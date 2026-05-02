# Sistema de Agendamiento + Fidelización para Profesionales de Servicios

> **Briefing único del proyecto** · Use este documento para iniciar nuevas conversaciones de IA o pasarlo a desarrolladores. Reemplaza toda la conversación de planeación.

---

## 1. Resumen del producto en 30 segundos

**Qué es:** Aplicación web progresiva (PWA) tipo SaaS donde profesionales de servicios (barberos, manicuristas, masajistas) gestionan su agenda y clientela. Una instancia de software por vertical (un dominio para barberos, otro para manicuristas, etc.). Cada profesional dentro de la instancia tiene su cuenta independiente con suscripción manual.

**Para quién:**
- **Profesionales independientes** que quieren digitalizar su agenda y construir lealtad de clientes.
- **Sus clientes finales** que quieren agendar fácil y acumular beneficios.

**Diferenciadores:**
- Coordinación dual: el cliente elige entre agendar en la app (con doble confirmación) o por WhatsApp directo.
- Cita manual con invitación: el barbero crea citas para clientes sin app, opcionalmente con link mágico que los registra al confirmar.
- Recordatorios manuales asistidos: el sistema prepara mensajes de WhatsApp listos y el barbero los envía con un tap (cero costo de API).
- Programa de fidelización con 4 mecánicas predefinidas (sello, descuento N-ésima visita, cumpleaños, promo temporal).
- Cuenta única del cliente con historial separado por barbero (privacidad entre profesionales).

**No incluye:** gestión de pagos, flujo de caja, contabilidad ni reportes financieros.

---

## 2. Decisiones arquitectónicas finales

| Aspecto | Decisión |
|---|---|
| Plataforma | PWA (Progressive Web App), no nativa |
| Modelo de negocio | SaaS multi-tenant por vertical, un deploy por tipo de servicio |
| Modelo de cuenta | Profesional individual (Modelo B): un barbero = una cuenta = una suscripción |
| Personalización entre verticales | Solo branding (colores, logo, vocabulario, dominio) |
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui en Vercel |
| Backend / DB / Auth | Supabase (PostgreSQL + Auth + RLS + Edge Functions + Storage) |
| Lógica server-side | Supabase Edge Functions (Deno/TypeScript) |
| Tareas programadas | pg_cron + Edge Functions Scheduled |
| Push notifications | Web Push API + VAPID keys |
| Email | Resend (3K/mes gratis) |
| Errores | Sentry |
| Costo MVP estimado | $0 hasta cierto volumen, ~$45/mes al crecer |

**Suscripciones:**
- 14 días de prueba al registrarse (automático).
- Pago manual: el cliente contacta al equipo, el equipo verifica, extiende días desde panel super admin.
- Vencimiento: cuenta entra en modo lectura (puede ver histórico, no puede crear).
- Recordatorios automáticos: -7, -3 y -1 días antes del vencimiento.

**Aislamiento entre tenants:** Row Level Security (RLS) de PostgreSQL. Imposible que un barbero vea datos de otro a nivel de motor de DB.

---

## 3. Modelo de datos (19 tablas)

### Tablas del SaaS
- `provider_accounts` · cuenta del profesional con datos de negocio, ubicación, plantillas WhatsApp
- `subscriptions` · estado y vencimiento de cada cuenta
- `subscription_events` · auditoría de extensiones, expiraciones
- `super_admins` · equipo de administración global

### Tablas de clientes y catálogo
- `client_profiles` · persona única en la plataforma (1:1 con auth.users)
- `client_provider_links` · relación cliente↔barbero con notas internas y stats
- `favorite_providers` · barberos favoritos del cliente
- `services` · catálogo de servicios del barbero
- `weekly_availability` · horarios semanales recurrentes
- `availability_overrides` · excepciones (vacaciones, días extra)

### Tablas de citas
- `appointments` · citas con constraint EXCLUDE de no-solapamiento
- `appointment_services` · multi-servicio (N servicios por cita)
- `appointment_history` · auditoría inmutable de cambios de estado
- `appointment_invitations` · tokens mágicos para invitar clientes nuevos
- `waitlist_entries` · lista de espera con prioridad y TTL
- `reviews` · reseñas del cliente al barbero
- `reminder_tasks` · tareas WhatsApp pre-armadas para el barbero

