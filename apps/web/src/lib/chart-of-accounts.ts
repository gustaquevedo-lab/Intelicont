export type AccountNature = "asset" | "liability" | "equity" | "income" | "expense";

export interface ChartAccount {
  id: string;
  code: string;
  name: string;
  nature: AccountNature;
  parentCode: string | null;
  allowsPosting: boolean;
  balance: number;
  currency: string;
  active: boolean;
  taxMappings?: string[];
  children?: ChartAccount[];
}

const NATURE_LABELS: Record<AccountNature, string> = {
  asset: "Activo",
  liability: "Pasivo",
  equity: "Patrimonio Neto",
  income: "Ingreso",
  expense: "Gasto",
};

const NATURE_COLORS: Record<AccountNature, string> = {
  asset: "text-emerald-600 dark:text-emerald-400",
  liability: "text-red-600 dark:text-red-400",
  equity: "text-blue-600 dark:text-blue-400",
  income: "text-green-600 dark:text-green-400",
  expense: "text-orange-600 dark:text-orange-400",
};

const NATURE_BG: Record<AccountNature, string> = {
  asset: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
  liability: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
  equity: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
  income: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20",
  expense: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
};

export function getNatureLabel(n: AccountNature) { return NATURE_LABELS[n]; }
export function getNatureColor(n: AccountNature) { return NATURE_COLORS[n]; }
export function getNatureBg(n: AccountNature) { return NATURE_BG[n]; }

