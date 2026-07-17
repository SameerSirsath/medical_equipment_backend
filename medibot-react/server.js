import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const FLASK_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

// Allow CORS from Vite dev server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: 'http://localhost:5175',
    credentials: true,
  }));
}

// Proxy configuration
const proxyOptions = {
  target: FLASK_URL,
  changeOrigin: true,
  logLevel: 'debug',  // shows all proxied requests in console
  onProxyReq: (proxyReq, req) => {
    console.log(`➡️ Proxying ${req.method} ${req.url} → ${FLASK_URL}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy failed. Is Flask running?' });
  },
};

const proxy = createProxyMiddleware(proxyOptions);

// Proxy all backend endpoints
app.use('/api', proxy);
app.use('/chat', proxy);
app.use('/inquiry', proxy);
app.use('/cookie-consent', proxy);
app.use('/accept_terms', proxy);
app.use('/admin', proxy);
app.use('/static', proxy);   // for the avatar image

// Production: serve static React build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('⚙️ Development: Node proxies to Flask, Vite serves React.');
}

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`✅ Node server running on port ${PORT}`);
  console.log(`➡️ Proxying to Flask at ${FLASK_URL}`);
});