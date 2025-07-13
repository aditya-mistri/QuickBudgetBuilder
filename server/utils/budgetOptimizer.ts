import { Product } from "@shared/schema";
import { storage } from "../storage";
import { geminiService } from "./geminiService";

export interface BudgetOptimization {
  optimizedProducts: Product[];
  totalCost: number;
  savings: number;
  swapsMade: Array<{
    original: Product;
    replacement: Product;
    savings: number;
  }>;
}

export class BudgetOptimizer {
  async optimizeForBudget(
    products: Product[],
    budget: number
  ): Promise<BudgetOptimization> {
    const currentCost = products.reduce((sum, p) => sum + p.price, 0);

    if (currentCost <= budget) {
      return {
        optimizedProducts: products,
        totalCost: currentCost,
        savings: 0,
        swapsMade: [],
      };
    }

    try {
      // Use Gemini for intelligent budget optimization
      const allProducts = await storage.getAllProducts();
      const optimization = await geminiService.optimizeOutfitForBudget(
        products,
        budget,
        allProducts
      );

      return {
        optimizedProducts: optimization.optimizedProducts,
        totalCost: optimization.totalCost,
        savings: optimization.savings,
        swapsMade: optimization.swapsMade.map((swap) => ({
          original: swap.original,
          replacement: swap.replacement,
          savings: swap.savings,
        })),
      };
    } catch (error) {
      console.error(
        "Gemini budget optimization failed, falling back to rule-based:",
        error
      );

      // Fallback to rule-based optimization
      return this.optimizeForBudgetFallback(products, budget);
    }
  }

  private async optimizeForBudgetFallback(
    products: Product[],
    budget: number
  ): Promise<BudgetOptimization> {
    const currentCost = products.reduce((sum, p) => sum + p.price, 0);

    // Get all available products for alternatives
    const allProducts = await storage.getAllProducts();
    const swapsMade: Array<{
      original: Product;
      replacement: Product;
      savings: number;
    }> = [];
    let optimizedProducts = [...products];

    // Find cheaper alternatives for each product
    for (let i = 0; i < optimizedProducts.length; i++) {
      const product = optimizedProducts[i];
      const alternatives = await this.findBudgetAlternatives(
        product,
        allProducts
      );

      if (alternatives.length > 0) {
        const bestAlternative = alternatives.reduce((best, alt) =>
          alt.price < best.price ? alt : best
        );

        const savings = product.price - bestAlternative.price;
        if (savings > 0) {
          swapsMade.push({
            original: product,
            replacement: bestAlternative,
            savings,
          });
          optimizedProducts[i] = bestAlternative;

          // Check if we're now within budget
          const newCost = optimizedProducts.reduce(
            (sum, p) => sum + p.price,
            0
          );
          if (newCost <= budget) {
            break;
          }
        }
      }
    }

    const finalCost = optimizedProducts.reduce((sum, p) => sum + p.price, 0);
    const totalSavings = currentCost - finalCost;

    return {
      optimizedProducts,
      totalCost: finalCost,
      savings: totalSavings,
      swapsMade,
    };
  }

  async findBudgetAlternatives(
    product: Product,
    allProducts: Product[]
  ): Promise<Product[]> {
    return allProducts.filter(
      (alt) =>
        alt.category === product.category &&
        alt.price < product.price &&
        alt.id !== product.id
    );
  }

  calculateBudgetUtilization(products: Product[], budget: number): number {
    const totalCost = products.reduce((sum, p) => sum + p.price, 0);
    return Math.min((totalCost / budget) * 100, 100);
  }

  getBudgetStatus(
    products: Product[],
    budget: number
  ): {
    isWithinBudget: boolean;
    totalCost: number;
    remaining: number;
    utilizationPercent: number;
  } {
    const totalCost = products.reduce((sum, p) => sum + p.price, 0);
    const remaining = budget - totalCost;
    const utilizationPercent = this.calculateBudgetUtilization(
      products,
      budget
    );

    return {
      isWithinBudget: totalCost <= budget,
      totalCost,
      remaining,
      utilizationPercent,
    };
  }
}

export const budgetOptimizer = new BudgetOptimizer();
