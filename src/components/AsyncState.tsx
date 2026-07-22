import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

export function AsyncState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    return <p className="py-10 text-center text-[14px] text-text-muted">Загрузка…</p>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/5 px-6 py-8 text-center">
        <p className="text-[14px] text-danger">{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Повторить
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
