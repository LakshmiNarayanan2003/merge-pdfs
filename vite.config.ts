import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { cpSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/merge-pdfs/',
  plugins: [
    react(),
    {
      name: 'development-hmr-csp',
      apply: 'serve',
      transformIndexHtml(html) {
        return html
          .replace(
            "script-src 'self' 'wasm-unsafe-eval'",
            "script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'",
          )
          .replace("connect-src 'self'", "connect-src 'self' ws:");
      },
    },
    {
      name: 'local-pdf-assets',
      buildStart() {
        for (const dir of ['cmaps', 'standard_fonts', 'wasm']) {
          cpSync(
            resolve('node_modules/pdfjs-dist', dir),
            resolve('public/pdfjs', dir),
            { recursive: true },
          );
        }
      },
    },
  ],
  build: { target: 'es2022' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.*',
        'src/test-setup.ts',
        'src/main.tsx',
        'src/lib/types.ts',
      ],
    },
  },
});
