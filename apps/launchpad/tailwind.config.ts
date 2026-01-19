import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#0A0A0F',
          card: '#121218',
          surface: '#1A1A20',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          tertiary: '#00C2FF',
          muted: '#2A2A2A',
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          foreground: '#FFFFFF',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#52525B',
        },
        status: {
          success: '#00FF94',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        // Shadcn UI Colors
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'rgba(255, 255, 255, 0.1)',
        ring: 'var(--accent-primary)',
        background: '#0A0A0F',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: 'var(--accent-primary)',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: 'var(--accent-secondary)',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#2A2A2A',
          foreground: '#A1A1AA',
        },
        popover: {
          DEFAULT: '#121218',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#121218',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow':
          'conic-gradient(from 90deg at 50% 50%, #00000000 50%, #000 50%), radial-gradient(rgba(0, 255, 148, 0.05) 0%, transparent 80%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(0, 255, 148, 0.3)',
        'glow-secondary': '0 0 20px -5px rgba(0, 194, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
