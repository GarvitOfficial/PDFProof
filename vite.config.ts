import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1600,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
