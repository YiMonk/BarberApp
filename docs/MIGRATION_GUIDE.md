# Guía de Migraciones Supabase

## Descripción General

Este documento describe todas las migraciones SQL creadas para la plataforma de citas de Servicios.

## Migraciones Creadas

### 1. Compliance & Audit (20250215_create_compliance_tables.sql)

Gestión de cumplimiento normativo y auditoría.

**Tablas:**
- `compliance_checklists` - Listas de verificación con progreso
- `audit_logs` - Registro detallado de cambios

**Características:**
- Seguimiento automático de cambios
- Cumplimiento normativo por frecuencia
- IP address y user agent en auditoría

### 2. Virtual Queue & Notifications (20250215_create_queue_and_notifications.sql)

Sistema de colas virtuales y gestión de notificaciones.

**Tablas:**
- `virtual_queues` - Gestión de esperas
- `notification_templates` - Plantillas reutilizables
- `smart_notification_rules` - Reglas automáticas

**Estados:**
- Queue: waiting, next, in_service, completed
- Notifications: email, sms, push, whatsapp

### 3. Staff & Referrals (20250215_create_staff_and_referrals.sql)

Gestión de personal y programa de referencias.

**Tablas:**
- `staff_members` - Personal con comisiones
- `referral_programs` - Tracking de referencias
- `two_factor_settings` - Autenticación segura
- `api_tokens` - Acceso por API

**Seguridad:**
- 2FA con TOTP
- API tokens con rate limiting
- Backup codes para emergencias

### 4. Backups & SLA (20250215_create_backup_and_sla.sql)

Respaldos automáticos y métricas SLA.

**Tablas:**
- `backups` - Respaldos automáticos y manuales
- `sla_metrics` - Métricas de servicio

**Estados de Backup:**
- completed, in_progress, failed

**Métricas SLA:**
- response_time, availability, completion_rate, satisfaction

### 5. Loyalty & Gamification (20250215_create_loyalty_and_gamification.sql)

Sistema de gamificación y lealtad.

**Tablas:**
- `loyalty_achievements` - Logros desbloqueados
- `gamification_points` - Sistema de puntos
- `leaderboard_cache` - Ranking de clientes
- `customer_feedback` - Retroalimentación

**Tipos de Puntos:**
- purchase, review, referral, achievement

### 6. Subscriptions & Payments (20250215_create_subscriptions_and_payments.sql)

Gestión de suscripciones, cupones e invoices.

**Tablas:**
- `subscription_plans` - 4 tiers (free, starter, professional, enterprise)
- `coupons` - Descuentos con tracking
- `invoices` - Facturas con estado
- `role_permissions` - Permisos granulares

**Estados de Invoice:**
- draft, sent, paid, overdue, cancelled

### 7. Marketplace & Documents (20250215_create_marketplace_and_documents.sql)

Marketplace de servicios y gestión de documentos.

**Tablas:**
- `marketplace_services` - Servicios publicados
- `documents` - Gestión de documentos
- `analytics_snapshots` - Snapshots diarios
- `integrations` - Configuración de integraciones

### 8. Triggers & Functions (20250215_create_triggers_and_functions.sql)

Automatizaciones y triggers de base de datos.

**Funciones:**
- `update_updated_at_column()` - Actualiza timestamps
- `refresh_leaderboard()` - Recalcula rankings
- `archive_old_compliance_data()` - Archiva datos antiguos
- `calculate_sla_status()` - Calcula estado SLA
- `audit_trigger()` - Auditoría automática

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Políticas típicas:

```sql
CREATE POLICY "Users can manage own [table]" ON [table]
  FOR ALL USING (auth.uid() = provider_id);
```

## Aplicar Migraciones

### Opción 1: Usar Supabase CLI

```bash
supabase migration up
```

### Opción 2: Manual en Supabase Dashboard

1. Ve a SQL Editor
2. Copia el contenido de cada archivo
3. Ejecuta en orden (empezando por compliance)

## Índices Creados

Para optimización de queries:

- `idx_[table]_provider` - Por provider_id
- `idx_[table]_status` - Por estado
- `idx_[table]_created_at` - Por fecha de creación
- Índices UNIQUE donde es necesario

## Triggers Automáticos

- **updated_at**: Se actualiza automáticamente en cada modificación
- **Audit**: Registra INSERT, UPDATE, DELETE
- **Leaderboard**: Se puede refrescar con función

## Mantención Sugerida

```sql
-- Actualizar SLA cada 15 minutos
SELECT cron.schedule('calculate-sla', '*/15 * * * *', 'SELECT calculate_sla_status()');

-- Refrescar leaderboard diariamente
SELECT cron.schedule('refresh-leaderboard', '0 2 * * *', 'SELECT refresh_leaderboard()');

-- Archivar datos antiguos semanalmente
SELECT cron.schedule('archive-compliance', '0 3 * * 0', 'SELECT archive_old_compliance_data()');
```

## Reversión de Migraciones

Si necesitas revertir, usa:

```bash
supabase migration down
```

## Seguridad

- ✓ RLS en todas las tablas
- ✓ Encriptación en backup_codes
- ✓ Audit trail automático
- ✓ Rate limiting en API tokens
- ✓ Restricciones CHECK en enums

## Próximos Pasos

1. Verificar que todas las migraciones se aplicaron
2. Crear backups automáticos
3. Configurar replicación si es necesario
4. Testear RLS policies
5. Monitorear uso de espacio
