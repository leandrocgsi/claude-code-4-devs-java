'use client';

import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { ToastMessage } from '@/app/store/modules/global/useToastStore';
import { useToast, useToasts } from '@/hooks/useToast/useToast';
import styles from './Toast.module.css';

const AUTO_DISMISS_MS = 4000;

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[toast.tone]}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <span>{toast.message}</span>
      <button type="button" className={styles.close} onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <FaTimes />
      </button>
    </div>
  );
}

export default function Toast() {
  const toasts = useToasts();
  const { dismiss } = useToast();

  return (
    <div className={styles.viewport}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}
