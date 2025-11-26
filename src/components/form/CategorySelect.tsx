"use client";

import { Chip } from "@/components/ui";
import { CATEGORIES } from "@/constants";
import type { Category } from "@/types";

interface CategorySelectProps {
  value: Category | null;
  onChange: (category: Category) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <Chip
          key={category}
          selected={value === category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category}
        </Chip>
      ))}
    </div>
  );
}
