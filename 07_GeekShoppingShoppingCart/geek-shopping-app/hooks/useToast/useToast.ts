import { useToastStore } from '@/app/store/modules/global/useToastStore';

export function useToast() {
  const show = useToastStore((state) => state.show);
  const dismiss = useToastStore((state) => state.dismiss);
  return { show, dismiss };
}

export function useToasts() {
  return useToastStore((state) => state.toasts);
}
