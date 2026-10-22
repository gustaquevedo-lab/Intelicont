-- Identity: Better Auth tables (users, sessions, auth_accounts, verifications, two_factors),
-- memberships (user -> entity, role) with user-scoped RLS, and create_entity().
--
-- APPLY NOTE: migrations never name roles. After migrating the real DB, run once:
--   GRANT DELETE ON sessions, verifications TO <runtime role>;
-- (the runtime role already gets SELECT/INSERT/UPDATE via the usual blanket grant).
-- Auth tables (users, sessions, auth_accounts, verifications, two_factors) have NO tenant RLS:
-- they are auth-layer tables read/written by the auth library before any tenant scope exists.

-- Current user, set per request/transaction via set_config('app.user_id', ..., true). NULL when unset.
CREATE OR REPLACE FUNCTION app_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"user_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_id_entity_id_pk" PRIMARY KEY("user_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factors_user_id_idx" ON "two_factors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factors_secret_idx" ON "two_factors" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");
--> statement-breakpoint

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_role_check"
  CHECK (role IN ('admin','accountant','assistant','auditor','client'));
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY user_isolation ON "memberships" FOR ALL
  USING (user_id = app_user_id())
  WITH CHECK (user_id = app_user_id());
--> statement-breakpoint

-- Creates an entity and the caller's admin membership atomically. SECURITY DEFINER because the
-- runtime role cannot INSERT into entities (RLS requires id = ANY(app_entity_ids()), which a new id
-- never satisfies). The new id is appended to the transaction-local app.entity_ids so the creator
-- can read it in the same transaction.
-- shortcut: RUC DV is validated in TypeScript, not in SQL
CREATE OR REPLACE FUNCTION create_entity(
  p_ruc text, p_legal_name text, p_trade_name text, p_tax_regimes text[], p_base_currency text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := app_user_id();
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'create_entity requires app.user_id to be set';
  END IF;
  INSERT INTO entities (ruc, legal_name, trade_name, tax_regimes, base_currency)
  VALUES (p_ruc, p_legal_name, p_trade_name, p_tax_regimes, p_base_currency)
  RETURNING id INTO v_id;
  INSERT INTO memberships (user_id, entity_id, role) VALUES (v_user, v_id, 'admin');
  PERFORM set_config(
    'app.entity_ids',
    concat_ws(',', NULLIF(current_setting('app.entity_ids', true), ''), v_id::text),
    true
  );
  RETURN v_id;
END
$$;
