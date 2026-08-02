import { useEffect, useRef, ReactNode } from 'react'

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const Modal = ({ open, onClose, children, title }: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveEl.current = document.activeElement as HTMLElement;
      dialogRef.current?.focus();
    }
    return () => {
      previousActiveEl.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 rounded-none bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        className="bg-background p-6 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {title && (
          <h2 className="font-display text-xl font-bold text-text mb-4">{title}</h2>
        )}
        {children}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 rounded-xl bg-soft text-muted hover:text-text transition-colors text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};