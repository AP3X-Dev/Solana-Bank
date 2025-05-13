/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'solana-teal': '#00FFC8',
        'solana-blue': '#4D7FFF',
        'solana-purple': '#C346FF',
        'solana-gradient-start': '#00FFC8',
        'solana-gradient-mid': '#4D7FFF',
        'solana-gradient-end': '#C346FF',
        'dark': '#121212',
        'dark-card': '#1E1E1E',
        'dark-light': '#2D2D2D',
        'light-text': '#F8F9FA',
        'muted-text': '#A0AEC0',
      },
      backgroundImage: {
        'solana-gradient': 'linear-gradient(90deg, #00FFC8 0%, #4D7FFF 50%, #C346FF 100%)',
        'solana-gradient-vertical': 'linear-gradient(180deg, #00FFC8 0%, #4D7FFF 50%, #C346FF 100%)',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.25)',
        'button': '0 4px 10px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
