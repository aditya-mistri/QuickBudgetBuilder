import OpenAI from "openai";
import { Product } from "@shared/schema";

let openai: OpenAI | null = null;

// Initialize OpenAI client only if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn("OpenAI API key not provided. AI features will use fallback implementations.");
}

export interface OutfitGenerationRequest {
  occasion: string;
  budget: number;
  size?: string;
  color?: string;
  availableProducts: Product[];
}

export interface AIOutfitRecommendation {
  name: string;
  description: string;
  products: Product[];
  totalCost: number;
  reasoning: string;
}

export class OpenAIService {
  async generateOutfitRecommendations(request: OutfitGenerationRequest): Promise<AIOutfitRecommendation[]> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    const { occasion, budget, size, color, availableProducts } = request;
    
    // Filter products by size and color if specified
    const filteredProducts = availableProducts.filter(product => {
      if (size && product.sizes && !product.sizes.includes(size)) return false;
      if (color && product.colors && !product.colors.includes(color)) return false;
      return true;
    });

    const prompt = `You are a professional fashion stylist. Create 3 outfit recommendations for the following requirements:

Occasion: ${occasion}
Budget: $${budget}
${size ? `Size: ${size}` : ''}
${color ? `Preferred color: ${color}` : ''}

Available Products:
${filteredProducts.map(p => `- ${p.name} ($${p.price}) - ${p.category} - Tags: ${p.tags.join(', ')}`).join('\n')}

Requirements:
1. Each outfit must stay within the $${budget} budget
2. Each outfit should be appropriate for ${occasion}
3. Mix and match products to create complete outfits
4. Include at least 3-4 items per outfit (top, bottom, shoes, accessories)
5. Provide reasoning for each recommendation

Return your response as a JSON array with this structure:
[
  {
    "name": "outfit name",
    "description": "brief description",
    "product_ids": ["id1", "id2", "id3"],
    "total_cost": 0.00,
    "reasoning": "why this outfit works for the occasion and budget"
  }
]`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a professional fashion stylist with expertise in budget-conscious outfit creation. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content);
      const outfits = Array.isArray(result) ? result : result.outfits || [];

      return outfits.map((outfit: any) => ({
        name: outfit.name,
        description: outfit.description,
        products: outfit.product_ids.map((id: string) => 
          filteredProducts.find(p => p.id === id)
        ).filter(Boolean),
        totalCost: outfit.total_cost,
        reasoning: outfit.reasoning
      }));
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate outfit recommendations");
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
    swapsMade: Array<{ original: Product; replacement: Product; savings: number }>;
  }> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    const currentTotal = products.reduce((sum, p) => sum + p.price, 0);
    
    if (currentTotal <= budget) {
      return {
        optimizedProducts: products,
        totalCost: currentTotal,
        savings: 0,
        swapsMade: []
      };
    }

    const prompt = `You are a budget optimization expert. Help optimize this outfit to fit within budget:

Current outfit:
${products.map(p => `- ${p.name} ($${p.price}) - ${p.category}`).join('\n')}

Current total: $${currentTotal}
Target budget: $${budget}
Need to save: $${(currentTotal - budget).toFixed(2)}

Available alternatives:
${availableProducts.map(p => `- ${p.name} ($${p.price}) - ${p.category} - Tags: ${p.tags.join(', ')}`).join('\n')}

Find the best product swaps to stay within budget while maintaining outfit quality and style coherence.

Return JSON with this structure:
{
  "swaps": [
    {
      "original_product_id": "id",
      "replacement_product_id": "id",
      "savings": 0.00,
      "reason": "why this swap works"
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a budget optimization expert. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content);
      const swaps = result.swaps || [];

      let optimizedProducts = [...products];
      let totalSavings = 0;
      const swapsMade = [];

      for (const swap of swaps) {
        const originalProduct = products.find(p => p.id === swap.original_product_id);
        const replacementProduct = availableProducts.find(p => p.id === swap.replacement_product_id);

        if (originalProduct && replacementProduct) {
          const index = optimizedProducts.findIndex(p => p.id === originalProduct.id);
          if (index !== -1) {
            optimizedProducts[index] = replacementProduct;
            const savings = originalProduct.price - replacementProduct.price;
            totalSavings += savings;
            swapsMade.push({
              original: originalProduct,
              replacement: replacementProduct,
              savings
            });
          }
        }
      }

      const newTotal = optimizedProducts.reduce((sum, p) => sum + p.price, 0);

      return {
        optimizedProducts,
        totalCost: newTotal,
        savings: totalSavings,
        swapsMade
      };
    } catch (error) {
      console.error("OpenAI optimization error:", error);
      throw new Error("Failed to optimize outfit for budget");
    }
  }
}

export const openaiService = new OpenAIService();