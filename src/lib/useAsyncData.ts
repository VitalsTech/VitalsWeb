import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/http';

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Сессия истекла. Пожалуйста, войдите снова.';
    if (error.status === 404) return 'Данные не найдены.';
    if (error.status >= 500) return 'Сервер временно недоступен. Попробуйте ещё раз.';
    return error.message || 'Не удалось выполнить запрос.';
  }
  if (error instanceof Error) return error.message;
  return 'Не удалось выполнить запрос.';
}

/**
 * Fetches data from the API on mount / whenever `deps` change, exposing a
 * standard `{ data, loading, error, reload }` shape so pages can render
 * consistent loading/error states instead of relying on mock data.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ data: prev.data, loading: true, error: null }));

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: messageFor(error) });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { ...state, reload };
}
