-- ============================================================================
-- Migration 004: Security Hardening (Search Path, Extensions, RPC Access)
-- ============================================================================

-- 1. Esquema de extensiones
-- Mover las extensiones a un esquema dedicado mejora la seguridad al evitar
-- que objetos de extensión sean "ocultados" por objetos en el esquema public.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
ALTER EXTENSION "btree_gist" SET SCHEMA extensions;

-- 2. Endurecimiento de funciones (search_path = '')
-- Establecer search_path en blanco obliga a usar nombres completamente calificados,
-- lo que previene ataques de búsqueda de ruta.

-- Helper: set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- Helper: log_appointment_status_change
CREATE OR REPLACE FUNCTION public.log_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_history (appointment_id, from_status, to_status, changed_by_user_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Helper: create_trial_subscription
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    provider_account_id, status, trial_ends_at, current_period_end, total_days_granted
  ) VALUES (
    NEW.id, 'trial', pg_catalog.now() + interval '14 days', pg_catalog.now() + interval '14 days', 14
  );

  INSERT INTO public.subscription_events (subscription_id, event_type, days_added, new_period_end)
  SELECT id, 'trial_started', 14, current_period_end
  FROM public.subscriptions WHERE provider_account_id = NEW.id;

  RETURN NEW;
END;
$$;

-- RLS Helper: is_account_owner
CREATE OR REPLACE FUNCTION public.is_account_owner(p_provider_account_id uuid)
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

-- RLS Helper: is_subscription_active
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_provider_account_id uuid)
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

-- RLS Helper: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
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

-- RLS Helper: is_client_of_provider
CREATE OR REPLACE FUNCTION public.is_client_of_provider(p_provider_account_id uuid)
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

-- RLS Helper: is_client_of_link
CREATE OR REPLACE FUNCTION public.is_client_of_link(p_link_id uuid)
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

-- Trigger: update_progress_on_attended
CREATE OR REPLACE FUNCTION public.update_progress_on_attended()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_program record;
  v_progress_id uuid;
  v_current int;
  v_link record;
  v_appointment_service_ids uuid[];
  v_should_count boolean;
  v_stamps_required int;
BEGIN
  -- Solo procesar al pasar a 'attended'
  IF OLD.status = 'attended' OR NEW.status != 'attended' THEN
    RETURN NEW;
  END IF;

  -- Obtener el link y datos del cliente
  SELECT cpl.*, cp.birth_date
  INTO v_link
  FROM public.client_provider_links cpl
  JOIN public.client_profiles cp ON cp.id = cpl.client_profile_id
  WHERE cpl.id = NEW.client_provider_link_id;

  -- Actualizar stats del link
  UPDATE public.client_provider_links
  SET total_appointments = total_appointments + 1,
      total_attended = total_attended + 1,
      last_appointment_at = NEW.scheduled_start,
      first_appointment_at = pg_catalog.coalesce(first_appointment_at, NEW.scheduled_start)
  WHERE id = NEW.client_provider_link_id;

  -- Obtener los servicios incluidos en esta cita
  SELECT pg_catalog.array_agg(service_id) INTO v_appointment_service_ids
  FROM public.appointment_services
  WHERE appointment_id = NEW.id;

  -- Iterar por cada programa activo del barbero
  FOR v_program IN
    SELECT * FROM public.loyalty_programs
    WHERE provider_account_id = NEW.provider_account_id
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= pg_catalog.now())
      AND (ends_at IS NULL OR ends_at > pg_catalog.now())
  LOOP
    -- Verificar si la cita aplica al programa (servicios)
    v_should_count := true;
    IF v_program.applicable_service_ids IS NOT NULL AND pg_catalog.array_length(v_program.applicable_service_ids, 1) > 0 THEN
      v_should_count := v_appointment_service_ids && v_program.applicable_service_ids;
    END IF;

    IF NOT v_should_count THEN
      CONTINUE;
    END IF;

    -- Obtener o crear el progress de este programa para este link
    INSERT INTO public.loyalty_progress (loyalty_program_id, client_provider_link_id, current_value)
    VALUES (v_program.id, NEW.client_provider_link_id, 0)
    ON CONFLICT (loyalty_program_id, client_provider_link_id) DO NOTHING;

    SELECT id, current_value INTO v_progress_id, v_current
    FROM public.loyalty_progress
    WHERE loyalty_program_id = v_program.id AND client_provider_link_id = NEW.client_provider_link_id;

    -- Lógica por mecánica
    IF v_program.mechanic = 'punch_card' THEN
      v_stamps_required := (v_program.config->>'stamps_required')::int;
      v_current := v_current + 1;

      UPDATE public.loyalty_progress
      SET current_value = v_current, last_progress_at = pg_catalog.now()
      WHERE id = v_progress_id;

      -- Si completó los sellos, generar recompensa
      IF v_current >= v_stamps_required THEN
        INSERT INTO public.loyalty_rewards (
          loyalty_program_id, client_provider_link_id, reward_type, reward_value,
          expires_at
        ) VALUES (
          v_program.id, NEW.client_provider_link_id,
          (v_program.config->>'reward_type')::public.reward_type,
          pg_catalog.nullif(v_program.config->>'reward_value', '')::numeric,
          pg_catalog.now() + interval '90 days'
        );

        -- Reset del contador
        UPDATE public.loyalty_progress
        SET current_value = 0,
            rewards_earned = rewards_earned + 1
        WHERE id = v_progress_id;
      END IF;

    ELSIF v_program.mechanic = 'nth_visit_discount' THEN
      v_current := v_current + 1;

      UPDATE public.loyalty_progress
      SET current_value = v_current, last_progress_at = pg_catalog.now()
      WHERE id = v_progress_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger: update_stats_on_no_show_or_cancel
