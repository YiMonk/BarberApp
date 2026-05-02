// Responsive Design Utilities

export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  "2xl": `@media (min-width: ${breakpoints["2xl"]}px)`,
} as const;

export const gridClasses = {
  // Responsive grid layouts
  twoColumns: "grid grid-cols-1 md:grid-cols-2 gap-4",
  threeColumns: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  fourColumns: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
  sixColumns: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2",
} as const;

export const spacingClasses = {
  containerPadding: "px-4 sm:px-6 lg:px-8",
  sectionPadding: "py-8 sm:py-12 lg:py-16",
  compactSpacing: "space-y-2 sm:space-y-3",
  normalSpacing: "space-y-4 sm:space-y-5",
  wideSpacing: "space-y-6 sm:space-y-8",
} as const;

export const typographyClasses = {
  h1: "text-2xl sm:text-3xl md:text-4xl font-bold",
  h2: "text-xl sm:text-2xl md:text-3xl font-bold",
  h3: "text-lg sm:text-xl md:text-2xl font-semibold",
  h4: "text-base sm:text-lg font-semibold",
  body: "text-sm sm:text-base text-gray-700",
  small: "text-xs sm:text-sm text-gray-600",
} as const;

export const containerClasses = {
  maxWidth: "max-w-7xl mx-auto",
  fullWidth: "w-full",
  sidebarLayout: "grid grid-cols-1 lg:grid-cols-4 gap-6",
  mainContent: "lg:col-span-3",
  sidebar: "lg:col-span-1",
} as const;

// Hook for responsive values
export const useResponsive = () => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < breakpoints.md;
  const isTablet = typeof window !== "undefined" && window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= breakpoints.lg;

  return { isMobile, isTablet, isDesktop };
};