### Tablas de fidelización
- `loyalty_programs` · programas con una de las 4 mecánicas, config en JSONB
- `loyalty_progress` · progreso del cliente en cada programa
- `loyalty_rewards` · recompensas ganadas (available/reserved/redeemed/expired)

### Tablas de notificaciones
- `notifications` · bandeja in-app
- `push_subscriptions` · suscripciones Web Push por dispositivo

**Estados de cita:** `draft`, `pending_provider_approval`, `pending_client_approval`, `confirmed`, `rescheduled`, `cancelled`, `attended`, `no_show`.

**Estados de suscripción:** `trial`, `active`, `expiring_soon`, `expired`, `cancelled`.

**Mecánicas de fidelización:** `punch_card`, `nth_visit_discount`, `birthday_bonus`, `time_limited_promo`.

---

## 4. Flujos críticos del producto

### 4.1 Doble confirmación
Cualquier parte puede iniciar una cita pero la otra debe aceptar antes de quedar confirmada.

- Si el **cliente** crea la cita → estado `pending_provider_approval` → el barbero recibe push y aprueba/rechaza dentro de un TTL configurable (default 2 horas).
- Si el **barbero** crea la cita → estado `pending_client_approval` → el cliente recibe push y acepta/rechaza dentro de TTL (default 30 min).
- Si el barbero crea cita para un walk-in (cliente físicamente en el local) → flag `is_walk_in = true` → cita pasa directo a `confirmed`.
- Si TTL expira sin respuesta → cita pasa a `cancelled` con razón `approval_timeout`.

### 4.2 Cita manual con cliente nuevo
El barbero tiene dos sub-caminos al crear cita manual:

- **Cliente fantasma:** el barbero crea la cita con datos del cliente. Cliente no toca la app. Cita confirmada directo. Recordatorios se preparan como `reminder_tasks` para el barbero (envía WhatsApp con un tap).
- **Cliente invitado:** el barbero marca "invitar a la app". Sistema genera token mágico único. Barbero envía link por WhatsApp. Cliente abre link, ve la cita, confirma con un click → queda registrado en la plataforma. Cita pasa a `confirmed`.

### 4.3 Coordinación dual
En el perfil de cada barbero, el cliente ve dos botones:
- **Agendar en la app** (primario, más grande): flujo completo dentro de la plataforma con multi-servicio y selección de slot.
- **Contactar por WhatsApp** (secundario): abre WhatsApp con mensaje pre-cargado configurado por el barbero. Coordinación afuera de la app.

### 4.4 Recordatorios manuales asistidos
Para clientes con cuenta en la app: notificaciones Web Push automáticas a 24h y 1h antes.

Para clientes fantasma: el sistema crea `reminder_tasks` con mensaje pre-armado y URL `wa.me/...?text=...`. El barbero ve estas tareas en su dashboard, hace tap a "Enviar", se abre WhatsApp con el mensaje listo y manda con un click. Costo cero.

### 4.5 Lista de espera
Cuando un horario está ocupado, el cliente puede unirse a la lista. Cuando se libera (cita cancelada o pending expirado), el sistema notifica automáticamente al primero de la lista y le da TTL (default 10 min) para confirmar antes de pasar al siguiente.

### 4.6 Fidelización
Cada barbero crea N programas activos. Las mecánicas:

- **`punch_card`**: "Cada 10 cortes, uno gratis". Sellos se acumulan automáticamente al pasar la cita a `attended` (vía trigger SQL).
- **`nth_visit_discount`**: "Tu 5ta visita tiene 20% off". Recurrente o única vez.
- **`birthday_bonus`**: descuento generado automáticamente el día 1 del mes para clientes que cumplen ese mes (cron job pg_cron).
- **`time_limited_promo`**: descuento por ventana de tiempo, aplicable a todos los clientes registrados.

El cliente ve sus sellos y recompensas dentro del perfil del barbero específico (no hay vista global cross-barbero).

---

## 5. Roles y pantallas principales

