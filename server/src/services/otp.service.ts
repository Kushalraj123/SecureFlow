import crypto from 'crypto';
import { db } from '../db/database.js';

export interface OtpCreationResult {
  challengeId: string;
  expiresAt: string;
  demoTestOtp?: string; // Exposed only in demo environment for student/judge evaluation
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
  attemptsRemaining: number;
  expired?: boolean;
}

export class OtpService {
  private static OTP_EXPIRATION_MINUTES = 5;
  private static MAX_ATTEMPTS = 3;

  /**
   * Generates a cryptographically strong 6-digit OTP, hashes it with SHA-256,
   * and records the challenge record in SQLite.
   */
  public static createChallenge(transactionId: string): OtpCreationResult {
    // Generate secure 6-digit number between 100000 and 999999
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32BE(0);
    const otp = (100000 + (randomNumber % 900000)).toString();

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRATION_MINUTES * 60 * 1000).toISOString();
    const challengeId = crypto.randomUUID();

    // Check if challenge already exists for this transaction
    const existing = db.prepare('SELECT id FROM authentication_challenges WHERE transaction_id = ?').get(transactionId);
    if (existing) {
      db.prepare(`
        UPDATE authentication_challenges 
        SET otp_hash = ?, demo_otp_clear = ?, expires_at = ?, attempts = 0, verified_at = NULL
        WHERE transaction_id = ?
      `).run(otpHash, otp, expiresAt, transactionId);
    } else {
      db.prepare(`
        INSERT INTO authentication_challenges (id, transaction_id, otp_hash, demo_otp_clear, expires_at, attempts, max_attempts)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `).run(challengeId, transactionId, otpHash, otp, expiresAt, this.MAX_ATTEMPTS);
    }

    return {
      challengeId,
      expiresAt,
      demoTestOtp: otp, // Local demonstration convenience
    };
  }

  /**
   * Verifies submitted OTP against stored hash, enforcing expiration and attempt limits.
   */
  public static verifyOtp(transactionId: string, submittedOtp: string): OtpVerificationResult {
    const challenge = db.prepare(`
      SELECT * FROM authentication_challenges WHERE transaction_id = ?
    `).get(transactionId) as {
      id: string;
      otp_hash: string;
      expires_at: string;
      attempts: number;
      max_attempts: number;
      verified_at: string | null;
    } | undefined;

    if (!challenge) {
      return {
        success: false,
        message: 'No active authentication challenge found for this transaction reference.',
        attemptsRemaining: 0,
      };
    }

    if (challenge.verified_at) {
      return {
        success: true,
        message: 'This challenge has already been successfully verified.',
        attemptsRemaining: 0,
      };
    }

    // Check expiration
    const now = new Date();
    const expiry = new Date(challenge.expires_at);
    if (now > expiry) {
      return {
        success: false,
        message: 'The OTP code has expired. Please request a new security code.',
        attemptsRemaining: 0,
        expired: true,
      };
    }

    // Check attempt limits
    if (challenge.attempts >= challenge.max_attempts) {
      return {
        success: false,
        message: `Maximum verification attempts (${challenge.max_attempts}) exceeded. Transaction locked for security.`,
        attemptsRemaining: 0,
      };
    }

    // Increment attempt count
    const nextAttempts = challenge.attempts + 1;
    db.prepare('UPDATE authentication_challenges SET attempts = ? WHERE id = ?').run(
      nextAttempts,
      challenge.id
    );

    // Verify hash using constant-time comparison
    const submittedHash = crypto.createHash('sha256').update(submittedOtp).digest('hex');
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'utf-8'),
      Buffer.from(challenge.otp_hash, 'utf-8')
    );

    if (!isMatch) {
      const remaining = Math.max(0, challenge.max_attempts - nextAttempts);
      return {
        success: false,
        message: remaining > 0
          ? `Invalid 6-digit verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : `Invalid verification code. All ${challenge.max_attempts} attempts exhausted. Authentication failed.`,
        attemptsRemaining: remaining,
      };
    }

    // Success! Mark challenge verified
    const verifiedAt = now.toISOString();
    db.prepare('UPDATE authentication_challenges SET verified_at = ? WHERE id = ?').run(
      verifiedAt,
      challenge.id
    );

    return {
      success: true,
      message: 'OTP verified successfully. Step-up authentication passed.',
      attemptsRemaining: challenge.max_attempts - nextAttempts,
    };
  }
}
