import { app } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  SecureFlow Core Security API Engine running on http://localhost:${PORT}`);
  console.log(`📊  SSE Event Stream available at http://localhost:${PORT}/api/events/stream`);
  console.log(`⚡  Deterministic Scoring & SQLite WAL Mode active`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
