"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** "Mostrar módulos en vista previa": per-browser flag, off by default. Call `rehydrate()` after mount (skipHydration avoids an SSR mismatch). */
export const usePreviewStore = create<{ showPreview: boolean; setShowPreview: (v: boolean) => void }>()(
  persist(
    (set) => ({ showPreview: false, setShowPreview: (showPreview) => set({ showPreview }) }),
    { name: "ic.showPreview", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
