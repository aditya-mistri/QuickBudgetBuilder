import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart, RefreshCw, Lightbulb } from "lucide-react";
import { type OutfitResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";

interface OutfitCardProps {
  outfit: OutfitResponse;
  budget: number;
  onAddToCart: (outfit: OutfitResponse) => void;
  onApplySwap?: (outfitId: number, budget: number) => void;
}

export function OutfitCard({ outfit, budget, onAddToCart, onApplySwap }: OutfitCardProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return api.addToCart({
        outfit_id: outfit.id,
        outfit_name: outfit.name,
        total_cost: outfit.total_cost,
        product_ids: outfit.products.map(p => p.id)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Success!",
        description: "Bundle added to cart successfully!",
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add bundle to cart",
        variant: "destructive"
      });
    }
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      return api.optimizeOutfit(outfit.id, budget);
    },
    onSuccess: () => {
      toast({
        title: "Optimization Applied!",
        description: "Budget optimization has been applied to your bundle.",
        variant: "default"
      });
      if (onApplySwap) {
        onApplySwap(outfit.id, budget);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to optimize outfit",
        variant: "destructive"
      });
    }
  });

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  const handleApplySwap = () => {
    optimizeMutation.mutate();
  };

  const budgetPercentage = Math.min((outfit.total_cost / budget) * 100, 100);
  const isOverBudget = outfit.total_cost > budget;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div className="relative">
        <img
          src={outfit.products[0]?.image_url || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop"}
          alt={`${outfit.name} outfit bundle`}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge variant={isOverBudget ? "destructive" : "secondary"}>
            {isOverBudget ? "Over Budget" : "Under Budget"}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-blue-600 text-white">
            Bundle {outfit.id}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{outfit.name}</h4>
        <p className="text-gray-600 text-sm mb-4">
          Perfect for {outfit.occasion.replace('-', ' ')} with comfort and style
        </p>

        {/* Budget Status */}
        <div className="flex justify-between items-center mb-4">
          <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            ${outfit.total_cost.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">of ${budget} budget</div>
        </div>

        {/* Progress Bar */}
        <Progress
          value={budgetPercentage}
          className="mb-4"
          style={{
            '--progress-background': isOverBudget ? '#ef4444' : '#10b981'
          } as any}
        />

        {/* Product Breakdown */}
        <div className="space-y-2 mb-4">
          {outfit.products.map((product, index) => (
            <div key={product.id} className="flex justify-between items-center text-sm">
              <span className="flex items-center">
                <span className="w-4 h-4 bg-gray-200 rounded-full mr-2"></span>
                <span>{product.name}</span>
              </span>
              <span className="font-semibold">${product.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Swap Suggestions */}
        {isOverBudget && outfit.swap_suggestions && outfit.swap_suggestions.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="flex items-center text-sm text-blue-600 mb-2">
              <Lightbulb className="w-4 h-4 mr-2" />
              <span className="font-semibold">Budget-Friendly Alternative</span>
            </div>
            <div className="text-sm text-gray-600">
              Replace {outfit.swap_suggestions[0].original_product.name} with {outfit.swap_suggestions[0].suggested_product.name} to save ${outfit.swap_suggestions[0].savings.toFixed(2)}!
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isOverBudget && outfit.swap_suggestions && outfit.swap_suggestions.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleApplySwap}
              disabled={optimizeMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Apply Swap
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
              variant="outline"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add Anyway
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add Bundle to Cart
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
