import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0a0a0f',
        bg2:     '#13131a',
        bg3:     '#1c1c28',
        accent:  '#7c6dfa',
        accent2: '#a78bfa',
        ngreen:  '#22d3a0',
        amber:   '#f59e0b',
        nred:    '#f87171',
        wa:      '#25D366',
        text1:   '#f0f0f8',
        text2:   '#8b8ba0',
        text3:   '#55556a',
      },
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        sm:   '10px',
      },
    },
  },
  plugins: [],
}
export default config
