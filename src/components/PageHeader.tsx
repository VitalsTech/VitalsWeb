import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHeader({
  title,
  description,
  backTo,
  backLabel = 'Назад',
  actions,
}: {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  useEffect(() => {
    document.title = title ? `${title} · Vitals` : 'Vitals';
  }, [title]);

  return (
    <div className="mb-6 sm:mb-8">
      {backTo && (
        <Link
          to={backTo}
          className="mb-3 inline-block text-[14px] text-text-muted hover:text-text sm:mb-4"
        >
          ← {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-text sm:text-[28px]">{title}</h1>
          {description && (
            <p className="mt-2 text-[13px] text-text-muted sm:text-[14px]">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
}
