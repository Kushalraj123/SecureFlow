import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'secureflow.db');

export const db: Database.Database = new Database(DB_PATH);

// Enable SQLite WAL mode (Write-Ahead Logging) for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      reference_id TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      customer_name TEXT,
      customer_email TEXT,
      merchant_name TEXT DEFAULT 'SecureFlow Demo Store',
      risk_score INTEGER NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('ALLOW', 'CHALLENGE', 'BLOCK')),
      authentication_status TEXT NOT NULL CHECK(authentication_status IN ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'FAILED', 'BLOCKED')),
      execution_time_ms REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_decision ON transactions(decision);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(authentication_status);
    CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id);

    CREATE TABLE IF NOT EXISTS transaction_signals (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      device_trust TEXT NOT NULL,
      ip_reputation TEXT NOT NULL,
      geographic_velocity_status TEXT NOT NULL,
      dwell_time REAL NOT NULL,
      mouse_entropy REAL NOT NULL,
      paste_detected INTEGER NOT NULL DEFAULT 0,
      typing_cadence TEXT NOT NULL,
      transaction_velocity TEXT NOT NULL,
      ip_address TEXT,
      location TEXT,
      device_id TEXT,
      user_agent TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_signals_tx ON transaction_signals(transaction_id);

    CREATE TABLE IF NOT EXISTS risk_reasons (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      rule_code TEXT NOT NULL,
      description TEXT NOT NULL,
      score_contribution INTEGER NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reasons_tx ON risk_reasons(transaction_id);

    CREATE TABLE IF NOT EXISTS authentication_challenges (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      demo_otp_clear TEXT, -- Stored exclusively for demonstration display in local dev mode
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      verified_at TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_challenges_tx ON authentication_challenges(transaction_id);

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audit_tx ON audit_events(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);
  `);

  seedInitialDataIfEmpty();
}

/**
 * Seeds realistic demonstration data if database is fresh
 */
function seedInitialDataIfEmpty(): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  if (countRow.count > 0) {
    return;
  }

  const sampleTransactions = [
    {
      ref: 'TXN-794012',
      amount: 1499.00,
      customer: 'Priya Patel',
      email: 'priya.patel@gmail.com',
      score: 10,
      decision: 'ALLOW',
      auth: 'NOT_REQUIRED',
      ip: '103.22.14.88 (Bangalore, IN)',
      loc: 'Bangalore, Karnataka, India',
      device: 'dev_priya_macbook',
      trust: 'TRUSTED',
      ipRep: 'GOOD',
      geo: 'NORMAL',
      dwell: 6.4,
      entropy: 0.91,
      paste: 0,
      cadence: 'NORMAL',
      velocity: 'NORMAL',
      rules: [
        { code: 'RULE_TRUSTED_DEVICE', desc: 'Hardware Trusted Device Token', pts: -15 },
        { code: 'RULE_NORMAL_DWELL', desc: 'Natural Human Dwell Time', pts: -10 },
        { code: 'RULE_NORMAL_TYPING', desc: 'Human Keystroke Dynamics', pts: -5 },
      ],
      offsetMinutes: 45,
    },
    {
      ref: 'TXN-794013',
      amount: 8990.00,
      customer: 'Vikram Mehta',
      email: 'vikram.m@outlook.com',
      score: 55,
      decision: 'CHALLENGE',
      auth: 'VERIFIED',
      ip: '185.191.171.12 (Frankfurt, DE)',
      loc: 'Frankfurt, Germany',
      device: 'dev_unknown_ff92',
      trust: 'NEW',
      ipRep: 'SUSPICIOUS',
      geo: 'IMPOSSIBLE_TRAVEL',
      dwell: 3.8,
      entropy: 0.65,
      paste: 0,
      cadence: 'NORMAL',
      velocity: 'NORMAL',
      rules: [
        { code: 'RULE_IMPOSSIBLE_TRAVEL', desc: 'Impossible Geographic Velocity', pts: 35 },
        { code: 'RULE_SUSPICIOUS_IP', desc: 'Data-Center / Commercial VPN IP', pts: 20 },
        { code: 'RULE_NEW_DEVICE', desc: 'Unrecognized Device Signature', pts: 15 },
        { code: 'RULE_NORMAL_DWELL', desc: 'Natural Human Dwell Time', pts: -10 },
        { code: 'RULE_NORMAL_TYPING', desc: 'Human Keystroke Dynamics', pts: -5 },
      ],
      offsetMinutes: 30,
    },
    {
      ref: 'TXN-794014',
      amount: 45000.00,
      customer: 'Anonymous Cardholder',
      email: 'bot_proxy_99@tempmail.ninja',
      score: 95,
      decision: 'BLOCK',
      auth: 'BLOCKED',
      ip: '45.146.164.110 (Tor Exit)',
      loc: 'Anonymized Proxy Server',
      device: 'dev_headless_chrome',
      trust: 'NEW',
      ipRep: 'BLACKLISTED',
      geo: 'IMPOSSIBLE_TRAVEL',
      dwell: 0.35,
      entropy: 0.02,
      paste: 1,
      cadence: 'BOT_LIKE',
      velocity: 'BURST',
      rules: [
        { code: 'RULE_BLACKLISTED_IP', desc: 'High-Risk / Tor / Proxy IP', pts: 40 },
        { code: 'RULE_IMPOSSIBLE_TRAVEL', desc: 'Impossible Geographic Velocity', pts: 35 },
        { code: 'RULE_BURST_VELOCITY', desc: 'Card-Testing Burst Velocity', pts: 30 },
        { code: 'RULE_LOW_MOUSE_ENTROPY', desc: 'Synthetic / Zero Mouse Entropy', pts: 20 },
        { code: 'RULE_FAST_SUBMISSION', desc: 'Sub-Second Form Submission', pts: 20 },
        { code: 'RULE_PASTE_DETECTED', desc: 'Automated Clipboard Injection', pts: 15 },
        { code: 'RULE_BOT_TYPING', desc: 'Mechanized Typing Cadence', pts: 15 },
        { code: 'RULE_NEW_DEVICE', desc: 'Unrecognized Device Signature', pts: 15 },
      ],
      offsetMinutes: 20,
    },
    {
      ref: 'TXN-794015',
      amount: 3200.00,
      customer: 'Ananya Deshmukh',
      email: 'ananya.d@gmail.com',
      score: 45,
      decision: 'CHALLENGE',
      auth: 'PENDING',
      ip: '103.88.22.9 (Pune, IN)',
      loc: 'Pune, Maharashtra, India',
      device: 'dev_iphone_15_pro',
      trust: 'NEW',
      ipRep: 'GOOD',
      geo: 'NORMAL',
      dwell: 0.85,
      entropy: 0.45,
      paste: 1,
      cadence: 'NORMAL',
      velocity: 'HIGH',
      rules: [
        { code: 'RULE_HIGH_VELOCITY', desc: 'Elevated Transaction Velocity', pts: 20 },
        { code: 'RULE_FAST_SUBMISSION', desc: 'Sub-Second Form Submission', pts: 20 },
        { code: 'RULE_PASTE_DETECTED', desc: 'Automated Clipboard Injection', pts: 15 },
        { code: 'RULE_NEW_DEVICE', desc: 'Unrecognized Device Signature', pts: 15 },
        { code: 'RULE_NORMAL_TYPING', desc: 'Human Keystroke Dynamics', pts: -5 },
      ],
      offsetMinutes: 10,
    },
    {
      ref: 'TXN-794016',
      amount: 620.00,
      customer: 'Rahul Verma',
      email: 'rahul.v@cyber.in',
      score: 5,
      decision: 'ALLOW',
      auth: 'NOT_REQUIRED',
      ip: '103.21.244.18 (Delhi, IN)',
      loc: 'New Delhi, Delhi, India',
      device: 'dev_rahul_pixel8',
      trust: 'TRUSTED',
      ipRep: 'GOOD',
      geo: 'NORMAL',
      dwell: 8.2,
      entropy: 0.94,
      paste: 0,
      cadence: 'NORMAL',
      velocity: 'NORMAL',
      rules: [
        { code: 'RULE_TRUSTED_DEVICE', desc: 'Hardware Trusted Device Token', pts: -15 },
        { code: 'RULE_NORMAL_DWELL', desc: 'Natural Human Dwell Time', pts: -10 },
        { code: 'RULE_NORMAL_TYPING', desc: 'Human Keystroke Dynamics', pts: -5 },
      ],
      offsetMinutes: 3,
    },
  ];

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, reference_id, amount, currency, customer_name, customer_email, merchant_name, risk_score, decision, authentication_status, execution_time_ms, created_at)
    VALUES (?, ?, ?, 'INR', ?, ?, 'SecureFlow Demo Store', ?, ?, ?, ?, ?)
  `);

  const insertSig = db.prepare(`
    INSERT INTO transaction_signals (id, transaction_id, device_trust, ip_reputation, geographic_velocity_status, dwell_time, mouse_entropy, paste_detected, typing_cadence, transaction_velocity, ip_address, location, device_id, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReason = db.prepare(`
    INSERT INTO risk_reasons (id, transaction_id, rule_code, description, score_contribution)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_events (id, transaction_id, event_type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertChallenge = db.prepare(`
    INSERT INTO authentication_challenges (id, transaction_id, otp_hash, demo_otp_clear, expires_at, attempts, max_attempts, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, 3, ?)
  `);

  const now = Date.now();

  const seedTransaction = db.transaction(() => {
    for (const item of sampleTransactions) {
      const txId = crypto.randomUUID();
      const createdAt = new Date(now - item.offsetMinutes * 60 * 1000).toISOString();
      const execTime = Math.round(12 + Math.random() * 25);

      insertTx.run(txId, item.ref, item.amount, item.customer, item.email, item.score, item.decision, item.auth, execTime, createdAt);

      insertSig.run(
        crypto.randomUUID(),
        txId,
        item.trust,
        item.ipRep,
        item.geo,
        item.dwell,
        item.entropy,
        item.paste,
        item.cadence,
        item.velocity,
        item.ip,
        item.loc,
        item.device,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecureFlow-Telemetry/2.1'
      );

      for (const r of item.rules) {
        insertReason.run(crypto.randomUUID(), txId, r.code, r.desc, r.pts);
      }

      insertAudit.run(
        crypto.randomUUID(),
        txId,
        'RISK_EVALUATION',
        `Evaluated transaction risk score: ${item.score}/100 [${item.decision}]`,
        JSON.stringify({ rulesTriggered: item.rules.length, executionTimeMs: execTime }),
        createdAt
      );

      if (item.decision === 'CHALLENGE') {
        const dummyOtp = '482910';
        const hash = crypto.createHash('sha256').update(dummyOtp).digest('hex');
        const expTime = new Date(new Date(createdAt).getTime() + 10 * 60 * 1000).toISOString();
        const verifiedAt = item.auth === 'VERIFIED' ? new Date(new Date(createdAt).getTime() + 45 * 1000).toISOString() : null;

        insertChallenge.run(crypto.randomUUID(), txId, hash, dummyOtp, expTime, item.auth === 'VERIFIED' ? 1 : 0, verifiedAt);

        if (item.auth === 'VERIFIED') {
          insertAudit.run(
            crypto.randomUUID(),
            txId,
            'OTP_VERIFIED',
            'Step-up 2FA OTP verified successfully. Transaction approved.',
            JSON.stringify({ attempt: 1 }),
            verifiedAt!
          );
        }
      } else if (item.decision === 'BLOCK') {
        insertAudit.run(
          crypto.randomUUID(),
          txId,
          'TRANSACTION_BLOCKED',
          'Transaction blocked immediately due to excessive risk score exceeding threshold (75+).',
          JSON.stringify({ score: item.score }),
          createdAt
        );
      } else {
        insertAudit.run(
          crypto.randomUUID(),
          txId,
          'TRANSACTION_APPROVED',
          'Frictionless approval granted. Score under challenge barrier.',
          JSON.stringify({ score: item.score }),
          createdAt
        );
      }
    }
  });

  seedTransaction();
}
