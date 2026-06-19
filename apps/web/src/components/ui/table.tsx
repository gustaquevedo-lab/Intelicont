import { useState, useMemo, Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  width?: string;
  hideOnMobile?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (ids: Set<string | number>) => void;
  expandableRender?: (row: T) => ReactNode;
  emptyMessage?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="border-b border-border last:border-0">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700" style={{ width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function MobileSkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface space-y-3 animate-pulse">
      <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-1/2 rounded-md bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-2/3 rounded-md bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  onRowClick,
  selectedIds,
  onSelectionChange,
  expandableRender,
  emptyMessage = "No data available",
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp =
        typeof aVal === "string"
          ? (aVal as string).localeCompare(bVal as string)
          : Number(aVal) - Number(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = total ? Math.ceil(total / pageSize) : 1;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string | number) => {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      const all = new Set(data.map(keyExtractor));
      onSelectionChange(all);
    }
  };

  const toggleExpand = (id: string | number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    data.length > 0 && data.every((r) => selectedIds?.has(keyExtractor(r)));

  const desktopCols = columns.filter((c) => !c.hideOnMobile);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                {onSelectionChange && (
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                    />
                  </th>
                )}
                {expandableRender && <th className="w-10" />}
                {desktopCols.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 text-left text-xs font-bold text-text-muted uppercase tracking-wider",
                      col.sortable && "cursor-pointer select-none hover:text-text transition-colors duration-150"
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            "transition-transform duration-200",
                            sortDir === "desc" && "rotate-180"
                          )}
                        >
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} columns={desktopCols.length + (onSelectionChange ? 1 : 0) + (expandableRender ? 1 : 0)} />
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={desktopCols.length + (onSelectionChange ? 1 : 0) + (expandableRender ? 1 : 0)}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-text-muted">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <path d="M3 3h18v18H3z" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                      </svg>
                      <p className="text-sm font-medium">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => {
                  const id = keyExtractor(row);
                  const isExpanded = expandedRows.has(id);
                  const isSelected = selectedIds?.has(id);
                  return (
                    <Fragment key={id}>
                      <tr
                        className={cn(
                          "border-b border-border last:border-0 transition-colors duration-150",
                          onRowClick && "cursor-pointer hover:bg-surface-2/50",
                          isSelected && "bg-primary/[0.03]"
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {onSelectionChange && (
                          <td className="px-4 py-3.5">
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={() => toggleSelect(id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
                            />
                          </td>
                        )}
                        {expandableRender && (
                          <td className="px-4 py-3.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleExpand(id); }}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-all duration-200"
                            >
                              <svg
                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                className={cn("transition-transform duration-200", isExpanded && "rotate-90")}
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          </td>
                        )}
                        {desktopCols.map((col) => (
                          <td key={col.key} className="px-4 py-3.5 text-sm text-text">
                            {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                          </td>
                        ))}
                      </tr>
                      {expandableRender && (
                        <tr>
                          <td colSpan={desktopCols.length + (onSelectionChange ? 1 : 0) + 1} className="p-0">
                            <div
                              className={cn(
                                "overflow-hidden transition-all duration-250 border-b border-border",
                                isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                              )}
                            >
                              <div className="px-6 py-4 bg-surface-2/30">
                                {expandableRender(row)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {total !== undefined && onPageChange && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <MobileSkeletonCard key={i} />)
          : sortedData.length === 0
            ? (
              <div className="flex flex-col items-center gap-2 py-12 text-text-muted">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                  <path d="M3 3h18v18H3z" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                </svg>
                <p className="text-sm font-medium">{emptyMessage}</p>
              </div>
            )
            : sortedData.map((row) => {
              const id = keyExtractor(row);
              const isExpanded = expandedRows.has(id);
              const isSelected = selectedIds?.has(id);
              return (
                <div
                  key={id}
                  className={cn(
                    "rounded-xl border bg-surface p-4 transition-all duration-200",
                    onRowClick && "cursor-pointer",
                    isSelected
                      ? "border-primary/40 shadow-[0_0_0_1px_rgba(37,99,235,0.15)]"
                      : "border-border hover:border-primary/20 hover:shadow-sm"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {onSelectionChange && (
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleSelect(id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-border text-primary accent-primary"
                        />
                      )}
                      <div className="space-y-1">
                        {columns.slice(0, 2).map((col) => (
                          <div key={col.key} className="text-sm text-text">
                            {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                          </div>
                        ))}
                      </div>
                    </div>
                    {expandableRender && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-2 transition-all flex-shrink-0"
                      >
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className={cn("transition-transform duration-200", isExpanded && "rotate-90")}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                    {columns.slice(2).map((col) => (
                      <div key={col.key}>
                        <span className="font-medium block mb-0.5">{col.label}</span>
                        <span className="text-text">
                          {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                        </span>
                      </div>
                    ))}
                  </div>
                  {expandableRender && (
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-250",
                        isExpanded ? "max-h-[500px] opacity-100 mt-3 pt-3 border-t border-border" : "max-h-0 opacity-0"
                      )}
                    >
                      {expandableRender(row)}
                    </div>
                  )}
                </div>
              );
            })}
        {total !== undefined && onPageChange && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} className="mt-4" />
        )}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  className?: string;
}) {
  const pages = useMemo(() => {
    const range: (number | "ellipsis")[] = [];
    const delta = 1;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    range.push(1);
    if (left > 2) range.push("ellipsis");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("ellipsis");
    if (totalPages > 1) range.push(totalPages);

    return range;
  }, [page, totalPages]);

  return (
    <div className={cn("flex items-center justify-between px-4 py-3 border-t border-border", className)}>
      <p className="text-xs text-text-muted">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-text-muted">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200",
                p === page
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-2 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
