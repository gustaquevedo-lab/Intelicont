import { AlertTriangle } from "lucide-react";

export function PreviewBanner() {
  return (
    <div role="note" data-testid="preview-banner" className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      Vista previa — datos de ejemplo, no reflejan tu contabilidad
    </div>
  );
}
