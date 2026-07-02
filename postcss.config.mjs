/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind CSS v4 — PostCSS 플러그인. autoprefixer는 v4에 내장되어 불필요.
    "@tailwindcss/postcss": {},
  },
};

export default config;
