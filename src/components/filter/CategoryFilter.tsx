"use client";

import { useState, useCallback } from "react";
import { CATEGORIES } from "@/constants";
import { useFilterStore } from "@/stores/useFilterStore";
import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryFilter() {
  const { selectedCategory, setSelectedCategory } = useFilterStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const containerRef = useClickOutside<HTMLDivElement>(handleClose, isOpen);

  const handleSelect = (category: Category | null) => {
    setSelectedCategory(category);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          selectedCategory ? "text-sky-600" : "text-gray-500 hover:text-gray-700"
        )}
      >
        <span>{selectedCategory || "전체"}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[100px]">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full px-3 py-1.5 text-sm text-left transition-colors",
              selectedCategory === null
                ? "bg-sky-50 text-sky-600"
                : "text-gray-700 hover:bg-gray-50"
            )}
          >
            전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelect(cat)}
              className={cn(
                "w-full px-3 py-1.5 text-sm text-left transition-colors",
                selectedCategory === cat
                  ? "bg-sky-50 text-sky-600"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
