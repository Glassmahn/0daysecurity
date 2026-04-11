import { useState, useCallback, useMemo } from 'react';

export function useBulkSelection(filteredIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev => {
      if (prev.size === filteredIds.length && filteredIds.every(id => prev.has(id))) {
        return new Set();
      }
      return new Set(filteredIds);
    });
  }, [filteredIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = useMemo(
    () => filteredIds.length > 0 && filteredIds.every(id => selected.has(id)),
    [filteredIds, selected]
  );

  const someSelected = useMemo(
    () => filteredIds.some(id => selected.has(id)) && !allSelected,
    [filteredIds, selected, allSelected]
  );

  return {
    selected,
    count: selected.size,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
    isSelected: (id: string) => selected.has(id),
  };
}
