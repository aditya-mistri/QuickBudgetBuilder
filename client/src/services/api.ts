import {
  type GenerateOutfitRequest,
  type OutfitResponse,
  type Product,
  type CartItem,
  type ClientCartItem,
  type Avatar,
} from "@shared/schema";

// Helper function for API requests
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response;
}

export const api = {
  // Product operations
  async getProducts(): Promise<Product[]> {
    const response = await fetchApi("/api/products");
    return response.json();
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await fetchApi(`/api/products/category/${category}`);
    return response.json();
  },

  // Outfit operations
  async generateOutfits(
    request: GenerateOutfitRequest
  ): Promise<OutfitResponse[]> {
    const response = await fetchApi("/api/generate-outfit", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async optimizeOutfit(
    outfitId: number,
    budget: number
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
    const response = await fetchApi(`/api/outfit/${outfitId}/optimize`, {
      method: "POST",
      body: JSON.stringify({ budget }),
    });
    return response.json();
  },

  // Cart operations
  async addToCart(item: ClientCartItem): Promise<CartItem> {
    const response = await fetchApi("/api/cart", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.json();
  },

  async getCart(): Promise<CartItem[]> {
    const response = await fetchApi("/api/cart");
    return response.json();
  },

  async clearCart(): Promise<void> {
    await fetchApi("/api/cart/clear", { method: "DELETE" });
  },

  async removeFromCart(id: number): Promise<void> {
    await fetchApi(`/api/cart/${id}`, { method: "DELETE" });
  },

  // Avatar operations
  async getAvatars(): Promise<Avatar[]> {
    const response = await fetchApi("/api/avatars");
    return response.json();
  },
};
