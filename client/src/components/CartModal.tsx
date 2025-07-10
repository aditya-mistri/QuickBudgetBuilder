import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { type CartItem } from "@shared/schema";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: () => api.getCart(),
    enabled: isOpen
  });

  const clearCartMutation = useMutation({
    mutationFn: api.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
        variant: "default"
      });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: (id: number) => api.removeFromCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
        variant: "default"
      });
    }
  });

  const total = cartItems.reduce((sum, item) => sum + item.total_cost, 0);

  const handleCheckout = () => {
    toast({
      title: "Checkout",
      description: "This feature would normally redirect to checkout process.",
      variant: "default"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Your Cart
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Your cart is empty</p>
                <p className="text-sm">Add some style bundles to get started!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.outfit_name}</h4>
                      <p className="text-sm text-gray-600">{item.product_ids.length} items</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">${item.total_cost.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center text-xl font-bold mb-4">
                <span>Total:</span>
                <span className="text-blue-600">${total.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => clearCartMutation.mutate()}
                  disabled={clearCartMutation.isPending}
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cart
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
