"use client";

import { create } from "zustand";

/**
 * Read state of the top-bar notifications. The notifications themselves are real (`fiscal.upcoming` of
 * the active entity); only the ids the user has dismissed live here (per session, in memory).
 */
interface NotificationStore {
  readIds: string[];
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  readIds: [],
  markRead: (id) => set((s) => (s.readIds.includes(id) ? s : { readIds: [...s.readIds, id] })),
  markAllRead: (ids) => set((s) => ({ readIds: [...new Set([...s.readIds, ...ids])] })),
}));
