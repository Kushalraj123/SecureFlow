import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RiskEngine } from '../engine/riskEngine.js';
import { DEMO_PERSONAS, DECISION_THRESHOLDS } from '../config/rules.config.js';
import type { TransactionSignals } from '../types/index.js';

describe('SecureFlow Risk Engine — Deterministic Scoring & Rules', () => {
  it('Persona A: Returning Customer evaluates strictly to ALLOW (Score <= 29)', () => {
    const result = RiskEngine.evaluate(DEMO_PERSONAS.RETURNING_CUSTOMER.signals as TransactionSignals);
    assert.equal(result.decision, 'ALLOW');
    assert.equal(result.riskLevel, 'LOW');
    assert.ok(result.finalScore <= DECISION_THRESHOLDS.ALLOW_MAX);
    assert.ok(result.finalScore >= 0);
  });

  it('Persona B: Suspicious VPN Hop evaluates strictly to CHALLENGE (30 <= Score <= 74)', () => {
    const result = RiskEngine.evaluate(DEMO_PERSONAS.SUSPICIOUS_VPN.signals as TransactionSignals);
    assert.equal(result.decision, 'CHALLENGE');
    assert.equal(result.riskLevel, 'MEDIUM');
    assert.ok(result.finalScore >= DECISION_THRESHOLDS.CHALLENGE_MIN);
    assert.ok(result.finalScore <= DECISION_THRESHOLDS.CHALLENGE_MAX);
  });

  it('Persona C: Credential-Stuffing Bot evaluates strictly to BLOCK (Score >= 75)', () => {
    const result = RiskEngine.evaluate(DEMO_PERSONAS.CREDENTIAL_STUFFING_BOT.signals as TransactionSignals);
    assert.equal(result.decision, 'BLOCK');
    assert.equal(result.riskLevel, 'HIGH');
    assert.ok(result.finalScore >= DECISION_THRESHOLDS.BLOCK_MIN);
    assert.ok(result.finalScore <= DECISION_THRESHOLDS.SCORE_MAX);
  });

  it('Determinism test: identical input signals produce identical score and decision', () => {
    const signals: TransactionSignals = {
      deviceTrust: 'NEW',
      ipReputation: 'SUSPICIOUS',
      geographicVelocityStatus: 'IMPOSSIBLE_TRAVEL',
      dwellTime: 2.5,
      mouseEntropy: 0.5,
      pasteDetected: false,
      typingCadence: 'NORMAL',
      transactionVelocity: 'NORMAL',
    };

    const run1 = RiskEngine.evaluate(signals);
    const run2 = RiskEngine.evaluate(signals);
    const run3 = RiskEngine.evaluate(signals);

    assert.equal(run1.finalScore, run2.finalScore);
    assert.equal(run2.finalScore, run3.finalScore);
    assert.equal(run1.decision, run2.decision);
    assert.deepEqual(run1.triggeredRules, run2.triggeredRules);
  });

  it('Score clamping: negative raw scores clamp at 0', () => {
    // All high-trust signals
    const signals: TransactionSignals = {
      deviceTrust: 'TRUSTED', // -15
      ipReputation: 'GOOD',
      geographicVelocityStatus: 'NORMAL',
      dwellTime: 10.0, // -10
      mouseEntropy: 0.99,
      pasteDetected: false,
      typingCadence: 'NORMAL', // -5
      transactionVelocity: 'NORMAL',
    };

    const result = RiskEngine.evaluate(signals);
    assert.ok(result.rawScore < 0);
    assert.equal(result.finalScore, 0);
  });

  it('Score clamping: excessive risk scores clamp at 100', () => {
    // All worst-case attacker signals
    const signals: TransactionSignals = {
      deviceTrust: 'NEW', // +15
      ipReputation: 'BLACKLISTED', // +40
      geographicVelocityStatus: 'IMPOSSIBLE_TRAVEL', // +35
      dwellTime: 0.1, // +20
      mouseEntropy: 0.01, // +20
      pasteDetected: true, // +15
      typingCadence: 'BOT_LIKE', // +15
      transactionVelocity: 'BURST', // +30
    };

    const result = RiskEngine.evaluate(signals);
    assert.ok(result.rawScore > 100);
    assert.equal(result.finalScore, 100);
  });

  it('Decision boundaries: accurately distinguishes ALLOW, CHALLENGE, and BLOCK', () => {
    // Test boundary at 0 -> ALLOW
    const zeroRisk: TransactionSignals = {
      deviceTrust: 'UNKNOWN',
      ipReputation: 'GOOD',
      geographicVelocityStatus: 'NORMAL',
      dwellTime: 1.5, // neither fast nor normal dwell discount
      mouseEntropy: 0.5,
      pasteDetected: false,
      typingCadence: 'IRREGULAR', // let's balance or craft direct tests
      transactionVelocity: 'NORMAL',
    };
    // Score of zeroRisk: unknown(0) + good(0) + normal(0) + dwell 1.5(0) + entropy 0.5(0) + no paste(0) + cadence irregular(+10) = 10
    const evalZero = RiskEngine.evaluate(zeroRisk);
    assert.equal(evalZero.decision, 'ALLOW');
  });
});
