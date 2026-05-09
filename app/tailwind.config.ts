import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── OpenGagan brand palette (from logo) ── */
        'og-cream':     '#ECE8D4',   /* background — RGB 236,232,212 */
        'og-cream-lt':  '#F5F2E8',   /* lighter cream for cards */
        'og-navy':      '#1a2540',   /* primary text / "Open" */
        'og-olive':     '#6b7838',   /* accent / "Gagan" */
        'og-navy-muted':'#2d3d5c',   /* secondary text */
        /* ── legacy (keep for globe layers) ── */
        'sky-dark':     '#010810',
        'india-orange': '#FF8C00',
        'udan-green':   '#22C55E',
        'udan-red':     '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