### Profesional (barbero)
- Onboarding obligatorio de 5 pasos: datos del negocio, contacto WhatsApp, ubicación con Google Maps, horarios semanales, catálogo inicial.
- Dashboard "Hoy": citas del día, tareas WhatsApp pendientes, solicitudes en bandeja.
- Bandeja de solicitudes pendientes con TTL visible.
- Agenda diaria y semanal.
- CRUD de catálogo de servicios.
- Configuración de horarios y excepciones.
- Crear cita manual (wizard 4 pasos).
- CRUD de programas de fidelización.
- Editor de plantillas de WhatsApp.
- Gestión de "Mis clientes".

### Cliente final
- Directorio público de barberos (visible sin login).
- Perfil del barbero con info pública (foto, ubicación, servicios, rating). Reseñas detalladas y agenda requieren login.
- Solicitar cita con multi-servicio.
- Página pública de invitación (link mágico) para confirmar cita creada por el barbero.
- Mis citas con [Barbero] (historial dentro del perfil de cada barbero).
- Mis sellos y recompensas con [Barbero].
- Favoritos.
- Notificaciones.

### Super admin (equipo del SaaS)
- Dashboard global con métricas (trial / activas / por vencer / vencidas).
- Lista de cuentas con filtros y búsqueda.
- Detalle de cuenta con timeline de eventos de suscripción.
- Acción "Extender suscripción" con presets (+30, +60, +90, +365 días) + nota interna.
- Acción "Cancelar / Reactivar cuenta".

---

## 6. Stack técnico completo

```
Frontend
├── Next.js 14 (App Router)
├── Tailwind CSS + shadcn/ui
├── Zustand (estado UI)
├── TanStack Query (cache servidor)
└── next-pwa (Service Worker, PWA install)

Backend (todo Supabase)
├── PostgreSQL 15 (DB)
├── Supabase Auth (JWT, magic links)
├── Row Level Security (aislamiento multi-tenant)
├── Edge Functions Deno (lógica server-side)
├── pg_cron (jobs programados)
├── Storage (avatares, fotos)
└── btree_gist + uuid-ossp (extensiones)

Servicios externos
├── Vercel (hosting frontend)
├── Resend (email transaccional)
├── Sentry (error tracking)
└── Google Maps Embed (sin API key, vista pública)
```

**Costo estimado:**
- MVP: $0/mes en tiers gratuitos
- Producción 50-100 usuarios: ~$45/mes (Supabase Pro $25 + Vercel Hobby $0 o Pro $20)

---

## 7. Estructura del repositorio sugerida

```
repo/
├── apps/
│   ├── web/              # PWA principal (barberos + clientes)
│   │   ├── app/          # Next.js App Router
│   │   │   ├── (public)/ # Landing, login, registro, directorio
│   │   │   ├── (provider)/ # Dashboard del barbero
│   │   │   ├── (client)/   # Vista del cliente
│   │   │   └── api/        # Route handlers
│   │   ├── components/
│   │   ├── lib/          # Cliente Supabase, helpers
│   │   ├── hooks/
│   │   └── public/
│   │       ├── manifest.json
│   │       └── sw.js
│   │
│   └── admin/            # Panel super admin (separado)
│       └── app/
│
├── packages/
│   ├── ui/               # Componentes shadcn compartidos
│   ├── db/               # Tipos generados de Supabase
│   └── shared/           # Utils, validators (zod)
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_invitations_and_directory_basics.sql
│   │   └── 003_refactor_clients_and_loyalty.sql
│   ├── functions/        # Edge Functions
│   │   ├── send-push/
│   │   ├── send-reminders/
│   │   ├── waitlist-matcher/
│   │   └── magic-link-validator/
│   └── seeds/            # Datos por vertical
│
└── package.json          # Monorepo (pnpm workspaces o turborepo)
```

---

## 8. Roadmap por fases (~14-16 semanas con 1 dev)

