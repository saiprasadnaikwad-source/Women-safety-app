import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Women-safety-app/',
  server: {
    port: 3001,
    host: true
  }
});
