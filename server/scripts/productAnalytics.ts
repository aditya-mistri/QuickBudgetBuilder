import { storage } from "../storage";
import type { Product } from "@shared/schema";

export interface ProductAnalytics {
  totalProducts: number;
  categoryBreakdown: Record<string, number>;
  brandBreakdown: Record<string, number>;
  priceAnalysis: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    priceRanges: Record<string, number>;
  };
  colorAnalysis: {
    mostPopularColors: Array<{ color: string; count: number }>;
    totalUniqueColors: number;
  };
  occasionAnalysis: Record<string, number>;
  ageGroupAnalysis: {
    teen: number;
    youngAdult: number;
    adult: number;
    mature: number;
  };
  sizeAnalysis: {
    mostCommonSizes: Array<{ size: string; count: number }>;
    totalUniqueSizes: number;
  };
  recommendations: string[];
}

class ProductAnalyticsService {
  async generateProductAnalytics(): Promise<ProductAnalytics> {
    const products = await storage.getAllProducts();

    if (products.length === 0) {
      return {
        totalProducts: 0,
        categoryBreakdown: {},
        brandBreakdown: {},
        priceAnalysis: {
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
          priceRanges: {},
        },
        colorAnalysis: {
          mostPopularColors: [],
          totalUniqueColors: 0,
        },
        occasionAnalysis: {},
        ageGroupAnalysis: {
          teen: 0,
          youngAdult: 0,
          adult: 0,
          mature: 0,
        },
        sizeAnalysis: {
          mostCommonSizes: [],
          totalUniqueSizes: 0,
        },
        recommendations: [
          "Database is empty. Run 'npm run db:seed' to populate with products.",
        ],
      };
    }

    // Category breakdown
    const categoryBreakdown = products.reduce(
      (acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Brand breakdown
    const brandBreakdown = products.reduce(
      (acc, product) => {
        acc[product.brand] = (acc[product.brand] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Price analysis
    const prices = products.map((p) => p.price);
    const averagePrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const priceRanges = {
      "Under $20": prices.filter((p) => p < 20).length,
      "$20-$50": prices.filter((p) => p >= 20 && p < 50).length,
      "$50-$100": prices.filter((p) => p >= 50 && p < 100).length,
      "$100+": prices.filter((p) => p >= 100).length,
    };

    // Color analysis
    const colorCounts = new Map<string, number>();
    products.forEach((product) => {
      if (product.colors) {
        product.colors.forEach((color) => {
          colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
        });
      }
    });

    const mostPopularColors = Array.from(colorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([color, count]) => ({ color, count }));

    // Occasion analysis
    const occasionAnalysis = products.reduce(
      (acc, product) => {
        if (product.occasions) {
          product.occasions.forEach((occasion) => {
            acc[occasion] = (acc[occasion] || 0) + 1;
          });
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Age group analysis
    const ageGroupAnalysis = products.reduce(
      (acc, product) => {
        if (product.target_age_min && product.target_age_max) {
          const avgAge = (product.target_age_min + product.target_age_max) / 2;
          if (avgAge <= 19) acc.teen++;
          else if (avgAge <= 35) acc.youngAdult++;
          else if (avgAge <= 55) acc.adult++;
          else acc.mature++;
        }
        return acc;
      },
      { teen: 0, youngAdult: 0, adult: 0, mature: 0 }
    );

    // Size analysis
    const sizeCounts = new Map<string, number>();
    products.forEach((product) => {
      if (product.sizes) {
        product.sizes.forEach((size) => {
          sizeCounts.set(size, (sizeCounts.get(size) || 0) + 1);
        });
      }
    });

    const mostCommonSizes = Array.from(sizeCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([size, count]) => ({ size, count }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(products, {
      categoryBreakdown,
      brandBreakdown,
      priceRanges,
      totalProducts: products.length,
    });

    return {
      totalProducts: products.length,
      categoryBreakdown,
      brandBreakdown,
      priceAnalysis: {
        averagePrice: Math.round(averagePrice * 100) / 100,
        minPrice,
        maxPrice,
        priceRanges,
      },
      colorAnalysis: {
        mostPopularColors,
        totalUniqueColors: colorCounts.size,
      },
      occasionAnalysis,
      ageGroupAnalysis,
      sizeAnalysis: {
        mostCommonSizes,
        totalUniqueSizes: sizeCounts.size,
      },
      recommendations,
    };
  }

  private generateRecommendations(
    products: Product[],
    analytics: {
      categoryBreakdown: Record<string, number>;
      brandBreakdown: Record<string, number>;
      priceRanges: Record<string, number>;
      totalProducts: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Product count recommendations
    if (analytics.totalProducts < 100) {
      recommendations.push(
        "Consider running database seeding to add more product variety (recommended: 1000+ products)"
      );
    } else if (analytics.totalProducts < 500) {
      recommendations.push(
        "Good product selection! Consider expanding catalog for even better user experience"
      );
    } else {
      recommendations.push(
        "Excellent product catalog size for diverse outfit generation"
      );
    }

    // Category balance recommendations
    const categoryEntries = Object.entries(analytics.categoryBreakdown);
    const totalCategories = categoryEntries.length;
    const expectedCategories = [
      "clothing",
      "shoes",
      "accessories",
      "activewear",
      "outerwear",
    ];

    const missingCategories = expectedCategories.filter(
      (cat) => !analytics.categoryBreakdown[cat]
    );
    if (missingCategories.length > 0) {
      recommendations.push(
        `Missing categories: ${missingCategories.join(", ")}. Consider adding products in these areas`
      );
    }

    // Check category distribution
    if (totalCategories > 0) {
      const avgProductsPerCategory = analytics.totalProducts / totalCategories;
      const imbalancedCategories = categoryEntries.filter(
        ([, count]) => count < avgProductsPerCategory * 0.5
      );

      if (imbalancedCategories.length > 0) {
        recommendations.push(
          `Categories needing more products: ${imbalancedCategories.map(([cat]) => cat).join(", ")}`
        );
      }
    }

    // Price range recommendations
    const underBudgetProducts = analytics.priceRanges["Under $20"] || 0;
    const budgetFriendlyPercentage =
      (underBudgetProducts / analytics.totalProducts) * 100;

    if (budgetFriendlyPercentage < 30) {
      recommendations.push(
        "Consider adding more budget-friendly options (under $20) for cost-conscious users"
      );
    }

    // Brand diversity
    const brandCount = Object.keys(analytics.brandBreakdown).length;
    if (brandCount < 5) {
      recommendations.push(
        "Consider expanding brand diversity for more varied outfit options"
      );
    }

    return recommendations;
  }

  async getProductGaps(): Promise<{
    missingCombinations: Array<{
      category: string;
      occasion: string;
      priceRange: string;
      count: number;
    }>;
    underrepresentedAgeGroups: Array<{
      ageGroup: string;
      currentCount: number;
      recommendedCount: number;
    }>;
  }> {
    const products = await storage.getAllProducts();

    // Analyze missing category-occasion combinations
    const categories = [
      "clothing",
      "shoes",
      "accessories",
      "activewear",
      "outerwear",
    ];
    const occasions = [
      "casual",
      "work",
      "formal",
      "party",
      "outdoor",
      "athletic",
    ];
    const priceRanges = ["under-20", "20-50", "50-100", "100-plus"];

    const combinations = new Map<string, number>();

    products.forEach((product) => {
      const priceRange =
        product.price < 20
          ? "under-20"
          : product.price < 50
            ? "20-50"
            : product.price < 100
              ? "50-100"
              : "100-plus";

      if (product.occasions) {
        product.occasions.forEach((occasion) => {
          const key = `${product.category}-${occasion}-${priceRange}`;
          combinations.set(key, (combinations.get(key) || 0) + 1);
        });
      }
    });

    const missingCombinations: Array<{
      category: string;
      occasion: string;
      priceRange: string;
      count: number;
    }> = [];

    categories.forEach((category) => {
      occasions.forEach((occasion) => {
        priceRanges.forEach((priceRange) => {
          const key = `${category}-${occasion}-${priceRange}`;
          const count = combinations.get(key) || 0;
          if (count < 3) {
            // Threshold for "missing"
            missingCombinations.push({
              category,
              occasion,
              priceRange,
              count,
            });
          }
        });
      });
    });

    // Analyze age group representation
    const totalProducts = products.length;
    const expectedPerAgeGroup = totalProducts / 4; // 4 age groups

    const ageGroupCounts = { teen: 0, youngAdult: 0, adult: 0, mature: 0 };
    products.forEach((product) => {
      if (product.target_age_min && product.target_age_max) {
        const avgAge = (product.target_age_min + product.target_age_max) / 2;
        if (avgAge <= 19) ageGroupCounts.teen++;
        else if (avgAge <= 35) ageGroupCounts.youngAdult++;
        else if (avgAge <= 55) ageGroupCounts.adult++;
        else ageGroupCounts.mature++;
      }
    });

    const underrepresentedAgeGroups = Object.entries(ageGroupCounts)
      .filter(([, count]) => count < expectedPerAgeGroup * 0.7)
      .map(([ageGroup, currentCount]) => ({
        ageGroup,
        currentCount,
        recommendedCount: Math.ceil(expectedPerAgeGroup),
      }));

    return {
      missingCombinations: missingCombinations.slice(0, 20), // Top 20 gaps
      underrepresentedAgeGroups,
    };
  }
}

export const productAnalytics = new ProductAnalyticsService();
