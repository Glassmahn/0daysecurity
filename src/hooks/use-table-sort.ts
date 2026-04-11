import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export function useTableSort<T extends Record<string, unknown>>(
  data: T[],
  defaultColumn?: string,
  defaultDirection: SortDirection = null
) {
  const [sort, setSort] = useState<SortState>({
    column: defaultColumn ?? null,
    direction: defaultDirection,
  });

  const toggle = useCallback((column: string) => {
    setSort(prev => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: null };
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sort.column || !sort.direction) return data;
    const col = sort.column;
    const dir = sort.direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      const av = a[col];
      const bv = b[col];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [data, sort.column, sort.direction]);

  return { sorted, sort, toggle };
}
