/**
 * Excel / CSV Export Utility
 *
 * Generates downloadable CSV files from any array of objects.
 * Supports Excel-compatible formatting with BOM for proper UTF-8 in Excel.
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  options?: {
    columns?: { key: keyof T; label: string }[];
    delimiter?: string;
  }
): void {
  if (data.length === 0) return;

  const delimiter = options?.delimiter || ";";
  const columns = options?.columns || Object.keys(data[0]).map((k) => ({ key: k as keyof T, label: k }));

  // Excel BOM for UTF-8
  const BOM = "\uFEFF";
  const header = columns.map((c) => `"${c.label}"`).join(delimiter);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(delimiter)
  );

  const csv = BOM + [header, ...rows].join("\n");
  downloadBlob(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function exportToExcelCSV<T extends Record<string, any>>(
  sheets: { name: string; data: T[]; columns?: { key: keyof T; label: string }[] }[],
  filename: string
): void {
  // Simple multi-sheet CSV (one file per sheet, zipped mentally)
  // For true Excel, we'd need xlsx library. This is a lightweight alternative.
  sheets.forEach((sheet) => {
    exportToCSV(sheet.data, `${filename}_${sheet.name}`, { columns: sheet.columns });
  });
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
