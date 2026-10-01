"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { District } from "@/types";

interface DistrictSelectorProps {
  districts: District[];
  value?: string;
  onChange: (districtId: string) => void;
  loading?: boolean;
  label?: string;
  className?: string;
}

export function DistrictSelector({
  districts,
  value,
  onChange,
  loading,
  label = "Select District",
  className,
}: DistrictSelectorProps) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading || districts.length === 0}
      >
        <SelectTrigger className="w-full min-w-[240px] bg-white">
          <SelectValue placeholder={loading ? "Loading districts..." : "Choose a district"} />
        </SelectTrigger>
        <SelectContent>
          {districts.map((district) => (
            <SelectItem key={district.id} value={district.id}>
              {district.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
