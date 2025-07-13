import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  real,
  json,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    first_name: varchar("first_name", { length: 100 }),
    last_name: varchar("last_name", { length: 100 }),
    profile_photo: text("profile_photo"), // base64 encoded image
    preferred_avatar_id: varchar("preferred_avatar_id", { length: 50 }),
    onboarding_completed: boolean("onboarding_completed").default(false),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("email_idx").on(table.email)]
);

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User preferences table
export const user_preferences = pgTable(
  "user_preferences",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    preferred_sizes: json("preferred_sizes").$type<string[]>(),
    preferred_colors: json("preferred_colors").$type<string[]>(),
    budget_range_min: real("budget_range_min"),
    budget_range_max: real("budget_range_max"),
    favorite_occasions: json("favorite_occasions").$type<string[]>(),
    personalization_type: varchar("personalization_type", { length: 20 }), // 'photo' or 'occasion'
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("user_prefs_idx").on(table.user_id)]
);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  image_url: text("image_url").notNull(),
  color: text("color").notNull(),
  sizes: json("sizes").$type<string[]>().notNull(),
  brand: text("brand").notNull(),
  colors: json("colors").$type<string[]>().notNull(),
});

export const outfits = pgTable(
  "outfits",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    occasion: text("occasion").notNull(),
    total_cost: real("total_cost").notNull(),
    product_ids: json("product_ids").$type<string[]>().notNull(),
    is_under_budget: boolean("is_under_budget").notNull(),
    try_on_image_url: text("try_on_image_url"),
    reasoning: text("reasoning"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("user_outfits_idx").on(table.user_id)]
);

export const cart_items = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    outfit_id: integer("outfit_id").references(() => outfits.id),
    outfit_name: text("outfit_name").notNull(),
    total_cost: real("total_cost").notNull(),
    product_ids: json("product_ids").$type<string[]>().notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("user_cart_idx").on(table.user_id)]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  outfits: many(outfits),
  cartItems: many(cart_items),
  preferences: one(user_preferences),
}));

export const outfitsRelations = relations(outfits, ({ one }) => ({
  user: one(users, {
    fields: [outfits.user_id],
    references: [users.id],
  }),
}));

export const cartItemsRelations = relations(cart_items, ({ one }) => ({
  user: one(users, {
    fields: [cart_items.user_id],
    references: [users.id],
  }),
  outfit: one(outfits, {
    fields: [cart_items.outfit_id],
    references: [outfits.id],
  }),
}));

export const userPreferencesRelations = relations(
  user_preferences,
  ({ one }) => ({
    user: one(users, {
      fields: [user_preferences.user_id],
      references: [users.id],
    }),
  })
);

// Schema validations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertProductSchema = createInsertSchema(products);
export const insertOutfitSchema = createInsertSchema(outfits).omit({
  id: true,
  created_at: true,
});
export const insertCartItemSchema = createInsertSchema(cart_items).omit({
  id: true,
  created_at: true,
});

// Client-side cart item schema (without user_id since server adds it)
export const clientCartItemSchema = insertCartItemSchema.omit({
  user_id: true,
});

export const insertUserPreferencesSchema = createInsertSchema(
  user_preferences
).omit({
  id: true,
  updated_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Outfit = typeof outfits.$inferSelect;
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type CartItem = typeof cart_items.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type ClientCartItem = z.infer<typeof clientCartItemSchema>;
export type UserPreferences = typeof user_preferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// Onboarding schemas
export const onboardingSchema = z.object({
  personalizationType: z.enum(["photo", "avatar", "direct"], {
    required_error: "Please select a personalization type",
  }),
  profilePhoto: z.string().optional(), // base64 encoded image
  avatarId: z.string().optional(),
  preferredSizes: z.array(z.string()).optional(),
  preferredColors: z.array(z.string()).optional(),
  budgetRange: z
    .object({
      min: z.number().min(50),
      max: z.number().max(500),
    })
    .optional(),
  favoriteOccasions: z.array(z.string()).optional(),
});

export type OnboardingRequest = z.infer<typeof onboardingSchema>;

// API request/response types
export const generateOutfitRequestSchema = z.object({
  occasion: z.string().min(1),
  budget: z.number().min(50).max(500),
  age: z.number().min(13).max(100).optional(), // Age for age-appropriate styling
  size: z.string().optional(),
  color: z.string().optional(),
  user_photo: z.string().optional(), // Base64 encoded image
  avatar_id: z.string().optional(), // Alternative to user photo
});

export type GenerateOutfitRequest = z.infer<typeof generateOutfitRequestSchema>;

export const outfitResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  occasion: z.string(),
  total_cost: z.number(),
  products: z.array(insertProductSchema),
  is_under_budget: z.boolean(),
  tryon_image_url: z.string().optional(), // AI-generated try-on image
  reasoning: z.string().optional(),
  age_appropriate: z.boolean().optional(), // Whether outfit suits the user's age
  style_category: z.string().optional(), // classic, trendy, professional, casual, elegant
  swap_suggestions: z
    .array(
      z.object({
        original_product: insertProductSchema,
        suggested_product: insertProductSchema,
        savings: z.number(),
      })
    )
    .optional(),
});

export type OutfitResponse = z.infer<typeof outfitResponseSchema>;

// Avatar schema for predefined avatars
export const avatarSchema = z.object({
  id: z.string(),
  name: z.string(),
  image_url: z.string(),
  gender: z.string(),
  skin_tone: z.string(),
  body_type: z.string(),
});

export type Avatar = z.infer<typeof avatarSchema>;
