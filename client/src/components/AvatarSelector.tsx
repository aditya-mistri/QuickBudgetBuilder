import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Avatar } from "@shared/schema";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/services/api";

interface AvatarSelectorProps {
  onAvatarSelect: (avatarId: string) => void;
  selectedAvatarId?: string;
}

export function AvatarSelector({ onAvatarSelect, selectedAvatarId }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(selectedAvatarId);

  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['avatars'],
    queryFn: () => api.getAvatars()
  });

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    onAvatarSelect(avatarId);
  };

  if (isLoading) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Users className="inline w-4 h-4 mr-2 text-blue-600" />
          Choose an Avatar
        </label>
        <LoadingSpinner message="Loading avatars..." />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        <Users className="inline w-4 h-4 mr-2 text-blue-600" />
        Choose an Avatar
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {avatars.map((avatar) => (
          <Card 
            key={avatar.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAvatar === avatar.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleAvatarSelect(avatar.id)}
          >
            <CardContent className="p-3">
              <div className="relative">
                <img
                  src={avatar.image_url}
                  alt={avatar.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="font-medium text-sm">{avatar.name}</p>
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  <Badge variant="secondary" className="text-xs">
                    {avatar.gender}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedAvatar && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">
            ✓ Avatar selected! Your outfits will be shown on{' '}
            {avatars.find(a => a.id === selectedAvatar)?.name}
          </p>
        </div>
      )}
    </div>
  );
}