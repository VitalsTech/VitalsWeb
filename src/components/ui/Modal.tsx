import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  onClose,
  children,
  widthClassName = 'max-w-[800px]',
}: {
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-6 sm:p-10">
      <div
        className="fixed inset-0 bg-[#11442f]/40 dark:bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative z-10 w-full ${widthClassName} rounded-lg border border-border bg-surface p-8 shadow-xl mt-10`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
