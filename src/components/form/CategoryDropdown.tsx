"use client";

import { useState, useCallback } from "react";
import { CATEGORIES } from "@/constants";
import { useClickOutside } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryDropdownProps {
  value: Category | null;
  onChange: (value: Category) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryDropdown({
  value,
  onChange,
  placeholder = "카테고리",
  className,
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const containerRef = useClickOutside<HTMLDivElement>(handleClose, isOpen);

  const handleSelect = (category: Category) => {
    onChange(category);
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
          <span className="text-[13px] text-gray-500">{value}</span>
        ) : (
          <span className="text-gray-400 text-[13px]">{placeholder} *</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1.5 flex flex-wrap gap-1 w-[180px]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelect(cat)}
              className={cn(
                "px-2.5 py-1.5 text-xs rounded-md transition-colors",
                value === cat
                  ? "bg-sky-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
