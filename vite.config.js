import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The page lives in web/ and reuses lib/metrics.js from the repo root (one source for every formula).
export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  test: { root: '.', environment: 'node', include: ['web/src/**/*.test.js'] },
});