| Fase | Duración | Entregable |
|---|---|---|
| 0. Setup | Sem 1 | Monorepo, Supabase + migrations, Vercel deploy, PWA base |
| 1. Auth + onboarding barbero | Sem 2-3 | Registro, wizard 5 pasos, suscripción trial visible |
| 2. Catálogo + disponibilidad | Sem 4 | CRUD servicios, horarios, ubicación con Google Maps |
| 3. Refactor de clientes | Sem 5 | client_profiles + client_provider_links operativos |
| 4. Agendamiento doble confirmación | Sem 6-7 | Solicitar/aprobar/rechazar, multi-servicio, walk-in |
| 5. Cita manual + invitaciones | Sem 8 | Wizard manual, token mágico, página pública |
| 6. Recordatorios manuales | Sem 9 | reminder_tasks, plantillas, dashboard |
| 7. Push + reseñas | Sem 10 | Web Push, VAPID, sistema de reseñas |
| 8. Directorio público | Sem 11 | Listado, perfil, mapa, botones WhatsApp |
| 9. Fidelización | Sem 12-13 | CRUD programas, vista cliente, aplicación de recompensas |
| 10. Lista de espera + favoritos | Sem 14 | Waitlist matcher, favoritos rápidos |
| 11. Panel super admin | Sem 15 | Dashboard, extensión de suscripciones |
| 12. QA + lanzamiento | Sem 16 | Tests RLS, primer barbero piloto |

---

## 9. Riesgos clave y mitigaciones

**Aislamiento multi-tenant:** un fallo de RLS expone datos entre tenants.
- Tests automatizados que verifiquen aislamiento.
- Nunca usar `service_role_key` desde el frontend (bypassa RLS).
- Code review riguroso en cualquier cambio de policies RLS.

**Pausa de Supabase Free:** los proyectos free se pausan tras 7 días sin tráfico.
- Con clientes reales no aplica.
- Pasar a Pro ($25/mes) cuando haya primer cliente.

**Push en iOS:** solo funciona con PWA instalada en home screen (Safari 16.4+).
- Instructivo claro al onboarding del usuario.
- Email/SMS como respaldo para recordatorios críticos.

**TTLs de aprobación:** un barbero ocupado puede no responder solicitudes a tiempo.
- TTL configurable por barbero.
- Notificaciones progresivas (a los 30 min, 1 hora, 1.5 horas).

**Cobro manual con disputas:** "yo pagué pero no me activaron".
- Toda extensión queda registrada en `subscription_events` con admin_id y nota.
- Email automático al barbero al extender: "Tu suscripción fue extendida hasta DD/MM/YYYY".

**Doble flujo (app + WhatsApp) confunde:** dos botones grandes pueden generar parálisis.
- Botón de "Agendar en app" es primario (más grande, color principal).
- Copy claro: "Agendar en app: rápido, recordatorios automáticos." vs "WhatsApp: para preguntas o casos especiales".

---

## 10. Estado actual del proyecto

**Lo que está hecho:**
- Plan completo de producto y arquitectura (este documento + Plan_Desarrollo_v4_Final.docx).
- 3 migrations SQL listos para correr en Supabase (001, 002, 003).
- 12 wireframes de pantallas críticas (PDF separado).

**Lo que falta hacer:**
- Setup del monorepo y deploy inicial.
- Implementación fase por fase según roadmap.
- Edge Functions clave: `send-push`, `waitlist-matcher`, `magic-link-validator`, `send-reminders`.
- Tests automatizados de RLS para garantizar aislamiento.

**Próximo paso recomendado:** Fase 0 setup → ejecutar migrations en Supabase → verificar manualmente con un super_admin y un provider_account de prueba.

---

## 11. Cómo usar este documento

**Para iniciar nueva conversación con IA:**
> "Estoy trabajando en este proyecto, aquí está el contexto completo: [pegar este documento]. Hoy quiero trabajar en [X]."

**Para pasar a desarrollador:**
> Compartir este documento + plan v4 Word + 3 migrations SQL + PDF de wireframes. Con eso tiene todo para empezar.

**Para Claude Code u otra IA programadora:**
> Subir este documento al contexto del repo. Pedir explícitamente: "Lee BRIEFING.md antes de cualquier tarea. Sigue las decisiones arquitectónicas. Si vas a desviarte de algo del briefing, pregúntame antes."
