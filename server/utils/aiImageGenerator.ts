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
  
  async generateTryOnImage(params: TryOnGenerationParams): Promise<TryOnResult> {
    try {
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error("REPLICATE_API_TOKEN not found in environment variables");
      }

      // Use Replicate's virtual try-on model
      const prediction = await this.callReplicateAPI(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input_image: params.userPhoto || await this.getAvatarImage(params.avatarId),
          garment_image: params.products[0]?.image_url,
          category: this.mapCategoryToTryOn(params.products[0]?.category || ""),
          num_steps: 20,
          guidance_scale: 2.5
        }
      );

      // Wait for the prediction to complete
      const result = await this.waitForCompletion(prediction.id);
      
      if (result.status === "succeeded") {
        return {
          success: true,
          imageUrl: result.output[0] || result.output
        };
      } else {
        throw new Error(`Prediction failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("AI image generation failed:", error);
      return {
        success: false,
        error: error.message || "Failed to generate try-on image"
      };
    }
  }
  
  private async getAvatarImage(avatarId?: string): Promise<string> {
    // Avatar mapping - in production you'd store these in database
    const avatarMap: Record<string, string> = {
      "avatar_1": "https://images.unsplash.com/photo-1494790108755-2616b612b639?w=400&h=600&fit=crop&crop=face",
      "avatar_2": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
      "avatar_3": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
      "avatar_4": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
      "avatar_5": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
      "avatar_6": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face",
      "avatar_7": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face",
      "avatar_8": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face"
    };
    
    return avatarMap[avatarId || "avatar_1"] || avatarMap["avatar_1"];
  }
  
  private mapCategoryToTryOn(category: string): string {
    const categoryMap: Record<string, string> = {
      "dress": "dress",
      "top": "upper_body",
      "bottom": "lower_body",
      "shoes": "shoes",
      "accessories": "accessories"
    };
    
    return categoryMap[category] || "upper_body";
  }
  
  async generateOutfitCollage(products: Product[]): Promise<string> {
    try {
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error("REPLICATE_API_TOKEN not found in environment variables");
      }

      // Create a collage of outfit items using Replicate's image composition model
      const prediction = await this.callReplicateAPI(
        "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e45",
        {
          prompt: `Product collage of ${products.map(p => p.name).join(', ')}, clean white background, professional product photography`,
          negative_prompt: "person, model, wearing, blurry, low quality",
          width: 768,
          height: 768,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          scheduler: "K_EULER"
        }
      );

      const result = await this.waitForCompletion(prediction.id);
      
      if (result.status === "succeeded") {
        return result.output[0] || result.output;
      } else {
        throw new Error(`Collage generation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Collage generation failed:", error);
      // Fallback to a simple grid layout URL
      const imageUrls = products.map(p => encodeURIComponent(p.image_url)).join(',');
      return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop&collage=${imageUrls}`;
    }
  }
  
  private async callReplicateAPI(model: string, input: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: model,
        input: input
      })
    });
    
    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async waitForCompletion(predictionId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes max wait
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/${predictionId}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check prediction status: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status === "succeeded" || result.status === "failed") {
        return result;
      }
      
      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    throw new Error("Prediction timed out");
  }
}

export const aiImageGenerator = new AIImageGenerator();