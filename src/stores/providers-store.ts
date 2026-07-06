import { create } from "zustand";

export interface ProviderSearchResult {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  city: string;
  mainCategory: string | null;
  category: string;
  shortDescription: string | null;
  priceRange: string | null;
  availability: string;
  verified: boolean;
  verificationLevel: string | null;
  formalizationStatus: string;
  trustScore: number;
  responseTimeHrs: number | null;
  completedRequests: number;
  photos: string[];
  lat: number | null;
  lng: number | null;
}

export interface FullProvider {
  provider: any;
  catalogItems: any[];
  photos: any[];
  medals: any[];
  reviews: any[];
  averageReviewScore: number | null;
  completedRequestsCount: number;
}

interface ProvidersState {
  providers: ProviderSearchResult[];
  currentProvider: FullProvider | null;
  isLoading: boolean;
  error: string | null;

  searchProviders: (params: { q?: string; city?: string }) => Promise<void>;
  getProvider: (idOrSlug: string) => Promise<FullProvider | null>;
  clearCurrentProvider: () => void;
}

export const useProvidersStore = create<ProvidersState>((set, get) => ({
  providers: [],
  currentProvider: null,
  isLoading: false,
  error: null,

  searchProviders: async ({ q, city }) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (city) params.set("city", city);

      const res = await fetch(`/api/providers/search?${params}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al buscar proveedores");
      }

      set({ providers: data.data, isLoading: false });
    } catch (error) {
      console.error("searchProviders error:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getProvider: async (idOrSlug) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/providers/${encodeURIComponent(idOrSlug)}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        set({ currentProvider: null, isLoading: false });
        return null;
      }

      set({ currentProvider: data.data, isLoading: false });
      return data.data;
    } catch (error) {
      console.error("getProvider error:", error);
      set({ error: (error as Error).message, isLoading: false });
      return null;
    }
  },

  clearCurrentProvider: () => set({ currentProvider: null }),
}));