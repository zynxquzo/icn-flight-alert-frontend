import { useContext } from 'react';
import { ToastContext } from '../context/toast-context';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (ctx == null) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
