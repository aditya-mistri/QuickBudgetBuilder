/**
 * Product Analytics and Management Utility
 * Provides insights and management functions for the product catalog
 */

import { storage } from "../storage";
import { Product } from "@shared/schema";

export class ProductAnalytics {
  async getProductStatistics() {
    const products = await storage.getAllProducts();

    const stats = {
      total: products.length,
      byCategory: this.groupByCategory(products),
      byBrand: this.groupByBrand(products),
      byPriceRange: this.groupByPriceRange(products),
      byOccasion: this.groupByOccasion(products),
      averagePrice: this.calculateAveragePrice(products),
      priceRange: this.getPriceRange(products),
      popularColors: this.getPopularColors(products),
      sizeAvailability: this.getSizeAvailability(products),
    };

    return stats;
  }

  private groupByCategory(products: Product[]) {
    return products.reduce(
      (acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private groupByBrand(products: Product[]) {
    return products.reduce(
      (acc, product) => {
        acc[product.brand] = (acc[product.brand] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private groupByPriceRange(products: Product[]) {
    const ranges = {
      "Under $25": 0,
      "$25-$50": 0,
      "$50-$75": 0,
      "$75-$100": 0,
      "Over $100": 0,
    };

    products.forEach((product) => {
      if (product.price < 25) ranges["Under $25"]++;
      else if (product.price < 50) ranges["$25-$50"]++;
      else if (product.price < 75) ranges["$50-$75"]++;
      else if (product.price < 100) ranges["$75-$100"]++;
      else ranges["Over $100"]++;
    });

    return ranges;
  }

  private groupByOccasion(products: Product[]) {
    const occasions = [
      "casual",
      "formal",
      "business",
      "party",
      "athletic",
      "beach",
    ];
    const occasionCounts: Record<string, number> = {};

    occasions.forEach((occasion) => {
      occasionCounts[occasion] = products.filter((product) =>
        product.tags?.some((tag) => tag.toLowerCase().includes(occasion))
      ).length;
    });

    return occasionCounts;
  }

  private calculateAveragePrice(products: Product[]) {
    const total = products.reduce((sum, product) => sum + product.price, 0);
    return Math.round((total / products.length) * 100) / 100;
  }

  private getPriceRange(products: Product[]) {
    const prices = products.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  private getPopularColors(products: Product[]) {
    const colorCounts: Record<string, number> = {};

    products.forEach((product) => {
      if (product.colors) {
        product.colors.forEach((color) => {
          colorCounts[color] = (colorCounts[color] || 0) + 1;
        });
      }
    });

    return Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce(
        (acc, [color, count]) => {
          acc[color] = count;
          return acc;
        },
        {} as Record<string, number>
      );
  }

  private getSizeAvailability(products: Product[]) {
    const sizeCounts: Record<string, number> = {};

    products.forEach((product) => {
      product.sizes?.forEach((size) => {
        sizeCounts[size] = (sizeCounts[size] || 0) + 1;
      });
    });

    return Object.entries(sizeCounts)
      .sort(([, a], [, b]) => b - a)
      .reduce(
        (acc, [size, count]) => {
          acc[size] = count;
          return acc;
        },
        {} as Record<string, number>
      );
  }

  async findProductGaps() {
    const products = await storage.getAllProducts();
    const stats = await this.getProductStatistics();

    const gaps = [];

    // Check for missing category combinations
    const categories = ["top", "bottom", "dress", "shoes", "accessories"];
    const occasions = ["casual", "formal", "business", "party", "athletic"];

    for (const category of categories) {
      for (const occasion of occasions) {
        const count = products.filter(
          (p) =>
            p.category === category &&
            p.tags?.some((tag) => tag.includes(occasion))
        ).length;

        if (count < 10) {
          // Threshold for "gap"
          gaps.push({
            type: "category-occasion",
            category,
            occasion,
            count,
            recommendation: `Need more ${category} items for ${occasion} occasions`,
          });
        }
      }
    }

    // Check price range gaps
    const priceRanges = stats.byPriceRange;
    Object.entries(priceRanges).forEach(([range, count]) => {
      if (count < 50) {
        // Threshold for price range gaps
        gaps.push({
          type: "price-range",
          range,
          count,
          recommendation: `Consider adding more products in ${range} price range`,
        });
      }
    });

    return gaps;
  }

  async getRecommendedProducts(
    occasion: string,
    budget: number,
    category?: string
  ) {
    const products = await storage.getAllProducts();

    let filtered = products.filter((product) => {
      // Budget filter (allow up to 60% of budget for single items)
      if (product.price > budget * 0.6) return false;

      // Category filter
      if (category && product.category !== category) return false;

      // Occasion filter
      return product.tags?.some((tag) =>
        tag.toLowerCase().includes(occasion.toLowerCase())
      );
    });

    // Sort by popularity (number of colors available) and price
    filtered.sort((a, b) => {
      const aPopularity = (a.colors?.length || 1) * (a.sizes?.length || 1);
      const bPopularity = (b.colors?.length || 1) * (b.sizes?.length || 1);

      if (aPopularity !== bPopularity) {
        return bPopularity - aPopularity; // More popular first
      }

      return a.price - b.price; // Then by price (cheaper first)
    });

    return filtered.slice(0, 50); // Return top 50 recommendations
  }
}

export const productAnalytics = new ProductAnalytics();
