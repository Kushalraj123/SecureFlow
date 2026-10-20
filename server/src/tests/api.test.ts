import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { OtpService } from '../services/otp.service.js';
import { db, initDatabase } from '../db/database.js';

initDatabase();

describe('SecureFlow OTP Challenge & Verification Lifecycle', () => {
  it('Creates a short-lived challenge and verifies successfully with exact 6-digit code', () => {
    const testTxId = crypto.randomUUID();
    // Insert mock transaction
    db.prepare(`
      INSERT INTO transactions (id, reference_id, amount, currency, risk_score, decision, authentication_status, execution_time_ms, created_at)
      VALUES (?, ?, 1000, 'INR', 50, 'CHALLENGE', 'PENDING', 15, ?)
    `).run(testTxId, `TXN-${Math.floor(Math.random() * 900000)}`, new Date().toISOString());

    const challenge = OtpService.createChallenge(testTxId);
    assert.ok(challenge.challengeId);
    assert.ok(challenge.demoTestOtp);
    assert.equal(challenge.demoTestOtp.length, 6);

    // Verify with correct OTP
    const verifyResult = OtpService.verifyOtp(testTxId, challenge.demoTestOtp);
    assert.equal(verifyResult.success, true);
    assert.equal(verifyResult.message.includes('successfully'), true);
  });

  it('Fails verification on incorrect code and decrements remaining attempts', () => {
    const testTxId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO transactions (id, reference_id, amount, currency, risk_score, decision, authentication_status, execution_time_ms, created_at)
      VALUES (?, ?, 1000, 'INR', 50, 'CHALLENGE', 'PENDING', 15, ?)
    `).run(testTxId, `TXN-${Math.floor(Math.random() * 900000)}`, new Date().toISOString());

    OtpService.createChallenge(testTxId);

    // Incorrect code attempt 1
    const badAttempt1 = OtpService.verifyOtp(testTxId, '000000');
    assert.equal(badAttempt1.success, false);
    assert.equal(badAttempt1.attemptsRemaining, 2);

    // Incorrect code attempt 2
    const badAttempt2 = OtpService.verifyOtp(testTxId, '111111');
    assert.equal(badAttempt2.success, false);
    assert.equal(badAttempt2.attemptsRemaining, 1);

    // Incorrect code attempt 3 (exhausted)
    const badAttempt3 = OtpService.verifyOtp(testTxId, '222222');
    assert.equal(badAttempt3.success, false);
    assert.equal(badAttempt3.attemptsRemaining, 0);

    // Further attempts are locked
    const lockedAttempt = OtpService.verifyOtp(testTxId, '333333');
    assert.equal(lockedAttempt.success, false);
    assert.ok(lockedAttempt.message.includes('exceeded') || lockedAttempt.message.includes('locked'));
  });

  it('Rejects expired OTP codes', () => {
    const testTxId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO transactions (id, reference_id, amount, currency, risk_score, decision, authentication_status, execution_time_ms, created_at)
      VALUES (?, ?, 1000, 'INR', 50, 'CHALLENGE', 'PENDING', 15, ?)
    `).run(testTxId, `TXN-${Math.floor(Math.random() * 900000)}`, new Date().toISOString());

    const challenge = OtpService.createChallenge(testTxId);

    // Force expiration in past
    const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    db.prepare('UPDATE authentication_challenges SET expires_at = ? WHERE transaction_id = ?').run(
      pastDate,
      testTxId
    );

    const expiredResult = OtpService.verifyOtp(testTxId, challenge.demoTestOtp!);
    assert.equal(expiredResult.success, false);
    assert.equal(expiredResult.expired, true);
  });
});
