"use client";

import Link from "next/link";
import { WifiOff, Camera, RefreshCw } from "lucide-react";
import { Wordmark } from "@/components/logo";

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center max-w-sm">
        <div className="h-20 w-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-10 w-10 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sin conexión
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          No tenés internet. Pero no te preocupes — <Wordmark /> PWA funciona offline.
          Tus facturas capturadas se guardan localmente y se sincronizan automáticamente.
        </p>

        <div className="space-y-3">
          <Link
            href="/m"
            className="block w-full py-3 px-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95"
          >
            <Camera className="h-5 w-5" />
            Capturar facturas
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="block w-full py-3 px-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw className="h-5 w-5" />
            Reintentar conexión
          </button>
        </div>
      </div>
    </div>
  );
}
