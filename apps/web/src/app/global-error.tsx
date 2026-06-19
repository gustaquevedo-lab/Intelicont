"use client";

import { GlobalErrorFallback } from "@/components/ui/toast";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      <GlobalErrorFallback error={error} reset={reset} />
    </div>
  );
}
