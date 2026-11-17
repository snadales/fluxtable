import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-sunken': 'var(--surface-sunken)',
        line: 'var(--line)',
        'line-control': 'var(--line-control)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          strong: 'var(--accent-strong)',
          tint: 'var(--accent-tint)',
        },
        'on-accent': 'var(--on-accent)',
        ok: {
          DEFAULT: 'var(--ok)',
          tint: 'var(--ok-tint)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          tint: 'var(--warn-tint)',
        },
        error: {
          DEFAULT: 'var(--error)',
          tint: 'var(--error-tint)',
        },
        info: {
          DEFAULT: 'var(--info)',
          tint: 'var(--info-tint)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;
