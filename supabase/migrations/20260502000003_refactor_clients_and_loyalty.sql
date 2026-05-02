-- ============================================================================
-- Migration 003: Refactor de clients a profiles+links, sistema de fidelización
-- con 4 mecánicas predefinidas, favoritos y promociones temporales.
-- ============================================================================
-- Asume que 001_initial_schema.sql y 002_invitations_and_directory_basics.sql
-- ya fueron ejecutados.
-- ============================================================================

-- ============================================================================
-- PARTE 1: REFACTOR DE CLIENTS
-- ============================================================================
-- La tabla "clients" original mezclaba dos conceptos:
--   1. La persona (Juan, su nombre, teléfono, email, fecha de nacimiento)
--   2. La relación de esa persona con un barbero específico (notas internas, etc.)
-- Esto causaba duplicación cuando Juan iba con múltiples barberos.
--
-- Refactor:
--   - client_profiles: la persona única (1:1 con auth.users si está registrado)
--   - client_provider_links: relación cliente↔barbero (1:N)
--
-- Como el migration 001 creó "clients" con FKs desde appointments y waitlist,
-- preservamos compatibilidad: clients ahora es una VISTA mantenible para
-- minimizar el daño al código existente, y migramos progresivamente.
--
-- Para un sistema en desarrollo (sin datos en producción aún), la estrategia
-- es: crear las nuevas tablas, mover las FKs, y dropear "clients" original.
-- ============================================================================

-- Nueva tabla: client_profiles (la persona)
create table public.client_profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete set null,

  -- Datos personales únicos
  first_name text not null,
  last_name text,
  phone text,
  whatsapp text,
  email text,
  avatar_url text,
  birth_date date,                       -- para birthday_bonus

  -- Indica si el cliente alguna vez se autenticó (vs creado solo por barberos)
  is_registered boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_client_profiles_auth_user on public.client_profiles(auth_user_id) where auth_user_id is not null;
CREATE INDEX IF NOT EXISTS idx_client_profiles_phone on public.client_profiles(phone) where phone is not null;
CREATE INDEX IF NOT EXISTS idx_client_profiles_email on public.client_profiles(email) where email is not null;
CREATE INDEX IF NOT EXISTS idx_client_profiles_birth_month on public.client_profiles(extract(month from birth_date)) where birth_date is not null;

create trigger trg_client_profiles_updated before update on public.client_profiles
  for each row execute function public.set_updated_at();

