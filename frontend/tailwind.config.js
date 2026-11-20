/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mantu: {
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          text: '#17212B',
          muted: '#697586',
          border: '#E5E9EF',
          accent: {
            DEFAULT: '#2457D6',
            hover: '#1B45B2',
            subtle: '#EEF3FD',
          },
          success: {
            DEFAULT: '#16845B',
            subtle: '#ECF8F2',
          },
          warning: {
            DEFAULT: '#B7791F',
            subtle: '#FEF7ED',
          },
          error: {
            DEFAULT: '#D64545',
            subtle: '#FDF2F2',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        card: '0 1px 3px 0 rgba(23, 33, 43, 0.05), 0 1px 2px -1px rgba(23, 33, 43, 0.03)',
        modal: '0 20px 25px -5px rgba(23, 33, 43, 0.1), 0 8px 10px -6px rgba(23, 33, 43, 0.1)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
    },
  },
  plugins: [],
}
