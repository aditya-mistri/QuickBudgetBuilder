import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "@shared/schema";

let genAI: GoogleGenerativeAI | null = null;

// Initialize Gemini client only if API key is available
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn(
    "Gemini API key not provided. AI features will use fallback implementations."
  );
}

export interface OutfitGenerationRequest {
  occasion: string;
  budget: number;
  age?: number;
  size?: string;
  color?: string;
  userPhoto?: string;
  avatarId?: string;
  availableProducts: Product[];
}

export interface AIOutfitRecommendation {
  name: string;
  description: string;
  products: Product[];
  totalCost: number;
  reasoning: string;
  tryOnImageUrl?: string;
  ageAppropriate: boolean;
  styleCategory: string;
}

export class GeminiService {
  private parseJsonFromResponse(text: string): any {
    console.log("Raw Gemini response:", text);

    try {
      // First, try to parse as pure JSON
      return JSON.parse(text);
    } catch (error) {
      console.log(
        "Failed to parse as pure JSON, trying markdown extraction..."
      );

      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const extractedJson = jsonMatch[1].trim();
          console.log("Extracted JSON from markdown:", extractedJson);
          return JSON.parse(extractedJson);
        } catch (innerError) {
          console.error(
            "Failed to parse JSON from markdown block:",
            innerError
          );
        }
      }

