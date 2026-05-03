import { useEffect, useRef } from 'react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  ariaLabelledBy = 'modal-title',
}) {
  const dialogRef = useRef(null);
  const prevActive = useRef(null);

  useEffect(() => {
    if (!open) return;
    prevActive.current = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) {
      const focusable = dialogRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus?.();
    }
    if (!open && prevActive.current?.focus) {
      prevActive.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title != null ? ariaLabelledBy : undefined}
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        {title != null && (
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 id={ariaLabelledBy} className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}
        <div className="max-h-[min(70vh,560px)] overflow-y-auto px-6 py-4">{children}</div>
        {footer != null && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
