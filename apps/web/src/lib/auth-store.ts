"use client";

import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "accountant" | "assistant" | "auditor" | "client";
}

export interface Entity {
  id: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedEntity: Entity | null;
  availableEntities: Entity[];

  // Actions
  login: (email: string) => Promise<void>;
  logout: () => void;
  verifyOtp: (email: string, token: string) => Promise<void>;
  selectEntity: (entity: Entity) => void;
  setUser: (user: User | null) => void;
}

// Mock auth for MVP — replace with real Supabase Auth when configured
const MOCK_USERS: Record<string, User> = {
  "admin@intelicont.com": {
    id: "user-admin-1",
    email: "admin@intelicont.com",
    name: "Gustavo Admin",
    role: "admin",
  },
  "contador@estudio.com": {
    id: "user-contador-1",
    email: "contador@estudio.com",
    name: "María Contadora",
    role: "accountant",
  },
};

const MOCK_ENTITIES: Entity[] = [
  { id: "e1", ruc: "80012345-1", legalName: "Importadora del Este S.A.", tradeName: "ImportEste" },
  { id: "e2", ruc: "80023456-2", legalName: "Tecnología Asunción SRL", tradeName: "TechAsu" },
  { id: "e3", ruc: "80034567-3", legalName: "Distribuciones Ñandutí SA", tradeName: "Ñandutí" },
  { id: "e4", ruc: "80045678-4", legalName: "Agropecuaria Guaraní SRL", tradeName: "AgroGuaraní" },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: MOCK_USERS["admin@intelicont.com"], // Auto-login as admin for MVP
  isAuthenticated: true,
  isLoading: false,
  selectedEntity: MOCK_ENTITIES[0],
  availableEntities: MOCK_ENTITIES,

  login: async (email: string) => {
    set({ isLoading: true });
    // Simulate magic link sent
    await new Promise((r) => setTimeout(r, 800));
    set({ isLoading: false });
    // In mock mode: auto-login
    const user = MOCK_USERS[email] || {
      id: `user-${Date.now()}`,
      email,
      name: email.split("@")[0],
      role: "accountant" as const,
    };
    set({ user, isAuthenticated: true, selectedEntity: MOCK_ENTITIES[0] });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, selectedEntity: null });
  },

  verifyOtp: async (email: string, token: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 500));
    const user = MOCK_USERS[email] || {
      id: `user-${Date.now()}`,
      email,
      name: email.split("@")[0],
      role: "accountant" as const,
    };
    set({ user, isAuthenticated: true, selectedEntity: MOCK_ENTITIES[0], isLoading: false });
  },

  selectEntity: (entity: Entity) => {
    set({ selectedEntity: entity });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));