      // Try to find JSON array or object starting points
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          console.log("Found array pattern:", arrayMatch[0]);
          return JSON.parse(arrayMatch[0]);
        } catch (innerError) {
          console.error("Failed to parse extracted array:", innerError);
        }
      }

      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          console.log("Found object pattern:", objectMatch[0]);
          return JSON.parse(objectMatch[0]);
        } catch (innerError) {
          console.error("Failed to parse extracted object:", innerError);
        }
      }

      // If all parsing attempts fail, throw the original error
      console.error("All JSON parsing attempts failed for text:", text);
      throw error;
    }
  }

  async generateOutfitRecommendations(
    request: OutfitGenerationRequest
  ): Promise<AIOutfitRecommendation[]> {
    if (!genAI) {
      throw new Error("Gemini API not initialized. Please check your API key.");
    }

    const {
      occasion,
      budget,
      age,
      size,
      color,
      userPhoto,
      avatarId,
      availableProducts,
    } = request;

    // Filter products based on user criteria BEFORE sending to AI
    const filteredProducts = this.filterProductsByCriteria(availableProducts, {
      occasion,
      budget,
      age,
      size,
      color,
    });

    console.log(
      `Filtered ${filteredProducts.length} products from ${availableProducts.length} total products`
    );

    // Create enhanced prompt for Gemini
    const prompt = this.createEnhancedOutfitPrompt(
      occasion,
      budget,
      age,
      size,
      color,
      filteredProducts
    );

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response with robust error handling
      const recommendations = this.parseJsonFromResponse(text);

      // Validate and convert to our enhanced format
      const validatedRecommendations = this.validateAndConvertRecommendations(
        recommendations,
        availableProducts
      );

      // Generate try-on images for each outfit if user photo/avatar provided
      if (userPhoto || avatarId) {
        for (const outfit of validatedRecommendations) {
          try {
            const tryOnUrl = await this.generateTryOnImageForOutfit(
              userPhoto,
              avatarId,
              outfit.products,
              occasion
            );
            outfit.tryOnImageUrl = tryOnUrl;
          } catch (error) {
            console.error(
              "Try-on generation failed for outfit:",
              outfit.name,
              error
            );
          }
        }
      }

      return validatedRecommendations;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to generate outfit recommendations");
    }
  }

  private filterProductsByCriteria(
    products: Product[],
    criteria: {
      occasion: string;
      budget: number;
      age?: number;
      size?: string;
      color?: string;
    }
  ): Product[] {
    return products.filter((product) => {
      // Budget filter - include products that allow for complete outfits within budget
      if (product.price > criteria.budget * 0.6) return false;

      // Size filter
      if (
        criteria.size &&
        product.sizes &&
        !product.sizes.includes(criteria.size)
      ) {
        return false;
      }

      // Color filter
      if (
        criteria.color &&
        product.colors &&
        !product.colors.some((color) =>
          color.toLowerCase().includes(criteria.color!.toLowerCase())
        )
      ) {
        return false;
      }

      // Age-appropriate filter
      if (criteria.age) {
        const ageCategory = this.getAgeCategory(criteria.age);
        if (!this.isAgeAppropriate(product, ageCategory)) {
          return false;
        }
      }

      // Occasion filter based on product tags
      const occasionTags = this.getOccasionTags(criteria.occasion);
      const hasOccasionMatch = product.tags?.some((tag) =>
        occasionTags.some((occasionTag) =>
          tag.toLowerCase().includes(occasionTag.toLowerCase())
        )
      );

      return (
        hasOccasionMatch ||
        this.isCategoryAppropriate(product.category, criteria.occasion)
      );
    });
  }

  private getAgeCategory(age: number): string {
    if (age < 18) return "teen";
    if (age < 30) return "young-adult";
    if (age < 50) return "adult";
    return "mature";
  }

  private isAgeAppropriate(product: Product, ageCategory: string): boolean {
    const productTags = product.tags?.map((tag) => tag.toLowerCase()) || [];

    switch (ageCategory) {
      case "teen":
        return !productTags.some((tag) =>
          ["professional", "formal", "business", "mature"].includes(tag)
        );
      case "young-adult":
        return true; // Young adults can wear most styles
      case "adult":
        return !productTags.some((tag) =>
          ["teen", "juvenile", "kids"].includes(tag)
        );
      case "mature":
        return !productTags.some((tag) =>
          ["teen", "trendy", "juvenile", "crop"].includes(tag)
        );
      default:
        return true;
    }
  }

  private getOccasionTags(occasion: string): string[] {
    const occasionMap: Record<string, string[]> = {
      casual: ["casual", "everyday", "comfortable", "relaxed"],
      formal: ["formal", "elegant", "dressy", "professional"],
      business: ["professional", "business", "work", "office"],
      date: ["romantic", "date", "evening", "stylish"],
      party: ["party", "festive", "celebration", "fun"],
      workout: ["athletic", "sport", "gym", "active"],
      beach: ["beach", "summer", "vacation", "resort"],
      winter: ["warm", "cozy", "winter", "cold-weather"],
    };

    return occasionMap[occasion.toLowerCase()] || [occasion.toLowerCase()];
  }

  private isCategoryAppropriate(category: string, occasion: string): boolean {
    const categoryOccasionMap: Record<string, string[]> = {
      dress: ["formal", "date", "party", "business"],
      top: ["casual", "business", "date"],
      bottom: ["casual", "business", "formal"],
      shoes: ["casual", "formal", "business", "party"],
      accessories: ["formal", "date", "party", "casual"],
    };

    const appropriateOccasions =
      categoryOccasionMap[category.toLowerCase()] || [];
    return appropriateOccasions.includes(occasion.toLowerCase());
  }

  private createEnhancedOutfitPrompt(
    occasion: string,
    budget: number,
    age?: number,
    size?: string,
    color?: string,
    availableProducts: Product[] = []
  ): string {
    const sizeFilter = size ? ` in size ${size}` : "";
    const colorFilter = color ? ` in ${color} color` : "";
    const ageFilter = age ? ` for a ${age}-year-old` : "";

    return `You are a professional fashion stylist specializing in Walmart clothing. Create 5-7 complete outfit recommendations for a ${occasion}${ageFilter}${sizeFilter}${colorFilter} with a budget of $${budget}.

FILTERED AVAILABLE PRODUCTS (pre-selected for occasion and criteria):
${availableProducts.map((p) => `- ID: ${p.id} | ${p.name} (${p.category}): $${p.price}, Brand: ${p.brand}, Colors: ${p.colors?.join(", ")}, Sizes: ${p.sizes?.join(", ")}, Tags: ${p.tags?.join(", ")}`).join("\n")}

STYLING REQUIREMENTS:
1. Create 5-7 DISTINCT complete outfits (not just 3)
2. Each outfit must include complementary pieces:
   - For casual: top + bottom + shoes (+ optional accessories)
   - For formal: dress + shoes + accessories OR formal top + bottom + shoes
   - For business: professional pieces that work together
3. Stay within budget (total cost ≤ $${budget})
4. Consider age-appropriateness${age ? ` for ${age} years old` : ""}
5. Ensure color coordination and style cohesion
6. Include variety in outfit styles and price points
7. Make each outfit feel distinct and complete

RESPONSE FORMAT - Return EXACTLY this JSON structure:
[
  {
    "name": "Descriptive Outfit Name",
    "description": "Detailed description of the complete look",
    "productIds": ["product_id_1", "product_id_2", "product_id_3"],
    "totalCost": 89.97,
    "reasoning": "Why this outfit works perfectly for ${occasion} and fits the criteria",
    "styleCategory": "classic/trendy/professional/casual/elegant",
    "ageAppropriate": true
  }
]

CRITICAL INSTRUCTIONS:
- Return ONLY the raw JSON array
- NO markdown formatting, backticks, or code blocks
- Start with [ and end with ]
- Include 5-7 outfit options for variety
- Each outfit should feel complete and styled
- Ensure all productIds exist in the available products list above`;
  }

  private validateAndConvertRecommendations(
    recommendations: any[],
    availableProducts: Product[]
  ): AIOutfitRecommendation[] {
    const productMap = new Map(availableProducts.map((p) => [p.id, p]));

    return recommendations
      .map((rec) => {
        // Find products by ID
        const products =
          rec.productIds
            ?.map((id: string) => productMap.get(id))
            .filter(Boolean) || [];

        // Calculate actual total cost
        const totalCost = products.reduce(
          (sum: number, product: Product) => sum + product.price,
          0
        );

        return {
          name: rec.name || "Stylish Outfit",
          description: rec.description || "",
          products,
          totalCost,
          reasoning: rec.reasoning || "AI-generated outfit recommendation",
          ageAppropriate: rec.ageAppropriate ?? true,
          styleCategory: rec.styleCategory || "casual",
        };
      })
      .filter((outfit) => outfit.products.length > 0);
  }

  async generateTryOnImageForOutfit(
    userPhoto?: string,
    avatarId?: string,
    outfitProducts: Product[] = [],
    occasion: string = "casual"
  ): Promise<string> {
    try {
      // Import the aiImageGenerator to use real Replicate integration
      const { aiImageGenerator } = await import("./aiImageGenerator");

      console.log("Generating try-on image for outfit:", {
        userPhoto: userPhoto ? "provided" : "none",
        avatarId,
        productCount: outfitProducts.length,
        occasion,
        products: outfitProducts.map((p) => ({
          name: p.name,
          category: p.category,
        })),
      });

      if (outfitProducts.length === 0) {
        console.warn("No products provided for try-on generation");
        return "";
      }

      // Use the real AI image generator with Replicate integration
      const result = await aiImageGenerator.generateTryOnImage({
        userPhoto,
        avatarId,
        products: outfitProducts,
        occasion,
      });

      if (result.success && result.imageUrl) {
        console.log("Successfully generated try-on image:", result.imageUrl);
        return result.imageUrl;
      } else {
        console.error("Try-on generation failed:", result.error);
        // Return empty string instead of placeholder for failed generations
        return "";
      }
    } catch (error) {
      console.error("Try-on image generation failed:", error);
      return "";
    }
  }

  async generateTryOnImage(
    userImageUrl: string,
    outfitProducts: Product[]
  ): Promise<string> {
    // Legacy method - now calls the enhanced version
    return this.generateTryOnImageForOutfit(
      userImageUrl,
      undefined,
      outfitProducts
    );
  }

  async analyzeUserPhoto(imageUrl: string): Promise<{
    bodyType: string;
    skinTone: string;
    recommendations: string[];
  }> {
    if (!genAI) {
      throw new Error("Gemini API not initialized. Please check your API key.");
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze this person's photo for fashion styling purposes. 
      Provide recommendations for clothing styles, colors, and cuts that would be most flattering.
      
      Return a JSON object with this structure (no markdown formatting):
      {
        "bodyType": "body type description",
        "skinTone": "skin tone description", 
        "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
      }`;

      const result = await model.generateContent([prompt, imageUrl]);
      const response = await result.response;
      const text = response.text();

      return this.parseJsonFromResponse(text);
    } catch (error) {
      console.error("Gemini photo analysis error:", error);
      throw new Error("Failed to analyze user photo");
    }
  }

  async optimizeOutfitForBudget(
    products: Product[],
    budget: number,
    availableProducts: Product[]
  ): Promise<{
    optimizedProducts: Product[];
    totalCost: number;
    savings: number;
    swapsMade: Array<{
      original: Product;
      replacement: Product;
      savings: number;
    }>;
  }> {
    if (!genAI) {
      throw new Error("Gemini API not initialized. Please check your API key.");
    }

    const currentTotal = products.reduce((sum, p) => sum + p.price, 0);

    if (currentTotal <= budget) {
      return {
        optimizedProducts: products,
        totalCost: currentTotal,
        savings: 0,
        swapsMade: [],
      };
    }

    const prompt = `You are a budget optimization expert. Help optimize this outfit to fit within budget:

Current outfit:
${products.map((p) => `- ${p.name} ($${p.price}) - ${p.category} - Tags: ${p.tags?.join(", ")}`).join("\n")}

Current total: $${currentTotal}
Target budget: $${budget}
Need to save: $${(currentTotal - budget).toFixed(2)}

Available alternatives:
${availableProducts.map((p) => `- ID: ${p.id} | ${p.name} ($${p.price}) - ${p.category} - Tags: ${p.tags?.join(", ")}`).join("\n")}

Find the best product swaps to stay within budget while maintaining outfit quality and style coherence.

Return JSON with this exact structure (no markdown formatting):
{
  "swaps": [
    {
      "original_product_id": "current_product_id",
      "replacement_product_id": "alternative_product_id",
      "savings": 0.00,
      "reason": "why this swap works"
    }
  ]
}

CRITICAL: Return ONLY the raw JSON object. Do not wrap it in backticks, markdown code blocks, or include any additional text. Start your response with { and end with }.`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const resultData = this.parseJsonFromResponse(text);
      const swaps = resultData.swaps || [];

      let optimizedProducts = [...products];
      let totalSavings = 0;
      const swapsMade = [];

      for (const swap of swaps) {
        const originalProduct = products.find(
          (p) => p.id === swap.original_product_id
        );
        const replacementProduct = availableProducts.find(
          (p) => p.id === swap.replacement_product_id
        );

        if (originalProduct && replacementProduct) {
          const index = optimizedProducts.findIndex(
            (p) => p.id === originalProduct.id
          );
          if (index !== -1) {
            optimizedProducts[index] = replacementProduct;
            const savings = originalProduct.price - replacementProduct.price;
            totalSavings += savings;
            swapsMade.push({
              original: originalProduct,
              replacement: replacementProduct,
              savings,
            });
          }
        }
      }

      const newTotal = optimizedProducts.reduce((sum, p) => sum + p.price, 0);

      return {
        optimizedProducts,
        totalCost: newTotal,
        savings: totalSavings,
        swapsMade,
      };
    } catch (error) {
      console.error("Gemini optimization error:", error);
      throw new Error("Failed to optimize outfit for budget using Gemini");
    }
  }
}

export const geminiService = new GeminiService();
