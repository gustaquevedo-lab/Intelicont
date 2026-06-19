import { z } from "zod";
import { router, publicProcedure, privateProcedure } from "./trpc";
import { entitiesRouter } from "./routers/entities";
import { accountsRouter } from "./routers/accounts";
import { journalEntriesRouter } from "./routers/journal-entries";
import { taxDocumentsRouter } from "./routers/tax-documents";
import { partnersRouter } from "./routers/partners";
import { bankRouter } from "./routers/bank";
import { fiscalRouter } from "./routers/fiscal";
import { reportsRouter } from "./routers/reports";

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
});

export type AppRouter = typeof appRouter;
