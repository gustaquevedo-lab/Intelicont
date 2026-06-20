"use client";

// IndexedDB wrapper para InteliCont PWA
// Almacena: fotos de facturas (Blob), borradores, cola de subida

const DB_NAME = "intelicont-pwa";
const DB_VERSION = 1;

const STORES = {
  INVOICES: "invoices", // Cola de facturas pendientes
  DRAFTS: "drafts", // Borradores de asientos
  CACHE: "cache", // Cache de respuestas API
} as const;

export type InvoiceStatus = "queued" | "processing" | "synced" | "error";

export interface QueuedInvoice {
  id: string;
  blob: Blob;
  thumbnail?: string;
  status: InvoiceStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  entityId: string;
  metadata?: {
    width?: number;
    height?: number;
    filter?: "none" | "grayscale" | "high-contrast" | "brighten";
    notes?: string;
  };
  errorMessage?: string;
  syncedAt?: number;
  serverId?: string;
}

export interface DraftEntry {
  id: string;
  entityId: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

class IntelicontDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.INVOICES)) {
          const store = db.createObjectStore(STORES.INVOICES, { keyPath: "id" });
          store.createIndex("status", "status");
          store.createIndex("entityId", "entityId");
          store.createIndex("createdAt", "createdAt");
        }

        if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
          const store = db.createObjectStore(STORES.DRAFTS, { keyPath: "id" });
          store.createIndex("entityId", "entityId");
          store.createIndex("updatedAt", "updatedAt");
        }

        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          db.createObjectStore(STORES.CACHE, { keyPath: "key" });
        }
      };
    });

    return this.dbPromise;
  }

  // ─── Invoices Queue ─────────────────────────────────────────────────────

  async addInvoice(invoice: Omit<QueuedInvoice, "createdAt" | "updatedAt" | "attempts">): Promise<string> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVOICES, "readwrite");
      const store = tx.objectStore(STORES.INVOICES);
      const id = invoice.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = Date.now();
      const record: QueuedInvoice = {
        ...invoice,
        id,
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getInvoice(id: string): Promise<QueuedInvoice | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVOICES, "readonly");
      const store = tx.objectStore(STORES.INVOICES);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllInvoices(): Promise<QueuedInvoice[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVOICES, "readonly");
      const store = tx.objectStore(STORES.INVOICES);
      const request = store.getAll();
      request.onsuccess = () => {
        const all = (request.result || []) as QueuedInvoice[];
        resolve(all.sort((a, b) => b.createdAt - a.createdAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getQueuedInvoices(): Promise<QueuedInvoice[]> {
    const all = await this.getAllInvoices();
    return all.filter((i) => i.status === "queued" || i.status === "error");
  }

  async getSyncedInvoices(): Promise<QueuedInvoice[]> {
    const all = await this.getAllInvoices();
    return all.filter((i) => i.status === "synced");
  }

  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    extra?: Partial<QueuedInvoice>
  ): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVOICES, "readwrite");
      const store = tx.objectStore(STORES.INVOICES);
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const invoice = getRequest.result as QueuedInvoice | undefined;
        if (!invoice) {
          reject(new Error(`Invoice ${id} not found`));
          return;
        }
        const updated: QueuedInvoice = {
          ...invoice,
          ...extra,
          status,
          updatedAt: Date.now(),
          attempts: status === "error" ? invoice.attempts + 1 : invoice.attempts,
        };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteInvoice(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVOICES, "readwrite");
      const store = tx.objectStore(STORES.INVOICES);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSynced(): Promise<number> {
    const synced = await this.getSyncedInvoices();
    for (const inv of synced) {
      await this.deleteInvoice(inv.id);
    }
    return synced.length;
  }

  // ─── Drafts ─────────────────────────────────────────────────────────────

  async saveDraft(draft: Omit<DraftEntry, "updatedAt">): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DRAFTS, "readwrite");
      const store = tx.objectStore(STORES.DRAFTS);
      const record: DraftEntry = { ...draft, updatedAt: Date.now() };
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDrafts(entityId: string): Promise<DraftEntry[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DRAFTS, "readonly");
      const store = tx.objectStore(STORES.DRAFTS);
      const index = store.index("entityId");
      const request = index.getAll(entityId);
      request.onsuccess = () => {
        const all = (request.result || []) as DraftEntry[];
        resolve(all.sort((a, b) => b.updatedAt - a.updatedAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDraft(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DRAFTS, "readwrite");
      const store = tx.objectStore(STORES.DRAFTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new IntelicontDB();
export { STORES };
