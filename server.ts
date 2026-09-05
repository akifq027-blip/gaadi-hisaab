import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initDatabase } from './server/db.js';
import { initMySQL } from './server/mysql.js';
import { apiRouter } from './server/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize Database & Test Connections
  try {
    initDatabase();
    await initMySQL();
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api', apiRouter);

  // Manifest endpoint for PWA installability without CORS or auth redirection
  app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'GAADI HISAAB',
      tagline: 'Hisaab, Trip aur Gaadi — Sab Ek Jagah',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite Middleware setup for Frontend Single-Page Application
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // Prevents WebSocket connection errors on closed ports
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚚 GAADI HISAAB server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GAADI HISAAB server:', err);
});
