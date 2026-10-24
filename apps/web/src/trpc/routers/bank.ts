import { router, protectedProcedure, z } from "../trpc";
import {
  getBankAccounts,
  createBankAccount,
  getBankMovements,
  importBankMovements,
  getReconciliations,
  saveReconciliations,
  getGLTransactionsForBank,
} from "@ledger/db/repository";

export const bankRouter = router({
  accounts: protectedProcedure
    .input(z.object({ entityId: z.string().uuid() }))
    .query(async ({ input }) => {
      return getBankAccounts(input.entityId);
    }),

  createAccount: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        bankName: z.string().min(2),
        accountNumber: z.string().min(3),
        currencyCode: z.string().default("PYG"),
        glAccountId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createBankAccount(input);
      return { id };
    }),

  movements: protectedProcedure
    .input(z.object({ bankAccountId: z.string().uuid() }))
    .query(async ({ input }) => {
      return getBankMovements(input.bankAccountId);
    }),

  glTransactions: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        bankAccountId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      return getGLTransactionsForBank(input.entityId, input.bankAccountId);
    }),

  importMovements: protectedProcedure
    .input(
      z.object({
        bankAccountId: z.string().uuid(),
        movements: z.array(
          z.object({
            date: z.string(),
            amount: z.number().int().positive(),
            direction: z.enum(["debit", "credit"]),
            ref: z.string().optional(),
            description: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const count = await importBankMovements(input.bankAccountId, input.movements);
      return { count };
    }),

  reconciliations: protectedProcedure
    .input(z.object({ bankAccountId: z.string().uuid() }))
    .query(async ({ input }) => {
      return getReconciliations(input.bankAccountId);
    }),

  reconcile: protectedProcedure
    .input(
      z.object({
        bankAccountId: z.string().uuid(),
        matches: z.array(
          z.object({
            bankMovementId: z.string(),
            glTransactionId: z.string(),
            score: z.number().min(0).max(100),
            status: z.enum(["pending", "matched", "flagged", "manual"]).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const count = await saveReconciliations(input.bankAccountId, input.matches);
      return { count };
    }),
});
