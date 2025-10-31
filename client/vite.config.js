import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // allows access from other devices
    port: 5713,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://192.168.1.154:5000", // your backend
        changeOrigin: true,
      },
    },
    // Allow NGROK hosts
    allowedHosts: ['.ngrok-free.dev'], // ✅ allows all ngrok subdomains
  },
});
