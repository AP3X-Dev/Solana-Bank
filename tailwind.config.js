/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Solana brand colors
        'solana-teal': '#00FFC8',
        'solana-blue': '#4D7FFF',
        'solana-purple': '#C346FF',
        'solana-gradient-start': '#00FFC8',
        'solana-gradient-mid': '#4D7FFF',
        'solana-gradient-end': '#C346FF',

        // Dark theme colors
        'dark': '#0A0A0A',
        'dark-card': '#1A1A1A',
        'dark-light': '#2A2A2A',
        'dark-border': '#333333',

        // Text colors
        'light-text': '#FFFFFF',
        'muted-text': '#A1A1AA',
        'secondary-text': '#71717A',

        // Semantic colors
        'primary': '#00FFC8',
        'primary-foreground': '#000000',
        'secondary': '#2A2A2A',
        'secondary-foreground': '#FFFFFF',
        'accent': '#4D7FFF',
        'accent-foreground': '#FFFFFF',
        'destructive': '#EF4444',
        'destructive-foreground': '#FFFFFF',
        'success': '#10B981',
        'success-foreground': '#FFFFFF',
        'warning': '#F59E0B',
        'warning-foreground': '#000000',
        'info': '#3B82F6',
        'info-foreground': '#FFFFFF',

        // Component colors
        'background': '#0A0A0A',
        'foreground': '#FFFFFF',
        'card': '#1A1A1A',
        'card-foreground': '#FFFFFF',
        'popover': '#1A1A1A',
        'popover-foreground': '#FFFFFF',
        'border': '#333333',
        'input': '#2A2A2A',
        'ring': '#00FFC8',
      },
      backgroundImage: {
        'solana-gradient': 'linear-gradient(135deg, #00FFC8 0%, #4D7FFF 50%, #C346FF 100%)',
        'solana-gradient-vertical': 'linear-gradient(180deg, #00FFC8 0%, #4D7FFF 50%, #C346FF 100%)',
        'solana-gradient-radial': 'radial-gradient(circle, #00FFC8 0%, #4D7FFF 50%, #C346FF 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.4) 100%)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 10px 40px rgba(0, 0, 0, 0.35)',
        'button': '0 4px 14px rgba(0, 0, 0, 0.15)',
        'button-hover': '0 6px 20px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(0, 255, 200, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 255, 200, 0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'gradient': 'gradient 6s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
};
