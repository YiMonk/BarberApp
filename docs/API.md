# API Documentation

## Base URL

```
https://api.serviceapp.com/v1
# Local development
http://localhost:3000/api/v1
```

## Authentication

Todos los endpoints requieren JWT token en header:

```
Authorization: Bearer <token>
```

Obtener token:

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

## Appointments (Citas)

### GET /appointments

Listar todas las citas

```bash
curl http://localhost:3000/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN"
```

**Parámetros:**
- `status`: pending, confirmed, completed, cancelled
- `date_from`: ISO 8601 date
- `date_to`: ISO 8601 date
- `limit`: 1-100 (default: 20)
- `offset`: Pagination offset

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "service_id": "uuid",
      "start_time": "2025-02-15T14:00:00Z",
      "duration_minutes": 60,
      "status": "confirmed",
      "created_at": "2025-02-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

### POST /appointments

Crear nueva cita

```bash
curl -X POST http://localhost:3000/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid",
    "service_id": "uuid",
    "start_time": "2025-02-15T14:00:00Z",
    "duration_minutes": 60
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "client_id": "uuid",
    "status": "pending"
  }
}
```

### PUT /appointments/{id}

Actualizar cita

```bash
curl -X PUT http://localhost:3000/api/v1/appointments/uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### DELETE /appointments/{id}

Cancelar cita

```bash
curl -X DELETE http://localhost:3000/api/v1/appointments/uuid \
  -H "Authorization: Bearer $TOKEN"
```

## Clients (Clientes)

### GET /clients

```bash
curl http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer $TOKEN"
```

### POST /clients

```bash
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan García",
    "email": "juan@example.com",
    "phone": "+34612345678"
  }'
```

### GET /clients/{id}

```bash
curl http://localhost:3000/api/v1/clients/uuid \
  -H "Authorization: Bearer $TOKEN"
```

### PUT /clients/{id}

```bash
curl -X PUT http://localhost:3000/api/v1/clients/uuid \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan García González"
  }'
```

## Services (Servicios)

### GET /services

```bash
curl http://localhost:3000/api/v1/services \
  -H "Authorization: Bearer $TOKEN"
```

### POST /services

```bash
curl -X POST http://localhost:3000/api/v1/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Corte Premium",
    "description": "Corte de cabello con técnicas modernas",
    "price": 35.00,
    "duration_minutes": 60
  }'
```

## Analytics

### GET /analytics/dashboard

```bash
curl http://localhost:3000/api/v1/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 5250.00,
    "total_appointments": 124,
    "active_clients": 45,
    "retention_rate": 85.5,
    "average_rating": 4.8
  }
}
```

### GET /analytics/kpis

```bash
curl http://localhost:3000/api/v1/analytics/kpis?period=month \
  -H "Authorization: Bearer $TOKEN"
```

## Gamification

### GET /gamification/leaderboard

```bash
curl http://localhost:3000/api/v1/gamification/leaderboard \
  -H "Authorization: Bearer $TOKEN"
```

### POST /gamification/points

```bash
curl -X POST http://localhost:3000/api/v1/gamification/points \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid",
    "points": 50,
    "reason": "purchase"
  }'
```

## Payments

### POST /payments/intent

Crear payment intent para Stripe

```bash
curl -X POST http://localhost:3000/api/v1/payments/intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "usd",
    "appointment_id": "uuid"
  }'
```

### POST /payments/webhook

Webhook para confirmar pagos (Stripe automático)

```bash
curl -X POST http://localhost:3000/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d '@stripe_event.json'
```

## Notifications

### POST /notifications/send-email

```bash
curl -X POST http://localhost:3000/api/v1/notifications/send-email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid",
    "template": "appointment_reminder",
    "variables": {
      "appointment_date": "2025-02-15T14:00:00Z"
    }
  }'
```

### POST /notifications/send-sms

```bash
curl -X POST http://localhost:3000/api/v1/notifications/send-sms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+34612345678",
    "message": "Tu cita es mañana a las 14:00"
  }'
```

## Rate Limiting

**Límites por tier:**
- Free: 100 req/hora
- Starter: 1000 req/hora
- Professional: 10000 req/hora
- Enterprise: Ilimitado

**Headers de respuesta:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1613383200
```

## Error Handling

### Formato de Errores

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Email is required",
    "details": {
      "field": "email"
    }
  }
}
```

### Códigos de Error Comunes

| Código | Status | Descripción |
|--------|--------|-------------|
| INVALID_REQUEST | 400 | Datos inválidos |
| UNAUTHORIZED | 401 | Token inválido |
| FORBIDDEN | 403 | Sin permisos |
| NOT_FOUND | 404 | Recurso no existe |
| RATE_LIMIT | 429 | Límite excedido |
| SERVER_ERROR | 500 | Error del servidor |

## Webhooks

### Eventos Disponibles

- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `payment.succeeded`
- `payment.failed`
- `client.signup`

### Configurar Webhook

```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhooks",
    "events": ["appointment.created", "payment.succeeded"]
  }'
```

## Ejemplos de Integración

### Python

```python
import requests

BASE_URL = "http://localhost:3000/api/v1"
TOKEN = "your_token_here"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Get appointments
response = requests.get(
    f"{BASE_URL}/appointments",
    headers=headers
)
appointments = response.json()["data"]
```

### JavaScript

```javascript
const BASE_URL = "http://localhost:3000/api/v1";
const TOKEN = "your_token_here";

async function getAppointments() {
  const response = await fetch(
    `${BASE_URL}/appointments`,
    {
      headers: {
        "Authorization": `Bearer ${TOKEN}`
      }
    }
  );
  return response.json();
}
```

## Documentación Interactiva

Swagger/OpenAPI disponible en:
```
http://localhost:3000/api/docs
```

## Cambios y Versionado

API versión: **v1** (Estable)

Cambios retrocompatibles se agregan a v1.
Cambios incompatibles van a v2 (próximamente).

## Soporte

- Documentación: https://docs.serviceapp.com
- Email: api-support@serviceapp.com
- Status: https://status.serviceapp.com
