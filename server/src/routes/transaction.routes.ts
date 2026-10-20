import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { RiskEngine } from '../engine/riskEngine.js';
import { OtpService } from '../services/otp.service.js';
import { SSEService } from '../services/sse.service.js';
import {
  EvaluateScoreRequestSchema,
  CreateTransactionRequestSchema,
  TransactionQuerySchema,
} from '../schemas/transaction.schema.js';
import type { AuthenticationStatus } from '../types/index.js';

const router = Router();

/**
 * POST /api/transactions/score
 * Evaluate a simulated transaction and return its score, decision, and reason codes without recording.
 */
router.post('/score', (req: Request, res: Response): void => {
  const parseResult = EvaluateScoreRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid request payload',
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { signals } = parseResult.data;
  const startTime = performance.now();
  const evaluation = RiskEngine.evaluate(signals);
  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

  res.json({
    success: true,
    data: {
      ...evaluation,
      executionTimeMs,
      evaluatedAt: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/transactions
 * Execute and record a transaction simulation with appropriate validation and audit logging.
 */
router.post('/', (req: Request, res: Response): void => {
  const parseResult = CreateTransactionRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'Invalid transaction parameters',
      details: parseResult.error.flatten(),
    });
    return;
  }

  const { amount, currency, customerName, customerEmail, merchantName, signals } = parseResult.data;

  const startTime = performance.now();
  // Server-side deterministic calculation (never trust client score)
  const evaluation = RiskEngine.evaluate(signals);
  const executionTimeMs = Math.max(1, Math.round(performance.now() - startTime));

  const transactionId = crypto.randomUUID();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const referenceId = `TXN-${randomSuffix}`;
  const createdAt = new Date().toISOString();

  let initialAuthStatus: AuthenticationStatus = 'NOT_REQUIRED';
  if (evaluation.decision === 'CHALLENGE') {
    initialAuthStatus = 'PENDING';
  } else if (evaluation.decision === 'BLOCK') {
    initialAuthStatus = 'BLOCKED';
  }

  // Insert into SQLite transactionally
  const insertAll = db.transaction(() => {
    // 1. Transactions table
    db.prepare(`
      INSERT INTO transactions (
        id, reference_id, amount, currency, customer_name, customer_email, merchant_name,
        risk_score, decision, authentication_status, execution_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transactionId,
      referenceId,
      amount,
      currency,
      customerName,
      customerEmail,
      merchantName,
      evaluation.finalScore,
      evaluation.decision,
      initialAuthStatus,
      executionTimeMs,
      createdAt
    );

    // 2. Transaction signals
    db.prepare(`
      INSERT INTO transaction_signals (
        id, transaction_id, device_trust, ip_reputation, geographic_velocity_status,
        dwell_time, mouse_entropy, paste_detected, typing_cadence, transaction_velocity,
        ip_address, location, device_id, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      transactionId,
      signals.deviceTrust,
      signals.ipReputation,
      signals.geographicVelocityStatus,
      signals.dwellTime,
      signals.mouseEntropy,
      signals.pasteDetected ? 1 : 0,
      signals.typingCadence,
      signals.transactionVelocity,
      signals.ipAddress || '103.21.244.18',
      signals.location || 'Mumbai, India',
      signals.deviceId || 'dev_demo_session',
      signals.userAgent || req.headers['user-agent'] || 'SecureFlow-Client/1.0'
    );

    // 3. Risk reasons
    const insertReason = db.prepare(`
      INSERT INTO risk_reasons (id, transaction_id, rule_code, description, score_contribution)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const rule of evaluation.triggeredRules) {
      insertReason.run(
        crypto.randomUUID(),
        transactionId,
        rule.ruleCode,
        rule.name,
        rule.contribution
      );
    }

    // 4. Audit event
    db.prepare(`
      INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      transactionId,
      'RISK_EVALUATION',
      `Calculated risk score ${evaluation.finalScore}/100. Decision: ${evaluation.decision}. Reason: ${evaluation.primaryReason}`,
      JSON.stringify({
        rulesCount: evaluation.triggeredRules.length,
        executionTimeMs,
        positiveRisk: evaluation.positiveContributions,
        trustOffset: evaluation.negativeContributions,
      }),
      createdAt
    );
  });

  insertAll();

  // If CHALLENGE, create an OTP verification challenge
  let challengeInfo: { challengeId: string; expiresAt: string; demoTestOtp?: string } | null = null;
  if (evaluation.decision === 'CHALLENGE') {
    challengeInfo = OtpService.createChallenge(transactionId);

    db.prepare(`
      INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      transactionId,
      'CHALLENGE_ISSUED',
      `Step-up OTP challenge issued. Expires in 5 minutes.`,
      JSON.stringify({ challengeId: challengeInfo.challengeId, expiresAt: challengeInfo.expiresAt }),
      createdAt
    );
  } else if (evaluation.decision === 'BLOCK') {
    db.prepare(`
      INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      transactionId,
      'TRANSACTION_BLOCKED',
      `Simulated transaction blocked. Risk score of ${evaluation.finalScore} exceeds 75-point threshold.`,
      JSON.stringify({ score: evaluation.finalScore }),
      createdAt
    );
  } else {
    db.prepare(`
      INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      transactionId,
      'TRANSACTION_APPROVED',
      `Transaction approved without customer challenge.`,
      JSON.stringify({ score: evaluation.finalScore }),
      createdAt
    );
  }

  // Sanitized broadcast payload via SSE
  const broadcastPayload = {
    id: transactionId,
    referenceId,
    amount,
    currency,
    customerName,
    riskScore: evaluation.finalScore,
    decision: evaluation.decision,
    authenticationStatus: initialAuthStatus,
    primaryReason: evaluation.primaryReason,
    deviceTrust: signals.deviceTrust,
    ipReputation: signals.ipReputation,
    location: signals.location || 'Mumbai, India',
    createdAt,
  };

  SSEService.broadcast('transaction_created', broadcastPayload);

  res.status(201).json({
    success: true,
    data: {
      id: transactionId,
      referenceId,
      amount,
      currency,
      customerName,
      customerEmail,
      merchantName,
      riskScore: evaluation.finalScore,
      decision: evaluation.decision,
      riskLevel: evaluation.riskLevel,
      authenticationStatus: initialAuthStatus,
      executionTimeMs,
      createdAt,
      evaluation,
      signals,
      challenge: challengeInfo,
    },
  });
});

/**
 * GET /api/transactions
 * Return paginated transaction records with filtering and search.
 */
router.get('/', (req: Request, res: Response): void => {
  const queryResult = TransactionQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    res.status(400).json({
      error: 'Invalid query parameters',
      details: queryResult.error.flatten(),
    });
    return;
  }

  const { page, limit, search, decision, status, startDate, endDate } = queryResult.data;
  const offset = (page - 1) * limit;

  let whereClauses: string[] = [];
  const params: unknown[] = [];

  if (search) {
    whereClauses.push('(t.reference_id LIKE ? OR t.customer_name LIKE ? OR t.customer_email LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (decision) {
    whereClauses.push('t.decision = ?');
    params.push(decision);
  }

  if (status) {
    whereClauses.push('t.authentication_status = ?');
    params.push(status);
  }

  if (startDate) {
    whereClauses.push('t.created_at >= ?');
    params.push(startDate);
  }

  if (endDate) {
    whereClauses.push('t.created_at <= ?');
    params.push(endDate);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalRow = db.prepare(`SELECT COUNT(*) as total FROM transactions t ${whereSql}`).get(...params) as { total: number };
  const total = totalRow.total;

  const rows = db.prepare(`
    SELECT 
      t.id, t.reference_id, t.amount, t.currency, t.customer_name, t.customer_email,
      t.merchant_name, t.risk_score, t.decision, t.authentication_status,
      t.execution_time_ms, t.created_at,
      s.device_trust, s.ip_reputation, s.geographic_velocity_status, s.ip_address, s.location,
      (SELECT description FROM risk_reasons r WHERE r.transaction_id = t.id ORDER BY ABS(r.score_contribution) DESC LIMIT 1) as main_reason
    FROM transactions t
    LEFT JOIN transaction_signals s ON s.transaction_id = t.id
    ${whereSql}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    success: true,
    data: {
      transactions: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * GET /api/transactions/:id
 * Return transaction details, individual signal contributions, and audit history.
 */
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  const transaction = db.prepare(`
    SELECT * FROM transactions WHERE id = ? OR reference_id = ?
  `).get(id, id) as any;

  if (!transaction) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  const signals = db.prepare(`
    SELECT * FROM transaction_signals WHERE transaction_id = ?
  `).get(transaction.id);

  const reasons = db.prepare(`
    SELECT * FROM risk_reasons WHERE transaction_id = ? ORDER BY ABS(score_contribution) DESC
  `).all(transaction.id);

  const auditEvents = db.prepare(`
    SELECT * FROM audit_events WHERE transaction_id = ? ORDER BY created_at ASC
  `).all(transaction.id);

  const challenge = db.prepare(`
    SELECT id, transaction_id, demo_otp_clear, expires_at, attempts, max_attempts, verified_at
    FROM authentication_challenges WHERE transaction_id = ?
  `).get(transaction.id);

  res.json({
    success: true,
    data: {
      ...transaction,
      signals,
      reasons,
      auditEvents,
      challenge,
    },
  });
});

export default router;
