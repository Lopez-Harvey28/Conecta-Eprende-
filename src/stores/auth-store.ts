import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  roleLabels?: string[];
  requesterProfileId?: string;
  providerProfileId?: string | null;
  profileState?: "DRAFT" | "ACTIVE" | "SUSPENDED";
  providers: Array<{
    id: string;
    displayName: string;
    slug: string;
    verified: boolean;
    formalizationStatus: string;
    status?: string;
    statusReason?: string | null;
    suspendedUntil?: string | null;
  }>;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  fetchMe: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await res.json() as { success: boolean; data?: T; error?: string };

    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data.data as T;
  } catch (error) {
    console.error("API error:", error);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch<{ user: AuthUser }>("/api/auth/me");
      if (data?.user) {
        set({ user: data.user, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json() as { success: boolean; data?: { user: AuthUser }; error?: string };

      if (!res.ok || !data.success) {
        set({ error: data.error || "Error al iniciar sesión", isLoading: false });
        return false;
      }

      set({ user: data.data?.user || null, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (error) {
      set({ error: "Error de conexión", isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json() as { success: boolean; data?: { user: AuthUser }; error?: string };

      if (!res.ok || !data.success) {
        set({ error: data.error || "Error al registrar", isLoading: false });
        return false;
      }

      set({ user: data.data?.user || null, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (error) {
      set({ error: "Error de conexión", isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  refreshToken: async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  },
}));
