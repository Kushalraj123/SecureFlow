import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { SSEService } from '../services/sse.service.js';

const router = Router();

/**
 * GET /api/events/stream
 * Provide an SSE stream for real-time transaction events.
 */
router.get('/stream', (req: Request, res: Response): void => {
  const clientId = crypto.randomUUID();

  SSEService.addClient(clientId, res);

  req.on('close', () => {
    SSEService.removeClient(clientId);
  });
});

export default router;
