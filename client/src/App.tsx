import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AuthForms } from "@/components/Auth/AuthForms";
import { OnboardingForm } from "@/components/Auth/OnboardingForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading, isAuthenticated, isOnboarded } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading your account..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthForms onAuthSuccess={() => window.location.reload()} />
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <OnboardingForm onComplete={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
