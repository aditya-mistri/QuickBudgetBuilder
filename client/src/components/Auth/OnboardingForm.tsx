import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { onboardingSchema } from "@shared/schema";
import { z } from "zod";
import { PhotoUpload } from "@/components/PhotoUpload";
import { AvatarSelector } from "@/components/AvatarSelector";

interface OnboardingFormProps {
  onComplete: () => void;
}

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      personalizationType: "direct",
      preferredSizes: [],
      preferredColors: [],
      favoriteOccasions: [],
      budgetRange: { min: 50, max: 200 },
    },
  });

  const personalizationType = form.watch("personalizationType");

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Onboarding failed");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "Your profile has been set up successfully.",
      });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Setup failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = (data: OnboardingFormData) => {
    onboardingMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Welcome to Style Bundle Builder
        </CardTitle>
        <CardDescription className="text-center">
          Let's personalize your fashion experience
        </CardDescription>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">
                    How would you like to personalize your experience?
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="personalizationType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="space-y-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="photo" id="photo" />
                            <Label
                              htmlFor="photo"
                              className="text-sm font-medium"
                            >
                              Upload my photo for personalized try-on
                              experiences
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="avatar" id="avatar" />
                            <Label
                              htmlFor="avatar"
                              className="text-sm font-medium"
                            >
                              Choose an avatar to represent me
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="direct" id="direct" />
                            <Label
                              htmlFor="direct"
                              className="text-sm font-medium"
                            >
                              Skip personalization and go straight to styling
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && personalizationType === "photo" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">
                    Upload Your Photo
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a clear photo of yourself to get personalized try-on
                    experiences
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="profilePhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhotoUpload
                          onPhotoSelect={field.onChange}
                          onPhotoRemove={() => field.onChange(null)}
                          selectedPhoto={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && personalizationType === "avatar" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">
                    Choose Your Avatar
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select an avatar that represents you for try-on experiences
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="avatarId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AvatarSelector
                          onAvatarSelect={field.onChange}
                          selectedAvatarId={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && personalizationType === "direct" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">All Set!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You can always add personalization later in your profile
                    settings
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">
                    Style Preferences (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Help us understand your style preferences better
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="preferredSizes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Sizes</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                              <Button
                                key={size}
                                type="button"
                                variant={
                                  field.value?.includes(size)
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  const current = field.value || [];
                                  const updated = current.includes(size)
                                    ? current.filter((s) => s !== size)
                                    : [...current, size];
                                  field.onChange(updated);
                                }}
                              >
                                {size}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredColors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Colors</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Black",
                              "White",
                              "Blue",
                              "Red",
                              "Green",
                              "Pink",
                              "Purple",
                              "Yellow",
                            ].map((color) => (
                              <Button
                                key={color}
                                type="button"
                                variant={
                                  field.value?.includes(color)
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  const current = field.value || [];
                                  const updated = current.includes(color)
                                    ? current.filter((c) => c !== color)
                                    : [...current, color];
                                  field.onChange(updated);
                                }}
                              >
                                {color}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="favoriteOccasions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Favorite Occasions</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Work",
                            "Date Night",
                            "Casual",
                            "Party",
                            "Vacation",
                            "Summer Picnic",
                          ].map((occasion) => (
                            <Button
                              key={occasion}
                              type="button"
                              variant={
                                field.value?.includes(occasion)
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                const current = field.value || [];
                                const updated = current.includes(occasion)
                                  ? current.filter((o) => o !== occasion)
                                  : [...current, occasion];
                                field.onChange(updated);
                              }}
                            >
                              {occasion}
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budgetRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Range ($)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <label className="text-sm">Min: $</label>
                            <input
                              type="number"
                              min="50"
                              max="500"
                              value={field.value?.min || 50}
                              onChange={(e) =>
                                field.onChange({
                                  ...field.value,
                                  min: parseInt(e.target.value) || 50,
                                })
                              }
                              className="w-20 px-2 py-1 border rounded"
                            />
                            <label className="text-sm">Max: $</label>
                            <input
                              type="number"
                              min="50"
                              max="500"
                              value={field.value?.max || 200}
                              onChange={(e) =>
                                field.onChange({
                                  ...field.value,
                                  max: parseInt(e.target.value) || 200,
                                })
                              }
                              className="w-20 px-2 py-1 border rounded"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Range: ${field.value?.min || 50} - $
                            {field.value?.max || 200}
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>

              {step < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={onboardingMutation.isPending}>
                  {onboardingMutation.isPending
                    ? "Setting up..."
                    : "Complete Setup"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
