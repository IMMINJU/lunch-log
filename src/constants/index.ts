import type { Category, PriceRange, SortOption, User } from "@/types";

export const CATEGORIES: Category[] = [
  "한식",
  "중식",
  "일식",
  "양식",
  "분식",
  "기타",
];

export const PRICE_RANGES: { value: PriceRange; label: string; shortLabel: string; emoji: string }[] = [
  { value: "LOW", label: "~10,000원", shortLabel: "~10,000원", emoji: "💰" },
  { value: "MID", label: "10,000~12,000원", shortLabel: "~12,000원", emoji: "💰💰" },
  { value: "HIGH", label: "12,000원~", shortLabel: "12,000원~", emoji: "💰💰💰" },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "rating", label: "별점순" },
  { value: "name", label: "이름순" },
];

export const getPriceEmoji = (price: PriceRange): string => {
  const found = PRICE_RANGES.find((p) => p.value === price);
  return found?.emoji ?? "";
};

export const getPriceLabel = (price: PriceRange): string => {
  const found = PRICE_RANGES.find((p) => p.value === price);
  return found?.label ?? "";
};

export const USERS: User[] = [
  { id: "minju", name: "민주" },
  { id: "chulsoo", name: "철수" },
  { id: "younghee", name: "영희" },
  { id: "guest", name: "Guest", readonly: true },
];