CREATE OR REPLACE FUNCTION public.update_stats_on_no_show_or_cancel()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'no_show' AND OLD.status != 'no_show' THEN
    UPDATE public.client_provider_links
    SET total_appointments = total_appointments + 1,
        total_no_show = total_no_show + 1
    WHERE id = NEW.client_provider_link_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Helper: resolve_message_template
CREATE OR REPLACE FUNCTION public.resolve_message_template(
  p_template text,
  p_variables jsonb
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_result text;
  v_key text;
  v_value text;
BEGIN
  v_result := p_template;
  FOR v_key, v_value IN SELECT * FROM pg_catalog.jsonb_each_text(p_variables) LOOP
    v_result := pg_catalog.replace(v_result, '{' || v_key || '}', pg_catalog.coalesce(v_value, ''));
  END LOOP;
  RETURN v_result;
END;
$$;

-- Trigger: create_reminder_tasks_for_appointment
CREATE OR REPLACE FUNCTION public.create_reminder_tasks_for_appointment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_provider record;
  v_client_link record;
  v_client_profile record;
  v_services_text text;
  v_24h_time timestamptz;
  v_1h_time timestamptz;
  v_message_24h text;
  v_message_1h text;
  v_phone text;
BEGIN
  -- Solo crear recordatorios para citas confirmadas o pending_client_approval
  IF NEW.status NOT IN ('confirmed', 'pending_client_approval') THEN
    RETURN NEW;
  END IF;

  -- Obtener datos del provider
  SELECT * INTO v_provider FROM public.provider_accounts WHERE id = NEW.provider_account_id;

  -- Obtener datos del link y perfil
  SELECT cpl.* INTO v_client_link FROM public.client_provider_links cpl WHERE cpl.id = NEW.client_provider_link_id;
  SELECT cp.* INTO v_client_profile FROM public.client_profiles cp WHERE cp.id = v_client_link.client_profile_id;

  -- Si el cliente no quiere recordatorios o no tiene WhatsApp, no crear tareas
  IF NOT pg_catalog.coalesce(v_client_link.whatsapp_reminders_enabled, true) OR pg_catalog.coalesce(v_client_profile.whatsapp, v_client_profile.phone) IS NULL THEN
    RETURN NEW;
  END IF;

  v_phone := pg_catalog.regexp_replace(pg_catalog.coalesce(v_client_profile.whatsapp, v_client_profile.phone), '[^0-9]', '', 'g');

  -- Construir lista de servicios
  SELECT pg_catalog.string_agg(s.name, ', ' ORDER BY aps.display_order)
  INTO v_services_text
  FROM public.appointment_services aps
  JOIN public.services s ON s.id = aps.service_id
  WHERE aps.appointment_id = NEW.id;

  -- Calcular momentos de recordatorio
  v_24h_time := NEW.scheduled_start - interval '24 hours';
  v_1h_time := NEW.scheduled_start - interval '1 hour';

  -- Resolver plantillas
  v_message_24h := public.resolve_message_template(
    pg_catalog.coalesce(v_provider.whatsapp_reminder_24h_template, 'Hola {client_name}, te recuerdo tu cita mañana a las {time}.'),
    pg_catalog.jsonb_build_object(
      'client_name', v_client_profile.first_name,
      'business_name', v_provider.business_name,
      'date', pg_catalog.to_char(NEW.scheduled_start AT TIME ZONE v_provider.timezone, 'DD/MM/YYYY'),
      'time', pg_catalog.to_char(NEW.scheduled_start AT TIME ZONE v_provider.timezone, 'HH24:MI'),
      'services', pg_catalog.coalesce(v_services_text, '')
    )
  );

  v_message_1h := public.resolve_message_template(
    pg_catalog.coalesce(v_provider.whatsapp_reminder_1h_template, 'Hola {client_name}, te recuerdo tu cita en una hora.'),
    pg_catalog.jsonb_build_object(
      'client_name', v_client_profile.first_name,
      'business_name', v_provider.business_name,
      'date', pg_catalog.to_char(NEW.scheduled_start AT TIME ZONE v_provider.timezone, 'DD/MM/YYYY'),
      'time', pg_catalog.to_char(NEW.scheduled_start AT TIME ZONE v_provider.timezone, 'HH24:MI'),
      'services', pg_catalog.coalesce(v_services_text, '')
    )
  );

  -- Crear task de 24h si la cita es a más de 24h vista
  IF v_24h_time > pg_catalog.now() THEN
    INSERT INTO public.reminder_tasks (
      provider_account_id, appointment_id, client_provider_link_id, type,
      due_at, prepared_message, whatsapp_url
    ) VALUES (
      NEW.provider_account_id, NEW.id, NEW.client_provider_link_id, 'reminder_24h',
      v_24h_time, v_message_24h,
      'https://wa.me/' || v_phone || '?text=' || pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(v_message_24h, ' ', '%20'), E'\n', '%0A'), '!', '%21')
    );
  END IF;

  -- Crear task de 1h si la cita es a más de 1h vista
  IF v_1h_time > pg_catalog.now() THEN
    INSERT INTO public.reminder_tasks (
      provider_account_id, appointment_id, client_provider_link_id, type,
      due_at, prepared_message, whatsapp_url
    ) VALUES (
      NEW.provider_account_id, NEW.id, NEW.client_provider_link_id, 'reminder_1h',
      v_1h_time, v_message_1h,
      'https://wa.me/' || v_phone || '?text=' || pg_catalog.replace(pg_catalog.replace(pg_catalog.replace(v_message_1h, ' ', '%20'), E'\n', '%0A'), '!', '%21')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: dismiss_reminders_on_status_change
CREATE OR REPLACE FUNCTION public.dismiss_reminders_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'attended', 'no_show') AND OLD.status != NEW.status THEN
    UPDATE public.reminder_tasks
    SET status = 'auto_dismissed'
    WHERE appointment_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Revocar acceso RPC a funciones de RLS
-- Esto evita que los avisos "Public Can Execute SECURITY DEFINER Function" persistan.
REVOKE EXECUTE ON FUNCTION public.is_account_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_subscription_active(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_client_of_provider(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_client_of_link(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_account_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_subscription_active(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_client_of_provider(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_client_of_link(uuid) TO authenticated, service_role;


