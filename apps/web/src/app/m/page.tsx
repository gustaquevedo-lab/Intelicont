"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera, X, Image as ImageIcon, Wifi, WifiOff, Sparkles, CheckCircle2,
  AlertCircle, Loader2, Trash2, RefreshCw, FlipHorizontal, Zap,
  Sun, Moon, ZoomIn, Filter as FilterIcon, ChevronRight, Bell,
  ScanLine, RotateCw, Home, Layers, ArrowUpRight, Upload,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCamera, applyImageFilter, type ImageFilter, filterLabel } from "@/lib/pwa/camera";
import { useInvoicesQueue, useOnlineStatus, statusLabel, statusColor, syncManager } from "@/lib/pwa/sync";
import { useGestures, useHaptic } from "@/lib/pwa/gestures";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import { useToast } from "@/components/ui/toast";

type View = "home" | "capture" | "review" | "queue" | "preview";

// ─── Main Mobile PWA Page ────────────────────────────────────────────────

function MobileApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);
  const isOnline = useOnlineStatus();
  const haptic = useHaptic();
  const { addToast } = useToast();

  const [view, setView] = useState<View>("home");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [activeFilter, setActiveFilter] = useState<ImageFilter>("none");
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle query params for shortcuts
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "scan") setView("capture");
    if (action === "queue") setView("queue");
  }, [searchParams]);

  const handleCaptureClick = useCallback(async () => {
    haptic("tap");
    setView("capture");
  }, [haptic]);

  const handleCloseCamera = useCallback(() => {
    haptic("tap");
    setView("home");
  }, [haptic]);

  const handlePhotoTaken = useCallback(
    (blob: Blob, dataUrl: string) => {
      setCapturedBlob(blob);
      setCapturedImage(dataUrl);
      setActiveFilter("none");
      setView("review");
    },
    []
  );

  const handleApprove = useCallback(async () => {
    if (!capturedBlob || !selectedEntity) return;
    setIsProcessing(true);
    haptic("scan");
    setView("queue");

    try {
      // Apply filter to blob if needed
      let finalBlob = capturedBlob;
      if (activeFilter !== "none") {
        // Re-apply filter
        const img = new window.Image();
        img.src = URL.createObjectURL(capturedBlob);
        await new Promise((res) => (img.onload = res));
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const filtered = applyImageFilter(imageData, activeFilter);
          ctx.putImageData(filtered, 0, 0);
          finalBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
          ).then((b) => b || capturedBlob);
        }
      }

      await syncManager.addInvoice(finalBlob, selectedEntity.id, {
        filter: activeFilter,
        width: 1920,
        height: 1080,
      });

      haptic("success");
      addToast({
        type: "success",
        title: "Factura agregada a la cola",
        message: isOnline ? "Se está procesando con IA" : "Se sincronizará cuando haya internet",
      });
      setCapturedBlob(null);
      setCapturedImage(null);
      setView("home");
    } catch (err) {
      haptic("error");
      addToast({
        type: "error",
        title: "Error al guardar",
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [capturedBlob, activeFilter, selectedEntity, haptic, addToast, isOnline]);

  const handleRetake = useCallback(() => {
    haptic("tap");
    setCapturedImage(null);
    setCapturedBlob(null);
    setView("capture");
  }, [haptic]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
      {/* Top Status Bar */}
      <TopBar
        isOnline={isOnline}
        onHome={() => setView("home")}
        onQueue={() => setView("queue")}
        view={view}
      />

      {/* Main View */}
      <main className="relative">
        {view === "home" && (
          <HomeView
            user={user}
            entityName={selectedEntity?.tradeName || selectedEntity?.legalName}
            onCapture={handleCaptureClick}
            onQueue={() => setView("queue")}
          />
        )}

        {view === "capture" && (
          <CameraView
            onCapture={handlePhotoTaken}
            onClose={handleCloseCamera}
          />
        )}

        {view === "review" && capturedImage && (
          <ReviewView
            image={capturedImage}
            filter={activeFilter}
            onFilterChange={setActiveFilter}
            onApprove={handleApprove}
            onRetake={handleRetake}
            isProcessing={isProcessing}
          />
        )}

        {view === "queue" && (
          <QueueView onBack={() => setView("home")} />
        )}
      </main>
    </div>
  );
}

export default function MobilePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <MobileApp />
    </Suspense>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────

function TopBar({
  isOnline,
  onHome,
  onQueue,
  view,
}: {
  isOnline: boolean;
  onHome: () => void;
  onQueue: () => void;
  view: View;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <button
          onClick={onHome}
          className="flex items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">InteliCont</span>
        </button>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
              isOnline
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isOnline ? "Online" : "Offline"}</span>
          </div>

          <button
            onClick={onQueue}
            className={cn(
              "p-2 rounded-lg transition-colors",
              view === "queue"
                ? "bg-primary/10 text-primary"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            )}
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Home View ───────────────────────────────────────────────────────────

function HomeView({
  user,
  entityName,
  onCapture,
  onQueue,
}: {
  user: any;
  entityName?: string;
  onCapture: () => void;
  onQueue: () => void;
}) {
  const { invoices } = useInvoicesQueue();

  const pending = invoices.filter(
    (i) => i.status === "queued" || i.status === "processing"
  ).length;
  const syncedToday = invoices.filter(
    (i) => i.status === "synced" && (i.syncedAt || 0) > Date.now() - 24 * 3600 * 1000
  ).length;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">
          {new Date().toLocaleDateString("es-PY", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          Hola, {user?.email?.split("@")[0] || "Contador"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {entityName || "Seleccioná una empresa"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-4 text-white shadow-xl shadow-primary/20">
          <div className="flex items-center justify-between mb-2">
            <ScanLine className="h-5 w-5 opacity-80" />
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">Pendientes</span>
          </div>
          <p className="text-3xl font-bold">{pending}</p>
          <p className="text-xs opacity-80 mt-1">En cola</p>
        </div>

        <div className="bg-gradient-to-br from-secondary to-secondary-dark rounded-2xl p-4 text-white shadow-xl shadow-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-5 w-5 opacity-80" />
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">Hoy</span>
          </div>
          <p className="text-3xl font-bold">{syncedToday}</p>
          <p className="text-xs opacity-80 mt-1">Digitalizadas</p>
        </div>
      </div>

      {/* Main CTA - Camera */}
      <button
        onClick={onCapture}
        className="w-full relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent rounded-3xl p-8 text-white shadow-2xl shadow-primary/30 active:scale-[0.98] transition-transform"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Camera className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Escanear Factura</h2>
            <p className="text-sm opacity-80 mt-1">Tocá para abrir la cámara con IA</p>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs bg-white/20 backdrop-blur rounded-full px-3 py-1">
            <Sparkles className="h-3 w-3" />
            <span>IA Gemini · OCR instantáneo</span>
          </div>
        </div>
      </button>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onQueue}
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 active:scale-95 transition-transform"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Cola</span>
        </button>

        <Link
          href="/sifen"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 active:scale-95 transition-transform"
        >
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-accent" />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">SIFEN XML</span>
        </Link>

        <Link
          href="/"
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 active:scale-95 transition-transform"
        >
          <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Home className="h-5 w-5 text-secondary" />
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Escritorio</span>
        </Link>
      </div>

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recientes</h2>
            <button
              onClick={onQueue}
              className="text-xs text-primary font-medium flex items-center gap-1"
            >
              Ver todas <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 3).map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Camera View ─────────────────────────────────────────────────────────

function CameraView({
  onCapture,
  onClose,
}: {
  onCapture: (blob: Blob, dataUrl: string) => void;
  onClose: () => void;
}) {
  const camera = useCamera();
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    camera.start();
    return () => camera.stop();
  }, [camera]);

  const handleShutter = useCallback(async () => {
    const result = await camera.capture("none");
    if (result) {
      setCapturedBlob(result.blob);
      onCapture(result.blob, result.dataUrl);
    }
  }, [camera, onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video feed */}
      <video
        ref={camera.videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        autoPlay
        muted
      />

      {/* Hidden canvas for capture */}
      <canvas ref={camera.canvasRef} className="hidden" />

      {/* Edge detector overlay - neon green alignment guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[85%] aspect-[3/4] max-h-[60%]">
          {/* Corners */}
          {[
            "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
            "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
            "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
            "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
          ].map((c, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-12 h-12 border-accent",
                c
              )}
              style={{
                boxShadow: "0 0 20px rgba(58, 175, 169, 0.8), inset 0 0 20px rgba(58, 175, 169, 0.3)",
              }}
            />
          ))}
          {/* Top label */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-accent text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
            style={{ textShadow: "0 0 10px rgba(58, 175, 169, 0.8)" }}
          >
            <ScanLine className="h-3 w-3" />
            Centrá la factura
          </div>
          {/* Subtle grid lines */}
          <div className="absolute inset-0 border border-white/10 rounded-2xl" />
        </div>
      </div>

      {/* Error state */}
      {camera.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center p-6 max-w-sm">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-2">Cámara no disponible</p>
            <p className="text-gray-400 text-sm mb-4">{camera.error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <X className="h-5 w-5" />
        </button>

        {camera.hasFlash && (
          <button
            onClick={camera.toggleFlash}
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur flex items-center justify-center active:scale-90 transition-transform",
              camera.flashOn
                ? "bg-yellow-400/90 text-yellow-900"
                : "bg-black/50 text-white"
            )}
          >
            {camera.flashOn ? <Zap className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-12 bg-gradient-to-t from-black/90 to-transparent z-10">
        <div className="flex items-center justify-center gap-8">
          {/* Zoom out */}
          {camera.maxZoom > 1 && (
            <button
              onClick={() => camera.setZoom(1)}
              className="h-10 w-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
            >
              <ZoomIn className="h-4 w-4 rotate-180" />
            </button>
          )}

          {/* Shutter button */}
          <button
            onClick={handleShutter}
            disabled={!camera.isReady}
            className="relative h-20 w-20 rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-accent" />
          </button>

          {/* Flip camera */}
          <button
            onClick={camera.flip}
            className="h-10 w-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
          >
            <FlipHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Zoom slider */}
        {camera.maxZoom > 1 && (
          <div className="mt-4 px-8">
            <input
              type="range"
              min="1"
              max={camera.maxZoom}
              step="0.1"
              value={camera.zoom}
              onChange={(e) => camera.setZoom(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Review View ─────────────────────────────────────────────────────────

function ReviewView({
  image,
  filter,
  onFilterChange,
  onApprove,
  onRetake,
  isProcessing,
}: {
  image: string;
  filter: ImageFilter;
  onFilterChange: (f: ImageFilter) => void;
  onApprove: () => void;
  onRetake: () => void;
  isProcessing: boolean;
}) {
  const [previewImage, setPreviewImage] = useState(image);

  // Apply filter to preview
  useEffect(() => {
    if (filter === "none") {
      setPreviewImage(image);
      return;
    }

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const filtered = applyImageFilter(imageData, filter);
        ctx.putImageData(filtered, 0, 0);
        setPreviewImage(canvas.toDataURL("image/jpeg", 0.85));
      }
    };
    img.src = image;
  }, [filter, image]);

  const handleSwipeLeft = useCallback(() => {
    const filters: ImageFilter[] = ["none", "grayscale", "high-contrast", "brighten"];
    const idx = filters.indexOf(filter);
    if (idx < filters.length - 1) onFilterChange(filters[idx + 1]);
  }, [filter, onFilterChange]);

  const handleSwipeRight = useCallback(() => {
    const filters: ImageFilter[] = ["none", "grayscale", "high-contrast", "brighten"];
    const idx = filters.indexOf(filter);
    if (idx > 0) onFilterChange(filters[idx - 1]);
  }, [filter, onFilterChange]);

  const { ref: gestureRef, scale } = useGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onRetake}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <h2 className="text-white text-sm font-semibold">Revisar foto</h2>
        <div className="h-10 w-10" />
      </div>

      {/* Image preview with gestures */}
      <div
        ref={gestureRef as any}
        className="flex-1 flex items-center justify-center overflow-hidden"
      >
        <img
          src={previewImage}
          alt="Preview"
          className="max-w-full max-h-full object-contain transition-transform"
          style={{ transform: `scale(${scale})` }}
        />
      </div>

      {/* Filter selector */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(["none", "grayscale", "high-contrast", "brighten"] as ImageFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                filter === f
                  ? "bg-accent text-white"
                  : "bg-white/10 text-white/70"
              )}
            >
              <FilterIcon className="h-3 w-3 inline mr-1" />
              {filterLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-8 pt-2 flex gap-3">
        <button
          onClick={onRetake}
          disabled={isProcessing}
          className="flex-1 py-4 rounded-2xl bg-white/10 backdrop-blur text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <X className="h-5 w-5" />
          Descartar
        </button>
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-xl shadow-primary/30"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Digitalizar con IA
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Queue View ──────────────────────────────────────────────────────────

function QueueView({ onBack }: { onBack: () => void }) {
  const { invoices, isOnline, deleteInvoice, retryInvoice, syncAll } = useInvoicesQueue();
  const haptic = useHaptic();

  const handleSync = useCallback(async () => {
    haptic("scan");
    const result = await syncAll();
    if (result.synced > 0) {
      haptic("success");
    }
  }, [haptic, syncAll]);

  const handleDelete = useCallback(async (id: string) => {
    haptic("warning");
    await deleteInvoice(id);
  }, [haptic, deleteInvoice]);

  const handleRetry = useCallback(async (id: string) => {
    haptic("tap");
    await retryInvoice(id);
  }, [haptic, retryInvoice]);

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
        >
          ← Volver
        </button>
        {invoices.some((i) => i.status === "queued" || i.status === "error") && isOnline && (
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-full active:scale-95"
          >
            <RefreshCw className="h-3 w-3" />
            Sincronizar
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Cola de subida
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {invoices.length === 0
          ? "Sin facturas en cola"
          : `${invoices.length} factura${invoices.length === 1 ? "" : "s"}`}
      </p>

      {invoices.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-20 w-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Layers className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Capturá tu primera factura para empezar
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              onDelete={handleDelete}
              onRetry={handleRetry}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Invoice Row ─────────────────────────────────────────────────────────

function InvoiceRow({
  invoice,
  onDelete,
  onRetry,
  compact = false,
}: {
  invoice: any;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  compact?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);

  const { ref: gestureRef } = useGestures({
    onSwipeLeft: () => onDelete && setShowActions(true),
    onSwipeRight: () => setShowActions(false),
  });

  return (
    <div
      ref={gestureRef as any}
      className={cn(
        "relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          {invoice.thumbnail ? (
            <img
              src={invoice.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              Factura #{invoice.id.slice(-6).toUpperCase()}
            </p>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(invoice.createdAt).toLocaleString("es-PY", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Processing state with laser animation */}
          {invoice.status === "processing" && <ProcessingLaser />}

          {/* Error state */}
          {invoice.status === "error" && invoice.errorMessage && (
            <p className="text-[10px] text-red-500 mt-1 truncate">
              {invoice.errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!compact && (showActions || onDelete || onRetry) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {invoice.status === "error" && onRetry && (
            <button
              onClick={() => onRetry(invoice.id)}
              className="flex-1 py-2 text-xs font-medium text-primary bg-primary/10 rounded-lg active:scale-95"
            >
              <RefreshCw className="h-3 w-3 inline mr-1" />
              Reintentar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(invoice.id)}
              className="flex-1 py-2 text-xs font-medium text-red-600 bg-red-500/10 rounded-lg active:scale-95"
            >
              <Trash2 className="h-3 w-3 inline mr-1" />
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap",
        statusColor[status as keyof typeof statusColor]
      )}
    >
      {statusLabel[status as keyof typeof statusLabel]}
    </span>
  );
}

// ─── Processing Laser Animation ──────────────────────────────────────────

function ProcessingLaser() {
  return (
    <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
      <div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
        style={{
          animation: "laserScan 1.5s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes laserScan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
