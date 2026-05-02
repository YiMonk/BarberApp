-- ============================================================================
-- Sistema de Agendamiento para Servicios Profesionales
-- Migration inicial · Supabase / PostgreSQL 15+
-- ============================================================================
-- Modelo: SaaS multi-tenant por vertical (Modelo B: profesional individual)
-- Una instancia = una vertical (barberos / manicuristas / masajistas / etc.)
-- Cada provider_account tiene su propia suscripción y datos aislados via RLS.
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "btree_gist";  -- para constraint EXCLUDE de citas
create extension if not exists "pg_cron";     -- para tareas programadas

-- ============================================================================
-- 1. CUENTAS DE PROFESIONALES Y SUSCRIPCIONES
-- ============================================================================

-- Cuenta del profesional (el "tenant" principal en Modelo B).
-- Cada barbero/manicurista/masajista tiene una.
-- Se vincula 1:1 con auth.users de Supabase Auth.
create table public.provider_accounts (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Datos del negocio del profesional
  business_name text not null,
  display_name text not null,
  phone text,
  whatsapp text,
  email text not null,
  bio text,
  avatar_url text,
  cover_url text,

  -- Configuración operativa
  timezone text not null default 'America/Bogota',
  currency text not null default 'USD',
  default_slot_minutes int not null default 30,
  default_approval_ttl_minutes int not null default 120,

  -- Estado de la cuenta
  is_active boolean not null default true,         -- bloqueado por admin manualmente
  is_accepting_appointments boolean not null default true,
  onboarding_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_provider_accounts_auth_user on public.provider_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_provider_accounts_active on public.provider_accounts(is_active) where is_active = true;

-- Suscripciones: el corazón del control de acceso.
-- Una por cada provider_account.
create type subscription_status as enum (
  'trial',           -- 14 días iniciales gratis
  'active',          -- pagada y vigente
  'expiring_soon',   -- quedan ≤7 días, recordatorios activos
  'expired',         -- vencida, cuenta en modo lectura
  'cancelled'        -- usuario decidió cancelar (bloqueo total)
);

create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null unique references public.provider_accounts(id) on delete cascade,

  status subscription_status not null default 'trial',
  trial_ends_at timestamptz,                  -- null cuando ya pagó la primera vez
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,    -- fecha en que vence el acceso actual

  total_days_granted int not null default 14, -- acumulado histórico
  last_extended_at timestamptz,
  last_extended_by_admin_id uuid,             -- FK lógica a super_admins.id

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status on public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end on public.subscriptions(current_period_end);

-- Auditoría de cambios en suscripciones. Inmutable.
create type subscription_event_type as enum (
  'trial_started',
  'extended_by_admin',
  'expiring_warning_sent',
  'expired_auto',
  'reactivated',
  'cancelled_by_user',
  'cancelled_by_admin'
);

create table public.subscription_events (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  event_type subscription_event_type not null,

  days_added int,                       -- positivo en extensiones, null en otros
  previous_period_end timestamptz,
  new_period_end timestamptz,
  notes text,
  performed_by_admin_id uuid,           -- null si fue automático del sistema

  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_subscription on public.subscription_events(subscription_id, created_at desc);

-- Super admins (tú y tu equipo). Tabla aparte de provider_accounts.
create table public.super_admins (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. CLIENTES (los clientes finales del profesional, no del SaaS)
-- ============================================================================
-- Un cliente puede tener cuenta en auth.users (si usa la app web) o no
-- (si el proveedor lo creó manualmente para agendarle un walk-in).

create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,  -- null si no tiene cuenta

  first_name text not null,
  last_name text,
  phone text,
  whatsapp text,
  email text,
  avatar_url text,

  -- Notas internas del proveedor sobre el cliente. Solo el proveedor las ve.
  internal_notes text,

  -- Para evitar duplicados cuando el proveedor crea manualmente un cliente
  -- y luego ese mismo cliente se registra en la app web.
  is_managed_by_provider boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un cliente registrado en auth.users solo puede aparecer una vez por proveedor
  unique (provider_account_id, auth_user_id)
);

CREATE INDEX IF NOT EXISTS idx_clients_provider on public.clients(provider_account_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_user on public.clients(auth_user_id) where auth_user_id is not null;
CREATE INDEX IF NOT EXISTS idx_clients_phone on public.clients(provider_account_id, phone);

-- ============================================================================
-- 3. CATÁLOGO DE SERVICIOS
-- ============================================================================

create table public.services (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,

  name text not null,
  description text,
  duration_minutes int not null check (duration_minutes > 0),
  price numeric(10, 2) check (price >= 0),
  category text,
  display_order int not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_services_provider_active on public.services(provider_account_id, is_active);

-- ============================================================================
-- 4. DISPONIBILIDAD DEL PROFESIONAL
-- ============================================================================

-- Horarios semanales recurrentes
create table public.weekly_availability (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,

  day_of_week int not null check (day_of_week between 0 and 6),  -- 0=domingo
  start_time time not null,
  end_time time not null check (end_time > start_time),
  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_availability_provider on public.weekly_availability(provider_account_id, day_of_week)
  where is_active = true;

-- Excepciones puntuales: vacaciones, días bloqueados, horas extra
create type availability_override_type as enum ('blocked', 'extended', 'modified');

create table public.availability_overrides (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,

  override_date date not null,
  type availability_override_type not null,
  start_time time,         -- null si type='blocked' día completo
  end_time time,
  reason text,

  created_at timestamptz not null default now(),

  check (type = 'blocked' or (start_time is not null and end_time is not null))
);

CREATE INDEX IF NOT EXISTS idx_overrides_provider_date on public.availability_overrides(provider_account_id, override_date);

-- ============================================================================
-- 5. CITAS (el corazón del sistema)
-- ============================================================================

create type appointment_status as enum (
  'draft',
  'pending_provider_approval',  -- cliente solicitó, espera proveedor
  'pending_client_approval',    -- proveedor agendó, espera cliente
  'confirmed',                  -- ambas partes aceptaron
  'rescheduled',                -- movida, requiere reconfirmación
  'cancelled',
  'attended',                   -- servicio realizado
  'no_show'                     -- cliente no llegó
);

create type appointment_initiator as enum ('client', 'provider', 'admin');
create type appointment_canceller as enum ('client', 'provider', 'system');

create table public.appointments (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,

  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null check (scheduled_end > scheduled_start),

  status appointment_status not null default 'draft',
  initiated_by appointment_initiator not null,

  -- TTL del estado pending_*: si pasa de aquí sin aprobación, se cancela
  approval_deadline timestamptz,

  -- Walk-in: el proveedor agenda con un cliente que está en el local.
  -- Bypassa la doble confirmación, va directo a 'confirmed'.
  is_walk_in boolean not null default false,

  -- Notas. Ambas partes ven ambas (excepto en multi-rol futuro).
  client_notes text,
  provider_notes text,

  cancellation_reason text,
  cancelled_by appointment_canceller,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_provider_start on public.appointments(provider_account_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_appointments_client on public.appointments(client_id, scheduled_start desc);
CREATE INDEX IF NOT EXISTS idx_appointments_status on public.appointments(status, approval_deadline)
  where status in ('pending_provider_approval', 'pending_client_approval');
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming on public.appointments(provider_account_id, scheduled_start)
  where status in ('confirmed', 'pending_provider_approval', 'pending_client_approval');

-- Constraint crítico: no se solapan dos citas activas del mismo proveedor.
-- A nivel DB, no en código de aplicación. Es la única forma de prevenir
-- race conditions de verdad.
alter table public.appointments add constraint no_overlapping_appointments
  exclude using gist (
    provider_account_id with =,
    tstzrange(scheduled_start, scheduled_end, '[)') with &&
  )
  where (status in ('confirmed', 'pending_provider_approval', 'pending_client_approval', 'rescheduled'));

-- Servicios incluidos en la cita (multi-servicio).
-- Snapshot de duración y precio al momento de agendar.
create table public.appointment_services (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,

  duration_minutes_snapshot int not null,
  price_snapshot numeric(10, 2),
  display_order int not null default 0,

  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_appt_services_appointment on public.appointment_services(appointment_id);

-- Auditoría inmutable de cambios de estado de la cita.
create table public.appointment_history (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,

  from_status appointment_status,
  to_status appointment_status not null,
  changed_by_user_id uuid,             -- auth.users.id
  reason text,
  metadata jsonb not null default '{}',

  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_appt_history_appointment on public.appointment_history(appointment_id, created_at desc);

-- ============================================================================
-- 6. LISTA DE ESPERA
-- ============================================================================

create type waitlist_status as enum (
  'waiting',         -- esperando que se libere slot
  'notified',        -- se le ofreció un slot, en TTL
  'converted',       -- aceptó la oferta, se creó cita
  'expired',         -- no respondió a tiempo
  'cancelled'        -- el cliente canceló su entrada
);

create table public.waitlist_entries (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,

  desired_date date not null,
  desired_time_start time,                -- null = cualquier hora del día
  desired_time_end time,
  service_ids uuid[] not null,            -- servicios que quiere, array de FKs

  priority int not null default 0,        -- mayor = más prioridad
  status waitlist_status not null default 'waiting',

  -- Cuando se le ofreció un slot
  notified_at timestamptz,
  notification_expires_at timestamptz,    -- TTL para confirmar
  offered_appointment_id uuid references public.appointments(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_provider_date on public.waitlist_entries(provider_account_id, desired_date)
  where status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_waitlist_notified on public.waitlist_entries(notification_expires_at)
  where status = 'notified';

-- ============================================================================
-- 7. RESEÑAS
-- ============================================================================

create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,

  rating int not null check (rating between 1 and 5),
  comment text,

  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_provider on public.reviews(provider_account_id, created_at desc);

-- ============================================================================
-- 8. NOTIFICACIONES
-- ============================================================================

create type notification_type as enum (
  'appointment_request',
  'appointment_confirmed',
  'appointment_rejected',
  'appointment_cancelled',
  'appointment_rescheduled',
  'reminder_24h',
  'reminder_1h',
  'waitlist_offer',
  'subscription_expiring_7d',
  'subscription_expiring_3d',
  'subscription_expiring_1d',
  'subscription_expired',
  'subscription_reactivated'
);

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,

  type notification_type not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}',  -- appointment_id, etc.

  read_at timestamptz,
  delivered_via_push boolean not null default false,
  delivered_via_email boolean not null default false,

  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient on public.notifications(recipient_user_id, created_at desc);
CREATE INDEX IF NOT EXISTS idx_notifications_unread on public.notifications(recipient_user_id) where read_at is null;

-- Suscripciones a Web Push (un usuario puede tener varias, una por dispositivo)
create table public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,

  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user on public.push_subscriptions(user_id);

-- ============================================================================
-- 9. TRIGGERS DE AUDITORÍA Y UTILIDAD
-- ============================================================================

-- updated_at automático en tablas relevantes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_provider_accounts_updated before update on public.provider_accounts
  for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();
create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger trg_waitlist_updated before update on public.waitlist_entries
  for each row execute function public.set_updated_at();

-- Registrar automáticamente en appointment_history al cambiar status
create or replace function public.log_appointment_status_change()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into public.appointment_history (appointment_id, from_status, to_status, changed_by_user_id)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_appointments_history after update of status on public.appointments
  for each row execute function public.log_appointment_status_change();

-- Crear suscripción trial automáticamente al crear provider_account
create or replace function public.create_trial_subscription()
returns trigger language plpgsql as $$
begin
  insert into public.subscriptions (
    provider_account_id, status, trial_ends_at, current_period_end, total_days_granted
  ) values (
    new.id, 'trial', now() + interval '14 days', now() + interval '14 days', 14
  );

  insert into public.subscription_events (subscription_id, event_type, days_added, new_period_end)
  select id, 'trial_started', 14, current_period_end
  from public.subscriptions where provider_account_id = new.id;

  return new;
end;
$$;

create trigger trg_provider_accounts_trial after insert on public.provider_accounts
  for each row execute function public.create_trial_subscription();

-- ============================================================================
-- 10. FUNCIONES HELPER PARA RLS
-- ============================================================================

-- ¿El usuario actual es el dueño de este provider_account?
create or replace function public.is_account_owner(p_provider_account_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.provider_accounts
    where id = p_provider_account_id and auth_user_id = auth.uid()
  );
$$;

-- ¿La suscripción del provider está activa o en trial? (no expired/cancelled)
create or replace function public.is_subscription_active(p_provider_account_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.subscriptions
    where provider_account_id = p_provider_account_id
      and status in ('trial', 'active', 'expiring_soon')
      and current_period_end > now()
  );
$$;

-- ¿El usuario es super admin?
create or replace function public.is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.super_admins
    where auth_user_id = auth.uid() and is_active = true
  );
$$;

-- ¿El usuario actual es un cliente del provider?
create or replace function public.is_client_of_provider(p_provider_account_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.clients
    where provider_account_id = p_provider_account_id and auth_user_id = auth.uid()
  );
$$;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Habilitar RLS en todas las tablas con datos de tenant

alter table public.provider_accounts    enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.subscription_events  enable row level security;
alter table public.super_admins         enable row level security;
alter table public.clients              enable row level security;
alter table public.services             enable row level security;
alter table public.weekly_availability  enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.appointments         enable row level security;
alter table public.appointment_services enable row level security;
alter table public.appointment_history  enable row level security;
alter table public.waitlist_entries     enable row level security;
alter table public.reviews              enable row level security;
alter table public.notifications        enable row level security;
alter table public.push_subscriptions   enable row level security;

-- ----------------------------------------------------------------------------
-- provider_accounts: el dueño ve y edita lo suyo. Super admin ve todo.
-- ----------------------------------------------------------------------------
create policy provider_owns_account on public.provider_accounts
  for all to authenticated
  using (auth_user_id = auth.uid() or public.is_super_admin())
  with check (auth_user_id = auth.uid() or public.is_super_admin());

-- Clientes pueden VER providers (vista pública) pero solo lectura básica.
-- Esta policy se complementa con una vista pública para limitar columnas.

-- ----------------------------------------------------------------------------
-- subscriptions: solo el dueño y super admins. Solo super admins escriben.
-- ----------------------------------------------------------------------------
create policy subscription_read on public.subscriptions
  for select to authenticated
  using (public.is_account_owner(provider_account_id) or public.is_super_admin());

create policy subscription_write on public.subscriptions
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- subscription_events: solo lectura para el dueño, solo super admin escribe.
-- ----------------------------------------------------------------------------
create policy sub_events_read on public.subscription_events
  for select to authenticated
  using (
    public.is_super_admin() or
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_events.subscription_id
        and public.is_account_owner(s.provider_account_id)
    )
  );

create policy sub_events_write on public.subscription_events
  for insert to authenticated
  with check (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- super_admins: solo super admins ven y manejan esto.
-- ----------------------------------------------------------------------------
create policy super_admins_self on public.super_admins
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- clients: dueño ve y maneja todos sus clientes. Cliente registrado se ve a sí mismo.
-- ----------------------------------------------------------------------------
create policy clients_provider_full_access on public.clients
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

create policy clients_self_read on public.clients
  for select to authenticated
  using (auth_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- services: dueño full, cualquiera autenticado puede leer activos.
-- (los clientes necesitan ver el catálogo para agendar)
-- ----------------------------------------------------------------------------
create policy services_provider_full_access on public.services
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

create policy services_public_read on public.services
  for select to authenticated
  using (is_active = true);

-- ----------------------------------------------------------------------------
-- weekly_availability + availability_overrides: dueño full, otros solo lectura.
-- ----------------------------------------------------------------------------
create policy availability_provider_full on public.weekly_availability
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

create policy availability_public_read on public.weekly_availability
  for select to authenticated using (is_active = true);

create policy overrides_provider_full on public.availability_overrides
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

create policy overrides_public_read on public.availability_overrides
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- appointments: clave del modelo. Dueño ve todas sus citas.
-- Cliente ve solo las suyas. Inserción exige suscripción activa.
-- ----------------------------------------------------------------------------
create policy appointments_provider_access on public.appointments
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (
    public.is_account_owner(provider_account_id)
    and public.is_subscription_active(provider_account_id)
  );

create policy appointments_client_read on public.appointments
  for select to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = appointments.client_id and c.auth_user_id = auth.uid()
    )
  );

-- Cliente puede crear cita (solicitarla) si la suscripción del proveedor está activa
create policy appointments_client_insert on public.appointments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_id and c.auth_user_id = auth.uid()
    )
    and public.is_subscription_active(provider_account_id)
  );

-- Cliente puede actualizar SU cita (para cancelar o aceptar)
create policy appointments_client_update on public.appointments
  for update to authenticated
  using (
    exists (
      select 1 from public.clients c
      where c.id = appointments.client_id and c.auth_user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- appointment_services: misma lógica que appointments
-- ----------------------------------------------------------------------------
create policy appt_services_via_appointment on public.appointment_services
  for all to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
        and (
          public.is_account_owner(a.provider_account_id)
          or exists (select 1 from public.clients c where c.id = a.client_id and c.auth_user_id = auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
        and (
          public.is_account_owner(a.provider_account_id)
          or exists (select 1 from public.clients c where c.id = a.client_id and c.auth_user_id = auth.uid())
        )
    )
  );

-- ----------------------------------------------------------------------------
-- appointment_history: solo lectura. Triggers escriben con security definer.
-- ----------------------------------------------------------------------------
create policy appt_history_read on public.appointment_history
  for select to authenticated
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_history.appointment_id
        and (
          public.is_account_owner(a.provider_account_id)
          or exists (select 1 from public.clients c where c.id = a.client_id and c.auth_user_id = auth.uid())
        )
    )
  );

-- ----------------------------------------------------------------------------
-- waitlist_entries: dueño ve todas, cliente solo las suyas
-- ----------------------------------------------------------------------------
create policy waitlist_provider_full on public.waitlist_entries
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

create policy waitlist_client_own on public.waitlist_entries
  for all to authenticated
  using (
    exists (select 1 from public.clients c where c.id = client_id and c.auth_user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.clients c where c.id = client_id and c.auth_user_id = auth.uid())
    and public.is_subscription_active(provider_account_id)
  );

-- ----------------------------------------------------------------------------
-- reviews: cliente crea, ambos ven
-- ----------------------------------------------------------------------------
create policy reviews_read on public.reviews
  for select to authenticated
  using (
    public.is_account_owner(provider_account_id)
    or exists (select 1 from public.clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );

create policy reviews_client_insert on public.reviews
  for insert to authenticated
  with check (
    exists (select 1 from public.clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- notifications + push_subscriptions: cada usuario ve solo lo suyo
-- ----------------------------------------------------------------------------
create policy notifications_own on public.notifications
  for all to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

create policy push_subscriptions_own on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- 12. JOBS PROGRAMADOS (pg_cron)
-- ============================================================================
-- Estos se ejecutan dentro de Postgres. Para tareas más complejas o que
-- necesiten llamar APIs externas (push, email), usar Supabase Edge Functions
-- programadas y dejar que ESTAS llamen funciones SQL.

-- Marcar suscripciones expiradas: corre cada hora
select cron.schedule(
  'expire-subscriptions',
  '0 * * * *',
  $$
    update public.subscriptions
    set status = 'expired'
    where status in ('active', 'expiring_soon', 'trial')
      and current_period_end <= now();

    insert into public.subscription_events (subscription_id, event_type, previous_period_end, new_period_end)
    select id, 'expired_auto', current_period_end, current_period_end
    from public.subscriptions
    where status = 'expired'
      and not exists (
        select 1 from public.subscription_events e
        where e.subscription_id = subscriptions.id
          and e.event_type = 'expired_auto'
          and e.created_at > now() - interval '1 hour'
      );
  $$
);

-- Marcar como expiring_soon las que tienen ≤7 días: corre cada hora
select cron.schedule(
  'mark-expiring-soon',
  '15 * * * *',
  $$
    update public.subscriptions
    set status = 'expiring_soon'
    where status in ('active', 'trial')
      and current_period_end > now()
      and current_period_end <= now() + interval '7 days';
  $$
);

-- Cancelar citas pending_* cuyo TTL expiró: corre cada 5 minutos
select cron.schedule(
  'expire-pending-appointments',
  '*/5 * * * *',
  $$
    update public.appointments
    set status = 'cancelled',
        cancelled_by = 'system',
        cancellation_reason = 'approval_timeout',
        cancelled_at = now()
    where status in ('pending_provider_approval', 'pending_client_approval')
      and approval_deadline is not null
      and approval_deadline < now();
  $$
);

-- Expirar ofertas de lista de espera no respondidas: corre cada minuto
select cron.schedule(
  'expire-waitlist-offers',
  '* * * * *',
  $$
    update public.waitlist_entries
    set status = 'expired'
    where status = 'notified'
      and notification_expires_at < now();
  $$
);

-- ============================================================================
-- FIN DEL MIGRATION INICIAL
-- ============================================================================


