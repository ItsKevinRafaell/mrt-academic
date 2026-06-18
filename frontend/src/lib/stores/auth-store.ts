import { create } from "zustand";
import type { User, Role } from "@/types";

interface AuthState {
  user: User | null;
  role: Role | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User, role: Role, token: string) => void;
  logout: () => void;
  hydrate: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user, role, token) => {
    localStorage.setItem("mrt_token", token);
    localStorage.setItem("mrt_user", JSON.stringify(user));
    localStorage.setItem("mrt_role", role);
    set({ user, role: role as Role, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("mrt_token");
    localStorage.removeItem("mrt_user");
    localStorage.removeItem("mrt_role");
    set({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    window.location.href = "/login";
  },

  hydrate: () => {
    console.log("[AuthStore] Hydrate called");
    if (typeof window === "undefined") {
      console.log("[AuthStore] SSR detected, setting isLoading: false");
      set({ isLoading: false });
      return;
    }
    const token = localStorage.getItem("mrt_token");
    const userStr = localStorage.getItem("mrt_user");
    const role = localStorage.getItem("mrt_role");
    console.log("[AuthStore] LocalStorage:", { token: !!token, user: !!userStr, role: !!role });

    if (token && userStr && role) {
      try {
        const user = JSON.parse(userStr) as User;
        console.log("[AuthStore] User parsed successfully:", user.email);
        set({
          user,
          role: role as Role,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        console.log("[AuthStore] State updated, isLoading: false");
      } catch (e) {
        console.error("[AuthStore] Failed to parse user:", e);
        set({ isLoading: false });
      }
    } else {
      console.log("[AuthStore] No auth data, setting isLoading: false");
      set({ isLoading: false });
    }
  },

  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("mrt_token");
  },
}));
