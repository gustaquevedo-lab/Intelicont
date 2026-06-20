"use client";

import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "accountant" | "assistant" | "auditor" | "client";
}

export interface SystemUser {
  email: string;
  role: "admin" | "accountant" | "assistant" | "auditor" | "client";
  status: "active" | "invited" | "suspended";
  lastLogin: string;
}

export interface TenantFeatures {
  sifen: boolean;
  brainAi: boolean;
  bankApi: boolean;
  multiUser: boolean;
}

export interface Entity {
  id: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  plan: "starter" | "pro" | "inhouse" | "enterprise" | "corporativo";
  status: "active" | "suspended" | "trial";
  trialDaysTotal: number;
  trialDaysLeft: number;
  mrr: number;
  aiProvider: string;
  features: TenantFeatures;
  users: SystemUser[];
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
  updateTenants: (tenants: Entity[]) => void;
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

const INITIAL_TENANTS: Entity[] = [
  {
    id: "t1",
    ruc: "80012345-1",
    legalName: "Importadora del Este S.A.",
    tradeName: "ImportEste",
    plan: "pro",
    status: "active",
    trialDaysTotal: 14,
    trialDaysLeft: 0,
    mrr: 385000,
    aiProvider: "gemini",
    features: { sifen: true, brainAi: true, bankApi: true, multiUser: true },
    users: [
      { email: "admin@importeste.com.py", role: "admin", status: "active", lastLogin: "Hoy, 10:30" },
      { email: "contabilidad@importeste.com.py", role: "accountant", status: "active", lastLogin: "Ayer, 16:00" },
      { email: "auditoria@externo.com", role: "auditor", status: "active", lastLogin: "Hace 3 días" }
    ]
  },
  {
    id: "t2",
    ruc: "80041299-7",
    legalName: "Tecnología Asunción SRL",
    tradeName: "TechAsuncion",
    plan: "inhouse",
    status: "active",
    trialDaysTotal: 14,
    trialDaysLeft: 0,
    mrr: 440000,
    aiProvider: "gemini",
    features: { sifen: true, brainAi: true, bankApi: true, multiUser: true },
    users: [
      { email: "gerencia@techasuncion.com.py", role: "admin", status: "active", lastLogin: "Hoy, 08:15" },
      { email: "auxiliar@techasuncion.com.py", role: "assistant", status: "active", lastLogin: "Hoy, 11:20" }
    ]
  },
  {
    id: "t3",
    ruc: "80058801-3",
    legalName: "Distribuidora Ñandutí S.A.",
    tradeName: "Ñandutí",
    plan: "starter",
    status: "trial",
    trialDaysTotal: 14,
    trialDaysLeft: 9,
    mrr: 180000,
    aiProvider: "rules",
    features: { sifen: false, brainAi: false, bankApi: false, multiUser: false },
    users: [
      { email: "nanduti@outlook.com", role: "admin", status: "active", lastLogin: "Ayer, 09:30" }
    ]
  },
  {
    id: "t4",
    ruc: "80072134-9",
    legalName: "Consultora Guaraní SRL",
    tradeName: "AgroGuaraní",
    plan: "enterprise",
    status: "active",
    trialDaysTotal: 14,
    trialDaysLeft: 0,
    mrr: 650000,
    aiProvider: "claude",
    features: { sifen: true, brainAi: true, bankApi: true, multiUser: true },
    users: [
      { email: "director@guarani.com.py", role: "admin", status: "active", lastLogin: "Hace 5 días" },
      { email: "contadora@guarani.com.py", role: "accountant", status: "active", lastLogin: "Hoy, 10:45" },
      { email: "joven@guarani.com.py", role: "assistant", status: "invited", lastLogin: "—" }
    ]
  },
  {
    id: "t5",
    ruc: "80091456-2",
    legalName: "Agropecuaria Paraguay S.A.",
    tradeName: null,
    plan: "corporativo",
    status: "trial",
    trialDaysTotal: 14,
    trialDaysLeft: 2,
    mrr: 0,
    aiProvider: "gemini",
    features: { sifen: true, brainAi: true, bankApi: false, multiUser: true },
    users: [
      { email: "administrador@agroparaguay.com", role: "admin", status: "active", lastLogin: "Hoy, 12:00" }
    ]
  },
  {
    id: "t6",
    ruc: "80155223-9",
    legalName: "Comercial Pedro Juan Caballero E.A.S.",
    tradeName: null,
    plan: "pro",
    status: "suspended",
    trialDaysTotal: 14,
    trialDaysLeft: 0,
    mrr: 385000,
    aiProvider: "gemini",
    features: { sifen: true, brainAi: true, bankApi: true, multiUser: true },
    users: [
      { email: "pjc_comercial@gmail.com", role: "admin", status: "suspended", lastLogin: "Hace 14 días" }
    ]
  }
];

// Helper to load state from localStorage safely
const getStoredTenants = (): Entity[] => {
  if (typeof window === "undefined") return INITIAL_TENANTS;
  try {
    const stored = window.localStorage.getItem("intelicont_tenants");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading tenants from localStorage", e);
  }
  return INITIAL_TENANTS;
};

const storedTenants = getStoredTenants();
const defaultEntity = storedTenants.find(t => t.status === "active") || storedTenants[0];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: MOCK_USERS["admin@intelicont.com"], // Auto-login as admin for MVP
  isAuthenticated: true,
  isLoading: false,
  selectedEntity: defaultEntity,
  availableEntities: storedTenants,

  login: async (email: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 800));
    set({ isLoading: false });
    const user = MOCK_USERS[email] || {
      id: `user-${Date.now()}`,
      email,
      name: email.split("@")[0],
      role: "accountant" as const,
    };
    const currentTenants = getStoredTenants();
    const activeEnt = currentTenants.find(t => t.status === "active") || currentTenants[0];
    set({ user, isAuthenticated: true, selectedEntity: activeEnt, availableEntities: currentTenants });
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
    const currentTenants = getStoredTenants();
    const activeEnt = currentTenants.find(t => t.status === "active") || currentTenants[0];
    set({ user, isAuthenticated: true, selectedEntity: activeEnt, availableEntities: currentTenants, isLoading: false });
  },

  selectEntity: (entity: Entity) => {
    set({ selectedEntity: entity });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  updateTenants: (tenants: Entity[]) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("intelicont_tenants", JSON.stringify(tenants));
      } catch (e) {
        console.error("Error saving tenants to localStorage", e);
      }
    }
    const currentSelected = get().selectedEntity;
    const newSelected = tenants.find(t => t.id === currentSelected?.id) || tenants[0];
    set({ availableEntities: tenants, selectedEntity: newSelected });
  },
}));
