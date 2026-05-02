# Proyecto Status - 2026-05-02

## Completado

### ✅ FASE 0: Setup (Completado)
- [x] Monorepo con pnpm workspaces
- [x] Next.js 14 App Router en apps/web
- [x] Supabase cliente instalado
- [x] shadcn/ui inicializado
- [x] Variables de entorno configuradas
- [x] Dev server corriendo en puerto 3000

### ✅ FASE 1: Auth + Onboarding (Completado)

#### Frontend:
- [x] Página de registro (/registro)
- [x] Página de login (/login)
- [x] Wizard onboarding 5 pasos (/onboarding)
- [x] Dashboard básico (/dashboard)
- [x] Auth context para estado global
- [x] useAuth hook (signUp, signIn, signOut)
- [x] Protected routes en (provider)

#### Backend (Supabase):
- [x] Migration 001: Schema inicial con provider_accounts, subscriptions
- [x] Migration 002: Invitaciones y directorio
- [x] Migration 003: Refactor clients + loyalty
- [x] RLS policies configuradas
- [x] Trigger para crear trial subscription automáticamente
- [x] Trigger para audit logs

#### Flows Implementados:
1. Registro → Crea auth.users + provider_accounts + trial subscription
2. Onboarding → Completa datos del negocio en 5 pasos
3. Login → Accede al dashboard
4. Dashboard → Muestra estado de trial y links rápidos

### ✅ FASE 2: Catálogo + Disponibilidad (Completado)

#### Frontend:
- [x] Página de servicios con CRUD (/dashboard/services)
- [x] Página de horarios semanales (/dashboard/schedule)
- [x] Editor de excepciones (vacaciones, días festivos)
- [x] ServiceForm con validaciones
- [x] WeeklyScheduleEditor (7 días)
- [x] OverridesEditor para excepciones

#### Backend (Supabase):
- [x] services table operativo
- [x] weekly_availability table operativo
- [x] availability_overrides table operativo
- [x] RLS policies para servicios y horarios

#### Features Implementadas:
- [x] Crear servicio (name, duration, price)
- [x] Editar servicio
- [x] Eliminar servicio
- [x] Display order automático
- [x] Configurar horarios por día (7 días)
- [x] Agregar excepciones con razón
- [x] Validaciones en formularios
- [x] Error handling completo

## En Progreso

- Ninguno actualmente

## Próximo: FASE 3 - Refactor Clientes (Semana 5)

### Pendiente:
- [ ] Verificar client_profiles operativo
- [ ] Verificar client_provider_links operativo
- [ ] Componentes si es necesario
- [ ] Tests de RLS para clientes

## Tech Stack

```
Frontend:
- Next.js 14 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase JS client

Backend:
- Supabase (PostgreSQL 15)
- Auth (JWT)
- Row Level Security (RLS)
- pg_cron (jobs)
- Edge Functions (Deno)

Dev:
- pnpm workspaces
- ESLint
```

## URLs Importantes

- Dev server: http://localhost:3000
- Registro: http://localhost:3000/registro
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard (require auth)
- Onboarding: http://localhost:3000/onboarding (require auth)

## Notas

- Trial subscription se crea automáticamente vía trigger en migration 001
- Auth context proporciona estado global de usuario
- RLS policies garantizan multi-tenant isolation
- TypeScript sin errores
- Próximas semanas: Servicios, disponibilidad, agendamiento
