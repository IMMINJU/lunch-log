"use client";

import { cn } from "@/lib/utils";
import { PRICE_RANGES } from "@/constants";
import type { PriceRange } from "@/types";

interface PriceSelectProps {
  value: PriceRange | null;
  onChange: (price: PriceRange) => void;
}

export function PriceSelect({ value, onChange }: PriceSelectProps) {
  return (
    <div className="flex gap-2">
      {PRICE_RANGES.map((price) => (
        <button
          key={price.value}
          type="button"
          onClick={() => onChange(price.value)}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg border transition-colors text-center",
            value === price.value
              ? "border-sky-500 bg-sky-50 text-sky-700"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <span className="block text-lg">{price.emoji}</span>
          <span className="block text-xs text-gray-500 mt-0.5">{price.label}</span>
        </button>
      ))}
    </div>
  );
}
