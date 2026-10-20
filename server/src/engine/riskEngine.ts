import {
  DECISION_THRESHOLDS,
  RULE_WEIGHTS,
  RISK_RULES_DEFINITIONS,
} from '../config/rules.config.js';
import type {
  TransactionSignals,
  RiskEngineResult,
  RuleEvaluationResult,
  Decision,
  RiskLevel,
} from '../types/index.js';

/**
 * Deterministic Risk Scoring Engine for SecureFlow
 * Computes calibrated risk score from 0 to 100 based on transaction telemetry signals.
 */
export class RiskEngine {
  /**
   * Evaluates input transaction signals and returns a comprehensive deterministic risk assessment.
   */
  public static evaluate(signals: TransactionSignals): RiskEngineResult {
    let score = 0;
    const triggeredRules: RuleEvaluationResult[] = [];
    let positiveContributions = 0;
    let negativeContributions = 0;

    const addRule = (
      code: string,
      weight: number,
      explanation: string
    ) => {
      const def = RISK_RULES_DEFINITIONS[code];
      if (!def) return;

      score += weight;
      if (weight > 0) {
        positiveContributions += weight;
      } else {
        negativeContributions += Math.abs(weight);
      }

      triggeredRules.push({
        ruleCode: code,
        name: def.name,
        description: def.description,
        category: def.category,
        contribution: weight,
        explanation,
      });
    };

    // 1. Device Trust Evaluation
    if (signals.deviceTrust === 'TRUSTED') {
      addRule(
        'RULE_TRUSTED_DEVICE',
        RULE_WEIGHTS.TRUSTED_DEVICE,
        `Device identified with verified cryptographic token (-${Math.abs(RULE_WEIGHTS.TRUSTED_DEVICE)} pts)`
      );
    } else if (signals.deviceTrust === 'NEW') {
      addRule(
        'RULE_NEW_DEVICE',
        RULE_WEIGHTS.NEW_DEVICE,
        `Unrecognized client hardware and canvas fingerprint (+${RULE_WEIGHTS.NEW_DEVICE} pts)`
      );
    }

    // 2. IP & Network Reputation Evaluation
    if (signals.ipReputation === 'BLACKLISTED') {
      addRule(
        'RULE_BLACKLISTED_IP',
        RULE_WEIGHTS.BLACKLISTED_IP,
        `Client IP address matches high-risk proxy/Tor exit node threat intelligence (+${RULE_WEIGHTS.BLACKLISTED_IP} pts)`
      );
    } else if (signals.ipReputation === 'SUSPICIOUS') {
      addRule(
        'RULE_SUSPICIOUS_IP',
        RULE_WEIGHTS.SUSPICIOUS_IP,
        `Origin IP routed through commercial hosting datacenter or VPN provider (+${RULE_WEIGHTS.SUSPICIOUS_IP} pts)`
      );
    }

    // 3. Geographic Velocity Evaluation
    if (signals.geographicVelocityStatus === 'IMPOSSIBLE_TRAVEL') {
      addRule(
        'RULE_IMPOSSIBLE_TRAVEL',
        RULE_WEIGHTS.IMPOSSIBLE_TRAVEL,
        `Physical origin discrepancy: geographic leap impossible within recorded delta (+${RULE_WEIGHTS.IMPOSSIBLE_TRAVEL} pts)`
      );
    }

    // 4. Behavioral Biometrics: Mouse Movement Entropy
    if (signals.mouseEntropy <= 0.20) {
      addRule(
        'RULE_LOW_MOUSE_ENTROPY',
        RULE_WEIGHTS.LOW_MOUSE_ENTROPY,
        `Linear or zero mouse trajectory entropy (entropy=${signals.mouseEntropy.toFixed(2)} <= 0.20) (+${RULE_WEIGHTS.LOW_MOUSE_ENTROPY} pts)`
      );
    }

    // 5. Behavioral Biometrics: Clipboard / Paste Injection
    if (signals.pasteDetected) {
      addRule(
        'RULE_PASTE_DETECTED',
        RULE_WEIGHTS.PASTE_DETECTED,
        `Form field populated via direct clipboard paste event (+${RULE_WEIGHTS.PASTE_DETECTED} pts)`
      );
    }

    // 6. Behavioral Biometrics: Dwell & Form Interaction Timing
    if (signals.dwellTime < 1.0) {
      addRule(
        'RULE_FAST_SUBMISSION',
        RULE_WEIGHTS.SUBMISSION_UNDER_ONE_SEC,
        `Checkout authorization executed in ${signals.dwellTime.toFixed(2)}s (< 1.00s human threshold) (+${RULE_WEIGHTS.SUBMISSION_UNDER_ONE_SEC} pts)`
      );
    } else if (signals.dwellTime >= 2.0) {
      addRule(
        'RULE_NORMAL_DWELL',
        RULE_WEIGHTS.NORMAL_DWELL_TIME,
        `Cognitive reading dwell time within authentic human range (${signals.dwellTime.toFixed(1)}s >= 2.0s) (-${Math.abs(RULE_WEIGHTS.NORMAL_DWELL_TIME)} pts)`
      );
    }

    // 7. Keystroke Dynamics / Typing Cadence
    if (signals.typingCadence === 'BOT_LIKE') {
      addRule(
        'RULE_BOT_TYPING',
        RULE_WEIGHTS.BOT_TYPING_CADENCE,
        `Inter-keystroke timing exhibits zero variance standard deviation (+${RULE_WEIGHTS.BOT_TYPING_CADENCE} pts)`
      );
    } else if (signals.typingCadence === 'NORMAL') {
      addRule(
        'RULE_NORMAL_TYPING',
        RULE_WEIGHTS.NORMAL_TYPING_CADENCE,
        `Keystroke dynamics show natural human timing variation (-${Math.abs(RULE_WEIGHTS.NORMAL_TYPING_CADENCE)} pts)`
      );
    }

    // 8. Transaction Velocity
    if (signals.transactionVelocity === 'BURST') {
      addRule(
        'RULE_BURST_VELOCITY',
        RULE_WEIGHTS.BURST_TRANSACTION_VELOCITY,
        `Card-testing velocity spike detected: burst authorization attempts (+${RULE_WEIGHTS.BURST_TRANSACTION_VELOCITY} pts)`
      );
    } else if (signals.transactionVelocity === 'HIGH') {
      addRule(
        'RULE_HIGH_VELOCITY',
        RULE_WEIGHTS.HIGH_TRANSACTION_VELOCITY,
        `Multiple checkout attempts within rolling velocity window (+${RULE_WEIGHTS.HIGH_TRANSACTION_VELOCITY} pts)`
      );
    }

    const rawScore = score;
    // Clamping strictly between 0 and 100
    const finalScore = Math.max(
      DECISION_THRESHOLDS.SCORE_MIN,
      Math.min(DECISION_THRESHOLDS.SCORE_MAX, rawScore)
    );

    // Decision assignment
    let decision: Decision = 'ALLOW';
    let riskLevel: RiskLevel = 'LOW';

    if (finalScore >= DECISION_THRESHOLDS.BLOCK_MIN) {
      decision = 'BLOCK';
      riskLevel = 'HIGH';
    } else if (finalScore >= DECISION_THRESHOLDS.CHALLENGE_MIN) {
      decision = 'CHALLENGE';
      riskLevel = 'MEDIUM';
    } else {
      decision = 'ALLOW';
      riskLevel = 'LOW';
    }

    // Sort triggered rules by contribution magnitude descending
    triggeredRules.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    // Determine primary reason
    const topRiskRule = triggeredRules.find(r => r.contribution > 0);
    const topTrustRule = triggeredRules.find(r => r.contribution < 0);

    let primaryReason = 'All baseline behavioral and device telemetry signals validated successfully.';
    if (decision === 'BLOCK' && topRiskRule) {
      primaryReason = `Critical risk detected: ${topRiskRule.name} (+${topRiskRule.contribution} pts). Immediate block enacted.`;
    } else if (decision === 'CHALLENGE' && topRiskRule) {
      primaryReason = `Elevated risk detected: ${topRiskRule.name} (+${topRiskRule.contribution} pts). OTP step-up verification required.`;
    } else if (decision === 'ALLOW') {
      if (topTrustRule) {
        primaryReason = `Approved: Verified by ${topTrustRule.name} with low overall risk score (${finalScore}/100).`;
      } else {
        primaryReason = `Approved: Risk score ${finalScore}/100 is within friction-free threshold (<${DECISION_THRESHOLDS.CHALLENGE_MIN}).`;
      }
    }

    const summaryExplanation = RiskEngine.generateSummaryExplanation(
      finalScore,
      decision,
      triggeredRules
    );

    return {
      rawScore,
      finalScore,
      decision,
      riskLevel,
      triggeredRules,
      positiveContributions,
      negativeContributions,
      primaryReason,
      summaryExplanation,
    };
  }

  private static generateSummaryExplanation(
    score: number,
    decision: Decision,
    rules: RuleEvaluationResult[]
  ): string {
    const riskRules = rules.filter(r => r.contribution > 0);
    const trustRules = rules.filter(r => r.contribution < 0);

    if (decision === 'ALLOW') {
      const trustNotes = trustRules.map(r => r.name).join(', ');
      return `Transaction score of ${score}/100 is below the 30-point challenge barrier. Authentication granted without customer friction. ${
        trustNotes ? `Trust factors: ${trustNotes}.` : ''
      }`;
    }

    if (decision === 'CHALLENGE') {
      const mainTriggers = riskRules.slice(0, 2).map(r => r.name).join(' and ');
      return `Transaction score of ${score}/100 falls in the challenge tier [30–74]. Primary anomaly triggers: ${mainTriggers}. Step-up two-factor OTP verification initiated to protect account holder.`;
    }

    const severeTriggers = riskRules.slice(0, 3).map(r => r.name).join(', ');
    return `Transaction score of ${score}/100 exceeds the 75-point block threshold. Severe security threats identified: ${severeTriggers}. Transaction terminated immediately to prevent unauthorized fraud loss.`;
  }
}
