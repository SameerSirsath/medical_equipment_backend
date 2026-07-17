import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


// The Flask backend this app talks to. Override with BACKEND_URL env var if needed.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// All of these paths are handled by app.py and need to be proxied to the
// Flask backend during development so that:
//   1. Requests are same-origin from the browser's point of view, which
//      means the Flask session cookie (used for auth / chat history / OTP)
//      is sent automatically without needing SameSite=None + HTTPS.
//   2. No CORS configuration is required at all in app.py.
const BACKEND_PATHS = [
  '/chat',
  '/inquiry',
  '/cookie-consent',
  '/accept_terms',
  '/admin',
  '/api',
  '/static',
];

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5175,
//   },
// });


export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    // allowedHosts: ['catalog-potato-alert-component.trycloudflare.com'],
    allowedHosts:true,
    proxy: {
      '/api': 'http://localhost:5000',
      '/chat': 'http://localhost:5000',
      '/inquiry': 'http://localhost:5000',
      '/cookie-consent': 'http://localhost:5000',
      '/accept_terms': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
      '/static': 'http://localhost:5000',
    }
  }
});