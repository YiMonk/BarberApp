# Guía Rápida de Instalación

## Problema Actual

Estás recibiendo errores:
- **400**: Error de autenticación con Supabase
- **401**: Tabla `provider_accounts` no existe

## Solución Paso a Paso

### Paso 1: Verificar Variables de Entorno

Crea un archivo `.env.local` en `apps/web/`:

```bash
# apps/web/.env.local

# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://omkigehvugradhjwvkst.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# APIs (opcionales)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
RESEND_API_KEY=re_...
```

⚠️ **IMPORTANTE**: Obtén tus claves en https://app.supabase.com

### Paso 2: Crear las Tablas en Supabase

#### Opción A: Con Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI si no lo tienes
npm install -g supabase

# 2. Login
supabase login

# 3. Enlazar proyecto
cd ServiceApp
supabase link --project-ref omkigehvugradhjwvkst

# 4. Aplicar migraciones
supabase db push
```

#### Opción B: Manual en Dashboard

1. Ve a https://app.supabase.com
2. Abre el proyecto
3. Ve a SQL Editor
4. Copia y ejecuta estos archivos EN ORDEN:

```
1. supabase/migrations/20250215_create_auth_tables.sql
2. supabase/migrations/20250215_create_core_tables.sql
3. supabase/migrations/20250215_create_compliance_tables.sql
4. supabase/migrations/20250215_create_queue_and_notifications.sql
5. ... y el resto
```

### Paso 3: Habilitar Email Confirmation (Opcional pero Recomendado)

En Supabase Dashboard:

1. Ve a **Authentication** → **Providers**
2. Enable **Email** provider
3. En **Email Configuration**, selecciona una opción:
   - **Supabase** (gratuito, 100 emails/hora)
   - **SendGrid** (más confiable)

### Paso 4: Verificar Auth Settings

En **Authentication** → **Settings**:

```
URL Configuration:
- Site URL: http://localhost:3000 (dev) o https://tudominio.com (prod)
- Redirect URLs:
  - http://localhost:3000/**
  - https://tudominio.com/**
```

### Paso 5: Prueba de Registro

```bash
# 1. Asegúrate de que el servidor está corriendo
npm run dev

# 2. Ve a http://localhost:3000/register

# 3. Intenta registrarte con:
# - Email: test@example.com
# - Contraseña: Test123456
# - Nombre: Test Barbería
```

## Si Aún Tienes Errores

### Error 400 - Invalid Request

**Causa**: Supabase Auth no configurado correctamente

**Solución**:
```bash
# Verifica que tienes estas variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Si no salen, actualiza .env.local
# Luego reinicia: npm run dev
```

### Error 401 - Unauthorized

**Causa**: Las tablas no fueron creadas

**Solución**:
```bash
# Aplica las migraciones manualmente:
supabase db push

# O verifica que existen:
# Dashboard → SQL Editor → Run esta query:
SELECT * FROM provider_accounts LIMIT 1;
```

### Error: "relation 'provider_accounts' does not exist"

**Solución**: Ejecuta el Paso 2 de nuevo

### Rate Limit (429)

**Espera 5 minutos** y reintentar. Es una protección de Supabase.

## Estructura de Tablas Creadas

```
Authentication:
├── provider_accounts    (Proveedores/Barberos)
└── client_profiles     (Clientes)

Core Features:
├── services            (Servicios ofrecidos)
├── appointments        (Citas)
├── working_hours       (Horarios)
├── coupons            (Descuentos)
└── invoices           (Facturas)

Advanced Features:
├── compliance_checklists
├── virtual_queues
├── notification_templates
├── gamification_points
├── loyalty_achievements
├── subscription_plans
└── ... 30+ más
```

## Verificar Instalación

```bash
# 1. Check migrations
supabase migration list

# 2. Check tables
supabase db list

# 3. Check if app starts
npm run dev

# 4. Check browser console
# Abre DevTools (F12) → Console
# No debe haber errores en rojo
```

## Próximos Pasos

1. ✓ Registrarse
2. ✓ Crear servicios
3. ✓ Aceptar citas
4. ✓ Gestionar clientes
5. ✓ Ver analytics

## Documentación Adicional

- [Migraciones SQL](./MIGRATION_GUIDE.md)
- [API Reference](./API.md)
- [Despliegue](./DEPLOYMENT.md)
- [UX Design](./UX_DESIGN_GUIDE.md)

## Soporte

Si tienes problemas:

1. Verifica `.env.local`
2. Reinicia: `npm run dev`
3. Limpia caché: Ctrl+Shift+Delete
4. Abre DevTools: F12
5. Mira Console errors

## Checklist de Setup Completo

- [ ] `.env.local` tiene las variables de Supabase
- [ ] Migraciones aplicadas (`supabase db push`)
- [ ] Email provider configurado en Supabase
- [ ] URL Configuration correcta
- [ ] `npm run dev` corre sin errores
- [ ] Puedo registrar un usuario
- [ ] Puedo crear un servicio
- [ ] Puedo crear una cita

¡Una vez que todo esté verde, la app está lista para usar!
