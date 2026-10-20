/**
 * SecureFlow — Central Risk Scoring Rules & Weight Configuration
 * All rule weights, decision thresholds, and demo persona defaults are centralized here.
 */

export interface RiskRuleConfig {
  code: string;
  name: string;
  description: string;
  weight: number; // positive increases risk, negative decreases risk
  category: 'DEVICE' | 'NETWORK' | 'BEHAVIOR' | 'VELOCITY';
}

export const DECISION_THRESHOLDS = {
  ALLOW_MAX: 29,      // 0 - 29: ALLOW
  CHALLENGE_MIN: 30,  // 30 - 74: CHALLENGE
  CHALLENGE_MAX: 74,
  BLOCK_MIN: 75,      // 75 - 100: BLOCK
  SCORE_MIN: 0,
  SCORE_MAX: 100,
} as const;

export const RULE_WEIGHTS = {
  // Device Signals
  NEW_DEVICE: 15,
  TRUSTED_DEVICE: -15,

  // Network / IP Signals
  BLACKLISTED_IP: 40,
  SUSPICIOUS_IP: 20,
  IMPOSSIBLE_TRAVEL: 35,

  // Behavioral Biometrics
  LOW_MOUSE_ENTROPY: 20,
  PASTE_DETECTED: 15,
  SUBMISSION_UNDER_ONE_SEC: 20,
  NORMAL_DWELL_TIME: -10,
  BOT_TYPING_CADENCE: 15,
  NORMAL_TYPING_CADENCE: -5,

  // Velocity Signals
  HIGH_TRANSACTION_VELOCITY: 20,
  BURST_TRANSACTION_VELOCITY: 30,
} as const;

export const RISK_RULES_DEFINITIONS: Record<string, Omit<RiskRuleConfig, 'weight'>> = {
  RULE_NEW_DEVICE: {
    code: 'RULE_NEW_DEVICE',
    name: 'Unrecognized Device Signature',
    description: 'Hardware and browser fingerprint has never been authenticated for this account.',
    category: 'DEVICE',
  },
  RULE_TRUSTED_DEVICE: {
    code: 'RULE_TRUSTED_DEVICE',
    name: 'Hardware Trusted Device Token',
    description: 'Cryptographically verified device fingerprint with positive history.',
    category: 'DEVICE',
  },
  RULE_BLACKLISTED_IP: {
    code: 'RULE_BLACKLISTED_IP',
    name: 'High-Risk / Tor / Proxy IP',
    description: 'IP address is matched against active fraud threat intelligence and Tor exit nodes.',
    category: 'NETWORK',
  },
  RULE_SUSPICIOUS_IP: {
    code: 'RULE_SUSPICIOUS_IP',
    name: 'Data-Center / Commercial VPN IP',
    description: 'IP originates from a cloud hosting provider or known VPN ASN.',
    category: 'NETWORK',
  },
  RULE_IMPOSSIBLE_TRAVEL: {
    code: 'RULE_IMPOSSIBLE_TRAVEL',
    name: 'Impossible Geographic Velocity',
    description: 'Physical distance from prior transaction requires supersonic or impossible transit speed.',
    category: 'NETWORK',
  },
  RULE_LOW_MOUSE_ENTROPY: {
    code: 'RULE_LOW_MOUSE_ENTROPY',
    name: 'Synthetic / Zero Mouse Entropy',
    description: 'Cursor trajectories exhibit unnatural linearity or zero jitter characteristic of automation.',
    category: 'BEHAVIOR',
  },
  RULE_PASTE_DETECTED: {
    code: 'RULE_PASTE_DETECTED',
    name: 'Automated Clipboard Injection',
    description: 'Payment credentials populated via direct paste buffer rather than human entry.',
    category: 'BEHAVIOR',
  },
  RULE_FAST_SUBMISSION: {
    code: 'RULE_FAST_SUBMISSION',
    name: 'Sub-Second Form Submission',
    description: 'Checkout completed in under 1000ms, exceeding physical human reading comprehension speed.',
    category: 'BEHAVIOR',
  },
  RULE_NORMAL_DWELL: {
    code: 'RULE_NORMAL_DWELL',
    name: 'Natural Human Dwell Time',
    description: 'Session duration and review timing matches typical human cognitive baseline.',
    category: 'BEHAVIOR',
  },
  RULE_BOT_TYPING: {
    code: 'RULE_BOT_TYPING',
    name: 'Mechanized Typing Cadence',
    description: 'Inter-keystroke intervals show zero standard deviation or machine-scripted timing.',
    category: 'BEHAVIOR',
  },
  RULE_NORMAL_TYPING: {
    code: 'RULE_NORMAL_TYPING',
    name: 'Human Keystroke Dynamics',
    description: 'Variable human typing intervals with natural rhythmic pauses and error corrections.',
    category: 'BEHAVIOR',
  },
  RULE_HIGH_VELOCITY: {
    code: 'RULE_HIGH_VELOCITY',
    name: 'Elevated Transaction Velocity',
    description: 'Multiple checkout attempts initiated within a rolling 5-minute security window.',
    category: 'VELOCITY',
  },
  RULE_BURST_VELOCITY: {
    code: 'RULE_BURST_VELOCITY',
    name: 'Card-Testing Burst Velocity',
    description: 'Rapid-fire authorization attempts indicative of automated card-testing attack.',
    category: 'VELOCITY',
  },
};

