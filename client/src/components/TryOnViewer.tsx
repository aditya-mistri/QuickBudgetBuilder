import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, RotateCcw, ZoomIn, Sparkles } from "lucide-react";
import { type OutfitResponse } from "@shared/schema";
import { OutfitComposer } from "./OutfitComposer";

interface TryOnViewerProps {
  outfit: OutfitResponse;
  userPhoto?: string;
  avatarId?: string;
}

export function TryOnViewer({ outfit, userPhoto, avatarId }: TryOnViewerProps) {
  const [showTryOn, setShowTryOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null);

  const getAvatarImageUrl = (avatarId?: string): string => {
    const avatarMap: Record<string, string> = {
      avatar_1: "https://images.unsplash.com/photo-1494790108755-2616b612b639?w=400&h=600&fit=crop&crop=face",
      avatar_2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
      avatar_3: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
      avatar_4: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
      avatar_5: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
      avatar_6: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face",
      avatar_7: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=600&fit=crop&crop=face",
      avatar_8: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face",
    };
    return avatarMap[avatarId || "avatar_1"] || avatarMap["avatar_1"];
  };

  const handleToggleView = () => {
    setShowTryOn(!showTryOn);
  };

  const handleRefreshTryOn = async () => {
    setIsLoading(true);
    setCompositeImageUrl(null);
    // The OutfitComposer will regenerate automatically
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleImageGenerated = (imageUrl: string) => {
    setCompositeImageUrl(imageUrl);
    setIsLoading(false);
  };

  const hasPersonalization = userPhoto || avatarId;
  const baseImage = userPhoto || getAvatarImageUrl(avatarId);

  const isCompositeUrl = (url?: string): boolean => {
    return url?.includes('composite=') || url?.includes('collage=') || false;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Header Controls */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Try-On
            </Badge>
            <div className="flex space-x-2">
              {hasPersonalization && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleView}
                    className="bg-white/90 hover:bg-white"
                  >
                    {showTryOn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshTryOn}
                    disabled={isLoading}
                    className="bg-white/90 hover:bg-white"
                  >
                    <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Main Image */}
          <div className="relative">
            {isLoading ? (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Generating AI try-on...</p>
                </div>
              </div>
            ) : showTryOn && hasPersonalization ? (
              <div className="relative">
                {/* Generate composite image if we have avatar/photo */}
                {baseImage && (
                  <OutfitComposer
                    outfit={outfit}
                    avatarImage={baseImage}
                    onImageGenerated={handleImageGenerated}
                  />
                )}
                
                {/* Display the composite image */}
                {compositeImageUrl ? (
                  <img
                    src={compositeImageUrl}
                    alt={`AI try-on for ${outfit.name}`}
                    className="w-full h-64 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Creating outfit visualization...</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge variant="default" className="bg-green-600 text-white">
                    AI-Generated Try-On Visualization
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 h-64">
                {outfit.products.slice(0, 4).map((product, index) => (
                  <img
                    key={product.id}
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ))}
                {outfit.products.length > 4 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    +{outfit.products.length - 4} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 bg-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  {showTryOn && hasPersonalization ? 'AI Try-On View' : 'Product Gallery'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {hasPersonalization 
                    ? 'Click toggle to switch views' 
                    : 'Upload photo or select avatar for AI try-on'}
                </p>
              </div>
              {hasPersonalization && (
                <Button size="sm" variant="outline">
                  <ZoomIn className="w-4 h-4 mr-1" />
                  Zoom
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}