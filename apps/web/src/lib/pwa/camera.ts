"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type ImageFilter = "none" | "grayscale" | "high-contrast" | "brighten";

export interface CaptureResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  filter: ImageFilter;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);

  const start = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Cámara no soportada en este dispositivo");
      }

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() || {}) as Record<string, unknown> & { torch?: boolean };
      setHasFlash(!!capabilities.torch);
      setMaxZoom((capabilities.zoom as number) || 1);

      setIsStreaming(true);
      setIsReady(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al acceder a la cámara";
      setError(message);
      setIsReady(false);
    }
  }, [facingMode]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setFlashOn(false);
  }, []);

  const flip = useCallback(async () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    await start();
  }, [start]);

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    const newState = !flashOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: newState } as MediaTrackConstraintSet & { torch?: boolean }],
      });
      setFlashOn(newState);
    } catch {
      // Fallback: try different format
      try {
        const constraints: MediaTrackConstraintSet & { torch?: boolean } = { torch: newState };
        await track.applyConstraints({ advanced: [constraints] });
        setFlashOn(newState);
      } catch {
        setError("Flash no disponible");
      }
    }
  }, [flashOn]);

  const setZoomLevel = useCallback(
    (level: number) => {
      if (!streamRef.current) return;
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return;
      const clamped = Math.max(1, Math.min(level, maxZoom));
      try {
        track.applyConstraints({ advanced: [{ zoom: clamped } as MediaTrackConstraintSet & { zoom?: number }] });
        setZoom(clamped);
      } catch {
        // ignore
      }
    },
    [maxZoom]
  );

  const capture = useCallback(
    async (filter: ImageFilter = "none"): Promise<CaptureResult | null> => {
      if (!videoRef.current || !canvasRef.current) return null;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Match canvas to video dimensions
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      // Draw video frame
      ctx.drawImage(video, 0, 0, width, height);

      // Apply filter via canvas
      if (filter !== "none") {
        const imageData = ctx.getImageData(0, 0, width, height);
        const filtered = applyImageFilter(imageData, filter);
        ctx.putImageData(filtered, 0, 0);
      }

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
      });

      if (!blob) return null;

      // Generate thumbnail dataURL
      const thumbCanvas = document.createElement("canvas");
      const maxThumb = 200;
      const ratio = Math.min(maxThumb / width, maxThumb / height);
      thumbCanvas.width = width * ratio;
      thumbCanvas.height = height * ratio;
      const tctx = thumbCanvas.getContext("2d");
      if (tctx) {
        tctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      }
      const dataUrl = thumbCanvas.toDataURL("image/jpeg", 0.7);

      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30);
      }

      return { blob, dataUrl, width, height, filter };
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    isReady,
    isStreaming,
    error,
    facingMode,
    hasFlash,
    flashOn,
    zoom,
    maxZoom,
    start,
    stop,
    flip,
    toggleFlash,
    setZoom: setZoomLevel,
    capture,
  };
}

// ─── Image Filters (Canvas) ──────────────────────────────────────────────

export function applyImageFilter(
  imageData: ImageData,
  filter: ImageFilter
): ImageData {
  const data = imageData.data;
  const len = data.length;

  switch (filter) {
    case "grayscale": {
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Luma formula: 0.299R + 0.587G + 0.114B
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      break;
    }
    case "high-contrast": {
      // Contrast factor
      const factor = 1.6;
      const intercept = 128 * (1 - factor);
      for (let i = 0; i < len; i += 4) {
        data[i] = factor * data[i] + intercept;
        data[i + 1] = factor * data[i + 1] + intercept;
        data[i + 2] = factor * data[i + 2] + intercept;
      }
      break;
    }
    case "brighten": {
      // Adaptive brightness for dim photos
      let totalLuma = 0;
      for (let i = 0; i < len; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLuma = totalLuma / (len / 4);
      const target = 140;
      const boost = avgLuma < target ? (target / Math.max(avgLuma, 30)) : 1;
      const cap = 1.8;
      const factor = Math.min(boost, cap);
      for (let i = 0; i < len; i += 4) {
        data[i] = Math.min(255, factor * data[i]);
        data[i + 1] = Math.min(255, factor * data[i + 1]);
        data[i + 2] = Math.min(255, factor * data[i + 2]);
      }
      break;
    }
    case "none":
    default:
      break;
  }

  return imageData;
}

export const filterLabel: Record<ImageFilter, string> = {
  none: "Original",
  grayscale: "Escala de grises",
  "high-contrast": "Contraste alto",
  brighten: "Auto-brillo",
};
