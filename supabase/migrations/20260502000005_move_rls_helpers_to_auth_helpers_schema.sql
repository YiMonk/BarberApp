-- ============================================================================
-- Migration 005: Mover helpers de RLS a un esquema privado (auth_helpers)
-- ============================================================================
-- Esto resuelve definitivamente los avisos de "Function Search Path Mutable"
-- y "Public Can Execute SECURITY DEFINER Function" al retirar estas funciones
-- del esquema 'public' (expuesto en la API) y moverlas a uno interno.

-- 1. Crear esquema privado
CREATE SCHEMA IF NOT EXISTS auth_helpers;

-- 2. Definir funciones en el nuevo esquema
-- Todas con SECURITY DEFINER y SET search_path = '' para máxima seguridad.

CREATE OR REPLACE FUNCTION auth_helpers.is_account_owner(p_provider_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.provider_accounts
    WHERE id = p_provider_account_id AND auth_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION auth_helpers.is_subscription_active(p_provider_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE provider_account_id = p_provider_account_id
      AND status IN ('trial', 'active', 'expiring_soon')
      AND current_period_end > pg_catalog.now()
  );
$$;

CREATE OR REPLACE FUNCTION auth_helpers.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION auth_helpers.is_client_of_provider(p_provider_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_provider_links cpl
    JOIN public.client_profiles cp ON cp.id = cpl.client_profile_id
    WHERE cpl.provider_account_id = p_provider_account_id AND cp.auth_user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION auth_helpers.is_client_of_link(p_link_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_provider_links cpl
    JOIN public.client_profiles cp ON cp.id = cpl.client_profile_id
    WHERE cpl.id = p_link_id AND cp.auth_user_id = auth.uid()
  );
$$;

-- 3. Eliminar funciones antiguas en public (CASCADE eliminará las políticas)
DROP FUNCTION IF EXISTS public.is_account_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_subscription_active(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_client_of_provider(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_client_of_link(uuid) CASCADE;

-- 4. Re-crear políticas afectadas apuntando al nuevo esquema

-- ----------------------------------------------------------------------------
-- provider_accounts
-- ----------------------------------------------------------------------------
CREATE POLICY provider_owns_account ON public.provider_accounts
  FOR ALL TO authenticated
  USING (auth_user_id = auth.uid() OR auth_helpers.is_super_admin())
  WITH CHECK (auth_user_id = auth.uid() OR auth_helpers.is_super_admin());

-- ----------------------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------------------
CREATE POLICY subscription_read ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id) OR auth_helpers.is_super_admin());

CREATE POLICY subscription_write ON public.subscriptions
  FOR ALL TO authenticated
  USING (auth_helpers.is_super_admin())
  WITH CHECK (auth_helpers.is_super_admin());

-- ----------------------------------------------------------------------------
-- subscription_events
-- ----------------------------------------------------------------------------
CREATE POLICY sub_events_read ON public.subscription_events
  FOR SELECT TO authenticated
  USING (
    auth_helpers.is_super_admin() OR
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_events.subscription_id
        AND auth_helpers.is_account_owner(s.provider_account_id)
    )
  );

CREATE POLICY sub_events_write ON public.subscription_events
  FOR INSERT TO authenticated
  WITH CHECK (auth_helpers.is_super_admin());

-- ----------------------------------------------------------------------------
-- super_admins
-- ----------------------------------------------------------------------------
CREATE POLICY super_admins_self ON public.super_admins
  FOR ALL TO authenticated
  USING (auth_helpers.is_super_admin())
  WITH CHECK (auth_helpers.is_super_admin());

-- ----------------------------------------------------------------------------
-- services
-- ----------------------------------------------------------------------------
CREATE POLICY services_provider_full_access ON public.services
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (auth_helpers.is_account_owner(provider_account_id));

-- ----------------------------------------------------------------------------
-- weekly_availability
-- ----------------------------------------------------------------------------
CREATE POLICY availability_provider_full ON public.weekly_availability
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (auth_helpers.is_account_owner(provider_account_id));

-- ----------------------------------------------------------------------------
-- availability_overrides
-- ----------------------------------------------------------------------------
CREATE POLICY overrides_provider_full ON public.availability_overrides
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (auth_helpers.is_account_owner(provider_account_id));

-- ----------------------------------------------------------------------------
-- appointments
-- ----------------------------------------------------------------------------
CREATE POLICY appointments_provider_access ON public.appointments
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (
    auth_helpers.is_account_owner(provider_account_id)
    AND auth_helpers.is_subscription_active(provider_account_id)
  );

CREATE POLICY appointments_client_read ON public.appointments
  FOR SELECT TO authenticated
  USING (auth_helpers.is_client_of_link(client_provider_link_id));

CREATE POLICY appointments_client_insert ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth_helpers.is_client_of_link(client_provider_link_id)
    AND auth_helpers.is_subscription_active(provider_account_id)
  );

