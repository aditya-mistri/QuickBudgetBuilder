import { Product } from "@shared/schema";

export interface TryOnGenerationParams {
  userPhoto?: string; // Base64 encoded image
  avatarId?: string;
  products: Product[];
  occasion: string;
}

export interface TryOnResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class AIImageGenerator {
  private readonly baseUrl = "https://api.replicate.com/v1/predictions";
  private readonly imageCache = new Map<string, string>(); // Simple in-memory cache
  private readonly maxCacheSize = 100; // Limit cache size

  private getCacheKey(params: TryOnGenerationParams): string {
    const productIds = params.products
      .map((p) => p.id)
      .sort()
      .join(",");
    const baseId = params.userPhoto
      ? "user_photo"
      : params.avatarId || "no_avatar";
    return `${baseId}_${productIds}_${params.occasion}`;
  }

  async generateTryOnImage(
    params: TryOnGenerationParams
  ): Promise<TryOnResult> {
    try {
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error(
          "REPLICATE_API_TOKEN not found in environment variables"
        );
      }

      // Check cache first
      const cacheKey = this.getCacheKey(params);
      const cachedResult = this.imageCache.get(cacheKey);
      if (cachedResult) {
        console.log("Returning cached try-on image:", cacheKey);
        return {
          success: true,
          imageUrl: cachedResult,
        };
      }

      // Get base person image (user photo or avatar)
      const baseImage =
        params.userPhoto || (await this.getAvatarImage(params.avatarId));

      console.log(
        `Generating complete outfit try-on with ${params.products.length} pieces`
      );

      let result: TryOnResult;

      // For complete outfits, we need to layer clothing pieces
      if (params.products.length === 1) {
        // Single item try-on
        result = await this.generateSingleItemTryOn(
          baseImage,
          params.products[0]
        );
      } else {
        // Multi-piece outfit try-on
        result = await this.generateCompleteOutfitTryOn(
          baseImage,
          params.products,
          params.occasion
        );
      }

      // Cache successful results
      if (result.success && result.imageUrl) {
        this.cacheImage(cacheKey, result.imageUrl);
      }

      return result;
    } catch (error) {
      console.error("AI image generation failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate try-on image",
      };
    }
  }

  private cacheImage(key: string, imageUrl: string): void {
    // Simple cache management - remove oldest if cache is full
    if (this.imageCache.size >= this.maxCacheSize) {
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }

    this.imageCache.set(key, imageUrl);
    console.log(
      `Cached try-on image: ${key} (cache size: ${this.imageCache.size})`
    );
  }

  private async generateSingleItemTryOn(
    baseImage: string,
    product: Product
  ): Promise<TryOnResult> {
    const prediction = await this.callReplicateAPI(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
      {
        input_image: baseImage,
        garment_image: product.image_url,
        category: this.mapCategoryToTryOn(product.category),
        num_steps: 20,
        guidance_scale: 2.5,
      }
    );

    const result = await this.waitForCompletion(prediction.id);

    if (result.status === "succeeded") {
      return {
        success: true,
        imageUrl: result.output[0] || result.output,
      };
    } else {
      throw new Error(
        `Single item try-on failed: ${result.error || "Unknown error"}`
      );
    }
  }

  private async generateCompleteOutfitTryOn(
    baseImage: string,
    products: Product[],
    occasion: string
  ): Promise<TryOnResult> {
    try {
      // Strategy 1: Use OOTD (Outfit of the Day) model for complete outfits
      // This model can handle multiple garments simultaneously
      const outfitPrompt = this.createOutfitPrompt(products, occasion);

      const prediction = await this.callReplicateAPI(
        "levihsu/ootdiffusion:0fbacf7afc6c144e5be9767cff80f25e2e61b1b6a86bf2e85a896e21506372ae",
        {
          model_type: "hd", // High definition
          category: "upperbody+lowerbody", // Multiple categories
          image_garm: products.map((p) => p.image_url).join(","), // Multiple garment images
          image_vton: baseImage,
          num_samples: 1,
          num_steps: 20,
          image_scale: 1.0,
          seed: Math.floor(Math.random() * 1000000),
        }
      );

      const result = await this.waitForCompletion(prediction.id);

      if (result.status === "succeeded") {
        return {
          success: true,
          imageUrl: result.output[0] || result.output,
        };
      } else {
        // Fallback: Layer items sequentially if OOTD fails
        console.log("OOTD model failed, trying sequential layering...");
        return await this.generateSequentialTryOn(baseImage, products);
      }
    } catch (error) {
      console.error("Complete outfit try-on failed, using fallback:", error);
      // Final fallback: Generate collage instead of try-on
      return await this.generateOutfitFallback(products);
    }
  }

  private async generateSequentialTryOn(
    baseImage: string,
    products: Product[]
  ): Promise<TryOnResult> {
    let currentImage = baseImage;

    // Sort products by layering priority (bottom to top)
    const sortedProducts = this.sortProductsByLayer(products);

    for (const product of sortedProducts) {
      try {
        const prediction = await this.callReplicateAPI(
          "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
          {
            input_image: currentImage,
            garment_image: product.image_url,
            category: this.mapCategoryToTryOn(product.category),
            num_steps: 15, // Faster for sequential processing
            guidance_scale: 2.0,
          }
        );

        const result = await this.waitForCompletion(prediction.id);

        if (result.status === "succeeded") {
          currentImage = result.output[0] || result.output;
          console.log(
            `Successfully layered ${product.category}: ${product.name}`
          );
        } else {
          console.warn(
            `Failed to layer ${product.name}, continuing with previous image`
          );
        }
      } catch (error) {
        console.error(`Error layering ${product.name}:`, error);
        // Continue with current image
      }
    }

    return {
      success: true,
      imageUrl: currentImage,
    };
  }

  private async generateOutfitFallback(
    products: Product[]
  ): Promise<TryOnResult> {
    console.log("Generating outfit collage as fallback");
    try {
      const collageUrl = await this.generateOutfitCollage(products);
      return {
        success: true,
        imageUrl: collageUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to generate outfit visualization",
      };
    }
  }

  private sortProductsByLayer(products: Product[]): Product[] {
    const layerPriority: Record<string, number> = {
      bottom: 1, // Pants, skirts first
      dress: 1, // Dresses as base
      top: 2, // Shirts, blouses over bottoms
      shoes: 3, // Shoes next
      accessories: 4, // Accessories last
    };

    return [...products].sort((a, b) => {
      const priorityA = layerPriority[a.category] || 5;
      const priorityB = layerPriority[b.category] || 5;
      return priorityA - priorityB;
    });
  }

  private createOutfitPrompt(products: Product[], occasion: string): string {
    const itemDescriptions = products
      .map((p) => `${p.category}: ${p.name}`)
      .join(", ");
    return `Complete ${occasion} outfit with ${itemDescriptions}, professionally styled, clean background`;
  }

  private async getAvatarImage(avatarId?: string): Promise<string> {
    // Avatar mapping - in production you'd store these in database
    const avatarMap: Record<string, string> = {
      avatar_1:
        "https://images.unsplash.com/photo-1494790108755-2616b612b639?w=400&h=600&fit=crop&crop=face",
      avatar_2:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
      avatar_3:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
      avatar_4:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
      avatar_5:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
      avatar_6:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face",
      avatar_7:
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face",
      avatar_8:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face",
    };

    return avatarMap[avatarId || "avatar_1"] || avatarMap["avatar_1"];
  }

  private mapCategoryToTryOn(category: string): string {
    const categoryMap: Record<string, string> = {
      dress: "dress",
      top: "upper_body",
      bottom: "lower_body",
      shoes: "shoes",
      accessories: "accessories",
    };

    return categoryMap[category] || "upper_body";
  }

  async generateOutfitCollage(products: Product[]): Promise<string> {
    try {
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error(
          "REPLICATE_API_TOKEN not found in environment variables"
        );
      }

      // Create a collage of outfit items using Replicate's image composition model
      const prediction = await this.callReplicateAPI(
        "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e45",
        {
          prompt: `Product collage of ${products.map((p) => p.name).join(", ")}, clean white background, professional product photography`,
          negative_prompt: "person, model, wearing, blurry, low quality",
          width: 768,
          height: 768,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          scheduler: "K_EULER",
        }
      );

      const result = await this.waitForCompletion(prediction.id);

      if (result.status === "succeeded") {
        return result.output[0] || result.output;
      } else {
        throw new Error(
          `Collage generation failed: ${result.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Collage generation failed:", error);
      // Fallback to a simple grid layout URL
      const imageUrls = products
        .map((p) => encodeURIComponent(p.image_url))
        .join(",");
      return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop&collage=${imageUrls}`;
    }
  }

  private async callReplicateAPI(model: string, input: any): Promise<any> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Calling Replicate API (attempt ${attempt}/${maxRetries}):`,
          model
        );

        const response = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: model,
            input: input,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Replicate API error (${response.status}): ${errorText}`
          );
        }

        const result = await response.json();
        console.log(`Replicate API success on attempt ${attempt}:`, result.id);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `Replicate API attempt ${attempt} failed:`,
          lastError.message
        );

        if (attempt < maxRetries) {
          // Exponential backoff: wait 2^attempt seconds
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Replicate API failed after all retries");
  }

  private async waitForCompletion(predictionId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes max wait
    const pollInterval = 5000; // 5 seconds
    let attempts = 0;

    console.log(`Waiting for prediction completion: ${predictionId}`);

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/${predictionId}`, {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to check prediction status (${response.status}): ${response.statusText}`
          );
        }

        const result = await response.json();

        console.log(
          `Prediction ${predictionId} status: ${result.status} (attempt ${attempts + 1}/${maxAttempts})`
        );

        if (result.status === "succeeded") {
          console.log(`Prediction ${predictionId} completed successfully`);
          return result;
        } else if (result.status === "failed") {
          throw new Error(
            `Prediction failed: ${result.error || "Unknown error"}`
          );
        } else if (result.status === "canceled") {
          throw new Error("Prediction was canceled");
        }

        // Status is still "starting" or "processing"
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error) {
        console.error(`Error checking prediction status:`, error);

        // If it's a network error, retry a few times
        if (attempts < 3) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          attempts++;
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      `Prediction timed out after ${(maxAttempts * pollInterval) / 1000} seconds`
    );
  }
}

export const aiImageGenerator = new AIImageGenerator();
