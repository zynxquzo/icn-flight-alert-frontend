import { useCallback, useEffect, useRef, useState } from 'react';
import Toaster from '../components/Toaster';
import { ToastContext } from './toast-context';

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Set());

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        timeoutsRef.current.delete(timeoutId);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
      timeoutsRef.current.add(timeoutId);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
