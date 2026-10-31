import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastStore {
  toasts: ToastMessage[];
  show: (tone: ToastTone, message: string) => void;
  dismiss: (id: number) => void;
}

let nextToastId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (tone, message) =>
    set((state) => ({ toasts: [...state.toasts, { id: nextToastId++, tone, message }] })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
