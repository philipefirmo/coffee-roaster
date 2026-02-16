/** @type {import('tailwindcss').Config} */

import { colors, typography, spacing, borderRadius, shadows } from './src/styles/design-tokens.ts';

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Cores premium de café
      colors: {
        // Neutros (tons de café)
        espresso: colors.espresso,
        roasted: colors.roasted,
        caramel: colors.caramel,
        chocolate: colors.chocolate,
        natural: colors.natural,
        
        // Status
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        
        // Overlay
        overlay: colors.overlay,
      },
      
      // Tipografia premium
      fontFamily: {
        sans: typography.fontFamily.primary,
        mono: typography.fontFamily.mono,
      },
      
      fontSize: {
        xs: typography.fontSize.xs,
        sm: typography.fontSize.sm,
        base: typography.fontSize.base,
        lg: typography.fontSize.lg,
        xl: typography.fontSize.xl,
        '2xl': typography.fontSize['2xl'],
        '3xl': typography.fontSize['3xl'],
        '4xl': typography.fontSize['4xl'],
        '5xl': typography.fontSize['5xl'],
      },
      
      fontWeight: {
        light: typography.fontWeight.light,
        normal: typography.fontWeight.normal,
        medium: typography.fontWeight.medium,
        semibold: typography.fontWeight.semibold,
        bold: typography.fontWeight.bold,
      },
      
      lineHeight: {
        tight: typography.lineHeight.tight,
        normal: typography.lineHeight.normal,
        relaxed: typography.lineHeight.relaxed,
      },
      
      // Espaçamento refinado
      spacing: spacing,
      
      // Bordas elegantes
      borderRadius: borderRadius,
      
      // Sombras sofisticadas
      boxShadow: shadows,
      
      // Animações suaves
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ease-in': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
        'ease-in-out': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
      },
      
      // Gradientes inspirados em café
      backgroundImage: {
        'coffee-gradient': 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #CD853F 100%)',
        'latte-gradient': 'linear-gradient(135deg, #F5F5DC 0%, #F5DEB3 50%, #DEB887 100%)',
        'espresso-gradient': 'linear-gradient(135deg, #2F1B14 0%, #4A2C17 50%, #6B4423 100%)',
        'caramel-gradient': 'linear-gradient(135deg, #F4A460 0%, #D2691E 50%, #A0522D 100%)',
      },
      
      // Animações customizadas
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 180, 116, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 180, 116, 0.6)' },
        },
      },
      
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};