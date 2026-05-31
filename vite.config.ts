import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'packages/shared/src'),
      '@shell': path.resolve(__dirname, 'packages/shell/src'),
      '@amis-renderer': path.resolve(__dirname, 'packages/amis-renderer/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: '/index.html',
    },
  },
});
