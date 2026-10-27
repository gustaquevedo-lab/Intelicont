-- SuperAdmin RLS Bypass for Entities and Memberships
-- Allows authorized superadmin transactions (app.is_superadmin = 'true') to view/manage all tenants.

DROP POLICY IF EXISTS tenant_isolation ON "entities";
CREATE POLICY tenant_isolation ON "entities"
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR id = ANY (app_entity_ids())
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR id = ANY (app_entity_ids())
  );

--> statement-breakpoint

DROP POLICY IF EXISTS memberships_select ON "memberships";
CREATE POLICY memberships_select ON "memberships" FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR user_id = app_user_id()
    OR entity_id = ANY (app_entity_ids())
  );

--> statement-breakpoint

DROP POLICY IF EXISTS memberships_superadmin_all ON "memberships";
CREATE POLICY memberships_superadmin_all ON "memberships"
  USING (current_setting('app.is_superadmin', true) = 'true')
  WITH CHECK (current_setting('app.is_superadmin', true) = 'true');