CREATE POLICY appointments_client_update ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth_helpers.is_client_of_link(client_provider_link_id));

-- ----------------------------------------------------------------------------
-- appointment_services
-- ----------------------------------------------------------------------------
CREATE POLICY appt_services_via_appointment ON public.appointment_services
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_services.appointment_id
        AND (
          auth_helpers.is_account_owner(a.provider_account_id)
          OR auth_helpers.is_client_of_link(a.client_provider_link_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_services.appointment_id
        AND (
          auth_helpers.is_account_owner(a.provider_account_id)
          OR auth_helpers.is_client_of_link(a.client_provider_link_id)
        )
    )
  );

-- ----------------------------------------------------------------------------
-- appointment_history
-- ----------------------------------------------------------------------------
CREATE POLICY appt_history_read ON public.appointment_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_history.appointment_id
        AND (
          auth_helpers.is_account_owner(a.provider_account_id)
          OR auth_helpers.is_client_of_link(a.client_provider_link_id)
        )
    )
  );

-- ----------------------------------------------------------------------------
-- waitlist_entries
-- ----------------------------------------------------------------------------
CREATE POLICY waitlist_provider_full ON public.waitlist_entries
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (auth_helpers.is_account_owner(provider_account_id));

CREATE POLICY waitlist_client_own ON public.waitlist_entries
  FOR ALL TO authenticated
  USING (auth_helpers.is_client_of_link(client_provider_link_id))
  WITH CHECK (
    auth_helpers.is_client_of_link(client_provider_link_id)
    AND auth_helpers.is_subscription_active(provider_account_id)
  );

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
CREATE POLICY reviews_read ON public.reviews
  FOR SELECT TO authenticated
  USING (
    auth_helpers.is_account_owner(provider_account_id)
    OR auth_helpers.is_client_of_link(client_provider_link_id)
  );

-- ----------------------------------------------------------------------------
-- appointment_invitations (Migration 002)
-- ----------------------------------------------------------------------------
CREATE POLICY invitations_provider_full ON public.appointment_invitations
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (
    auth_helpers.is_account_owner(provider_account_id)
    AND auth_helpers.is_subscription_active(provider_account_id)
  );

-- ----------------------------------------------------------------------------
-- reminder_tasks (Migration 002)
-- ----------------------------------------------------------------------------
CREATE POLICY reminder_tasks_provider_only ON public.reminder_tasks
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (auth_helpers.is_account_owner(provider_account_id));

-- ----------------------------------------------------------------------------
-- client_profiles (Migration 003)
-- ----------------------------------------------------------------------------
CREATE POLICY client_profiles_provider_read ON public.client_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_provider_links cpl
      WHERE cpl.client_profile_id = client_profiles.id
        AND auth_helpers.is_account_owner(cpl.provider_account_id)
    )
  );

-- ----------------------------------------------------------------------------
-- client_provider_links (Migration 003)
-- ----------------------------------------------------------------------------
CREATE POLICY cpl_provider_full ON public.client_provider_links
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (auth_helpers.is_account_owner(provider_account_id));

-- ----------------------------------------------------------------------------
-- loyalty_programs (Migration 003)
-- ----------------------------------------------------------------------------
CREATE POLICY loyalty_programs_provider ON public.loyalty_programs
  FOR ALL TO authenticated
  USING (auth_helpers.is_account_owner(provider_account_id))
  WITH CHECK (auth_helpers.is_account_owner(provider_account_id));

-- ----------------------------------------------------------------------------
-- loyalty_progress (Migration 003)
-- ----------------------------------------------------------------------------
CREATE POLICY loyalty_progress_provider ON public.loyalty_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_provider_links cpl
      WHERE cpl.id = loyalty_progress.client_provider_link_id
        AND auth_helpers.is_account_owner(cpl.provider_account_id)
    )
  );

CREATE POLICY loyalty_progress_client ON public.loyalty_progress
  FOR SELECT TO authenticated
  USING (auth_helpers.is_client_of_link(client_provider_link_id));

-- ----------------------------------------------------------------------------
-- loyalty_rewards (Migration 003)
-- ----------------------------------------------------------------------------
CREATE POLICY loyalty_rewards_provider ON public.loyalty_rewards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_provider_links cpl
      WHERE cpl.id = loyalty_rewards.client_provider_link_id
        AND auth_helpers.is_account_owner(cpl.provider_account_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_provider_links cpl
      WHERE cpl.id = loyalty_rewards.client_provider_link_id
        AND auth_helpers.is_account_owner(cpl.provider_account_id)
    )
  );

CREATE POLICY loyalty_rewards_client_read ON public.loyalty_rewards
  FOR SELECT TO authenticated
  USING (auth_helpers.is_client_of_link(client_provider_link_id));


