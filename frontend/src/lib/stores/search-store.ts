import { create } from "zustand";
import type { SearchResult } from "@/lib/api/search";

interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: "",
  results: [],
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: "", results: [] }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
