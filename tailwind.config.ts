import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        porsche: {
          red: '#C8102E',      // Guards Red
          silver: '#9DA0A4',   // GT Silver
          black: '#1A1A1A',    // Jet Black
          white: '#F5F5F0',    // Carrara White
          chalk: '#E8E8E8',    // Chalk
          graphite: '#2D2D2D', // Graphite
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'card': '0.5rem',
        'modal': '1rem',
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
export default config