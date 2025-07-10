import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DollarSign } from "lucide-react";

interface BudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function BudgetSlider({ value, onChange, min = 50, max = 200 }: BudgetSliderProps) {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        <DollarSign className="inline w-4 h-4 mr-2 text-blue-600" />
        Budget Range
      </label>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>${min}</span>
          <span className="font-semibold text-blue-600">${value}</span>
          <span>${max}</span>
        </div>
      </div>
    </div>
  );
}
