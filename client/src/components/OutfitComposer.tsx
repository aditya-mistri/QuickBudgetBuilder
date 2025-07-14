import { useState, useEffect, useRef } from "react";
import { type OutfitResponse } from "@shared/schema";

interface OutfitComposerProps {
  outfit: OutfitResponse;
  avatarImage: string;
  onImageGenerated: (imageUrl: string) => void;
}

export function OutfitComposer({ outfit, avatarImage, onImageGenerated }: OutfitComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateCompositeImage();
  }, [outfit, avatarImage]);

  const generateCompositeImage = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Clear canvas
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load avatar image
      const avatarImg = await loadImage(avatarImage);
      
      // Draw avatar on left side
      const avatarWidth = canvas.width * 0.45;
      const avatarHeight = canvas.height * 0.8;
      const avatarX = 20;
      const avatarY = (canvas.height - avatarHeight) / 2;
      
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarWidth, avatarHeight);

      // Add subtle overlay to indicate this is a try-on
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(avatarX, avatarY, avatarWidth, avatarHeight);

      // Load and arrange product images on the right side
      const productStartX = avatarX + avatarWidth + 20;
      const productAreaWidth = canvas.width - productStartX - 20;
      const productAreaHeight = canvas.height - 40;

      await drawProductLayout(ctx, outfit.products, productStartX, 20, productAreaWidth, productAreaHeight);

      // Add title and styling
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(outfit.name, canvas.width / 2, 30);

      // Add price information
      ctx.font = '18px Arial';
      ctx.fillStyle = '#059669';
      ctx.fillText(`$${outfit.total_cost.toFixed(2)}`, canvas.width / 2, canvas.height - 20);

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          onImageGenerated(url);
        }
      }, 'image/jpeg', 0.9);

    } catch (err) {
      console.error('Error generating composite image:', err);
      setError('Failed to generate outfit visualization');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  const drawProductLayout = async (
    ctx: CanvasRenderingContext2D,
    products: any[],
    startX: number,
    startY: number,
    width: number,
    height: number
  ) => {
    const productImages = await Promise.all(
      products.slice(0, 6).map(async (product) => {
        try {
          return await loadImage(product.image_url);
        } catch {
          return null;
        }
      })
    );

    const validImages = productImages.filter(img => img !== null) as HTMLImageElement[];

    // Arrange products in a grid
    const cols = Math.min(3, validImages.length);
    const rows = Math.ceil(validImages.length / cols);
    const productWidth = (width - (cols + 1) * 10) / cols;
    const productHeight = (height - (rows + 1) * 10) / rows;

    validImages.forEach((img, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (productWidth + 10) + 10;
      const y = startY + row * (productHeight + 10) + 10;

      // Draw product image with rounded corners effect
      ctx.save();
      ctx.beginPath();
      // Fallback for roundRect if not available
      if (ctx.roundRect) {
        ctx.roundRect(x, y, productWidth, productHeight, 8);
      } else {
        // Manual rounded rectangle
        const radius = 8;
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + productWidth - radius, y);
        ctx.quadraticCurveTo(x + productWidth, y, x + productWidth, y + radius);
        ctx.lineTo(x + productWidth, y + productHeight - radius);
        ctx.quadraticCurveTo(x + productWidth, y + productHeight, x + productWidth - radius, y + productHeight);
        ctx.lineTo(x + radius, y + productHeight);
        ctx.quadraticCurveTo(x, y + productHeight, x, y + productHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
      }
      ctx.clip();
      ctx.drawImage(img, x, y, productWidth, productHeight);
      ctx.restore();

      // Add subtle border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, productWidth, productHeight, 8);
      } else {
        // Manual rounded rectangle for border
        const radius = 8;
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + productWidth - radius, y);
        ctx.quadraticCurveTo(x + productWidth, y, x + productWidth, y + radius);
        ctx.lineTo(x + productWidth, y + productHeight - radius);
        ctx.quadraticCurveTo(x + productWidth, y + productHeight, x + productWidth - radius, y + productHeight);
        ctx.lineTo(x + radius, y + productHeight);
        ctx.quadraticCurveTo(x, y + productHeight, x, y + productHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
      }
      ctx.stroke();
    });

    // Add "Outfit Items" label
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Outfit Items:', startX + 10, startY - 10);
  };

  if (isGenerating) {
    return (
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Creating outfit visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={generateCompositeImage}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="hidden"
      style={{ display: 'none' }}
    />
  );
}
