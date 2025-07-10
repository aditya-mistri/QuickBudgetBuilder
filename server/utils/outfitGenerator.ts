import { Product } from "@shared/schema";
import { storage } from "../storage";
import { openaiService } from "./openaiService";

export interface OutfitGenerationParams {
  occasion: string;
  budget: number;
  size?: string;
  color?: string;
}

export interface GeneratedOutfit {
  name: string;
  products: Product[];
  totalCost: number;
  isUnderBudget: boolean;
  swapSuggestions?: SwapSuggestion[];
  reasoning?: string;
}

export interface SwapSuggestion {
  originalProduct: Product;
  suggestedProduct: Product;
  savings: number;
}

export class OutfitGenerator {
  async generateOutfits(params: OutfitGenerationParams): Promise<GeneratedOutfit[]> {
    const { occasion, budget, size, color } = params;
    
    try {
      // Get all available products
      const allProducts = await storage.getAllProducts();
      
      // Use OpenAI to generate intelligent outfit recommendations
      const aiRecommendations = await openaiService.generateOutfitRecommendations({
        occasion,
        budget,
        size,
        color,
        availableProducts: allProducts
      });

      // Convert AI recommendations to GeneratedOutfit format
      const outfits: GeneratedOutfit[] = [];
      
      for (const recommendation of aiRecommendations) {
        const isUnderBudget = recommendation.totalCost <= budget;
        let swapSuggestions: SwapSuggestion[] | undefined;
        
        // If over budget, try to optimize
        if (!isUnderBudget) {
          try {
            const optimization = await openaiService.optimizeOutfitForBudget(
              recommendation.products,
              budget,
              allProducts
            );
            
            swapSuggestions = optimization.swapsMade;
          } catch (error) {
            console.error("Failed to optimize outfit:", error);
            // Fallback to manual optimization
            swapSuggestions = this.findSwapSuggestions(
              recommendation.products,
              budget,
              allProducts
            );
          }
        }
        
        outfits.push({
          name: recommendation.name,
          products: recommendation.products,
          totalCost: recommendation.totalCost,
          isUnderBudget,
          swapSuggestions,
          reasoning: recommendation.reasoning
        });
      }

      return outfits;
    } catch (error) {
      console.error("AI outfit generation failed, falling back to rule-based:", error);
      
      // Fallback to rule-based generation if AI fails
      return this.generateOutfitsFallback(params);
    }
  }

  private async generateOutfitsFallback(params: OutfitGenerationParams): Promise<GeneratedOutfit[]> {
    const { occasion, budget, size, color } = params;
    
    // Get products suitable for the occasion
    let products = await this.getProductsForOccasion(occasion);
    
    // Filter by size and color if specified
    products = this.filterBySize(products, size);
    products = this.filterByColor(products, color);
    
    // Categorize products
    const categorized = this.categorizeProducts(products);
    
    // Generate outfit combinations
    const combinations = this.generateOutfitCombinations(categorized);
    
    // Convert to GeneratedOutfit format
    const outfits: GeneratedOutfit[] = combinations.map((combo, index) => {
      const totalCost = this.calculateTotalCost(combo);
      const isUnderBudget = totalCost <= budget;
      
      return {
        name: this.generateOutfitName(combo, occasion, index),
        products: combo,
        totalCost,
        isUnderBudget,
        swapSuggestions: !isUnderBudget ? 
          this.findSwapSuggestions(combo, budget, products) : undefined
      };
    });

    return outfits;
  }

  private async getProductsForOccasion(occasion: string): Promise<Product[]> {
    const occasionTags: Record<string, string[]> = {
      "workwear": ["work", "professional", "formal", "business"],
      "summer picnic": ["summer", "casual", "outdoor", "comfortable"],
      "date night": ["romantic", "elegant", "stylish", "evening"],
      "casual weekend": ["casual", "comfortable", "relaxed", "weekend"],
      "formal event": ["formal", "elegant", "sophisticated", "dress-up"],
      "travel": ["travel", "comfortable", "versatile", "practical"],
      "gym": ["athletic", "activewear", "sporty", "fitness"],
      "brunch": ["brunch", "casual", "chic", "daytime"]
    };

    const tags = occasionTags[occasion.toLowerCase()] || ["casual"];
    return await storage.getProductsByTags(tags);
  }

