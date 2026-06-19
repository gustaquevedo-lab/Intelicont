import { router, publicProcedure, z } from "../trpc";
import { getAllAccounts } from "@ledger/db/repository";

export const accountsRouter = router({
  list: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      const accounts = await getAllAccounts(input.entityId);
      return accounts.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        nature: a.nature,
        parentId: a.parentId,
        allowsPosting: a.allowsPosting,
        costCenterRequired: a.costCenterRequired,
        taxMappings: a.taxMappings,
      }));
    }),

  tree: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      const accounts = await getAllAccounts(input.entityId);
      return buildTree(accounts);
    }),
});

function buildTree(accounts: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const a of accounts) {
    map.set(a.id, { ...a, children: [] });
  }

  for (const a of accounts) {
    const node = map.get(a.id)!;
    if (a.parentId && map.has(a.parentId)) {
      map.get(a.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
