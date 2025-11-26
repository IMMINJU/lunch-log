import { create } from "zustand";
import type { Category, SortOption } from "@/types";

interface FilterState {
  selectedCategory: Category | null;
  sortOption: SortOption;
  showFavoritesOnly: boolean;
  searchQuery: string;
  setSelectedCategory: (category: Category | null) => void;
  setSortOption: (option: SortOption) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedCategory: null,
  sortOption: "latest",
  showFavoritesOnly: false,
  searchQuery: "",
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSortOption: (option) => set({ sortOption: option }),
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  reset: () => set({ selectedCategory: null, sortOption: "latest", showFavoritesOnly: false, searchQuery: "" }),
}));
