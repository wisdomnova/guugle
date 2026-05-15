// Design tokens strictly referencing CSS variables defined in globals.css
export const designTokens = {
  colors: {
    bg: {
      primary: 'var(--color-bg-primary)',
      elevated: 'var(--color-bg-elevated)',
      accent: 'var(--color-bg-accent)',
      card: 'var(--color-bg-card)',
    },
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
      muted: 'var(--color-text-muted)',
    },
    border: {
      default: 'var(--color-border)',
      subtle: 'var(--color-border-subtle)',
    },
    accent: {
      primary: 'var(--color-accent)',
      hover: 'var(--color-accent-hover)',
      soft: 'var(--color-accent-soft)',
      secondary: 'var(--color-accent-secondary)',
      tertiary: 'var(--color-accent-tertiary)',
    },
    signal: {
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      danger: 'var(--color-danger)',
      info: 'var(--color-info)',
    },
  },
  typography: {
    fonts: {
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    },
    sizes: {
      xs: 'var(--type-xs)',
      sm: 'var(--type-sm)',
      base: 'var(--type-base)',
      lg: 'var(--type-lg)',
      xl: 'var(--type-xl)',
      '2xl': 'var(--type-2xl)',
      '3xl': 'var(--type-3xl)',
      hero: 'var(--type-hero)',
    }
  },
  spacing: {
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
    5: 'var(--spacing-5)',
    6: 'var(--spacing-6)',
    8: 'var(--spacing-8)',
    10: 'var(--spacing-10)',
    12: 'var(--spacing-12)',
    16: 'var(--spacing-16)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    full: 'var(--radius-full)',
  },
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },
  easing: {
    outExpo: 'var(--ease-out-expo)',
    outQuart: 'var(--ease-out-quart)',
    inOutQuart: 'var(--ease-in-out-quart)',
  },
  durations: {
    instant: 'var(--duration-instant)',
    fast: 'var(--duration-fast)',
    normal: 'var(--duration-normal)',
    slow: 'var(--duration-slow)',
  },
} as const;
