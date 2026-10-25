export interface PlanDef {
  id: string;
  nombre: string;
  mrr: number;
  maxUsuarios: number;
  maxClientes: number;
  tieneIa: boolean;
  sifenSync: boolean;
  features: Record<string, boolean>;
}

export const PLANES_BASE: Record<string, PlanDef> = {
  starter: {
    id: "starter",
    nombre: "Starter PyME",
    mrr: 180000,
    maxUsuarios: 2,
    maxClientes: 10,
    tieneIa: false,
    sifenSync: false,
    features: {
      sifenSync: false,
      aiTripleImputation: false,
      cgrReports: false,
      bankApi: false,
      multiUser: false,
    },
  },
  pro: {
    id: "pro",
    nombre: "Estudio Profesional",
    mrr: 385000,
    maxUsuarios: 5,
    maxClientes: 50,
    tieneIa: true,
    sifenSync: true,
    features: {
      sifenSync: true,
      aiTripleImputation: true,
      cgrReports: false,
      bankApi: true,
      multiUser: true,
    },
  },
  inhouse: {
    id: "inhouse",
    nombre: "In-House Corporativo",
    mrr: 440000,
    maxUsuarios: 10,
    maxClientes: 150,
    tieneIa: true,
    sifenSync: true,
    features: {
      sifenSync: true,
      aiTripleImputation: true,
      cgrReports: true,
      bankApi: true,
      multiUser: true,
    },
  },
  enterprise: {
    id: "enterprise",
    nombre: "Enterprise / Holding",
    mrr: 650000,
    maxUsuarios: 50,
    maxClientes: 1000,
    tieneIa: true,
    sifenSync: true,
    features: {
      sifenSync: true,
      aiTripleImputation: true,
      cgrReports: true,
      bankApi: true,
      multiUser: true,
    },
  },
};

export interface FirmaLimits {
  planId: string;
  nombrePlan: string;
  mrr: number;
  maxUsuarios: number;
  maxClientes: number;
  tieneIa: boolean;
  sifenSync: boolean;
  features: Record<string, boolean>;
}

/**
 * Combina los límites y características del plan base con cualquier override configurado por el SuperAdmin.
 */
export function getFirmaLimits(planId: string = "starter", featuresOverrideJson?: string | null): FirmaLimits {
  const base = PLANES_BASE[planId.toLowerCase()] || PLANES_BASE.starter;

  let maxUsuarios = base.maxUsuarios;
  let maxClientes = base.maxClientes;
  let tieneIa = base.tieneIa;
  let sifenSync = base.sifenSync;
  let mrr = base.mrr;
  const features: Record<string, boolean> = { ...base.features };

  if (featuresOverrideJson) {
    try {
      const overrides = typeof featuresOverrideJson === "string" ? JSON.parse(featuresOverrideJson) : featuresOverrideJson;

      if (overrides && typeof overrides === "object") {
        if ("max_usuarios" in overrides) maxUsuarios = Number(overrides.max_usuarios);
        if ("maxUsuarios" in overrides) maxUsuarios = Number(overrides.maxUsuarios);

        if ("max_clientes" in overrides) maxClientes = Number(overrides.max_clientes);
        if ("maxClientes" in overrides) maxClientes = Number(overrides.maxClientes);

        if ("tiene_ia" in overrides) tieneIa = Boolean(overrides.tiene_ia);
        if ("tieneIa" in overrides) tieneIa = Boolean(overrides.tieneIa);

        if ("sifen_sync" in overrides) sifenSync = Boolean(overrides.sifen_sync);
        if ("sifenSync" in overrides) sifenSync = Boolean(overrides.sifenSync);

        if ("mrr" in overrides) mrr = Number(overrides.mrr);

        // Copiar cualquier otra bandera adicional
        for (const [k, v] of Object.entries(overrides)) {
          if (typeof v === "boolean") {
            features[k] = v;
          }
        }
      }
    } catch {
      // Ignorar JSON inválido y usar defaults
    }
  }

  return {
    planId: base.id,
    nombrePlan: base.nombre,
    mrr,
    maxUsuarios,
    maxClientes,
    tieneIa,
    sifenSync,
    features,
  };
}

/**
 * Valida si se puede crear un usuario adicional en la firma según sus límites.
 */
export function validarLimiteUsuarios(
  currentUsersCount: number,
  limits: FirmaLimits
): { allowed: boolean; reason?: string } {
  if (currentUsersCount >= limits.maxUsuarios) {
    return {
      allowed: false,
      reason: `Límite de usuarios alcanzado (${limits.maxUsuarios}) para el plan ${limits.nombrePlan}. Actualice el plan o configure una excepción para agregar más colaboradores.`,
    };
  }
  return { allowed: true };
}

/**
 * Valida si se puede crear un cliente/empresa adicional en el estudio según sus límites.
 */
export function validarLimiteClientes(
  currentClientsCount: number,
  limits: FirmaLimits
): { allowed: boolean; reason?: string } {
  if (currentClientsCount >= limits.maxClientes) {
    return {
      allowed: false,
      reason: `Límite de clientes alcanzado (${limits.maxClientes}) para el plan ${limits.nombrePlan}. Comuníquese con soporte para ampliar su cupo.`,
    };
  }
  return { allowed: true };
}
