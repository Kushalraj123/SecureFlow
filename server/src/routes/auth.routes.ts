import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { OtpService } from '../services/otp.service.js';
import { SSEService } from '../services/sse.service.js';
import { VerifyOtpRequestSchema, ResendOtpRequestSchema } from '../schemas/transaction.schema.js';

const router = Router();

/**
 * POST /api/auth/verify-otp
 * Verify a challenge using a short-lived, server-managed OTP.
 */
router.post('/verify-otp', (req: Request, res: Response): void => {
  const parseResult = VerifyOtpRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid verification input',
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { transactionId, otp } = parseResult.data;

  // Verify transaction exists
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId) as any;
  if (!transaction) {
    res.status(404).json({ error: 'Transaction record not found' });
    return;
  }

  if (transaction.authentication_status === 'VERIFIED') {
    res.json({
      success: true,
      message: 'Transaction has already been authenticated.',
      status: 'VERIFIED',
    });
    return;
  }

  const verification = OtpService.verifyOtp(transactionId, otp);

  const now = new Date().toISOString();

  if (verification.success) {
    // Update transaction to VERIFIED
    db.prepare('UPDATE transactions SET authentication_status = ? WHERE id = ?').run(
      'VERIFIED',
      transactionId
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      transactionId,
      'OTP_VERIFIED_SUCCESS',
      'Two-factor OTP verified successfully. Transaction approved.',
      JSON.stringify({ verifiedAt: now }),
      now
    );

    // Broadcast SSE update
    SSEService.broadcast('transaction_updated', {
      id: transactionId,
      referenceId: transaction.reference_id,
      authenticationStatus: 'VERIFIED',
      message: 'OTP challenge verified successfully.',
      updatedAt: now,
    });

    res.json({
      success: true,
      message: verification.message,
      status: 'VERIFIED',
    });
    return;
  }

  // Verification failed
  const isLocked = verification.attemptsRemaining <= 0;
  const newStatus = isLocked ? 'FAILED' : 'PENDING';

  if (isLocked) {
    db.prepare('UPDATE transactions SET authentication_status = ? WHERE id = ?').run(
      'FAILED',
      transactionId
    );
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    transactionId,
    'OTP_VERIFIED_FAILED',
    verification.message,
    JSON.stringify({ attemptsRemaining: verification.attemptsRemaining, expired: verification.expired }),
    now
  );

  // Broadcast if failed permanently
  if (isLocked) {
    SSEService.broadcast('transaction_updated', {
      id: transactionId,
      referenceId: transaction.reference_id,
      authenticationStatus: 'FAILED',
      message: 'OTP verification failed - maximum attempts exceeded.',
      updatedAt: now,
    });
  }

  res.status(400).json({
    success: false,
    message: verification.message,
    attemptsRemaining: verification.attemptsRemaining,
    expired: verification.expired,
    status: newStatus,
  });
});

/**
 * POST /api/auth/resend-otp
 * Generates a fresh OTP challenge if within validity window.
 */
router.post('/resend-otp', (req: Request, res: Response): void => {
  const parseResult = ResendOtpRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid parameters' });
    return;
  }

  const { transactionId } = parseResult.data;
  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId) as any;
  if (!transaction) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  const newChallenge = OtpService.createChallenge(transactionId);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    transactionId,
    'OTP_RESENT',
    'A new step-up 2FA verification code was generated and dispatched.',
    JSON.stringify({ expiresAt: newChallenge.expiresAt }),
    now
  );

  res.json({
    success: true,
    message: 'New verification OTP generated.',
    data: newChallenge,
  });
});

export default router;
