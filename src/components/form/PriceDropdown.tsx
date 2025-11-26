"use client";

import { useState, useCallback } from "react";
import { PRICE_RANGES, getPriceEmoji } from "@/constants";
import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";
import type { PriceRange } from "@/types";

interface PriceDropdownProps {
  value: PriceRange | null;
  onChange: (value: PriceRange) => void;
  placeholder?: string;
  className?: string;
}

export function PriceDropdown({
  value,
  onChange,
  placeholder = "가격대",
  className,
}: PriceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const containerRef = useClickOutside<HTMLDivElement>(handleClose, isOpen);

  const handleSelect = (priceValue: PriceRange) => {
    onChange(priceValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "cursor-pointer rounded-lg px-2 py-1 transition-colors",
          isOpen ? "bg-sky-50 ring-2 ring-sky-500" : "hover:bg-gray-50"
        )}
      >
        {value ? (
          <span className="text-base">{getPriceEmoji(value)}</span>
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[100px]">
          {PRICE_RANGES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handleSelect(p.value)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors",
                value === p.value ? "bg-sky-50 text-sky-700" : "text-gray-700"
              )}
            >
              {p.shortLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
