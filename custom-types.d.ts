/**
 * WHY THIS WAS ADDED:
 * TypeScript does not natively understand non-code imports like CSS.
 * While Next.js handles the CSS bundling, the TS compiler throws an error
 * in layout.tsx saying "Cannot find module './globals.css'".
 * * This declaration allows TypeScript to recognize CSS files as modules,
 * removing the red squiggly lines while maintaining Tailwind v4 support.
 */
declare module '*.css';