  private categorizeProducts(products: Product[]): Record<string, Product[]> {
    const categories: Record<string, Product[]> = {
      dress: [],
      top: [],
      bottom: [],
      shoes: [],
      accessories: []
    };

    products.forEach(product => {
      if (categories[product.category]) {
        categories[product.category].push(product);
      }
    });

    return categories;
  }

  private filterBySize(products: Product[], size?: string): Product[] {
    if (!size) return products;
    return products.filter(product => 
      product.sizes && product.sizes.includes(size)
    );
  }

  private filterByColor(products: Product[], color?: string): Product[] {
    if (!color) return products;
    return products.filter(product => 
      product.colors && product.colors.includes(color)
    );
  }

  private generateOutfitCombinations(categorized: Record<string, Product[]>): Product[][] {
    const combinations: Product[][] = [];
    
    // Generate dress-based outfits
    categorized.dress.forEach(dress => {
      const shoes = categorized.shoes[0];
      const accessories = categorized.accessories[0];
      if (shoes) {
        const outfit = [dress, shoes];
        if (accessories) outfit.push(accessories);
        combinations.push(outfit);
      }
    });

    // Generate top/bottom combinations
    categorized.top.forEach(top => {
      categorized.bottom.forEach(bottom => {
        const shoes = categorized.shoes[0];
        if (shoes) {
          const outfit = [top, bottom, shoes];
          const accessories = categorized.accessories[0];
          if (accessories) outfit.push(accessories);
          combinations.push(outfit);
        }
      });
    });

    return combinations.slice(0, 3); // Return top 3 combinations
  }

  private calculateTotalCost(products: Product[]): number {
    return products.reduce((total, product) => total + product.price, 0);
  }

  private findSwapSuggestions(
    products: Product[], 
    budget: number, 
    allProducts: Product[]
  ): SwapSuggestion[] {
    const suggestions: SwapSuggestion[] = [];
    const totalCost = this.calculateTotalCost(products);
    
    if (totalCost <= budget) return suggestions;

    // Find cheaper alternatives for each product
    products.forEach(product => {
      const alternatives = allProducts.filter(alt => 
        alt.category === product.category && 
        alt.price < product.price &&
        alt.id !== product.id
      );

      if (alternatives.length > 0) {
        const cheapest = alternatives.reduce((min, alt) => 
          alt.price < min.price ? alt : min
        );
        
        suggestions.push({
          originalProduct: product,
          suggestedProduct: cheapest,
          savings: product.price - cheapest.price
        });
      }
    });

    return suggestions;
  }

  private generateOutfitName(products: Product[], occasion: string, index: number): string {
    const occasionNames: Record<string, string[]> = {
      "workwear": ["Business Casual", "Professional Look", "Office Ready"],
      "summer picnic": ["Picnic Perfect", "Summer Breeze", "Casual Comfort"],
      "date night": ["Date Night Chic", "Romantic Evening", "Night Out"],
      "casual weekend": ["Weekend Vibes", "Casual Cool", "Relaxed Style"],
      "formal event": ["Formal Elegance", "Black Tie Ready", "Sophisticated Style"],
      "travel": ["Travel Ready", "Airport Chic", "Comfortable Journey"],
      "gym": ["Workout Ready", "Athletic Style", "Fitness Focus"],
      "brunch": ["Brunch Chic", "Sunday Style", "Casual Elegance"]
    };

    const names = occasionNames[occasion.toLowerCase()] || ["Stylish Outfit"];
    return names[index % names.length];
  }
}

export const outfitGenerator = new OutfitGenerator();