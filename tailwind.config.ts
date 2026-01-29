const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gender-m': '#3B82F6', // Blue for Maskulin (der)
        'gender-f': '#EF4444', // Red for Feminin (die)
        'gender-n': '#10B981', // Green for Neutrum (das)
        'gender-pl': '#F59E0B', // Amber for Plural
      },
    },
  },
  plugins: [],
}
export default config

