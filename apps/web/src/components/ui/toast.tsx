"use client";

import React from "react";
import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, Copy, Check, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: "border-green-500/50 bg-green-500/10",
    error: "border-red-500/50 bg-red-500/10",
    warning: "border-yellow-500/50 bg-yellow-500/10",
    info: "border-blue-500/50 bg-blue-500/10",
  };

  const iconColors = {
    success: "text-green-400",
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300",
        colors[toast.type],
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconColors[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{toast.title}</p>
        {toast.message && (
          <p className="text-gray-400 text-xs mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="text-gray-500 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Error Report Utilities ──────────────────────────────────────────────

const WHATSAPP_NUMBER = "+595994516360";

interface ErrorReport {
  error: Error;
  digest?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

function buildErrorReport(
  error: Error,
  digest?: string,
  componentStack?: string
): ErrorReport {
  return {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } as Error,
    digest,
    componentStack,
    url: typeof window !== "undefined" ? window.location.href : "server",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
    timestamp: new Date().toISOString(),
  };
}

function formatErrorForWhatsApp(report: ErrorReport): string {
  const lines = [
    "🚨 *REPORTE DE ERROR - InteliCont*",
    "",
    "📅 *Fecha:* " + report.timestamp,
    "🔗 *URL:* " + report.url,
    "📱 *Navegador:* " + report.userAgent.slice(0, 80),
    "",
    "❌ *Error:* " + report.error.message,
    "🏷️ *Tipo:* " + report.error.name,
  ];

  if (report.digest) {
    lines.push("🆔 *Digest:* " + report.digest);
  }

  if (report.componentStack) {
    lines.push("", "📚 *Component Stack:*", "```", report.componentStack.trim().slice(0, 500), "```");
  }

  if (report.error.stack) {
    const stackLines = report.error.stack.split("\n").slice(0, 8);
    lines.push("", "📍 *Stack Trace:*", "```", stackLines.join("\n"), "```");
  }

  lines.push("", "⚙️ _Generado automáticamente por InteliCont_");

  return lines.join("\n");
}

function formatErrorForCopy(report: ErrorReport): string {
  const lines = [
    "=== REPORTE DE ERROR - InteliCont ===",
    "",
    "Fecha: " + report.timestamp,
    "URL: " + report.url,
    "Navegador: " + report.userAgent,
    "",
    "Error: " + report.error.message,
    "Tipo: " + report.error.name,
  ];

  if (report.digest) {
    lines.push("Digest: " + report.digest);
  }

  if (report.componentStack) {
    lines.push("", "Component Stack:", report.componentStack.trim());
  }

  if (report.error.stack) {
    lines.push("", "Stack Trace:", report.error.stack);
  }

  return lines.join("\n");
}

function sendWhatsAppReport(report: ErrorReport) {
  const text = formatErrorForWhatsApp(report);
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${encoded}`, "_blank");
}

async function copyErrorReport(report: ErrorReport): Promise<boolean> {
  const text = formatErrorForCopy(report);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Error Boundary ──────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  digest?: string;
  componentStack?: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error, info: React.ErrorInfo) {
    return {
      hasError: true,
      error,
      componentStack: info?.componentStack,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Send to PostHog if available
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture("error_boundary", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorFallback
            error={this.state.error!}
            componentStack={this.state.componentStack}
            onRetry={() => this.setState({ hasError: false, error: null })}
          />
        )
      );
    }

    return this.props.children;
  }
}

// ─── Error Fallback Component ────────────────────────────────────────────

function ErrorFallback({
  error,
  digest,
  componentStack,
  onRetry,
}: {
  error: Error;
  digest?: string;
  componentStack?: string;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const report = buildErrorReport(error, digest, componentStack);

  const handleCopy = async () => {
    const success = await copyErrorReport(report);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    setIsReporting(true);
    sendWhatsAppReport(report);
    setTimeout(() => setIsReporting(false), 1000);
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        {/* Error icon */}
        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>

        {/* Error info */}
        <h2 className="text-xl font-bold text-white mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-400 text-sm mb-2">
          {error.message || "Error inesperado"}
        </p>
        {digest && (
          <p className="text-gray-600 text-xs font-mono mb-6">
            Error ID: {digest}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* WhatsApp report button */}
          <button
            onClick={handleWhatsApp}
            disabled={isReporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" />
            {isReporting ? "Abriendo WhatsApp..." : "Reportar por WhatsApp"}
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border",
              copied
                ? "bg-green-500/10 border-green-500/50 text-green-400"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            )}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar detalle
              </>
            )}
          </button>

          {/* Retry button */}
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>

        {/* Error details (collapsible) */}
        <details className="mt-6 text-left">
          <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-300 transition-colors">
            Ver detalles técnicos
          </summary>
          <div className="mt-3 p-4 bg-gray-900 rounded-xl border border-gray-800 text-xs font-mono text-gray-400 overflow-auto max-h-48">
            <p className="text-red-400 mb-2">{error.name}: {error.message}</p>
            {error.stack && (
              <pre className="whitespace-pre-wrap text-gray-500">{error.stack}</pre>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

// ─── Global Error Page ───────────────────────────────────────────────────

export function GlobalErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      digest={error.digest}
      onRetry={reset}
    />
  );
}
