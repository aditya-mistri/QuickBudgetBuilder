import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ShoppingCart, User, Wand2, Palette, Ruler, LogOut } from "lucide-react";
import { BudgetSlider } from "@/components/BudgetSlider";
import { OccasionSelector } from "@/components/OccasionSelector";
import { OutfitCard } from "@/components/OutfitCard";
import { CartModal } from "@/components/CartModal";
import { LoadingSpinner, OutfitSkeletonLoader } from "@/components/LoadingSpinner";
import { PhotoUpload } from "@/components/PhotoUpload";
import { AvatarSelector } from "@/components/AvatarSelector";
import { TryOnViewer } from "@/components/TryOnViewer";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { type OutfitResponse } from "@shared/schema";

const colorOptions = [
  { value: "neutral", label: "Neutral", color: "bg-gray-800" },
  { value: "blue", label: "Blue", color: "bg-blue-600" },
  { value: "red", label: "Red", color: "bg-red-600" },
  { value: "green", label: "Green", color: "bg-green-600" },
  { value: "yellow", label: "Yellow", color: "bg-yellow-500" },
  { value: "purple", label: "Purple", color: "bg-purple-600" }
];

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

export default function Home() {
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState(100);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [userPhoto, setUserPhoto] = useState<string>("");
  const [avatarId, setAvatarId] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<OutfitResponse[]>([]);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const { data: cartItems = [] } = useQuery({
    queryKey: ['/api/cart'],
    queryFn: () => api.getCart()
  });

  const generateOutfitsMutation = useMutation({
    mutationFn: () => api.generateOutfits({
      occasion,
      budget,
      size: size || undefined,
      color: color || undefined,
      user_photo: userPhoto || undefined,
      avatar_id: avatarId || undefined
    }),
    onSuccess: (data) => {
      setGeneratedOutfits(data);
      toast({
        title: "Outfits Generated!",
        description: `Found ${data.length} perfect style bundles for you.`,
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate outfits. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (!occasion) {
      toast({
        title: "Missing Information",
        description: "Please select an occasion first!",
        variant: "destructive"
      });
      return;
    }

    generateOutfitsMutation.mutate();
  };

  const handleAddToCart = (outfit: OutfitResponse) => {
    // The OutfitCard component handles the cart addition internally
  };

  const handleApplySwap = (outfitId: number, budget: number) => {
    // Refresh the outfits after swap is applied
    generateOutfitsMutation.mutate();
  };

  const handlePhotoSelect = (base64Image: string) => {
    setUserPhoto(base64Image);
    setAvatarId(""); // Clear avatar selection when photo is uploaded
  };

  const handlePhotoRemove = () => {
    setUserPhoto("");
  };

  const handleAvatarSelect = (selectedAvatarId: string) => {
    setAvatarId(selectedAvatarId);
    setUserPhoto(""); // Clear photo when avatar is selected
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="text-blue-600 w-8 h-8" />
              <h1 className="text-xl font-bold text-gray-900">Walmart Style Bundle Builder</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItems.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full"
                  >
                    {cartItems.length}
                  </Badge>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {user?.first_name || "User"}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Style Bundles Within Your Budget
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get personalized outfit recommendations that fit your occasion and budget. 
            Our smart algorithm finds the perfect combination of style and savings.
          </p>
        </div>

        {/* User Input Interface */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Create Your Perfect Bundle</h3>
            
            {/* Photo Upload and Avatar Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <PhotoUpload 
                onPhotoSelect={handlePhotoSelect}
                onPhotoRemove={handlePhotoRemove}
                selectedPhoto={userPhoto}
              />
              <AvatarSelector 
                onAvatarSelect={handleAvatarSelect}
                selectedAvatarId={avatarId}
              />
            </div>

            {/* Basic Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OccasionSelector value={occasion} onChange={setOccasion} />
              <BudgetSlider value={budget} onChange={setBudget} />
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Ruler className="inline w-4 h-4 mr-2 text-blue-600" />
                  Size Preference
                </label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((sizeOption) => (
                      <SelectItem key={sizeOption} value={sizeOption}>
                        {sizeOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Palette className="inline w-4 h-4 mr-2 text-blue-600" />
                  Color Preference
                </label>
                <div className="flex space-x-2">
                  {colorOptions.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      onClick={() => setColor(color === colorOption.value ? "" : colorOption.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        color === colorOption.value 
                          ? 'border-blue-600' 
                          : 'border-transparent hover:border-blue-600'
                      } ${colorOption.color}`}
                      title={colorOption.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button
                onClick={handleGenerate}
                disabled={generateOutfitsMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateOutfitsMutation.isPending ? "Generating..." : "Generate AI Style Bundles"}
              </Button>
              {(userPhoto || avatarId) && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ AI try-on will be generated with your {userPhoto ? 'photo' : 'selected avatar'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {generateOutfitsMutation.isPending && (
          <div className="mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <LoadingSpinner />
                <span className="ml-2">AI is creating your perfect bundles...</span>
              </div>
            </div>
            <OutfitSkeletonLoader />
          </div>
        )}

        {/* Outfit Results */}
        {generatedOutfits.length > 0 && !generateOutfitsMutation.isPending && (
          <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Your AI-Generated Style Bundles</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Wand2 className="w-4 h-4 text-blue-600" />
                <span>Powered by AI</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedOutfits.map((outfit) => (
                <div key={outfit.id} className="space-y-4">
                  <TryOnViewer 
                    outfit={outfit}
                    userPhoto={userPhoto}
                    avatarId={avatarId}
                  />
                  <OutfitCard
                    outfit={outfit}
                    budget={budget}
                    onAddToCart={handleAddToCart}
                    onApplySwap={handleApplySwap}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-600 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">About Style Builder</h4>
              <p className="text-blue-100 text-sm">
                AI-powered fashion recommendations that fit your budget and style preferences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Return Policy</a></li>
                <li><a href="#" className="hover:text-white">Size Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><a href="#" className="hover:text-white">AI Style Recommendations</a></li>
                <li><a href="#" className="hover:text-white">Budget Optimization</a></li>
                <li><a href="#" className="hover:text-white">Occasion Matching</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-blue-100 hover:text-white">Facebook</a>
                <a href="#" className="text-blue-100 hover:text-white">Twitter</a>
                <a href="#" className="text-blue-100 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-400 mt-8 pt-8 text-center text-blue-100 text-sm">
            <p>&copy; 2024 Walmart Style Bundle Builder. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
