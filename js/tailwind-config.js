/* ===================================================================
   CasacasStore – Tema de Tailwind (compartido por tienda y panel)
   Los valores de color viven en css/styles.css; acá solo se exponen
   como utilidades. Las esquinas son rectas: todos los rounded-* valen 0
   salvo rounded-full.
   =================================================================== */

tailwind.config = {
  theme: {
    borderRadius: { none: '0', sm: '0', DEFAULT: '0', md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0', full: '9999px' },
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', tile: 'var(--tile)',
        ink: 'var(--ink)', 'ink-2': 'var(--ink-2)', muted: 'var(--muted)', faint: 'var(--faint)',
        line: 'var(--line)', 'line-2': 'var(--line-2)', low: 'var(--low)',
        // Grises cálidos del mismo sistema, para las utilidades gray-* que quedan (p. ej. el comprobante)
        gray: {
          50: '#FAFAF8', 100: '#F4F4F2', 200: '#E7E7E3', 300: '#DADAD5', 400: '#B4B4AE',
          500: '#6B6B66', 600: '#55554F', 700: '#3A3A37', 800: '#262624', 900: '#121212',
        },
      },
    },
  },
};
