import { create } from "zustand";
import type { User, Role } from "@/types";

interface AuthState {
  user: User | null;
  role: Role | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setUser: (user: User, role: Role, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  _hasHydrated: false,

  setUser: (user, role, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mrt_token", token);
      localStorage.setItem("mrt_user", JSON.stringify(user));
      localStorage.setItem("mrt_role", role);
    }
    set({ user, role: role as Role, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mrt_token");
      localStorage.removeItem("mrt_user");
      localStorage.removeItem("mrt_role");
    }
    set({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  setHydrated: () => {
    set({ _hasHydrated: true });
  },
}));

// Client-side hydration
if (typeof window !== "undefined") {
  const token = localStorage.getItem("mrt_token");
  const userStr = localStorage.getItem("mrt_user");
  const role = localStorage.getItem("mrt_role");

  if (token && userStr && role) {
    try {
      const user = JSON.parse(userStr);
      useAuthStore.setState({
        user,
        role: role as Role,
        token,
        isAuthenticated: true,
        isLoading: false,
        _hasHydrated: true,
      });
    } catch {
      localStorage.removeItem("mrt_token");
      localStorage.removeItem("mrt_user");
      localStorage.removeItem("mrt_role");
      useAuthStore.setState({ _hasHydrated: true });
    }
  } else {
    useAuthStore.setState({ _hasHydrated: true });
  }
}
