import { create } from "zustand";

interface OfflineState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  setOnline: (online) => set({ isOnline: online }),
}));
