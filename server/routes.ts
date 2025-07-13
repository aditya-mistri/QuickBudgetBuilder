import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { authService } from "./utils/authService";
import { requireAuth, attachUser, requireOnboarding } from "./middleware/auth";
import { outfitGenerator } from "./utils/outfitGenerator";
import { budgetOptimizer } from "./utils/budgetOptimizer";
import { aiImageGenerator } from "./utils/aiImageGenerator";
import {
  generateOutfitRequestSchema,
  outfitResponseSchema,
  loginSchema,
  registerSchema,
  onboardingSchema,
  clientCartItemSchema,
  type Product,
  type GenerateOutfitRequest,
  type OutfitResponse,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import productsData from "./data/products.json";
import avatarsData from "./data/avatars.json";
import { productAnalytics } from "./scripts/productAnalytics.js";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Attach user to request
  app.use(attachUser);

  // Initialize products data
  await initializeProducts();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await authService.register(validatedData);

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.toString() });
      } else {
        console.error("Registration error:", error);
        res.status(400).json({
          message:
            error instanceof Error ? error.message : "Registration failed",
        });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await authService.login(validatedData);

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.toString() });
      } else {
        console.error("Login error:", error);
        res.status(401).json({
          message: error instanceof Error ? error.message : "Login failed",
        });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await authService.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Onboarding routes
  app.post("/api/onboarding", requireAuth, async (req, res) => {
    try {
      const validatedData = onboardingSchema.parse(req.body);
      const userId = req.session.userId!;

      // Update user profile
      await authService.updateUser(userId, {
        profile_photo: validatedData.profilePhoto || null,
        preferred_avatar_id: validatedData.avatarId || null,
        onboarding_completed: true,
      });

      // Update user preferences
      await storage.updateUserPreferences(userId, {
        personalization_type: validatedData.personalizationType,
        preferred_sizes: validatedData.preferredSizes || null,
        preferred_colors: validatedData.preferredColors || null,
        budget_range_min: validatedData.budgetRange?.min || null,
        budget_range_max: validatedData.budgetRange?.max || null,
        favorite_occasions: validatedData.favoriteOccasions || null,
      });

      res.json({ message: "Onboarding completed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.toString() });
      } else {
        console.error("Onboarding error:", error);
        res.status(500).json({ message: "Failed to complete onboarding" });
      }
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Get product database statistics
  app.get("/api/products/stats", async (req, res) => {
    try {
      const analytics = await productAnalytics.generateProductAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching product statistics:", error);
      res.status(500).json({ message: "Failed to fetch product statistics" });
    }
  });

  // Check database status and whether seeding is needed
  app.get("/api/database/status", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const productCount = products.length;

      // Consider database properly seeded if we have more than 100 products
      const needsSeeding = productCount < 100;

      res.json({
        productCount,
        needsSeeding,
        isSeeded: !needsSeeding,
        recommendation: needsSeeding
          ? "Run 'npm run db:seed' to populate your database with a comprehensive product catalog"
          : "Database has sufficient products for optimal user experience",
      });
    } catch (error) {
      console.error("Error checking database status:", error);
      res.status(500).json({ message: "Failed to check database status" });
    }
  });

  // Generate outfit recommendations
  app.post(
    "/api/generate-outfit",
    requireAuth,
    requireOnboarding,
    async (req, res) => {
      try {
        const validatedRequest = generateOutfitRequestSchema.parse(req.body);
        const userId = req.session.userId!;

        // Get user preferences for personalization
        const userPreferences = await storage.getUserPreferences(userId);
        const user = await authService.getUserById(userId);

        // Use user's profile photo or avatar preference if not provided
        const userPhoto = validatedRequest.user_photo || user?.profile_photo;
        const avatarId =
          validatedRequest.avatar_id || user?.preferred_avatar_id;

        const outfits = await outfitGenerator.generateOutfits(validatedRequest);

        // Convert to response format
        const response: OutfitResponse[] = [];

        for (const outfit of outfits) {
          const savedOutfit = await storage.createOutfit({
            user_id: userId,
            name: outfit.name,
            occasion: validatedRequest.occasion,
            total_cost: outfit.totalCost,
            product_ids: outfit.products.map((p) => p.id),
            is_under_budget: outfit.isUnderBudget,
            reasoning: outfit.reasoning,
          }); // Generate AI try-on image if user photo or avatar is provided
          let tryonImageUrl: string | undefined;
          if (userPhoto || avatarId) {
            const tryonResult = await aiImageGenerator.generateTryOnImage({
              userPhoto: userPhoto || undefined,
              avatarId: avatarId || undefined,
              products: outfit.products,
              occasion: validatedRequest.occasion,
            });

            if (tryonResult.success) {
              tryonImageUrl = tryonResult.imageUrl;
            }
          }

          response.push({
            id: savedOutfit.id,
            name: outfit.name,
            occasion: validatedRequest.occasion,
            total_cost: outfit.totalCost,
            products: outfit.products,
            is_under_budget: outfit.isUnderBudget,
            tryon_image_url: tryonImageUrl,
            reasoning: outfit.reasoning,
            swap_suggestions: outfit.swapSuggestions?.map((swap) => ({
              original_product: swap.originalProduct,
              suggested_product: swap.suggestedProduct,
              savings: swap.savings,
            })),
          });
        }

        res.json(response);
      } catch (error) {
        console.error("Error generating outfit:", error);
        res.status(400).json({ message: "Invalid request data" });
      }
    }
  );

  // Apply budget optimization
  app.post(
    "/api/outfit/:id/optimize",
    requireAuth,
    requireOnboarding,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { budget } = req.body;
        const userId = req.session.userId!;

        const outfit = await storage.getOutfitById(parseInt(id));
        if (!outfit || outfit.user_id !== userId) {
          return res.status(404).json({ message: "Outfit not found" });
        }

        // Get the products for this outfit
        const products = await Promise.all(
          outfit.product_ids.map(async (productId) => {
            const product = await storage.getProductById(productId);
            if (!product) {
              throw new Error(`Product with ID ${productId} not found`);
            }
            return product;
          })
        );

        const optimization = await budgetOptimizer.optimizeForBudget(
          products,
          budget
        );

        res.json({
          original: {
            products: products,
            totalCost: products.reduce((sum, p) => sum + p.price, 0),
          },
          optimized: {
            products: optimization.optimizedProducts,
            totalCost: optimization.totalCost,
            savings: optimization.savings,
            swapsMade: optimization.swapsMade,
          },
        });
      } catch (error) {
        console.error("Error optimizing outfit:", error);
        res.status(500).json({ message: "Failed to optimize outfit" });
      }
    }
  );

  // Cart routes
  app.post("/api/cart", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const validatedData = clientCartItemSchema.parse(req.body);

      const cartItem = await storage.addToCart({
        ...validatedData,
        user_id: userId,
      });

      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.get("/api/cart", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.delete("/api/cart/clear", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  app.delete("/api/cart/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.removeFromCart(userId, parseInt(req.params.id));
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  // Avatar routes
  app.get("/api/avatars", async (req, res) => {
    try {
      res.json(avatarsData);
    } catch (error) {
      console.error("Error fetching avatars:", error);
      res.status(500).json({ message: "Failed to fetch avatars" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeProducts() {
  try {
    const existingProducts = await storage.getAllProducts();

    if (existingProducts.length === 0) {
      console.log("Initializing products...");

      for (const productData of productsData) {
        await storage.createProduct({
          id: productData.id,
          name: productData.name,
          price: productData.price,
          category: productData.category,
          brand: productData.brand,
          image_url: productData.image_url,
          color: productData.color,
          colors: [productData.color], // Create colors array from single color
          sizes: productData.sizes,
          tags: productData.tags,
        });
      }

      console.log(`Initialized ${productsData.length} products`);
    }
  } catch (error) {
    console.error("Error initializing products:", error);
  }
}
