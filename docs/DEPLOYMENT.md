# Guía de Despliegue

## Entornos

La aplicación soporta tres entornos:

- **Development**: Desarrollo local
- **Staging**: Pre-producción
- **Production**: Producción

## Requisitos Pre-Despliegue

- [ ] Todas las pruebas pasan (`npm test`)
- [ ] Lighthouse score >= 90
- [ ] No hay console errors
- [ ] Variables de entorno configuradas
- [ ] Backup de base de datos

## Despliegue en Vercel

### 1. Conectar Repositorio

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

### 2. Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://[proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://serviceapp.com
```

### 3. Desplegar

```bash
# Staging
vercel deploy --prod

# Production (requiere confirmación)
vercel deploy --prod

# Ver deployment
vercel list
```

### 4. Verificar

```bash
# Comprobar logs
vercel logs <app-name>

# Monitor de deployment
vercel env list
```

## Despliegue en Docker

### 1. Crear Imagen

```bash
docker build -t serviceapp:latest .
```

### 2. Ejecutar Localmente

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  serviceapp:latest
```

### 3. Subir a Registro

```bash
# DockerHub
docker tag serviceapp:latest username/serviceapp:latest
docker push username/serviceapp:latest

# GitHub Container Registry
docker tag serviceapp ghcr.io/username/serviceapp:latest
docker push ghcr.io/username/serviceapp:latest
```

## Despliegue con Kubernetes

### 1. Crear Configuración

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: serviceapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: serviceapp
  template:
    metadata:
      labels:
        app: serviceapp
    spec:
      containers:
      - name: serviceapp
        image: serviceapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
```

### 2. Desplegar

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Verificar
kubectl get pods
kubectl logs <pod-name>
```

## Despliegue con AWS

### 1. Crear Instancia EC2

```bash
# SSH
ssh -i key.pem ec2-user@instance-ip

# Install Node
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Clone repo
git clone <repo>
cd ServiceApp/apps/web
npm install
npm run build
```

### 2. Usar PM2

```bash
npm install -g pm2

# Start app
pm2 start npm --name serviceapp -- start

# Monitor
pm2 monitor

# Restart on reboot
pm2 startup
pm2 save
```

### 3. NGINX Reverse Proxy

```nginx
# /etc/nginx/sites-available/serviceapp
upstream nextjs {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name api.serviceapp.com;

  location / {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## Despliegue Supabase

### 1. Aplicar Migraciones

```bash
# Conectar Supabase CLI
supabase login

# Aplicar todas las migraciones
supabase db push

# Verificar estado
supabase db list
```

### 2. Configurar Backups

En Supabase Dashboard → Database → Backups

- Frecuencia: Diaria
- Retención: 30 días
- Tipo: Automático + Manual

### 3. RLS y Seguridad

```bash
# Verificar policies
supabase db query

# Ver logs de erro
supabase logs list
```

## Monitoreo Post-Despliegue

### 1. Health Check

```bash
# Verificar que el app está corriendo
curl https://api.serviceapp.com/health

# Esperar 200 OK
```

### 2. Logs

```bash
# Vercel
vercel logs <app-name> --follow

# AWS
tail -f /var/log/app.log

# Docker
docker logs <container-id> -f
```

### 3. Métricas

Monitorear en:
- **Vercel Analytics**: https://vercel.com/dashboard
- **Supabase Metrics**: Dashboard de Supabase
- **Datadog/New Relic**: Si está configurado

### 4. Alertas

Configurar en:
- Vercel → Monitoring → Alerts
- Cloud Provider (AWS CloudWatch, GCP, etc.)
- Email alerts para errores críticos

## Rollback

### Si algo falla en Producción

```bash
# Vercel - Volver a deployment anterior
vercel rollback

# Docker - Usar tag anterior
docker pull serviceapp:v1.0.0
docker run -d serviceapp:v1.0.0

# Supabase - Restaurar backup
# Dashboard → Database → Backups → Restore
```

## Performance

### Optimizaciones

```bash
# Build optimizado
npm run build

# Analizar bundle
npm run analyze

# Check Lighthouse
npm run lighthouse
```

### Caching

- CDN: Vercel Edge, CloudFlare
- Browser: Headers Cache-Control
- Database: Redis (si aplica)

## Seguridad

### Pre-Despliegue

- [ ] Cambiar todas las contraseñas por defecto
- [ ] Configurar CORS correctamente
- [ ] Revisar secrets en CI/CD
- [ ] Habilitar HTTPS/SSL
- [ ] Configurar WAF (Web Application Firewall)

### Post-Despliegue

- [ ] Ejecutar security scan
- [ ] Monitorear accesos inusuales
- [ ] Verificar logs de auditoría
- [ ] Validar certificados SSL

## Escala

### Configurar Auto-Scaling

**Vercel**: Automático con Pro plan

**AWS**:
```bash
# Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name serviceapp-asg \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3
```

**Kubernetes**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: serviceapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: serviceapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      - run: npm run lint
      - run: npm run type-check
      
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## Checklist Final

### Antes de Desplegar

- [ ] Tests pasan localmente
- [ ] Build sin errores
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] SSL configurado
- [ ] Backups listos

### Después de Desplegar

- [ ] Health check OK
- [ ] Logs sin errores
- [ ] Métricas normales
- [ ] Usuarios pueden acceder
- [ ] Transacciones procesando
- [ ] Notificaciones enviándose

### Monitoreo Continuo

- [ ] Verificar alertas cada hora (primeras 24h)
- [ ] Monitorear performance
- [ ] Revisar logs de error
- [ ] Validar backups
- [ ] Reportar metrics al equipo

## Soporte

Contacto para problemas de despliegue:
- Slack: #devops
- Email: deployment@serviceapp.com
- Status: https://status.serviceapp.com
