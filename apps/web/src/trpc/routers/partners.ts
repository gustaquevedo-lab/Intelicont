import { TRPCError } from "@trpc/server";
import { validateRuc } from "@intelicont/ledger/fiscal-py";
import { router, protectedProcedure, z } from "../trpc";
import { getPartners, getPartner, createPartner, updatePartner } from "@ledger/db/repository";
import { isUniqueViolation } from "@ledger/db/index";

const kind = z.enum(["customer", "supplier", "both"]);
const optText = z.string().trim().max(200).optional().transform((v) => v || undefined);
const contacts = z.object({ email: optText, phone: optText, address: optText });
/** Update variant: "" / null mean "remove this key"; absent means "keep". */
const clearable = z.string().trim().max(200).nullish();
const contactsPatch = z.object({ email: clearable, phone: clearable, address: clearable });
const terms = z.number().int().min(0).max(365);

const createInput = z.object({
  entityId: z.string().uuid(),
  kind,
  ruc: z.string().trim().min(1, "El RUC es obligatorio").max(20),
  legalName: z.string().trim().min(1, "La razón social es obligatoria").max(200),
  tradeName: optText,
  country: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "País inválido (ISO-3)").default("PRY"),
  defaultPaymentTerms: terms.optional(),
  contacts: contacts.optional(),
});

const updateInput = z.object({
  id: z.string().uuid(),
  legalName: z.string().trim().min(1, "La razón social es obligatoria").max(200).optional(),
  tradeName: clearable, // "" / null clears it
  kind: kind.optional(),
  defaultPaymentTerms: terms.optional(),
  contacts: contactsPatch.optional(),
  retentionProfile: z.record(z.string(), z.unknown()).optional(),
}).strict(); // the RUC is immutable: unknown keys (ruc, dvRuc, entityId...) are rejected

export const isPartnerRucUniqueViolation = (err: unknown) => isUniqueViolation(err, "partners_entity_id_ruc_unique");

/** True for Postgres 42501 (RLS WITH CHECK / privilege), possibly wrapped by Drizzle in `cause`. */
function isRlsViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "42501" || e?.cause?.code === "42501";
}

/** Stores the identifier WITHOUT DV (Registro de Comprobantes needs it that way); DV goes to dvRuc. */
function parseIdentifier(raw: string, country: string): { ruc: string; dvRuc: string | null } {
  if (country !== "PRY") return { ruc: raw, dvRuc: null };
  const check = validateRuc(raw);
  if (!check.valid) throw new TRPCError({ code: "BAD_REQUEST", message: check.errors[0] ?? "RUC inválido" });
  const [ruc, dvRuc] = raw.split("-");
  return { ruc, dvRuc: dvRuc ?? null };
}

export const partnersRouter = router({
  list: protectedProcedure
    .input(z.object({ entityId: z.string().uuid() }))
    .query(async ({ input }) => {
      const partners = await getPartners(input.entityId);
      return partners.map((p) => ({
        id: p.id, entityId: p.entityId, kind: p.kind,
        ruc: p.ruc, dvRuc: p.dvRuc, rucDisplay: p.dvRuc ? `${p.ruc}-${p.dvRuc}` : p.ruc,
        legalName: p.legalName, tradeName: p.tradeName,
        contacts: p.contacts as { email?: string; phone?: string; address?: string } | null,
        defaultPaymentTerms: p.defaultPaymentTerms,
        retentionProfile: p.retentionProfile, country: p.country,
        createdAt: p.createdAt, updatedAt: p.updatedAt,
      }));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const partner = await getPartner(input.id);
      if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "Tercero no encontrado" });
      return partner;
    }),

  create: protectedProcedure.input(createInput).mutation(async ({ input }) => {
    const { ruc, dvRuc } = parseIdentifier(input.ruc, input.country);
    try {
      const id = await createPartner({ ...input, ruc, dvRuc });
      return { id };
    } catch (err) {
      if (isPartnerRucUniqueViolation(err)) throw new TRPCError({ code: "CONFLICT", message: "Ya existe un tercero con ese RUC en esta empresa" });
      if (isRlsViolation(err)) throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a esta empresa" });
      // Do not leak SQL details to the client.
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el tercero", cause: err });
    }
  }),

  update: protectedProcedure.input(updateInput).mutation(async ({ input }) => {
    const { id, tradeName, ...rest } = input;
    const found = await updatePartner(id, { ...rest, ...(tradeName !== undefined && { tradeName: tradeName || null }) });
    if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "Tercero no encontrado" });
    return { id };
  }),
});
