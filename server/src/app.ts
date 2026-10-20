import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import transactionRoutes from './routes/transaction.routes.js';
import authRoutes from './routes/auth.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import eventRoutes from './routes/event.routes.js';
import { initDatabase } from './db/database.js';

export const app = express();

// Initialize SQLite database schema and seed data
initDatabase();

// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS Configuration
app.use(
  cors({
    origin: '*', // Local demonstration environment
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

// Simple in-memory rate limiter for sensitive authentication endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function simpleRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a minute before retrying.',
    });
    return;
  }

  clientData.count++;
  next();
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    product: 'SecureFlow Adaptive Authentication Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: 'demo-sandbox',
  });
});

// Mount API Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', simpleRateLimiter, authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/events', eventRoutes);

// Static Frontend Serving (in production or when client/dist exists)
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST_PATH = path.resolve(__dirname, '../../client/dist');
const ALT_CLIENT_DIST_PATH = path.resolve(__dirname, '../client/dist');

const activeDistPath = fs.existsSync(CLIENT_DIST_PATH) 
  ? CLIENT_DIST_PATH 
  : fs.existsSync(ALT_CLIENT_DIST_PATH) 
  ? ALT_CLIENT_DIST_PATH 
  : null;

if (activeDistPath) {
  app.use(express.static(activeDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(activeDistPath, 'index.html'));
  });
}

// 404 Handler for undefined API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested API route does not exist in SecureFlow.',
  });
});

// Centralized Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SecureFlow Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected security engine error occurred.' : err.message,
  });
});
