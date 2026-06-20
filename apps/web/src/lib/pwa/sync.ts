"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { db, type QueuedInvoice, type InvoiceStatus } from "./db";

// ─── Sync Manager ────────────────────────────────────────────────────────

class SyncManager {
  private syncing = false;
  private listeners: Set<(invoices: QueuedInvoice[]) => void> = new Set();
  private onlineListeners: Set<(online: boolean) => void> = new Set();
  private currentInvoices: QueuedInvoice[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());

      // Listen for sync requests from service worker
      window.addEventListener("pwa:sync-invoices", () => {
        this.syncAll();
      });
    }
  }

  subscribe(listener: (invoices: QueuedInvoice[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentInvoices);
    return () => this.listeners.delete(listener);
  }

  subscribeOnline(listener: (online: boolean) => void): () => void {
    this.onlineListeners.add(listener);
    listener(typeof navigator !== "undefined" ? navigator.onLine : true);
    return () => this.onlineListeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentInvoices));
  }

  private notifyOnline(online: boolean) {
    this.onlineListeners.forEach((l) => l(online));
  }

  private handleOnline() {
    this.notifyOnline(true);
    this.syncAll();
  }

  private handleOffline() {
    this.notifyOnline(false);
  }

  async refresh() {
    this.currentInvoices = await db.getAllInvoices();
    this.notify();
  }

  async addInvoice(blob: Blob, entityId: string, metadata?: QueuedInvoice["metadata"]): Promise<string> {
    const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.addInvoice({
      id,
      blob,
      status: "queued",
      entityId,
      metadata,
    });
    await this.refresh();
    // Try to sync immediately if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      this.syncInvoice(id);
    }
    return id;
  }

  async syncAll(): Promise<{ synced: number; failed: number }> {
    if (this.syncing) return { synced: 0, failed: 0 };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.syncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const queued = await db.getQueuedInvoices();
      for (const invoice of queued) {
        const success = await this.syncInvoice(invoice.id);
        if (success) synced++;
        else failed++;
      }
    } finally {
      this.syncing = false;
      await this.refresh();
    }

    return { synced, failed };
  }

  async syncInvoice(id: string): Promise<boolean> {
    const invoice = await db.getInvoice(id);
    if (!invoice) return false;

    if (invoice.status === "synced") return true;

    await db.updateInvoiceStatus(id, "processing");

    try {
      // Convert blob to base64 for sending
      const base64 = await blobToBase64(invoice.blob);

      const response = await fetch("/api/sifen/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: id,
          image: base64,
          entityId: invoice.entityId,
          metadata: invoice.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      await db.updateInvoiceStatus(id, "synced", {
        serverId: result.documentId,
        syncedAt: Date.now(),
      });
      return true;
    } catch (error) {
      await db.updateInvoiceStatus(id, "error", {
        errorMessage: error instanceof Error ? error.message : "Sync failed",
      });
      return false;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.deleteInvoice(id);
    await this.refresh();
  }

  async retryInvoice(id: string): Promise<void> {
    await db.updateInvoiceStatus(id, "queued");
    await this.refresh();
    this.syncInvoice(id);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const syncManager = new SyncManager();

// ─── React Hooks ─────────────────────────────────────────────────────────

export function useInvoicesQueue() {
  const [invoices, setInvoices] = useState<QueuedInvoice[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubInvoices = syncManager.subscribe(setInvoices);
    const unsubOnline = syncManager.subscribeOnline(setIsOnline);
    syncManager.refresh();
    return () => {
      unsubInvoices();
      unsubOnline();
    };
  }, []);

  const addInvoice = useCallback(
    (blob: Blob, entityId: string, metadata?: QueuedInvoice["metadata"]) =>
      syncManager.addInvoice(blob, entityId, metadata),
    []
  );

  const deleteInvoice = useCallback((id: string) => syncManager.deleteInvoice(id), []);
  const retryInvoice = useCallback((id: string) => syncManager.retryInvoice(id), []);
  const syncAll = useCallback(() => syncManager.syncAll(), []);

  return {
    invoices,
    isOnline,
    addInvoice,
    deleteInvoice,
    retryInvoice,
    syncAll,
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    return syncManager.subscribeOnline(setIsOnline);
  }, []);
  return isOnline;
}

export const statusLabel: Record<InvoiceStatus, string> = {
  queued: "En cola",
  processing: "Procesando con IA",
  synced: "Digitalizado",
  error: "Error",
};

export const statusColor: Record<InvoiceStatus, string> = {
  queued: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  processing: "bg-primary/10 text-primary border-primary/30",
  synced: "bg-green-500/10 text-green-600 border-green-500/30",
  error: "bg-red-500/10 text-red-600 border-red-500/30",
};
