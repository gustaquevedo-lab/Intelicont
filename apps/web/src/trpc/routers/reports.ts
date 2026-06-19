import { router, publicProcedure, z } from "../trpc";

export const reportsRouter = router({
  ivaSummary: publicProcedure
    .input(z.object({ entityId: z.string(), year: z.number(), month: z.number() }))
    .query(async () => {
      return {
        gravado10: 13500000,
        gravado5: -500000,
        exento: 0,
        ivaDebito10: 550000,
        ivaDebito5: 0,
        ivaCredito10: 1350000,
        ivaCredito5: -25000,
        ivaAPagar: 0,
        saldoAFavor: 775000,
      };
    }),

  fiscalResume: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async () => {
      return [
        { periodo: "2026-01", ventas: 45000000, compras: 28000000, ivaPagar: 1700000, ire: 5100000 },
        { periodo: "2026-02", ventas: 52000000, compras: 31000000, ivaPagar: 2100000, ire: 6300000 },
        { periodo: "2026-03", ventas: 38000000, compras: 22000000, ivaPagar: 1600000, ire: 4800000 },
        { periodo: "2026-04", ventas: 61000000, compras: 35000000, ivaPagar: 2600000, ire: 7800000 },
        { periodo: "2026-05", ventas: 7050000, compras: 32125000, ivaPagar: 0, ire: 0 },
      ];
    }),

  trialBalance: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async () => {
      return [
        { code: "1.1.01", name: "Caja", debito: 2500000, credito: 0, saldo: 2500000 },
        { code: "1.1.02", name: "Banco GNB", debito: 11050000, credito: 2500000, saldo: 8550000 },
        { code: "1.2.01", name: "Mercaderías", debito: 10000000, credito: 500000, saldo: 9500000 },
        { code: "1.1.06", name: "IVA Crédito", debito: 1350000, credito: 50000, saldo: 1300000 },
        { code: "2.1.01", name: "Proveedores", debito: 550000, credito: 13750000, saldo: 13200000 },
        { code: "2.1.02", name: "IVA Débito", debito: 0, credito: 550000, saldo: 550000 },
        { code: "4.1.01", name: "Ventas", debito: 0, credito: 5500000, saldo: 5500000 },
        { code: "5.1.04", name: "Honorarios", debito: 2500000, credito: 0, saldo: 2500000 },
      ];
    }),
});
