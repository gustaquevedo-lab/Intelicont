import { z } from "zod";
import { router, publicProcedure } from "./trpc";
import { entitiesRouter } from "./routers/entities";
import { accountsRouter } from "./routers/accounts";
import { journalEntriesRouter } from "./routers/journal-entries";
import { taxDocumentsRouter } from "./routers/tax-documents";
import { partnersRouter } from "./routers/partners";
import { bankRouter } from "./routers/bank";
import { fiscalRouter } from "./routers/fiscal";
import { reportsRouter } from "./routers/reports";
import { auditRouter } from "./routers/audit";
import { timbradosRouter } from "./routers/timbrados";

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),

  entities: entitiesRouter,
  accounts: accountsRouter,
  "journal-entries": journalEntriesRouter,
  "tax-documents": taxDocumentsRouter,
  partners: partnersRouter,
  bank: bankRouter,
  fiscal: fiscalRouter,
  reports: reportsRouter,
  audit: auditRouter,
  timbrados: timbradosRouter,
});

export type AppRouter = typeof appRouter;
