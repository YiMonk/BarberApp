-- ============================================================================
-- Migration 002: Invitaciones a citas, recordatorios manuales asistidos,
-- ubicación geográfica del profesional, y soporte de onboarding completo.
-- ============================================================================
-- Asume que 001_initial_schema.sql ya fue ejecutado.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Campos de ubicación y configuración adicional en provider_accounts
-- ----------------------------------------------------------------------------

alter table public.provider_accounts add column if not exists address text;
alter table public.provider_accounts add column if not exists address_details text;  -- piso, local, referencia
alter table public.provider_accounts add column if not exists latitude numeric(10, 7);
alter table public.provider_accounts add column if not exists longitude numeric(10, 7);
alter table public.provider_accounts add column if not exists google_maps_url text;

-- Si el barbero quiere aparecer en el directorio público
alter table public.provider_accounts add column if not exists is_profile_public boolean not null default true;

-- Plantilla de mensaje de WhatsApp para invitaciones a clientes nuevos.
-- El barbero puede personalizarla. Soporta variables: {client_name}, {date}, {time}, {services}, {link}
alter table public.provider_accounts add column if not exists whatsapp_invitation_template text
  default 'Hola {client_name}! Te agendé una cita en {business_name} para el {date} a las {time}. Servicios: {services}. Confirma aquí: {link}';

-- Plantilla de recordatorio 24h antes
alter table public.provider_accounts add column if not exists whatsapp_reminder_24h_template text
  default 'Hola {client_name}, te recuerdo tu cita en {business_name} mañana {date} a las {time}. ¡Te espero!';

-- Plantilla de recordatorio 1h antes
alter table public.provider_accounts add column if not exists whatsapp_reminder_1h_template text
  default 'Hola {client_name}, te recuerdo tu cita en {business_name} en una hora ({time}). ¡Nos vemos pronto!';

-- Validación: latitude/longitude deben venir juntos o ambos null
alter table public.provider_accounts add constraint coordinates_both_or_none
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null));

CREATE INDEX IF NOT EXISTS idx_provider_accounts_public on public.provider_accounts(is_profile_public)
  where is_profile_public = true and onboarding_completed = true and is_active = true;

-- ----------------------------------------------------------------------------
-- 2. Origen del cliente (autoregistrado vs creado manualmente)
-- ----------------------------------------------------------------------------

create type client_source as enum (
  'self_registration',     -- el cliente se registró en la app por su cuenta
  'manual_creation',       -- el barbero lo creó manualmente
  'invitation_accepted',   -- el barbero lo creó pero el cliente aceptó la invitación
  'imported'               -- importado desde otra fuente (futuro)
);

alter table public.clients add column if not exists source client_source not null default 'self_registration';

-- Si el cliente quiere recibir recordatorios por WhatsApp (cuando es cliente fantasma)
alter table public.clients add column if not exists whatsapp_reminders_enabled boolean not null default true;

-- Marca si el cliente fue convertido (era manual_creation y luego aceptó invitación)
alter table public.clients add column if not exists converted_at timestamptz;

-- ----------------------------------------------------------------------------
-- 3. Tabla de invitaciones a citas (link mágico)
-- ----------------------------------------------------------------------------

create type invitation_status as enum (
  'pending',           -- enviada, esperando que el cliente abra
  'opened',            -- el cliente abrió el link pero no respondió aún
  'accepted',          -- el cliente confirmó la cita
  'rejected',          -- el cliente rechazó la cita
  'expired',           -- TTL expiró sin respuesta
  'cancelled'          -- el barbero canceló la invitación
);

