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
  dwellTime: number;
  mouseEntropy: number;
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
  contribution: number;
  explanation: string;
}

export interface RiskEngineResult {
  rawScore: number;
  finalScore: number;
  decision: Decision;
  riskLevel: RiskLevel;
  triggeredRules: RuleEvaluationResult[];
  positiveContributions: number;
  negativeContributions: number;
  primaryReason: string;
  summaryExplanation: string;
  executionTimeMs?: number;
}

export interface TransactionResponse {
  id: string;
  referenceId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  merchantName: string;
  riskScore: number;
  decision: Decision;
  riskLevel: RiskLevel;
  authenticationStatus: AuthenticationStatus;
  executionTimeMs: number;
  createdAt: string;
  evaluation: RiskEngineResult;
  signals: TransactionSignals;
  challenge?: {
    challengeId: string;
    expiresAt: string;
    demoTestOtp?: string;
  } | null;
}

export interface TransactionListItem {
  id: string;
  reference_id: string;
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  merchant_name: string;
  risk_score: number;
  decision: Decision;
  authentication_status: AuthenticationStatus;
  execution_time_ms: number;
  created_at: string;
  device_trust?: DeviceTrust;
  ip_reputation?: IpReputation;
  geographic_velocity_status?: GeoVelocity;
  ip_address?: string;
  location?: string;
  main_reason?: string;
}

export interface AnalyticsSummary {
  totalTransactions: number;
  approvedTransactions: number;
  challengedTransactions: number;
  blockedTransactions: number;
  averageRiskScore: number;
  approvalRate: number;
  totalVolume: number;
}

export interface RiskDistributionData {
  distribution: {
    allow: number;
    challenge: number;
    block: number;
  };
  histogram: { range: string; min: number; max: number; count: number }[];
  topIndicators: {
    rule_code: string;
    description: string;
    frequency: number;
    avgContribution: number;
  }[];
  timeline: {
    reference_id: string;
    amount: number;
    risk_score: number;
    decision: Decision;
    created_at: string;
  }[];
}
