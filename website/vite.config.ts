import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress dynamic/static import mixing warnings
        if (warning.message?.includes('dynamically imported') && warning.message?.includes('statically imported')) return;
        // Suppress Node.js module externalization warnings
        if (warning.message?.includes('externalized for browser compatibility')) return;
        // Suppress circular dependency in node_modules
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message?.includes('node_modules')) return;
        warn(warning);
      }
    },
    chunkSizeWarningLimit: 2000,
  },
  logLevel: 'error',
});
