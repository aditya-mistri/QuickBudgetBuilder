import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { type User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Clear all queries
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    isOnboarded: user?.onboarding_completed || false,
    logout,
    refetch,
    error,
  };
}