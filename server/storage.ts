import {
  users,
  user_preferences,
  products,
  outfits,
  cart_items,
  type User,
  type InsertUser,
  type UserPreferences,
  type InsertUserPreferences,
  type Product,
  type InsertProduct,
  type Outfit,
  type InsertOutfit,
  type CartItem,
  type InsertCartItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | null>;
  updateUserPreferences(userId: number, preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductsByTags(tags: string[]): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Outfit operations
  createOutfit(outfit: InsertOutfit): Promise<Outfit>;
  getOutfitById(id: number): Promise<Outfit | undefined>;
  getUserOutfits(userId: number): Promise<Outfit[]>;
  
  // Cart operations
  addToCart(item: InsertCartItem): Promise<CartItem>;
  getCartItems(userId: number): Promise<CartItem[]>;
  clearCart(userId: number): Promise<void>;
  removeFromCart(userId: number, itemId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | null> {
    const [preferences] = await db
      .select()
      .from(user_preferences)
      .where(eq(user_preferences.user_id, userId));
    return preferences || null;
  }

  async updateUserPreferences(userId: number, preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(user_preferences)
        .set({
          ...preferences,
          updated_at: new Date(),
        })
        .where(eq(user_preferences.user_id, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(user_preferences)
        .values({
          ...preferences,
          user_id: userId,
          updated_at: new Date(),
        })
        .returning();
      return created;
    }
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async getProductsByTags(tags: string[]): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        sql`${products.tags} && ${JSON.stringify(tags)}::jsonb`
      );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  // Outfit operations
  async createOutfit(outfitData: InsertOutfit): Promise<Outfit> {
    const [outfit] = await db
      .insert(outfits)
      .values({
        ...outfitData,
        created_at: new Date(),
      })
      .returning();
    return outfit;
  }

  async getOutfitById(id: number): Promise<Outfit | undefined> {
    const [outfit] = await db.select().from(outfits).where(eq(outfits.id, id));
    return outfit;
  }

  async getUserOutfits(userId: number): Promise<Outfit[]> {
    return await db
      .select()
      .from(outfits)
      .where(eq(outfits.user_id, userId))
      .orderBy(sql`${outfits.created_at} DESC`);
  }

  // Cart operations
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [cartItem] = await db
      .insert(cart_items)
      .values({
        ...item,
        created_at: new Date(),
      })
      .returning();
    return cartItem;
  }

  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db
      .select()
      .from(cart_items)
      .where(eq(cart_items.user_id, userId))
      .orderBy(sql`${cart_items.created_at} DESC`);
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(cart_items).where(eq(cart_items.user_id, userId));
  }

  async removeFromCart(userId: number, itemId: number): Promise<void> {
    await db
      .delete(cart_items)
      .where(and(eq(cart_items.user_id, userId), eq(cart_items.id, itemId)));
  }
}

export const storage = new DatabaseStorage();