export const PY_CHART_OF_ACCOUNTS: ChartAccount[] = [
  {
    id: "1", code: "1", name: "ACTIVO", nature: "asset", parentCode: null, allowsPosting: false, balance: 456782300, currency: "PYG", active: true, children: [
      {
        id: "1.1", code: "1.1", name: "Activo Corriente", nature: "asset", parentCode: "1", allowsPosting: false, balance: 189234500, currency: "PYG", active: true, children: [
          {
            id: "1.1.01", code: "1.1.01", name: "Caja y Bancos", nature: "asset", parentCode: "1.1", allowsPosting: false, balance: 78456200, currency: "PYG", active: true, children: [
              { id: "1.1.01.001", code: "1.1.01.001", name: "Caja Principal PYG", nature: "asset", parentCode: "1.1.01", allowsPosting: true, balance: 3245600, currency: "PYG", active: true },
              { id: "1.1.01.002", code: "1.1.01.002", name: "Banco Continental Cta. Cte. 123-456", nature: "asset", parentCode: "1.1.01", allowsPosting: true, balance: 62845600, currency: "PYG", active: true },
              { id: "1.1.01.003", code: "1.1.01.003", name: "Banco Continental Cta. USD 789-012", nature: "asset", parentCode: "1.1.01", allowsPosting: true, balance: 12365000, currency: "USD", active: true },
            ]
          },
          {
            id: "1.1.02", code: "1.1.02", name: "Cuentas a Cobrar", nature: "asset", parentCode: "1.1", allowsPosting: false, balance: 45234800, currency: "PYG", active: true, children: [
              { id: "1.1.02.001", code: "1.1.02.001", name: "Clientes del Mercado Local", nature: "asset", parentCode: "1.1.02", allowsPosting: true, balance: 32456700, currency: "PYG", active: true },
              { id: "1.1.02.002", code: "1.1.02.002", name: "Clientes del Exterior", nature: "asset", parentCode: "1.1.02", allowsPosting: true, balance: 12778100, currency: "USD", active: true },
            ]
          },
          {
            id: "1.1.03", code: "1.1.03", name: "Inventarios", nature: "asset", parentCode: "1.1", allowsPosting: false, balance: 65543500, currency: "PYG", active: true, children: [
              { id: "1.1.03.001", code: "1.1.03.001", name: "Mercaderías en Depósito", nature: "asset", parentCode: "1.1.03", allowsPosting: true, balance: 58234500, currency: "PYG", active: true },
              { id: "1.1.03.002", code: "1.1.03.002", name: "Mercaderías en Tránsito", nature: "asset", parentCode: "1.1.03", allowsPosting: true, balance: 7309000, currency: "PYG", active: true },
            ]
          },
        ]
      },
      {
        id: "1.2", code: "1.2", name: "Activo No Corriente", nature: "asset", parentCode: "1", allowsPosting: false, balance: 267547800, currency: "PYG", active: true, children: [
          {
            id: "1.2.01", code: "1.2.01", name: "Propiedades, Planta y Equipos", nature: "asset", parentCode: "1.2", allowsPosting: false, balance: 234547800, currency: "PYG", active: true, children: [
              { id: "1.2.01.001", code: "1.2.01.001", name: "Terrenos", nature: "asset", parentCode: "1.2.01", allowsPosting: true, balance: 120000000, currency: "PYG", active: true },
              { id: "1.2.01.002", code: "1.2.01.002", name: "Edificios", nature: "asset", parentCode: "1.2.01", allowsPosting: true, balance: 85000000, currency: "PYG", active: true },
              { id: "1.2.01.003", code: "1.2.01.003", name: "Vehículos", nature: "asset", parentCode: "1.2.01", allowsPosting: true, balance: 29547800, currency: "PYG", active: true },
            ]
          },
        ]
      },
    ]
  },
  {
    id: "2", code: "2", name: "PASIVO", nature: "liability", parentCode: null, allowsPosting: false, balance: 198456700, currency: "PYG", active: true, children: [
      {
        id: "2.1", code: "2.1", name: "Pasivo Corriente", nature: "liability", parentCode: "2", allowsPosting: false, balance: 134234500, currency: "PYG", active: true, children: [
          { id: "2.1.01", code: "2.1.01", name: "Cuentas a Pagar Proveedores", nature: "liability", parentCode: "2.1", allowsPosting: true, balance: 56789300, currency: "PYG", active: true },
          { id: "2.1.02", code: "2.1.02", name: "IVA Débito Fiscal", nature: "liability", parentCode: "2.1", allowsPosting: true, balance: 12456700, currency: "PYG", active: true, taxMappings: ["iva_debito"] },
          { id: "2.1.03", code: "2.1.03", name: "Retenciones por Pagar", nature: "liability", parentCode: "2.1", allowsPosting: true, balance: 4567800, currency: "PYG", active: true },
          { id: "2.1.04", code: "2.1.04", name: "Préstamos Bancarios CP", nature: "liability", parentCode: "2.1", allowsPosting: true, balance: 60420700, currency: "PYG", active: true },
        ]
      },
      {
        id: "2.2", code: "2.2", name: "Pasivo No Corriente", nature: "liability", parentCode: "2", allowsPosting: false, balance: 64222200, currency: "PYG", active: true, children: [
          { id: "2.2.01", code: "2.2.01", name: "Préstamos Bancarios LP", nature: "liability", parentCode: "2.2", allowsPosting: true, balance: 64222200, currency: "PYG", active: true },
        ]
      },
    ]
  },
  {
    id: "3", code: "3", name: "PATRIMONIO NETO", nature: "equity", parentCode: null, allowsPosting: false, balance: 156789400, currency: "PYG", active: true, children: [
      { id: "3.1", code: "3.1", name: "Capital Social", nature: "equity", parentCode: "3", allowsPosting: true, balance: 100000000, currency: "PYG", active: true },
      { id: "3.2", code: "3.2", name: "Reserva Legal", nature: "equity", parentCode: "3", allowsPosting: true, balance: 23456700, currency: "PYG", active: true },
      { id: "3.3", code: "3.3", name: "Resultados Acumulados", nature: "equity", parentCode: "3", allowsPosting: true, balance: 12332700, currency: "PYG", active: true },
      { id: "3.4", code: "3.4", name: "Resultado del Ejercicio", nature: "equity", parentCode: "3", allowsPosting: true, balance: 21000000, currency: "PYG", active: true },
    ]
  },
  {
    id: "4", code: "4", name: "INGRESOS", nature: "income", parentCode: null, allowsPosting: false, balance: 287654300, currency: "PYG", active: true, children: [
      {
        id: "4.1", code: "4.1", name: "Ingresos Operacionales", nature: "income", parentCode: "4", allowsPosting: false, balance: 267654300, currency: "PYG", active: true, children: [
          { id: "4.1.01", code: "4.1.01", name: "Ventas de Mercaderías Gravadas 10%", nature: "income", parentCode: "4.1", allowsPosting: true, balance: 234567800, currency: "PYG", active: true, taxMappings: ["iva_10", "ire_general"] },
          { id: "4.1.02", code: "4.1.02", name: "Ventas de Servicios", nature: "income", parentCode: "4.1", allowsPosting: true, balance: 23456500, currency: "PYG", active: true, taxMappings: ["iva_10", "ire_general"] },
          { id: "4.1.03", code: "4.1.03", name: "Ventas de Exportación (Exentas)", nature: "income", parentCode: "4.1", allowsPosting: true, balance: 9630000, currency: "USD", active: true, taxMappings: ["iva_exento"] },
        ]
      },
      {
        id: "4.2", code: "4.2", name: "Otros Ingresos", nature: "income", parentCode: "4", allowsPosting: false, balance: 20000000, currency: "PYG", active: true, children: [
          { id: "4.2.01", code: "4.2.01", name: "Intereses Ganados", nature: "income", parentCode: "4.2", allowsPosting: true, balance: 8700000, currency: "PYG", active: true },
          { id: "4.2.02", code: "4.2.02", name: "Diferencia de Cambio (Ganancia)", nature: "income", parentCode: "4.2", allowsPosting: true, balance: 11300000, currency: "PYG", active: true },
        ]
      },
    ]
  },
  {
    id: "5", code: "5", name: "GASTOS", nature: "expense", parentCode: null, allowsPosting: false, balance: 234567800, currency: "PYG", active: true, children: [
      {
        id: "5.1", code: "5.1", name: "Gastos Operacionales", nature: "expense", parentCode: "5", allowsPosting: false, balance: 189234500, currency: "PYG", active: true, children: [
          { id: "5.1.01", code: "5.1.01", name: "Costo de Mercaderías Vendidas", nature: "expense", parentCode: "5.1", allowsPosting: true, balance: 98765400, currency: "PYG", active: true, taxMappings: ["ire_general"] },
          { id: "5.1.02", code: "5.1.02", name: "Sueldos y Salarios", nature: "expense", parentCode: "5.1", allowsPosting: true, balance: 45678900, currency: "PYG", active: true, taxMappings: ["ire_general", "irp"] },
          { id: "5.1.03", code: "5.1.03", name: "Jornales", nature: "expense", parentCode: "5.1", allowsPosting: true, balance: 12345600, currency: "PYG", active: true },
          { id: "5.1.04", code: "5.1.04", name: "Honorarios Profesionales", nature: "expense", parentCode: "5.1", allowsPosting: true, balance: 15678900, currency: "PYG", active: true, taxMappings: ["ire_general", "irp"] },
          { id: "5.1.05", code: "5.1.05", name: "Alquileres", nature: "expense", parentCode: "5.1", allowsPosting: true, balance: 8900000, currency: "PYG", active: true, taxMappings: ["ire_general"] },
        ]
      },
      {
        id: "5.2", code: "5.2", name: "Gastos Administrativos", nature: "expense", parentCode: "5", allowsPosting: false, balance: 34567800, currency: "PYG", active: true, children: [
          { id: "5.2.01", code: "5.2.01", name: "Seguros", nature: "expense", parentCode: "5.2", allowsPosting: true, balance: 5678900, currency: "PYG", active: true },
          { id: "5.2.02", code: "5.2.02", name: "Servicios Públicos (ANDE/CORPAI)", nature: "expense", parentCode: "5.2", allowsPosting: true, balance: 3456700, currency: "PYG", active: true },
          { id: "5.2.03", code: "5.2.03", name: "Útiles y Materiales de Oficina", nature: "expense", parentCode: "5.2", allowsPosting: true, balance: 1234500, currency: "PYG", active: true },
          { id: "5.2.04", code: "5.2.04", name: "Depreciación de Equipos", nature: "expense", parentCode: "5.2", allowsPosting: true, balance: 8900000, currency: "PYG", active: true },
        ]
      },
      {
        id: "5.3", code: "5.3", name: "Gastos Financieros", nature: "expense", parentCode: "5", allowsPosting: false, balance: 10765500, currency: "PYG", active: true, children: [
          { id: "5.3.01", code: "5.3.01", name: "Intereses Pagados", nature: "expense", parentCode: "5.3", allowsPosting: true, balance: 7654300, currency: "PYG", active: true },
          { id: "5.3.02", code: "5.3.02", name: "Comisiones Bancarias", nature: "expense", parentCode: "5.3", allowsPosting: true, balance: 3111200, currency: "PYG", active: true },
        ]
      },
    ]
  },
];

