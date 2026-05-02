# Contexto del proyecto

Lee estos archivos antes de cualquier tarea:
1. /docs/BRIEFING.md — contexto completo del producto y arquitectura
2. /docs/wireframes.pdf — pantallas críticas con componentes sugeridos
3. /supabase/migrations/*.sql — modelo de datos exacto

## Reglas innegociables

- Stack: Next.js 14 App Router + Supabase + Tailwind + shadcn/ui
- Multi-tenant aislado vía RLS de Supabase, jamás bypass con service_role
- Modelo de cuenta: profesional individual (Modelo B)
- Refactor cliente a client_profiles + client_provider_links ya aplicado
- Si vas a desviarte de algo del BRIEFING, pregúntame antes