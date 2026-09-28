/**
 * Utility functions for exporting reports and tables to CSV format
 */

export function exportToCSV(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Determine headers if not provided
  const headerKeys = headers || Object.keys(rows[0]).map((k) => ({ key: k, label: k }));

  const csvRows: string[] = [];

  // Header row
  csvRows.push(headerKeys.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(','));

  // Data rows
  rows.forEach((row) => {
    const values = headerKeys.map((h) => {
      let val = row[h.key];
      if (val === undefined || val === null) {
        return '""';
      }
      if (typeof val === 'number') {
        return `"${val}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

