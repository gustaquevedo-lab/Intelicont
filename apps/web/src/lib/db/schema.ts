/**
 * Minimal schema mirror for apps/web — only the tables queried by the web app.
 * Source of truth (migrations) lives in packages/ledger/db/schema.ts.
 * Keep in sync when the ledger schema changes.
 */
import {
  pgTable, uuid, varchar, text, timestamp, pgEnum,
} from "drizzle-orm/pg-core";

export const entityStatusEnum = pgEnum("entity_status", ["active", "inactive", "closed"]);

export const entities = pgTable("entities", {
  id:           uuid("id").primaryKey().defaultRandom(),
  ruc:          varchar("ruc", { length: 20 }).notNull().unique(),
  legalName:    text("legal_name").notNull(),
  tradeName:    text("trade_name"),
  taxRegimes:   text("tax_regimes").array(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("PYG"),
  status:       entityStatusEnum("status").default("active"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow(),
});

export type Entity    = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
