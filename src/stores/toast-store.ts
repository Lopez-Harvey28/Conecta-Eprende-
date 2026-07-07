import { create } from "zustand";

interface ToastState {
  toast: string | null;
  leaving: boolean;
  setToast: (msg: string | null) => void;
  setLeaving: (val: boolean) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  leaving: false,
  setToast: (msg) => set({ toast: msg, leaving: false }),
  setLeaving: (val) => set({ leaving: val }),
}));