-- Nueva tabla: client_provider_links (relación cliente↔barbero)
create table public.client_provider_links (
  id uuid primary key default uuid_generate_v4(),
  client_profile_id uuid not null references public.client_profiles(id) on delete cascade,
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,

  -- Notas internas del barbero sobre este cliente. Privadas, solo el barbero las ve.
  internal_notes text,

  -- Origen de esta relación
  source client_source not null default 'self_registration',

  -- Si el cliente quiere recibir recordatorios por WhatsApp de ESTE barbero
  whatsapp_reminders_enabled boolean not null default true,

  -- Stats que mantenemos para queries rápidas (mantenidas por triggers)
  total_appointments int not null default 0,
  total_attended int not null default 0,
  total_no_show int not null default 0,
  last_appointment_at timestamptz,
  first_appointment_at timestamptz,

  -- Si el cliente fue convertido (era cliente fantasma y luego aceptó invitación)
  converted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (client_profile_id, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_cpl_client on public.client_provider_links(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_cpl_provider on public.client_provider_links(provider_account_id);

create trigger trg_cpl_updated before update on public.client_provider_links
  for each row execute function public.set_updated_at();

-- ============================================================================
-- PARTE 2: MIGRAR REFERENCIAS DESDE TABLAS QUE USABAN clients
-- ============================================================================
-- Cambiamos appointments, waitlist_entries, reviews, appointment_invitations
-- y reminder_tasks para apuntar a client_provider_links en vez de clients.
--
-- IMPORTANTE: si ya tienes datos en producción, esto requiere data migration.
-- Aquí asumimos que estás en desarrollo y la tabla está vacía.
-- ============================================================================

-- Drop FKs que apuntaban a clients
alter table public.appointments drop constraint if exists appointments_client_id_fkey;
alter table public.waitlist_entries drop constraint if exists waitlist_entries_client_id_fkey;
alter table public.reviews drop constraint if exists reviews_client_id_fkey;
alter table public.appointment_invitations drop constraint if exists appointment_invitations_client_id_fkey;
alter table public.reminder_tasks drop constraint if exists reminder_tasks_client_id_fkey;

-- Renombrar columnas: client_id pasa a referirse a client_provider_link_id
alter table public.appointments rename column client_id to client_provider_link_id;
alter table public.waitlist_entries rename column client_id to client_provider_link_id;
alter table public.reviews rename column client_id to client_provider_link_id;
alter table public.appointment_invitations rename column client_id to client_provider_link_id;
alter table public.reminder_tasks rename column client_id to client_provider_link_id;

-- Crear las nuevas FKs
alter table public.appointments
  add constraint appointments_link_fkey
  foreign key (client_provider_link_id) references public.client_provider_links(id) on delete restrict;

alter table public.waitlist_entries
  add constraint waitlist_entries_link_fkey
  foreign key (client_provider_link_id) references public.client_provider_links(id) on delete cascade;

alter table public.reviews
  add constraint reviews_link_fkey
  foreign key (client_provider_link_id) references public.client_provider_links(id) on delete cascade;

alter table public.appointment_invitations
  add constraint appointment_invitations_link_fkey
  foreign key (client_provider_link_id) references public.client_provider_links(id) on delete cascade;

alter table public.reminder_tasks
  add constraint reminder_tasks_link_fkey
  foreign key (client_provider_link_id) references public.client_provider_links(id) on delete cascade;

-- Ya no necesitamos la tabla clients original
drop table if exists public.clients cascade;

-- Eliminar el DEFAULT constraint que referencia el enum antes de operaciones de tipo
alter table public.client_provider_links alter column source drop default;

-- Convertir columna a text temporalmente antes de dropear el tipo
alter table public.client_provider_links alter column source type text;

-- Dropear el enum sin cascade
drop type if exists client_source;

-- Recrear el enum client_source
create type client_source as enum (
  'self_registration',
  'manual_creation',
  'invitation_accepted',
  'imported'
);

-- Volver a aplicar el enum a client_provider_links
alter table public.client_provider_links alter column source type client_source using source::client_source;

-- Restaurar el DEFAULT constraint
alter table public.client_provider_links alter column source set default 'self_registration';

-- ============================================================================
-- PARTE 3: ACTUALIZAR FUNCIONES Y POLICIES QUE REFERENCIABAN clients
-- ============================================================================

-- Helper: verificar si el usuario actual es el cliente detrás de un link
create or replace function public.is_client_of_link(p_link_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.client_provider_links cpl
    join public.client_profiles cp on cp.id = cpl.client_profile_id
    where cpl.id = p_link_id and cp.auth_user_id = auth.uid()
  );
$$;

-- ============================================================================
-- PARTE 4: SISTEMA DE FIDELIZACIÓN
-- ============================================================================

-- Las 4 mecánicas predefinidas en MVP
create type loyalty_mechanic as enum (
  'punch_card',           -- "Cada N cortes, uno gratis o con descuento"
  'nth_visit_discount',   -- "Tu visita N tiene X% descuento"
  'birthday_bonus',       -- "Descuento en el mes/semana de tu cumpleaños"
  'time_limited_promo'    -- "Esta semana: 30% en cortes" (promo abierta a todos)
);

create type reward_type as enum (
  'free_service',         -- servicio gratis (de los aplicables)
  'percentage_discount',  -- % de descuento sobre el precio
  'fixed_discount'        -- monto fijo de descuento
);

-- Programas de fidelización (un barbero puede tener varios activos)
create table public.loyalty_programs (
  id uuid primary key default uuid_generate_v4(),
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,

  name text not null,                              -- "10x1 en cortes"
  description text,                                -- texto que ve el cliente
  mechanic loyalty_mechanic not null,

  -- Configuración específica de la mecánica (JSONB porque cada una es distinta)
  -- punch_card: { stamps_required, reward_type, reward_value? }
  -- nth_visit_discount: { trigger_visit, discount_type, discount_value, recurring }
  -- birthday_bonus: { validity_days_before, validity_days_after, discount_type, discount_value }
  -- time_limited_promo: { discount_type, discount_value, max_uses_per_client? }
  config jsonb not null default '{}',

  -- A qué servicios aplica (null = todos)
  applicable_service_ids uuid[],

  -- Vigencia del programa (null = sin fecha de fin)
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,

  -- Términos y condiciones libres
  terms text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_programs_provider on public.loyalty_programs(provider_account_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_active on public.loyalty_programs(provider_account_id, is_active)
  where is_active = true;
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_mechanic on public.loyalty_programs(provider_account_id, mechanic);

create trigger trg_loyalty_programs_updated before update on public.loyalty_programs
  for each row execute function public.set_updated_at();

-- Progreso del cliente en cada programa (por link, no por profile, porque los
-- programas son del barbero específico)
create table public.loyalty_progress (
  id uuid primary key default uuid_generate_v4(),
  loyalty_program_id uuid not null references public.loyalty_programs(id) on delete cascade,
  client_provider_link_id uuid not null references public.client_provider_links(id) on delete cascade,

  -- Progreso actual: para punch_card es número de sellos, para nth_visit es número de visita
  current_value int not null default 0,

  -- Recompensas ganadas y canjeadas (acumulado histórico)
  rewards_earned int not null default 0,
  rewards_redeemed int not null default 0,

  -- Última actualización del progreso
  last_progress_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (loyalty_program_id, client_provider_link_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_progress_link on public.loyalty_progress(client_provider_link_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_progress_program on public.loyalty_progress(loyalty_program_id);

create trigger trg_loyalty_progress_updated before update on public.loyalty_progress
  for each row execute function public.set_updated_at();

-- Recompensas disponibles para canjear (cuando el cliente cumple el progreso)
create type reward_status as enum (
  'available',     -- ganada, lista para canjear
  'reserved',      -- aplicada a una cita pero la cita aún no fue atendida
  'redeemed',      -- canjeada (cita atendida usando esta recompensa)
  'expired',       -- venció sin canjear
  'cancelled'      -- el barbero la canceló manualmente
);

create table public.loyalty_rewards (
  id uuid primary key default uuid_generate_v4(),
  loyalty_program_id uuid not null references public.loyalty_programs(id) on delete cascade,
  client_provider_link_id uuid not null references public.client_provider_links(id) on delete cascade,

  -- Snapshot del tipo de recompensa al momento de ganarla
  reward_type reward_type not null,
  reward_value numeric(10, 2),               -- null si es free_service

  status reward_status not null default 'available',

  -- Si se aplicó a una cita
  applied_to_appointment_id uuid references public.appointments(id) on delete set null,

  -- Vigencia (null = sin caducidad)
  expires_at timestamptz,

  earned_at timestamptz not null default now(),
  redeemed_at timestamptz,

  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_rewards_link_available on public.loyalty_rewards(client_provider_link_id, status)
  where status = 'available';
CREATE INDEX IF NOT EXISTS idx_rewards_program on public.loyalty_rewards(loyalty_program_id);
CREATE INDEX IF NOT EXISTS idx_rewards_appointment on public.loyalty_rewards(applied_to_appointment_id)
  where applied_to_appointment_id is not null;

-- Cuando una cita se aplica una recompensa, registrar la relación en appointments
alter table public.appointments add column if not exists applied_reward_id uuid
  references public.loyalty_rewards(id) on delete set null;

-- ============================================================================
-- PARTE 5: FAVORITOS DEL CLIENTE
-- ============================================================================

create table public.favorite_providers (
  id uuid primary key default uuid_generate_v4(),
  client_profile_id uuid not null references public.client_profiles(id) on delete cascade,
  provider_account_id uuid not null references public.provider_accounts(id) on delete cascade,

  created_at timestamptz not null default now(),

  unique (client_profile_id, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_client on public.favorite_providers(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_provider on public.favorite_providers(provider_account_id);

-- ============================================================================
-- PARTE 6: TRIGGER QUE ACTUALIZA PROGRESO Y STATS AL ATENDERSE UNA CITA
-- ============================================================================

create or replace function public.update_progress_on_attended()
returns trigger language plpgsql as $$
declare
  v_program record;
  v_progress_id uuid;
  v_current int;
  v_link record;
  v_appointment_service_ids uuid[];
  v_should_count boolean;
  v_stamps_required int;
  v_birth_month int;
  v_birth_day int;
  v_today_month int;
  v_today_day int;
  v_validity_before int;
  v_validity_after int;
begin
  -- Solo procesar al pasar a 'attended'
  if old.status = 'attended' or new.status != 'attended' then
    return new;
  end if;

  -- Obtener el link y datos del cliente
  select cpl.*, cp.birth_date
  into v_link
  from public.client_provider_links cpl
  join public.client_profiles cp on cp.id = cpl.client_profile_id
  where cpl.id = new.client_provider_link_id;

  -- Actualizar stats del link
  update public.client_provider_links
  set total_appointments = total_appointments + 1,
      total_attended = total_attended + 1,
      last_appointment_at = new.scheduled_start,
      first_appointment_at = coalesce(first_appointment_at, new.scheduled_start)
  where id = new.client_provider_link_id;

  -- Obtener los servicios incluidos en esta cita
  select array_agg(service_id) into v_appointment_service_ids
  from public.appointment_services
  where appointment_id = new.id;

  -- Iterar por cada programa activo del barbero
  for v_program in
    select * from public.loyalty_programs
    where provider_account_id = new.provider_account_id
      and is_active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
  loop
    -- Verificar si la cita aplica al programa (servicios)
    v_should_count := true;
    if v_program.applicable_service_ids is not null and array_length(v_program.applicable_service_ids, 1) > 0 then
      v_should_count := v_appointment_service_ids && v_program.applicable_service_ids;
    end if;

    if not v_should_count then
      continue;
    end if;

    -- Obtener o crear el progress de este programa para este link
    insert into public.loyalty_progress (loyalty_program_id, client_provider_link_id, current_value)
    values (v_program.id, new.client_provider_link_id, 0)
    on conflict (loyalty_program_id, client_provider_link_id) do nothing;

    select id, current_value into v_progress_id, v_current
    from public.loyalty_progress
    where loyalty_program_id = v_program.id and client_provider_link_id = new.client_provider_link_id;

    -- Lógica por mecánica
    if v_program.mechanic = 'punch_card' then
      v_stamps_required := (v_program.config->>'stamps_required')::int;
      v_current := v_current + 1;

      update public.loyalty_progress
      set current_value = v_current, last_progress_at = now()
      where id = v_progress_id;

      -- Si completó los sellos, generar recompensa
      if v_current >= v_stamps_required then
        insert into public.loyalty_rewards (
          loyalty_program_id, client_provider_link_id, reward_type, reward_value,
          expires_at
        ) values (
          v_program.id, new.client_provider_link_id,
          (v_program.config->>'reward_type')::reward_type,
          nullif(v_program.config->>'reward_value', '')::numeric,
          now() + interval '90 days'  -- 3 meses para canjear, configurable a futuro
        );

        -- Reset del contador
        update public.loyalty_progress
        set current_value = 0,
            rewards_earned = rewards_earned + 1
        where id = v_progress_id;
      end if;

    elsif v_program.mechanic = 'nth_visit_discount' then
      v_current := v_current + 1;

      update public.loyalty_progress
      set current_value = v_current, last_progress_at = now()
      where id = v_progress_id;

      -- La recompensa para nth_visit_discount se otorga ANTES de la cita
      -- (el cliente la ve disponible al ir a agendar). Esto se maneja en otra
      -- función que se llama al momento de calcular precio. No genera reward
      -- automático aquí porque ya se aplicó.

    end if;
    -- birthday_bonus y time_limited_promo no actualizan progreso al atender,
    -- son evaluados al momento de agendar (función aparte)
  end loop;

  return new;
end;
$$;

create trigger trg_appointments_loyalty_progress
  after update of status on public.appointments
  for each row execute function public.update_progress_on_attended();

-- También actualizar stats en cancelaciones / no_show
create or replace function public.update_stats_on_no_show_or_cancel()
returns trigger language plpgsql as $$
begin
  if new.status = 'no_show' and old.status != 'no_show' then
    update public.client_provider_links
    set total_appointments = total_appointments + 1,
        total_no_show = total_no_show + 1
    where id = new.client_provider_link_id;
  end if;
  return new;
end;
$$;

create trigger trg_appointments_stats_no_show
  after update of status on public.appointments
  for each row execute function public.update_stats_on_no_show_or_cancel();

-- ============================================================================
-- PARTE 7: RLS PARA NUEVAS TABLAS
-- ============================================================================

alter table public.client_profiles enable row level security;
alter table public.client_provider_links enable row level security;
alter table public.loyalty_programs enable row level security;
alter table public.loyalty_progress enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.favorite_providers enable row level security;

-- client_profiles: el cliente ve y maneja su propio profile.
-- Los barberos NO ven el profile completo, solo ven el link.
create policy client_profiles_self on public.client_profiles
  for all to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Los barberos pueden LEER los profiles de sus clientes vía link
create policy client_profiles_provider_read on public.client_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.client_provider_links cpl
      where cpl.client_profile_id = client_profiles.id
        and public.is_account_owner(cpl.provider_account_id)
    )
  );

-- Los barberos pueden CREAR profiles para clientes fantasma (sin auth_user_id)
create policy client_profiles_provider_create on public.client_profiles
  for insert to authenticated
  with check (auth_user_id is null);

-- client_provider_links: barbero ve todos sus links, cliente ve los suyos
create policy cpl_provider_full on public.client_provider_links
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

create policy cpl_client_read on public.client_provider_links
  for select to authenticated
  using (
    exists (
      select 1 from public.client_profiles cp
      where cp.id = client_provider_links.client_profile_id
        and cp.auth_user_id = auth.uid()
    )
  );

-- loyalty_programs: barbero CRUD, cualquier cliente autenticado puede leer activos
create policy loyalty_programs_provider on public.loyalty_programs
  for all to authenticated
  using (public.is_account_owner(provider_account_id))
  with check (public.is_account_owner(provider_account_id));

create policy loyalty_programs_public_read on public.loyalty_programs
  for select to authenticated
  using (is_active = true);

-- loyalty_progress: barbero ve los de sus clientes, cliente ve los suyos
create policy loyalty_progress_provider on public.loyalty_progress
  for select to authenticated
  using (
    exists (
      select 1 from public.client_provider_links cpl
      where cpl.id = loyalty_progress.client_provider_link_id
        and public.is_account_owner(cpl.provider_account_id)
    )
  );

create policy loyalty_progress_client on public.loyalty_progress
  for select to authenticated
  using (public.is_client_of_link(client_provider_link_id));

-- loyalty_rewards: barbero CRUD (puede cancelar/ajustar), cliente solo lee
create policy loyalty_rewards_provider on public.loyalty_rewards
  for all to authenticated
  using (
    exists (
      select 1 from public.client_provider_links cpl
      where cpl.id = loyalty_rewards.client_provider_link_id
        and public.is_account_owner(cpl.provider_account_id)
    )
  )
  with check (
    exists (
      select 1 from public.client_provider_links cpl
      where cpl.id = loyalty_rewards.client_provider_link_id
        and public.is_account_owner(cpl.provider_account_id)
    )
  );

create policy loyalty_rewards_client_read on public.loyalty_rewards
  for select to authenticated
  using (public.is_client_of_link(client_provider_link_id));

-- favorite_providers: solo el cliente
create policy favorites_self on public.favorite_providers
  for all to authenticated
  using (
    exists (
      select 1 from public.client_profiles cp
      where cp.id = favorite_providers.client_profile_id and cp.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_profiles cp
      where cp.id = favorite_providers.client_profile_id and cp.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 8: JOB pg_cron PARA EXPIRAR REWARDS Y EVALUAR BIRTHDAY BONUS
-- ============================================================================

-- Expirar rewards no canjeadas
select cron.schedule(
  'expire-loyalty-rewards',
  '0 2 * * *',  -- todos los días a las 2am
  $$
    update public.loyalty_rewards
    set status = 'expired'
    where status = 'available'
      and expires_at is not null
      and expires_at < now();
  $$
);

-- Generar rewards de cumpleaños el primer día del mes para clientes que cumplan ese mes
-- (solo para programas birthday_bonus activos)
select cron.schedule(
  'birthday-bonus-generator',
  '0 6 1 * *',  -- día 1 de cada mes a las 6am
  $$
    insert into public.loyalty_rewards (
      loyalty_program_id, client_provider_link_id, reward_type, reward_value, expires_at
    )
    select distinct
      lp.id,
      cpl.id,
      (lp.config->>'discount_type')::reward_type,
      (lp.config->>'discount_value')::numeric,
      now() + ((lp.config->>'validity_days_after')::int || ' days')::interval
    from public.loyalty_programs lp
    join public.client_provider_links cpl on cpl.provider_account_id = lp.provider_account_id
    join public.client_profiles cp on cp.id = cpl.client_profile_id
    where lp.mechanic = 'birthday_bonus'
      and lp.is_active = true
      and (lp.ends_at is null or lp.ends_at > now())
      and cp.birth_date is not null
      and extract(month from cp.birth_date) = extract(month from now())
      and not exists (
        select 1 from public.loyalty_rewards lr
        where lr.loyalty_program_id = lp.id
          and lr.client_provider_link_id = cpl.id
          and lr.earned_at > date_trunc('year', now())
      );
  $$
);

-- ============================================================================
-- FIN MIGRATION 003
-- ============================================================================