/**
 * Predefined demo scenarios tuned for reliable scoring
 */
export const DEMO_PERSONAS = {
  RETURNING_CUSTOMER: {
    id: 'persona_returning',
    name: 'Persona A: Returning Customer',
    subtitle: 'Trusted customer on verified home hardware',
    expectedDecision: 'ALLOW',
    expectedScoreRange: '0 - 29',
    signals: {
      deviceTrust: 'TRUSTED',
      ipReputation: 'GOOD',
      geographicVelocityStatus: 'NORMAL',
      dwellTime: 4.8, // seconds
      mouseEntropy: 0.88,
      pasteDetected: false,
      typingCadence: 'NORMAL',
      transactionVelocity: 'NORMAL',
      ipAddress: '103.21.244.18 (Mumbai, IN)',
      location: 'Mumbai, Maharashtra, India',
    },
  },
  SUSPICIOUS_VPN: {
    id: 'persona_vpn',
    name: 'Persona B: Suspicious VPN Hop',
    subtitle: 'Unknown browser with geographic anomaly and VPN IP',
    expectedDecision: 'CHALLENGE',
    expectedScoreRange: '30 - 74',
    signals: {
      deviceTrust: 'NEW',
      ipReputation: 'SUSPICIOUS',
      geographicVelocityStatus: 'IMPOSSIBLE_TRAVEL',
      dwellTime: 3.2,
      mouseEntropy: 0.72,
      pasteDetected: false,
      typingCadence: 'NORMAL',
      transactionVelocity: 'NORMAL',
      ipAddress: '185.220.101.4 (Frankfurt, DE)',
      location: 'Frankfurt, Hesse, Germany',
    },
  },
  CREDENTIAL_STUFFING_BOT: {
    id: 'persona_bot',
    name: 'Persona C: Credential-Stuffing Bot',
    subtitle: 'Headless automation script with blacklisted IP & paste injection',
    expectedDecision: 'BLOCK',
    expectedScoreRange: '75 - 100',
    signals: {
      deviceTrust: 'NEW',
      ipReputation: 'BLACKLISTED',
      geographicVelocityStatus: 'IMPOSSIBLE_TRAVEL',
      dwellTime: 0.42,
      mouseEntropy: 0.05,
      pasteDetected: true,
      typingCadence: 'BOT_LIKE',
      transactionVelocity: 'BURST',
      ipAddress: '45.146.164.110 (Tor Exit Node)',
      location: 'Unknown / Anonymized Proxy',
    },
  },
} as const;
