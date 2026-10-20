import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';

const router = Router();

/**
 * GET /api/analytics/summary
 * Returns high-level dashboard metrics and KPIs.
 */
router.get('/summary', (req: Request, res: Response): void => {
  const counts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN decision = 'ALLOW' OR authentication_status = 'VERIFIED' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN decision = 'CHALLENGE' THEN 1 ELSE 0 END) as challenged,
      SUM(CASE WHEN decision = 'BLOCK' OR authentication_status = 'FAILED' THEN 1 ELSE 0 END) as blocked,
      AVG(risk_score) as avgScore,
      SUM(amount) as totalVolume
    FROM transactions
  `).get() as {
    total: number;
    approved: number | null;
    challenged: number | null;
    blocked: number | null;
    avgScore: number | null;
    totalVolume: number | null;
  };

  const total = counts.total || 0;
  const approved = counts.approved || 0;
  const challenged = counts.challenged || 0;
  const blocked = counts.blocked || 0;
  const avgScore = counts.avgScore ? Math.round(counts.avgScore * 10) / 10 : 0;
  const approvalRate = total > 0 ? Math.round((approved / total) * 1000) / 10 : 0;
  const totalVolume = counts.totalVolume ? Math.round(counts.totalVolume * 100) / 100 : 0;

  res.json({
    success: true,
    data: {
      totalTransactions: total,
      approvedTransactions: approved,
      challengedTransactions: challenged,
      blockedTransactions: blocked,
      averageRiskScore: avgScore,
      approvalRate,
      totalVolume,
    },
  });
});

/**
 * GET /api/analytics/risk-distribution
 * Returns chart-ready analytics for risk distribution, time series, histogram, and top indicators.
 */
router.get('/risk-distribution', (req: Request, res: Response): void => {
  // 1. Decision distribution
  const decisionRows = db.prepare(`
    SELECT decision, COUNT(*) as count
    FROM transactions
    GROUP BY decision
  `).all() as { decision: string; count: number }[];

  const distribution = {
    allow: 0,
    challenge: 0,
    block: 0,
  };

  for (const row of decisionRows) {
    if (row.decision === 'ALLOW') distribution.allow = row.count;
    if (row.decision === 'CHALLENGE') distribution.challenge = row.count;
    if (row.decision === 'BLOCK') distribution.block = row.count;
  }

  // 2. Score histogram (10-point buckets)
  const buckets = [
    { range: '0-9', min: 0, max: 9, count: 0 },
    { range: '10-19', min: 10, max: 19, count: 0 },
    { range: '20-29', min: 20, max: 29, count: 0 },
    { range: '30-39', min: 30, max: 39, count: 0 },
    { range: '40-49', min: 40, max: 49, count: 0 },
    { range: '50-59', min: 50, max: 59, count: 0 },
    { range: '60-69', min: 60, max: 69, count: 0 },
    { range: '70-79', min: 70, max: 79, count: 0 },
    { range: '80-89', min: 80, max: 89, count: 0 },
    { range: '90-100', min: 90, max: 100, count: 0 },
  ];

  const scoreRows = db.prepare('SELECT risk_score FROM transactions').all() as { risk_score: number }[];
  for (const row of scoreRows) {
    const s = row.risk_score;
    const bucket = buckets.find(b => s >= b.min && s <= b.max);
    if (bucket) bucket.count++;
  }

  // 3. Top risk indicators triggered
  const topIndicators = db.prepare(`
    SELECT 
      description,
      rule_code,
      COUNT(*) as frequency,
      AVG(score_contribution) as avgContribution
    FROM risk_reasons
    GROUP BY rule_code, description
    ORDER BY frequency DESC, ABS(avgContribution) DESC
    LIMIT 6
  `).all();

  // 4. Decisions chronological timeline (recent transactions)
  const timeline = db.prepare(`
    SELECT 
      reference_id,
      amount,
      risk_score,
      decision,
      created_at
    FROM transactions
    ORDER BY created_at ASC
    LIMIT 15
  `).all();

  res.json({
    success: true,
    data: {
      distribution,
      histogram: buckets,
      topIndicators,
      timeline,
    },
  });
});

export default router;