export function buildAccountTree(accounts: ChartAccount[]): ChartAccount[] {
  const codeMap = new Map<string, ChartAccount>();
  accounts.forEach((a) => codeMap.set(a.code, { ...a, children: [] }));

  const roots: ChartAccount[] = [];
  codeMap.forEach((account) => {
    if (!account.parentCode) {
      roots.push(account);
    } else {
      const parent = codeMap.get(account.parentCode);
      if (parent) {
        parent.children!.push(account);
      } else {
        roots.push(account);
      }
    }
  });

  function sortByCode(acc: ChartAccount[]) {
    acc.sort((a, b) => a.code.localeCompare(b.code));
    acc.forEach((a) => {
      if (a.children && a.children.length > 0) {
        sortByCode(a.children);
      }
    });
  }

  sortByCode(roots);
  return roots;
}

export function flattenTree(accounts: ChartAccount[]): ChartAccount[] {
  const result: ChartAccount[] = [];
  function walk(acc: ChartAccount[]) {
    for (const a of acc) {
      result.push(a);
      if (a.children && a.children.length > 0) {
        walk(a.children);
      }
    }
  }
  walk(accounts);
  return result;
}

export function findAccountByCode(accounts: ChartAccount[], code: string): ChartAccount | null {
  for (const a of accounts) {
    if (a.code === code) return a;
    if (a.children) {
      const found = findAccountByCode(a.children, code);
      if (found) return found;
    }
  }
  return null;
}

export function formatBalance(balance: number, currency: string = "PYG") {
  return `${currency === "PYG" ? "₲" : currency} ${Math.abs(balance).toLocaleString("es-PY")}`;
}
