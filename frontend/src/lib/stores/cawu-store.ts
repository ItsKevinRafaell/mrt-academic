import { create } from "zustand";
import type { Cawu } from "@/lib/api/cawu";

interface CawuState {
  selectedCawu: Cawu | null;
  cawus: Cawu[];
  isLoading: boolean;
  setSelectedCawu: (cawu: Cawu | null) => void;
  setCawus: (cawus: Cawu[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCawuStore = create<CawuState>((set) => ({
  selectedCawu: null,
  cawus: [],
  isLoading: false,

  setSelectedCawu: (cawu) => set({ selectedCawu: cawu }),
  setCawus: (cawus) => set({ cawus }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
