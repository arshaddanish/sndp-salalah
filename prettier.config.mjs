/** @type {import('prettier').Config} */
const config = {
  arrowParens: 'always',
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  plugins: ['prettier-plugin-tailwindcss']
};

export default config;