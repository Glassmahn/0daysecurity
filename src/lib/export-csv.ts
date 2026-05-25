export function exportToCsv(filename: string, rows: Record<string, unknown>[], columns?: { key: string; label: string }[]) {
  if (rows.length === 0) return;

  const cols = columns ?? Object.keys(rows[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${c.label}"`).join(',');
  const body = rows.map(row =>
    cols.map(c => {
      const v = row[c.key];
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(',')
  ).join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
