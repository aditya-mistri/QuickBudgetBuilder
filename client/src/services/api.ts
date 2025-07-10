import { apiRequest } from "@/lib/queryClient";
import { 
  type GenerateOutfitRequest, 
  type OutfitResponse, 
  type Product, 
  type CartItem,
  type InsertCartItem,
  type Avatar 
} from "@shared/schema";

export const api = {
  // Product operations
  async getProducts(): Promise<Product[]> {
    const response = await apiRequest("GET", "/api/products");
    return response.json();
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await apiRequest("GET", `/api/products/category/${category}`);
    return response.json();
  },

  // Outfit operations
  async generateOutfits(request: GenerateOutfitRequest): Promise<OutfitResponse[]> {
    const response = await apiRequest("POST", "/api/generate-outfit", request);
    return response.json();
  },

  async optimizeOutfit(outfitId: number, budget: number): Promise<{
    optimizedProducts: Product[];
    totalCost: number;
    savings: number;
    swapsMade: Array<{
      original: Product;
      replacement: Product;
      savings: number;
    }>;
  }> {
    const response = await apiRequest("POST", `/api/outfit/${outfitId}/optimize`, { budget });
    return response.json();
  },

  // Cart operations
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const response = await apiRequest("POST", "/api/cart/add", item);
    return response.json();
  },

  async getCart(): Promise<CartItem[]> {
    const response = await apiRequest("GET", "/api/cart");
    return response.json();
  },

  async clearCart(): Promise<void> {
    await apiRequest("DELETE", "/api/cart/clear");
  },

  async removeFromCart(id: number): Promise<void> {
    await apiRequest("DELETE", `/api/cart/${id}`);
  },

  // Avatar operations
  async getAvatars(): Promise<Avatar[]> {
    const response = await apiRequest("GET", "/api/avatars");
    return response.json();
  }
};
