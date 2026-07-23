import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let openModalCount = 0;

export function Modal({
  onClose,
  children,
  widthClassName = 'max-w-[800px]',
}: {
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    openModalCount += 1;
    const currentDepth = openModalCount;
    setDepth(currentDepth);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openModalCount !== currentDepth) return;
      e.stopPropagation();
      onClose();
    };

    document.addEventListener('keydown', onKey);
    if (openModalCount === 1) document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-10"
      style={{ zIndex: 40 + Math.max(depth, 1) * 10 }}
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-[#11442f]/40 dark:bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 mt-6 w-full ${widthClassName} rounded-lg border border-border bg-surface p-6 shadow-xl sm:mt-10 sm:p-8`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text sm:right-4 sm:top-4"
          aria-label="Закрыть"
        >
          <span aria-hidden className="text-[22px] leading-none">
            ×
          </span>
        </button>
        <div className="pr-8">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
