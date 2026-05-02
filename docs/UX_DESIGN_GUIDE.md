# Guía de Diseño UX/UI

## Principios de Diseño

### 1. Responsivo (Mobile-First)

La aplicación sigue un enfoque mobile-first:

- **Mobile (xs)**: 320px - Diseño de una columna
- **Tablet (md)**: 768px - Dos columnas
- **Desktop (lg)**: 1024px - Múltiples columnas
- **Wide (xl)**: 1280px - Layout expandido

### 2. Accesibilidad (WCAG 2.1 AA)

Cumplimos con estándares internacionales:

- Contraste de color: Mínimo 4.5:1 para texto normal
- Tamaño mínimo de botón: 44px x 44px (recomendado)
- Navegación por teclado: Tab, Shift+Tab, Enter, Escape
- Screen readers: ARIA labels y roles semánticos
- Sin dependencia de color solo: Iconos + texto

### 3. Performance

Optimizaciones incluidas:

- Lazy loading de imágenes
- Code splitting por ruta
- Caché con SWR
- Compresión de assets
- PWA ready

## Componentes Responsivos

### Grid Layouts

```jsx
// Dos columnas en desktop, una en mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Contenido */}
</div>

// Tres columnas
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Contenido */}
</div>
```

### Tipografía

```tsx
// Títulos responsivos
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
  Título Responsivo
</h1>

// Párrafos
<p className="text-sm sm:text-base text-gray-700">
  Texto normal
</p>
```

### Espaciado

```jsx
// Padding responsivo
<div className="px-4 sm:px-6 lg:px-8">
  {/* Contenido */}
</div>

// Espacio entre elementos
<div className="space-y-4 sm:space-y-6">
  {/* Elementos */}
</div>
```

## Patrones de Accesibilidad

### Campos de Formulario

```jsx
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium">
    Email <span className="text-red-600">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-label="Dirección de correo electrónico"
    aria-describedby="email-error"
    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  {error && (
    <div id="email-error" role="alert" className="text-red-600 text-sm">
      {error}
    </div>
  )}
</div>
```

### Botones

```jsx
// Tamaño mínimo 44x44px
<button className="px-4 py-2 min-h-[44px] focus:ring-2 focus:ring-blue-500">
  Enviar
</button>
```

### Navegación

```jsx
// Skip link (salta al contenido principal)
<a href="#main-content" className="sr-only focus:not-sr-only">
  Ir al contenido principal
</a>

{/* Luego en el contenido */}
<main id="main-content">
  {/* Contenido principal */}
</main>
```

### Tablas

```jsx
<table>
  <thead className="sticky top-0 bg-white">
    <tr>
      <th scope="col" className="text-left">
        Nombre
      </th>
    </tr>
  </thead>
  <tbody>
    {/* Filas */}
  </tbody>
</table>
```

## Colores y Contraste

### Paleta de Colores

```css
/* Primario - Información, acciones */
--color-primary: #2563eb /* Azul */

/* Éxito */
--color-success: #059669 /* Verde */

/* Advertencia */
--color-warning: #d97706 /* Ámbar */

/* Error */
--color-error: #dc2626 /* Rojo */

/* Neutral */
--color-gray-900: #111827 /* Casi negro - 16.6:1 contrast */
--color-gray-700: #374151 /* Oscuro - 11.4:1 contrast */
--color-gray-600: #4b5563 /* Normal - 7.5:1 contrast */
```

## Animaciones

### Reducir Movimiento

Respetamos la preferencia del usuario:

```jsx
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduces-motion: reduce)"
).matches;

// Solo animar si el usuario lo prefiere
{!prefersReducedMotion && (
  <div className="animate-fade-in">Contenido</div>
)}
```

## Iconografía

### Iconos Accesibles

```jsx
// CON etiqueta (icono solo no es suficiente)
<button aria-label="Cerrar">
  <CloseIcon />
</button>

// O con texto visible
<button>
  <Icon /> Cerrar
</button>
```

## Formularios

### Validación Accesible

```jsx
<input
  aria-invalid={error ? "true" : "false"}
  aria-describedby={error ? "error-message" : undefined}
/>

{error && (
  <div id="error-message" role="alert">
    {error}
  </div>
)}
```

## Testing de Accesibilidad

### Verificar

1. **Navegación por teclado**: Tab a través de todos los elementos interactivos
2. **Screen reader**: Probar con NVDA, JAWS o VoiceOver
3. **Contraste**: Usar herramientas como WebAIM
4. **Tamaños**: Verificar mínimos de 44x44px
5. **Colores**: No confiar solo en color

### Herramientas

- axe DevTools (navegador)
- WAVE (accesibilidad)
- Lighthouse (Chrome DevTools)
- WebAIM Contrast Checker

## Dark Mode (Futuro)

Preparado para dark mode:

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Contenido */}
</div>
```

## Performance

### Optimizaciones

- Lazy loading de imágenes
- Code splitting automático
- Caché con SWR
- PWA offline support
- Compresión gzip

### Métricas

- **FCP**: First Contentful Paint < 1.8s
- **LCP**: Largest Contentful Paint < 2.5s
- **CLS**: Cumulative Layout Shift < 0.1
- **TTFB**: Time to First Byte < 600ms

## Espaciado

### Escala de Espaciado

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

Usamos esta escala consistentemente para:
- Padding
- Margin
- Gaps en grillas

## Z-Index

```
sticky: 10
dropdown: 20
modal-backdrop: 30
modal: 40
tooltip: 50
```

## Transiciones

```
200ms - Hover, focus (rápido)
300ms - Cambios de contenido (normal)
500ms - Navegación, grandes cambios (lento)
```

## Breakpoints Recomendados

```jsx
sm: "640px"   // Tablets pequeños
md: "768px"   // Tablets
lg: "1024px"  // Laptops
xl: "1280px"  // Desktops grandes
```

## Conclusión

Esta guía asegura que la aplicación sea:
- ✓ Accesible para todos
- ✓ Responsiva en cualquier dispositivo
- ✓ Rápida y performante
- ✓ Agradable de usar
- ✓ Compatible con tecnologías asistivas
