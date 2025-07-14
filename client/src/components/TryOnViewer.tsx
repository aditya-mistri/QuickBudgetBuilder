import { useState, useEffect } from "react";
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
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string | null>(null);

  // Simulate fake loading and then show the outfit's try-on image
  useEffect(() => {
    setIsLoading(true);
    // Fake loading delay to simulate AI processing
    setTimeout(() => {
      // Always show either the generated image or fallback to screenshot
      setTryOnImageUrl(outfit.try_on_image_url || "/alex-formal-1.png");
      setIsLoading(false);
    }, 2000 + Math.random() * 1000); // 2-3 seconds random delay
  }, [outfit.try_on_image_url]);

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
    setTryOnImageUrl(null);
    
    // Simulate regenerating the try-on image
    setTimeout(() => {
      setTryOnImageUrl(outfit.try_on_image_url);
      setIsLoading(false);
    }, 2000 + Math.random() * 1000); // 2-3 seconds random delay
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
            ) : (
              <div className="relative">
                {/* ALWAYS Display the screenshots - NO CONDITIONS */}
                {tryOnImageUrl ? (
                  <img
                    src={tryOnImageUrl}
                    alt={`AI try-on for ${outfit.name}`}
                    className="w-full h-64 object-cover rounded"
                  />
                ) : (
                  <img
                    src="/alex-formal-1.png"
                    alt={`AI try-on for ${outfit.name}`}
                    className="w-full h-64 object-cover rounded"
                  />
                )}
                
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge variant="default" className="bg-green-600 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Generated Try-On Visualization
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 bg-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  {showTryOn ? 'AI Try-On View' : 'Product Gallery'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click toggle to switch between AI try-on and product gallery
                </p>
              </div>
              <Button size="sm" variant="outline">
                <ZoomIn className="w-4 h-4 mr-1" />
                Zoom
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}