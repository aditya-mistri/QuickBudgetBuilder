import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface OccasionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const occasions = [
  { value: "summer-picnic", label: "Summer Picnic" },
  { value: "workwear", label: "Workwear" },
  { value: "date-night", label: "Date Night" },
  { value: "casual-weekend", label: "Casual Weekend" },
  { value: "formal-event", label: "Formal Event" },
  { value: "beach-day", label: "Beach Day" },
  { value: "winter-outing", label: "Winter Outing" }
];

export function OccasionSelector({ value, onChange }: OccasionSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        <Calendar className="inline w-4 h-4 mr-2 text-blue-600" />
        Select Occasion
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose an occasion..." />
        </SelectTrigger>
        <SelectContent>
          {occasions.map((occasion) => (
            <SelectItem key={occasion.value} value={occasion.value}>
              {occasion.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
