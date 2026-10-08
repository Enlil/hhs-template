import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    // React, the router and Material UI already add up to about 500 kB before
    // any app code, which is where Vite starts warning; this leaves room to grow.
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: {{frontendPort}},
    strictPort: true,
  },
});
