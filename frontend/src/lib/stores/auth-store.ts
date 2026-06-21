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
  getToken: () => string | null;
}

function getInitialState(): AuthState {
  if (typeof window === "undefined") {
    return {
      user: null,
      role: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: () => {},
      logout: () => {},
      getToken: () => null,
    };
  }

  const token = localStorage.getItem("mrt_token");
  const userStr = localStorage.getItem("mrt_user");
  const role = localStorage.getItem("mrt_role");

  if (token && userStr && role) {
    try {
      const user = JSON.parse(userStr) as User;
      return {
        user,
        role: role as Role,
        token,
        isLoading: false,
        isAuthenticated: true,
        setUser: () => {},
        logout: () => {},
        getToken: () => token,
      };
    } catch {
      localStorage.removeItem("mrt_token");
      localStorage.removeItem("mrt_user");
      localStorage.removeItem("mrt_role");
    }
  }

  return {
    user: null,
    role: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    setUser: () => {},
    logout: () => {},
    getToken: () => null,
  };
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = getInitialState();

  return {
    user: initial.user,
    role: initial.role,
    token: initial.token,
    isLoading: initial.isLoading,
    isAuthenticated: initial.isAuthenticated,

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

    getToken: () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("mrt_token");
    },
  };
});
