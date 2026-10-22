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
}

// shortcut: mock entities until Task 9 loads the user's real entities from memberships.
const MOCK_ENTITIES: Entity[] = [
  { id: "e1", ruc: "80012345-0", legalName: "Importadora del Este S.A.", tradeName: "ImportEste" },
  { id: "e2", ruc: "80023456-2", legalName: "Tecnología Asunción SRL", tradeName: "TechAsu" },
  { id: "e3", ruc: "80034567-3", legalName: "Distribuciones Ñandutí SA", tradeName: "Ñandutí" },
  { id: "e4", ruc: "80045678-4", legalName: "Agropecuaria Guaraní SRL", tradeName: "AgroGuaraní" },
];

export const useAuthStore = create<EntityState>((set) => ({
  selectedEntity: MOCK_ENTITIES[0],
  availableEntities: MOCK_ENTITIES,
  selectEntity: (entity: Entity) => set({ selectedEntity: entity }),
}));
