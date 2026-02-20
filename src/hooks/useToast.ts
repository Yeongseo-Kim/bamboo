import { useCallback, useState } from 'react';

interface ToastState {
  open: boolean;
  text: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    text: '',
  });

  const showToast = useCallback((text: string) => {
    setToast({ open: true, text });
  }, []);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return { toast, showToast, closeToast };
}