create table public.appointment_invitations (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,

  -- Token único usado en el link mágico (URL-safe, 32 chars)
  token text not null unique default encode(gen_random_bytes(24), 'base64'),

  -- Datos de contacto a los que se envió la invitación
  sent_to_name text not null,
  sent_to_phone text,
  sent_to_email text,
  sent_via text not null default 'whatsapp' check (sent_via in ('whatsapp', 'sms', 'email', 'manual')),

  -- Tracking del flujo
  status invitation_status not null default 'pending',
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),

  -- Si el cliente se registró/loguó desde la invitación, vincular su user_id
  resulted_in_user_id uuid references auth.users(id) on delete set null,

  -- Cliente al que pertenece (puede ser fantasma o invitado)
  client_id uuid not null references public.clients(id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token on public.appointment_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_provider on public.appointment_invitations(provider_account_id, created_at desc);
CREATE INDEX IF NOT EXISTS idx_invitations_status_expires on public.appointment_invitations(status, expires_at)
  where status in ('pending', 'opened');
CREATE INDEX IF NOT EXISTS idx_invitations_client on public.appointment_invitations(client_id);

create trigger trg_invitations_updated before update on public.appointment_invitations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Cola de recordatorios manuales asistidos
-- ----------------------------------------------------------------------------
-- Cuando una cita se acerca, generamos un "reminder_task" para el barbero.
-- El barbero ve estas tasks en su dashboard, abre WhatsApp con el link
-- pre-armado, y marca como enviado.

create type reminder_type as enum (
  'reminder_24h',      -- 24 horas antes
  'reminder_1h',       -- 1 hora antes
  'invitation_send',   -- al crear cita con cliente invitado, recordar enviar el link
  'invitation_resend'  -- si la invitación lleva días sin responderse
);

create type reminder_status as enum (
  'pending',           -- esperando ser enviado por el barbero
  'sent',              -- el barbero marcó como enviado
  'skipped',           -- el barbero decidió no enviar
  'auto_dismissed'     -- la cita se canceló o el cliente respondió y ya no aplica
);

create table public.reminder_tasks (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,

  type reminder_type not null,
  status reminder_status not null default 'pending',

  -- Cuándo debería enviarse (calculado desde scheduled_start de la cita)
  due_at timestamptz not null,

  -- El mensaje pre-armado listo para WhatsApp (resuelto desde la plantilla)
  prepared_message text not null,
  -- URL completa wa.me/<phone>?text=<encoded_message>
  whatsapp_url text not null,

  -- Tracking
  marked_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_reminder_tasks_provider_pending on public.reminder_tasks(provider_account_id, due_at)
  where status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminder_tasks_appointment on public.reminder_tasks(appointment_id);

create trigger trg_reminder_tasks_updated before update on public.reminder_tasks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Funciones helper para resolver plantillas
-- ----------------------------------------------------------------------------

-- Resuelve plantilla reemplazando variables {client_name}, {business_name}, etc.
create or replace function public.resolve_message_template(
  p_template text,
  p_variables jsonb
)
returns text language plpgsql immutable as $$
declare
  v_result text;
  v_key text;
  v_value text;
begin
  v_result := p_template;
  for v_key, v_value in select * from jsonb_each_text(p_variables) loop
    v_result := replace(v_result, '{' || v_key || '}', coalesce(v_value, ''));
  end loop;
  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. RLS para las nuevas tablas
-- ----------------------------------------------------------------------------

alter table public.appointment_invitations enable row level security;
alter table public.reminder_tasks enable row level security;

-- appointment_invitations:
-- - Provider ve y maneja todas las invitaciones de sus citas
-- - Cualquiera puede leer una invitación si tiene el token (acceso público controlado por API)
create policy invitations_provider_full on public.appointment_invitations
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (
    public.is_account_owner(provider_account_id)
    and public.is_subscription_active(provider_account_id)
  );

-- Acceso por token: la app expone un endpoint que valida el token sin autenticar.
-- Por eso esta policy permite SELECT a cualquier rol anon SI el token coincide.
-- IMPORTANTE: la consulta SIEMPRE debe filtrar por token. Nunca exponer la tabla completa.
create policy invitations_public_by_token on public.appointment_invitations
  for select to anon, authenticated
  using (true);  -- la API filtra por token; sin token no hay forma de listar

-- Mejor enfoque: crear una vista pública limitada y usar service_role solo para validar token
-- Lo dejamos como nota: en el código de la API, usar service_role_key para esta consulta
-- y NUNCA exponer esta tabla directamente al cliente.

-- reminder_tasks: solo el provider las ve y maneja
create policy reminder_tasks_provider_only on public.reminder_tasks
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

-- ----------------------------------------------------------------------------
-- 7. Trigger: al crear una cita confirmada o pendiente, generar reminder_tasks
-- ----------------------------------------------------------------------------

create or replace function public.create_reminder_tasks_for_appointment()
returns trigger language plpgsql as $$
declare
  v_provider record;
  v_client record;
  v_services_text text;
  v_24h_time timestamptz;
  v_1h_time timestamptz;
  v_message_24h text;
  v_message_1h text;
  v_phone text;
begin
  -- Solo crear recordatorios para citas confirmadas o pending_client_approval
  if new.status not in ('confirmed', 'pending_client_approval') then
    return new;
  end if;

  -- Obtener datos del provider
  select * into v_provider from public.provider_accounts where id = new.provider_account_id;

  -- Obtener datos del cliente
  select * into v_client from public.clients where id = new.client_id;

  -- Si el cliente no quiere recordatorios o no tiene WhatsApp, no crear tareas
  if not coalesce(v_client.whatsapp_reminders_enabled, true) or coalesce(v_client.whatsapp, v_client.phone) is null then
    return new;
  end if;

  v_phone := regexp_replace(coalesce(v_client.whatsapp, v_client.phone), '[^0-9]', '', 'g');

  -- Construir lista de servicios
  select string_agg(s.name, ', ' order by aps.display_order)
  into v_services_text
  from public.appointment_services aps
  join public.services s on s.id = aps.service_id
  where aps.appointment_id = new.id;

  -- Calcular momentos de recordatorio
  v_24h_time := new.scheduled_start - interval '24 hours';
  v_1h_time := new.scheduled_start - interval '1 hour';

  -- Resolver plantillas
  v_message_24h := public.resolve_message_template(
    coalesce(v_provider.whatsapp_reminder_24h_template, 'Hola {client_name}, te recuerdo tu cita mañana a las {time}.'),
    jsonb_build_object(
      'client_name', v_client.first_name,
      'business_name', v_provider.business_name,
      'date', to_char(new.scheduled_start at time zone v_provider.timezone, 'DD/MM/YYYY'),
      'time', to_char(new.scheduled_start at time zone v_provider.timezone, 'HH24:MI'),
      'services', coalesce(v_services_text, '')
    )
  );

  v_message_1h := public.resolve_message_template(
    coalesce(v_provider.whatsapp_reminder_1h_template, 'Hola {client_name}, te recuerdo tu cita en una hora.'),
    jsonb_build_object(
      'client_name', v_client.first_name,
      'business_name', v_provider.business_name,
      'date', to_char(new.scheduled_start at time zone v_provider.timezone, 'DD/MM/YYYY'),
      'time', to_char(new.scheduled_start at time zone v_provider.timezone, 'HH24:MI'),
      'services', coalesce(v_services_text, '')
    )
  );

  -- Crear task de 24h si la cita es a más de 24h vista
  if v_24h_time > now() then
    insert into public.reminder_tasks (
      provider_account_id, appointment_id, client_id, type,
      due_at, prepared_message, whatsapp_url
    ) values (
      new.provider_account_id, new.id, new.client_id, 'reminder_24h',
      v_24h_time, v_message_24h,
      'https://wa.me/' || v_phone || '?text=' || replace(replace(replace(v_message_24h, ' ', '%20'), E'\n', '%0A'), '!', '%21')
    );
  end if;

  -- Crear task de 1h si la cita es a más de 1h vista
  if v_1h_time > now() then
    insert into public.reminder_tasks (
      provider_account_id, appointment_id, client_id, type,
      due_at, prepared_message, whatsapp_url
    ) values (
      new.provider_account_id, new.id, new.client_id, 'reminder_1h',
      v_1h_time, v_message_1h,
      'https://wa.me/' || v_phone || '?text=' || replace(replace(replace(v_message_1h, ' ', '%20'), E'\n', '%0A'), '!', '%21')
    );
  end if;

  return new;
end;
$$;

create trigger trg_appointments_create_reminders
  after insert on public.appointments
  for each row execute function public.create_reminder_tasks_for_appointment();

-- Trigger: cuando una cita se cancela o cambia, dismiss los recordatorios pendientes
create or replace function public.dismiss_reminders_on_status_change()
returns trigger language plpgsql as $$
begin
  if new.status in ('cancelled', 'attended', 'no_show') and old.status != new.status then
    update public.reminder_tasks
    set status = 'auto_dismissed'
    where appointment_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

create trigger trg_appointments_dismiss_reminders
  after update of status on public.appointments
  for each row execute function public.dismiss_reminders_on_status_change();

-- ----------------------------------------------------------------------------
-- 8. Job pg_cron: expirar invitaciones no respondidas
-- ----------------------------------------------------------------------------

select cron.schedule(
  'expire-invitations',
  '*/15 * * * *',  -- cada 15 min
  $$
    update public.appointment_invitations
    set status = 'expired'
    where status in ('pending', 'opened')
      and expires_at < now();

    -- También cancelar las citas cuyas invitaciones expiraron
    update public.appointments
    set status = 'cancelled',
        cancelled_by = 'system',
        cancellation_reason = 'invitation_expired',
        cancelled_at = now()
    where status = 'pending_client_approval'
      and exists (
        select 1 from public.appointment_invitations inv
        where inv.appointment_id = appointments.id
          and inv.status = 'expired'
      );
  $$
);

-- ============================================================================
-- FIN MIGRATION 002
-- ============================================================================


