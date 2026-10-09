export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Nova Paleta Premium: Baseada no gradiente profundo
        ink: '#000000',
        paper: '#FFFFFF',
        line: 'rgba(255,255,255,0.1)',
        mute: '#94a3b8',
        graphite: '#cbd5e1',
        accent: {
          DEFAULT: '#3b9ce2', // Azul vibrante do gradiente
          dark: '#00009a',    // Azul profundo
          soft: 'rgba(59, 156, 226, 0.1)'
        },
        deep: {
          DEFAULT: '#010009', // Preto azulado
          dark: '#000000',
        },
        brass: { DEFAULT: '#A8783A', soft: '#F4ECDD' },
      },
      fontFamily: { serif: ['Newsreader', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
