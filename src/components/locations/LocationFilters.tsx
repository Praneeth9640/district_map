"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Category, District, EntityStatus } from "@/types";

interface LocationFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  districts?: District[];
  categories: Category[];
  districtId?: string;
  categoryId?: string;
  status?: EntityStatus | "ALL";
  onDistrictChange?: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: EntityStatus | "ALL") => void;
  showDistrictFilter?: boolean;
}

export function LocationFilters({
  search,
  onSearchChange,
  districts = [],
  categories,
  districtId,
  categoryId,
  status = "ALL",
  onDistrictChange,
  onCategoryChange,
  onStatusChange,
  showDistrictFilter = false,
}: LocationFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-2 md:col-span-2 xl:col-span-1">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search place or location..."
        />
      </div>

      {showDistrictFilter ? (
        <div className="space-y-2">
          <Label>District</Label>
          <Select value={districtId || "ALL"} onValueChange={(value) => onDistrictChange?.(value)}>
            <SelectTrigger>
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All districts</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId || "ALL"} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as EntityStatus | "ALL")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
