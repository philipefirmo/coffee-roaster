// Design Tokens - Sistema de Design para Torrefação de Café

export const colors = {
  // Neutros (tons de café)
  espresso: {
    50: '#faf8f5',
    100: '#f4f0e8',
    200: '#e8ddd0',
    300: '#d9c7b0',
    400: '#c7a885',
    500: '#b89268',
    600: '#a67c52',
    700: '#8a6543',
    800: '#70533a',
    900: '#5c4530',
  },
  
  // Café torrado
  roasted: {
    50: '#fef9f3',
    100: '#fef2e6',
    200: '#fce4c7',
    300: '#f9d0a0',
    400: '#f5b474',
    500: '#f19c4b',
    600: '#e08534',
    700: '#bc6b2a',
    800: '#97552b',
    900: '#7c4728',
  },
  
  // Caramelo (acento doce)
  caramel: {
    50: '#fffdf7',
    100: '#fffaeb',
    200: '#fff2c7',
    300: '#ffe89e',
    400: '#ffd971',
    500: '#ffc747',
    600: '#ffb021',
    700: '#ff9500',
    800: '#e67a00',
    900: '#cc6a00',
  },
  
  // Chocolate (acento amargo)
  chocolate: {
    50: '#fcf9f6',
    100: '#f9f1eb',
    200: '#f2e0d1',
    300: '#e8cbb0',
    400: '#d9b088',
    500: '#c79560',
    600: '#b87c42',
    700: '#9c6635',
    800: '#7e5230',
    900: '#66442b',
  },
  
  // Verde natural (acento fresco)
  natural: {
    50: '#f7f7f6',
    100: '#ebeae8',
    200: '#d6d4d0',
    300: '#bebbb4',
    400: '#a19c93',
    500: '#878277',
    600: '#6f6a60',
    700: '#5c584d',
    800: '#4c4840',
    900: '#403d36',
  },
  
  // Status colors    
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  // Branco e preto
  white: '#ffffff',
  black: '#000000',
  
  // Overlay
  overlay: {
    light: 'rgba(0, 0, 0, 0.4)',
    medium: 'rgba(0, 0, 0, 0.6)',
    dark: 'rgba(0, 0, 0, 0.8)',
  },
} as const;

export const typography = {
  // Font families
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  // Base spacing unit: 4px
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const shadows = {
  // Soft shadows inspired by café foam
  sm: '0 1px 2px 0 rgba(92, 69, 48, 0.05)',
  base: '0 1px 3px 0 rgba(92, 69, 48, 0.1), 0 1px 2px -1px rgba(92, 69, 48, 0.1)',
  md: '0 4px 6px -1px rgba(92, 69, 48, 0.1), 0 2px 4px -2px rgba(92, 69, 48, 0.1)',
  lg: '0 10px 15px -3px rgba(92, 69, 48, 0.1), 0 4px 6px -4px rgba(92, 69, 48, 0.1)',
  xl: '0 20px 25px -5px rgba(92, 69, 48, 0.1), 0 8px 10px -6px rgba(92, 69, 48, 0.1)',
  '2xl': '0 25px 50px -12px rgba(92, 69, 48, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(92, 69, 48, 0.05)',
  none: 'none',
} as const;

export const animations = {
  // Smooth transitions
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  
  easing: {
    easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeIn: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeInOut: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  },
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;