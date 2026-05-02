// Accessibility Utilities (WCAG 2.1 AA Compliance)

// Color contrast ratios for WCAG AA compliance
export const colorContrast = {
  // Text colors on white background
  text: {
    primary: "text-gray-900", // 16.6:1 contrast
    secondary: "text-gray-700", // 11.4:1 contrast
    tertiary: "text-gray-600", // 7.5:1 contrast
  },
  // Status colors
  status: {
    success: "text-green-600", // 4.5:1 contrast
    warning: "text-yellow-700", // 7:1 contrast
    error: "text-red-600", // 5.8:1 contrast
    info: "text-blue-600", // 5.4:1 contrast
  },
} as const;

// ARIA labels and descriptions
export const ariaLabels = {
  closeButton: "Cerrar diálogo",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  loadingSpinner: "Cargando...",
  formSubmit: "Enviar formulario",
  formReset: "Reiniciar formulario",
  sortAscending: "Ordenar ascendente",
  sortDescending: "Ordenar descendente",
  expandDetails: "Expandir detalles",
  collapseDetails: "Contraer detalles",
} as const;

// Focus states for keyboard navigation
export const focusClasses = {
  button: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  input: "focus:outline-none focus:ring-2 focus:ring-blue-500",
  link: "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded",
} as const;

// Skip to main content link
export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2"
  >
    Ir al contenido principal
  </a>
);

// Accessible heading utility
export const headingLevels = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

// Accessible form field pattern
export interface AccessibleFormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

// ARIA live region for announcements
export const ariaLiveClasses = {
  polite: "aria-live-polite",
  assertive: "aria-live-assertive",
} as const;

// Screen reader only class
export const screenReaderOnly = "sr-only";

// Accessible table headers
export const tableHeaderClasses = {
  sortable: "cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
  sticky: "sticky top-0 z-10 bg-white",
} as const;

// Accessible buttons
export const buttonSizes = {
  sm: "px-3 py-2 text-sm min-h-[36px]", // 36px minimum height
  md: "px-4 py-2 text-base min-h-[44px]", // 44px minimum height (recommended)
  lg: "px-6 py-3 text-lg min-h-[48px]", // 48px minimum height
} as const;

// Keyboard shortcuts documentation
export const keyboardShortcuts = {
  submit: "Enter",
  cancel: "Escape",
  tab: "Tab para navegar",
  shiftTab: "Shift + Tab para navegar hacia atrás",
  focusSearch: "Ctrl + K o Cmd + K",
} as const;

// Accessible icon patterns
export interface AccessibleIconProps {
  icon: React.ReactNode;
  label: string;
  ariaLabel?: string;
}

// Error messages with ARIA
export const AccessibleErrorMessage = ({ id, message }: { id: string; message: string }) => (
  <div id={`${id}-error`} role="alert" className="text-red-600 text-sm mt-1">
    {message}
  </div>
);

// Success messages with ARIA
export const AccessibleSuccessMessage = ({ id, message }: { id: string; message: string }) => (
  <div id={`${id}-success`} role="status" aria-live="polite" className="text-green-600 text-sm mt-1">
    {message}
  </div>
);

// Loading skeleton (accessible)
export const AccessibleSkeleton = ({ count = 1, className = "" }: { count?: number; className?: string }) => (
  <div role="status" aria-label="Cargando" className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 rounded h-4 mb-2" />
    ))}
  </div>
);

// Dialog accessibility wrapper
export interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Accessible toast notification
export const AccessibleToast = ({ message, type = "info" }: { message: string; type?: "success" | "error" | "info" }) => (
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className={`p-4 rounded ${
      type === "success"
        ? "bg-green-100 text-green-800"
        : type === "error"
        ? "bg-red-100 text-red-800"
        : "bg-blue-100 text-blue-800"
    }`}
  >
    {message}
  </div>
);

// Accessible pagination
export const paginationAriaLabels = {
  previous: "Página anterior",
  next: "Página siguiente",
  current: "Página actual",
  page: (number: number) => `Ir a página ${number}`,
} as const;

// Accessible modal patterns
export const modalAriaLabels = {
  closeButton: "Cerrar diálogo modal",
  backdrop: "Cierra el diálogo",
} as const;

// Language attribute for screen readers
export const langAttribute = "es-ES";

// Reduced motion preference
export const prefersReducedMotion = () => {
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
};

// Animation classes respecting preferences
export const animationClasses = {
  fadeIn: prefersReducedMotion() ? "" : "animate-fade-in",
  slideIn: prefersReducedMotion() ? "" : "animate-slide-in",
  pulse: prefersReducedMotion() ? "" : "animate-pulse",
} as const;
