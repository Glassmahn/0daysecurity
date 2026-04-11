import { useState, useMemo, useCallback } from 'react';

export function usePagination<T>(items: T[], pageSize: number = 15) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const goTo = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);
  const next = useCallback(() => goTo(safePage + 1), [safePage, goTo]);
  const prev = useCallback(() => goTo(safePage - 1), [safePage, goTo]);
  const reset = useCallback(() => setPage(1), []);

  return { paged, page: safePage, totalPages, total: items.length, goTo, next, prev, reset, pageSize };
}
