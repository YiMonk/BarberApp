# ServiceApp - Platform de Citas y Gestión de Servicios

Una plataforma SaaS completa para profesionales independientes (barberos, peluqueros, estéticos, etc.) para gestionar citas, clientes, pagos y más.

## 🚀 Características

### Gestión de Citas
- ✓ Calendario interactivo
- ✓ Recordatorios automáticos (Email, SMS, Push)
- ✓ Confirmación de citas
- ✓ Historial de citas

### Gestión de Clientes
- ✓ Perfiles de cliente
- ✓ Historial de servicios
- ✓ Comportamiento y preferencias
- ✓ Segmentación automática

### Sistema de Pagos
- ✓ Integración Stripe
- ✓ Cupones y descuentos
- ✓ Facturas automáticas
- ✓ Reportes de ingresos

### Gamificación
- ✓ Sistema de puntos
- ✓ Badges y logros
- ✓ Leaderboard
- ✓ Programa de referencias

### Loyalty
- ✓ 4 mecánicas: punch card, nth visit, birthday bonus, time limited
- ✓ Recompensas personalizadas
- ✓ Análisis de retención

### Analytics
- ✓ Dashboard de KPIs
- ✓ Análisis de comportamiento
- ✓ Predicción de abandono
- ✓ Insights automáticos

### Integraciones
- ✓ Google Calendar
- ✓ Stripe
- ✓ Twilio (SMS)
- ✓ WhatsApp
- ✓ Resend (Email)

### Seguridad
- ✓ Autenticación JWT
- ✓ 2FA (TOTP)
- ✓ Rate limiting
- ✓ Auditoría de cambios
- ✓ Encriptación de datos

### Cumplimiento
- ✓ GDPR ready
- ✓ Checklists de cumplimiento
- ✓ Backups automáticos
- ✓ Recuperación de datos

## 📋 Requisitos

- Node.js 18+
- npm o pnpm
- Supabase (PostgreSQL)
- Cuenta en servicios externos (opcional)

## 🛠️ Instalación

### 1. Clonar Repositorio

```bash
git clone <repository>
cd ServiceApp
```

### 2. Instalar Dependencias

```bash
cd apps/web
npm install
# o
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# APIs
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...

TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
TWILIO_PHONE_NUMBER=+1...

RESEND_API_KEY=re_...

WHATSAPP_API_TOKEN=EAA...
```

### 4. Configurar Base de Datos

```bash
# Con Supabase CLI
supabase start

# O manualmente:
# 1. Ve a supabase.com
# 2. Crea nuevo proyecto
# 3. Ejecuta migraciones en SQL Editor
```

### 5. Ejecutar Localmente

```bash
npm run dev
```

Accede a: http://localhost:3000

## 📚 Documentación

### Guías Disponibles

- **[BRIEFING.md](docs/BRIEFING.md)** - Contexto completo del producto
- **[MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** - Migraciones Supabase
- **[UX_DESIGN_GUIDE.md](docs/UX_DESIGN_GUIDE.md)** - Diseño y accesibilidad
- **[API.md](docs/API.md)** - Endpoints y documentación
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Despliegue en producción

### Estructura del Proyecto

```
apps/web/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Rutas de autenticación
│   ├── (provider)/        # Dashboard del proveedor
│   ├── (client)/          # Portal del cliente
│   └── api/               # API routes
├── components/             # Componentes React (50+)
├── hooks/                  # React hooks custom (50+)
├── lib/                    # Utilities
│   ├── supabase.ts
│   ├── security.ts
│   ├── cache.ts
│   ├── responsive.ts
│   └── accessibility.ts
├── public/                 # Assets estáticos
└── styles/                 # CSS global

supabase/
├── migrations/             # SQL migrations (8 archivos)
└── functions/              # Edge functions (opcional)
```

## 🔐 Seguridad

### Autenticación

- JWT con Supabase
- Refresh tokens automáticos
- Session management

### Autorización

- RLS (Row Level Security) en PostgreSQL
- Role-based access control (4 roles)
- Permisos granulares (12 permisos)

### Datos

- Encriptación en tránsito (HTTPS)
- Encriptación en reposo (Supabase)
- Backup automático
- GDPR compliant

## 📊 Analytics

### KPIs Implementados

- Ingresos totales y por período
- Número de citas
- Clientes activos
- Tasa de retención
- NPS (Net Promoter Score)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Churn rate

## 💳 Planes de Suscripción

### Free (Gratuito)
- Hasta 10 citas/mes
- 5 clientes máximo
- Sin integraciones

### Starter ($9/mes)
- Hasta 100 citas/mes
- 50 clientes máximo
- Email notifications

### Professional ($29/mes)
- Citas ilimitadas
- Clientes ilimitados
- Todas las integraciones
- Analytics avanzada

### Enterprise (Personalizado)
- SLA garantizado
- Soporte 24/7
- Customizaciones
- Datos en local

## 🚢 Despliegue

### Vercel (Recomendado)

```bash
# 1. Conectar repositorio en Vercel
# 2. Configurar variables de entorno
# 3. Deploy automático en push

vercel deploy
```

### Docker

```bash
docker build -t serviceapp .
docker run -p 3000:3000 serviceapp
```

### Supabase Hosting

Versión sin servidor disponible.

## 🧪 Testing

### Ejecutar Tests

```bash
npm test                    # Unit tests
npm run test:e2e           # End-to-end tests
npm run test:coverage      # Coverage report
```

### Lighthouse

```bash
npm run lighthouse
```

## 📱 PWA

La aplicación es una Progressive Web App:

- ✓ Offline ready
- ✓ Installable
- ✓ Push notifications
- ✓ App-like experience

## 🌍 Localización

Soporta múltiples idiomas:
- Español
- English (próximamente)
- Português (próximamente)

## 🆘 Soporte

### Contato
- Email: soporte@serviceapp.com
- Chat: [Disponible en app]
- Documentación: docs.serviceapp.com

### Problemas Comunes

**Error: "Supabase URL no configurada"**
→ Verifica `.env.local`

**Error: "RLS policy violation"**
→ Asegúrate de estar autenticado

**Error: "Rate limit exceeded"**
→ Espera 5 minutos e intenta de nuevo

## 📝 Licencia

Propietaria - © 2025

## 🤝 Contribuciones

Las contribuciones están limitadas a pull requests desde equipos autorizados.

## 🗺️ Roadmap

### Q1 2025
- ✓ MVP lanzado
- ✓ Analytics avanzada
- ✓ Mobile app

### Q2 2025
- Marketplace de servicios
- AI chatbot support
- Integración con más POS

### Q3 2025
- Multi-location support
- API pública
- White label

## 📞 Stack Técnico

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Supabase (PostgreSQL)
- Next.js API Routes
- Serverless Functions

### Servicios Externos
- Stripe (Pagos)
- Twilio (SMS)
- Resend (Email)
- Google Calendar (Sync)

### DevOps
- Vercel (Hosting)
- GitHub (Versionado)
- Supabase (BD)

## 📄 Cambios Recientes

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo.

---

**Versión**: 1.0.0  
**Última actualización**: 2025-02-15  
**Mantenedor**: equipo@serviceapp.com
