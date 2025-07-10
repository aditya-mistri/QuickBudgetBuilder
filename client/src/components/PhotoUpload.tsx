import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  onPhotoSelect: (base64Image: string) => void;
  onPhotoRemove: () => void;
  selectedPhoto?: string;
}

export function PhotoUpload({ onPhotoSelect, onPhotoRemove, selectedPhoto }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, GIF)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onPhotoSelect(base64);
      setIsUploading(false);
      toast({
        title: "Photo Uploaded",
        description: "Your photo has been uploaded successfully!",
        variant: "default"
      });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: "Failed to read the image file",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    onPhotoRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        <Camera className="inline w-4 h-4 mr-2 text-blue-600" />
        Upload Your Photo
      </label>
      
      <Card className="relative">
        <CardContent className="p-4">
          {selectedPhoto ? (
            <div className="relative">
              <img
                src={selectedPhoto}
                alt="Your uploaded photo"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleRemovePhoto}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                Ready for AI Try-On
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Upload your photo to see how outfits look on you
              </p>
              <Button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photo
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supports JPG, PNG, GIF up to 10MB
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}