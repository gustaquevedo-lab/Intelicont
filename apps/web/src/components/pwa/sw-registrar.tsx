"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        // Unregister any old SW first to force update
        const oldRegs = await navigator.serviceWorker.getRegistrations();
        for (const reg of oldRegs) {
          if (reg.active && !reg.active.scriptURL.includes('/sw.js')) {
            await reg.unregister();
          }
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // always fetch fresh SW from server
        });
        console.log("[PWA] Service worker registered:", registration.scope);

        // Force update check immediately
        await registration.update();

        // Listen for updates — auto-reload when new SW activates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[PWA] New SW available, reloading...");
              setTimeout(() => window.location.reload(), 500);
            }
          });
        });

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SYNC_INVOICES") {
            window.dispatchEvent(new CustomEvent("pwa:sync-invoices"));
          }
        });

        // Register for background sync
        const reg = registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } };
        if (reg.sync) {
          try {
            await reg.sync.register("sync-invoices");
            console.log("[PWA] Background sync registered");
          } catch (err) {
            console.warn("[PWA] Background sync not supported:", err);
          }
        }
      } catch (err) {
        console.warn("[PWA] Service worker registration failed:", err);
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
