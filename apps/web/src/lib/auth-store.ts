"use client";

import { create } from "zustand";
import { authClient } from "@/lib/auth-client";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Entity {
  id: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  baseCurrency?: string | null;
}

/** Current user from the real Better Auth session; logout ends it server-side. */
export function useCurrentUser(): { user: User | null; logout: () => Promise<void> } {
  const { data } = authClient.useSession();
  const user = data?.user ? { id: data.user.id, email: data.user.email, name: data.user.name } : null;
  const logout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };
  return { user, logout };
}

interface EntityState {
  selectedEntity: Entity | null;
  availableEntities: Entity[];
  selectEntity: (entity: Entity) => void;
  /** Replaces the list with the server's entities and keeps (or restores from localStorage) the selection. */
  setAvailableEntities: (entities: Entity[]) => void;
}

const STORAGE_KEY = "ic.selectedEntityId";

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

export const useAuthStore = create<EntityState>((set, get) => ({
  selectedEntity: null,
  availableEntities: [],
  selectEntity: (entity) => {
    storeId(entity.id);
    set({ selectedEntity: entity });
  },
  setAvailableEntities: (entities) => {
    const keep = get().selectedEntity?.id ?? readStoredId();
    set({ availableEntities: entities, selectedEntity: entities.find((e) => e.id === keep) ?? entities[0] ?? null });
  },
}));
