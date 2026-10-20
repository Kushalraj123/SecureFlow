export type Decision = 'ALLOW' | 'CHALLENGE' | 'BLOCK';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AuthenticationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'BLOCKED';

export type DeviceTrust = 'TRUSTED' | 'UNKNOWN' | 'NEW';
export type IpReputation = 'GOOD' | 'SUSPICIOUS' | 'BLACKLISTED';
export type GeoVelocity = 'NORMAL' | 'IMPOSSIBLE_TRAVEL';
export type TypingCadence = 'NORMAL' | 'BOT_LIKE' | 'IRREGULAR';
export type TransactionVelocity = 'NORMAL' | 'HIGH' | 'BURST';

export interface TransactionSignals {
  deviceTrust: DeviceTrust;
  ipReputation: IpReputation;
  geographicVelocityStatus: GeoVelocity;
  dwellTime: number; // in seconds
  mouseEntropy: number; // 0.0 - 1.0 (near 0 is bot, >0.5 is human jitter)
  pasteDetected: boolean;
  typingCadence: TypingCadence;
  transactionVelocity: TransactionVelocity;
  ipAddress?: string;
  location?: string;
  deviceId?: string;
  userAgent?: string;
}

export interface RuleEvaluationResult {
  ruleCode: string;
  name: string;
  description: string;
  category: 'DEVICE' | 'NETWORK' | 'BEHAVIOR' | 'VELOCITY';
  contribution: number; // positive or negative
  explanation: string;
}

export interface RiskEngineResult {
  rawScore: number;
  finalScore: number; // clamped 0..100
  decision: Decision;
  riskLevel: RiskLevel;
  triggeredRules: RuleEvaluationResult[];
  positiveContributions: number; // total risk added
  negativeContributions: number; // total trust deducted
  primaryReason: string;
  summaryExplanation: string;
}

export interface TransactionRecord {
  id: string;
  reference_id: string;
  amount: number;
  currency: string;
  customer_name?: string;
  customer_email?: string;
  merchant_name?: string;
  risk_score: number;
  decision: Decision;
  authentication_status: AuthenticationStatus;
  execution_time_ms: number;
  created_at: string;
  signals?: TransactionSignals;
  reasons?: RuleEvaluationResult[];
  audit_events?: AuditEventRecord[];
  challenge?: OtpChallengeRecord | null;
}

export interface AuditEventRecord {
  id: string;
  transaction_id: string;
  event_type: string;
  description: string;
  metadata?: string | null;
  created_at: string;
}

export interface OtpChallengeRecord {
  id: string;
  transaction_id: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  verified_at?: string | null;
}
