/**
 * exportCsv — Generates a CSV file from an array of row objects and triggers
 * a browser download. Values are double-quoted and internal quotes are escaped
 * to comply with RFC 4180.
 *
 * @param rows - Array of row objects keyed by header name
 * @param headers - Ordered list of column headers (also used as object keys)
 * @param filename - Download filename (default: 'export.csv')
 */
export function exportCsv(rows: any[], headers: string[], filename = 'export.csv') {
  if (!rows || rows.length === 0) return;

  const csvRows = [headers.join(',')];
  for (const r of rows) {
    const values = headers.map(h => r[h] ?? r[h.toLowerCase()] ?? '');
    // Wrap each value in double quotes and escape any internal double quotes
    const escaped = values.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    csvRows.push(escaped);
  }

  const csv = csvRows.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke the object URL to free memory after the download is triggered
  URL.revokeObjectURL(url);
}
