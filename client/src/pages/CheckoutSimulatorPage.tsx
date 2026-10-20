import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  Zap, 
  Clock, 
  Cpu, 
  Terminal, 
  Lock, 
  CheckCircle2, 
  RotateCcw,
  User,
  ShoppingBag,
  Info
} from 'lucide-react';
import { SignalTelemetryStream } from '../components/SignalTelemetryStream';
import { ScoreGauge } from '../components/ScoreGauge';
import { RiskBadge } from '../components/RiskBadge';
import { OtpChallengeModal } from '../components/OtpChallengeModal';
import { api } from '../services/api';
import type { 
  TransactionSignals, 
  TransactionResponse, 
  DeviceTrust, 
  IpReputation, 
  GeoVelocity, 
  TypingCadence, 
  TransactionVelocity 
} from '../types';

interface CheckoutSimulatorPageProps {
  onNavigateToConsole: () => void;
}

const DEMO_CUSTOMERS = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', defaultTrust: 'TRUSTED' as DeviceTrust },
  { name: 'Priya Patel', email: 'priya.patel@gmail.com', defaultTrust: 'TRUSTED' as DeviceTrust },
  { name: 'Vikram Mehta', email: 'vikram.m@outlook.com', defaultTrust: 'NEW' as DeviceTrust },
  { name: 'Script Automation', email: 'bot_worker_42@temp-tor.org', defaultTrust: 'NEW' as DeviceTrust },
];

export const CheckoutSimulatorPage: React.FC<CheckoutSimulatorPageProps> = ({
  onNavigateToConsole,
}) => {
  // Transaction Parameters
  const [amount, setAmount] = useState<number>(2499.00);
  const [currency, setCurrency] = useState<string>('INR');
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState<number>(0);
  const [merchantName] = useState<string>('AegisPay Cloud Merchant — Store #881');

  // Signals State
  const [signals, setSignals] = useState<TransactionSignals>({
    deviceTrust: 'TRUSTED',
    ipReputation: 'GOOD',
    geographicVelocityStatus: 'NORMAL',
    dwellTime: 3.5,
    mouseEntropy: 0.85,
    pasteDetected: false,
    typingCadence: 'NORMAL',
    transactionVelocity: 'NORMAL',
    ipAddress: '103.21.244.18 (Mumbai, IN)',
    location: 'Mumbai, Maharashtra, India',
    deviceId: 'dev_macbook_pro_demo',
  });

  // Live session dwell time tracking
  const [dwellTimeCounter, setDwellTimeCounter] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Simulation execution state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactionResult, setTransactionResult] = useState<TransactionResponse | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);

  // Timer for session dwell
  useEffect(() => {
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setDwellTimeCounter((Date.now() - startTimeRef.current) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [transactionResult]);

  // Load Persona Presets
  const loadPersona = (persona: 'RETURNING' | 'VPN' | 'BOT') => {
    startTimeRef.current = Date.now();
    setTransactionResult(null);

    if (persona === 'RETURNING') {
      setSelectedCustomerIndex(0);
      setSignals({
        deviceTrust: 'TRUSTED',
        ipReputation: 'GOOD',
        geographicVelocityStatus: 'NORMAL',
        dwellTime: 4.8,
        mouseEntropy: 0.88,
        pasteDetected: false,
        typingCadence: 'NORMAL',
        transactionVelocity: 'NORMAL',
        ipAddress: '103.21.244.18 (Mumbai, IN)',
        location: 'Mumbai, Maharashtra, India',
        deviceId: 'dev_macbook_pro_demo',
      });
    } else if (persona === 'VPN') {
      setSelectedCustomerIndex(2);
      setSignals({
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
        deviceId: 'dev_unknown_ff92',
      });
    } else {
      setSelectedCustomerIndex(3);
      setSignals({
        deviceTrust: 'NEW',
        ipReputation: 'BLACKLISTED',
        geographicVelocityStatus: 'IMPOSSIBLE_TRAVEL',
        dwellTime: 0.42,
        mouseEntropy: 0.05,
        pasteDetected: true,
        typingCadence: 'BOT_LIKE',
        transactionVelocity: 'BURST',
        ipAddress: '45.146.164.110 (Tor Exit Node)',
        location: 'Anonymized Proxy Server',
        deviceId: 'dev_headless_chrome_script',
      });
    }
  };

  // Execute Authorization
  const handleAuthorizeAndPay = async () => {
    setIsProcessing(true);
    setTransactionResult(null);

    const customer = DEMO_CUSTOMERS[selectedCustomerIndex];
    const finalDwellTime = Math.max(0.2, Number(signals.dwellTime) || dwellTimeCounter);

    const payload = {
      amount,
      currency,
      customerName: customer.name,
      customerEmail: customer.email,
      merchantName,
      signals: {
        ...signals,
        dwellTime: finalDwellTime,
      },
    };

    try {
      // Simulate real-world network transmission latency (approx 250ms)
      await new Promise(r => setTimeout(r, 280));
      const result = await api.createTransaction(payload);
      setTransactionResult(result);

      // If challenge, trigger OTP modal
      if (result.decision === 'CHALLENGE') {
        setIsOtpModalOpen(true);
      }
    } catch (err: any) {
      console.error('Simulation execution failed', err);
      alert(err.message || 'Simulation execution failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOtpSuccess = () => {
    setIsOtpModalOpen(false);
    if (transactionResult) {
      setTransactionResult({
        ...transactionResult,
        authenticationStatus: 'VERIFIED',
      });
    }
  };

  const resetSimulation = () => {
    setTransactionResult(null);
    startTimeRef.current = Date.now();
  };

  const currentCustomer = DEMO_CUSTOMERS[selectedCustomerIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 cyber-grid-bg min-h-screen">
      {/* Header & Persona Quick Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Checkout Simulator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate realistic e-commerce authorizations and observe adaptive fraud detection in action.
          </p>
        </div>

        {/* 1-Click Demo Persona Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase mr-1">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => loadPersona('RETURNING')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold font-mono transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Persona A (Allow)
          </button>
          <button
            type="button"
            onClick={() => loadPersona('VPN')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold font-mono transition-colors flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Persona B (Challenge)
          </button>
          <button
            type="button"
            onClick={() => loadPersona('BOT')}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold font-mono transition-colors flex items-center gap-1.5"
          >
            <ShieldX className="w-3.5 h-3.5 text-red-400" />
            Persona C (Block)
          </button>
        </div>
      </div>

      {/* Main Grid: Checkout Form & Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Simulated Checkout Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-xl">
            {/* Merchant Information Card */}
            <div className="pb-5 mb-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  Simulated Merchant
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {merchantName}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                SSL / TLS 1.3
              </span>
            </div>

            {/* Inputs: Customer & Amount */}
            <div className="space-y-4 text-xs">
              {/* Customer Selector */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Customer Account
                </label>
                <select
                  value={selectedCustomerIndex}
                  onChange={e => {
                    const idx = Number(e.target.value);
                    setSelectedCustomerIndex(idx);
                    setSignals(prev => ({
                      ...prev,
                      deviceTrust: DEMO_CUSTOMERS[idx].defaultTrust,
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-xs focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none"
                >
                  {DEMO_CUSTOMERS.map((cust, i) => (
                    <option key={cust.email} value={i}>
                      {cust.name} ({cust.email}) — Device: {cust.defaultTrust}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Currency Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Authorization Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Synthetic Payment Card Token Preview */}
              <div className="pt-2">
                <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Synthetic Payment Token
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">DEMO TOKENIZED</span>
                </label>
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-inner space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">EMV 3DS SIMULATOR</span>
                    <span className="text-xs font-bold text-cyan-400 tracking-wider">AegisGuard Secure</span>
                  </div>
                  <div className="font-mono text-base tracking-widest text-slate-200">
                    •••• •••• •••• 8829
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>CARDHOLDER: {currentCustomer.name.toUpperCase()}</span>
                    <span>EXP: 09/29</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Authorize & Pay Button */}
            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={handleAuthorizeAndPay}
                disabled={isProcessing}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Risk Signals in Real-Time...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize & Pay {currency} {amount.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Silent Telemetry Stream & Results */}
        <div className="lg:col-span-6 space-y-6">
          {/* Section 4B: Prominent Silent Telemetry Sensor Stream Panel */}
          <SignalTelemetryStream
            signals={signals}
            liveDwellTime={dwellTimeCounter}
          />

          {/* Section 4C: Risk Analysis Results Card (Shows immediately after simulation) */}
          <AnimatePresence>
            {transactionResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`glass-panel-elevated rounded-2xl p-6 sm:p-7 border shadow-2xl relative overflow-hidden ${
                  transactionResult.decision === 'ALLOW'
                    ? 'border-emerald-500/40 glow-border-green'
                    : transactionResult.decision === 'CHALLENGE'
                    ? 'border-amber-500/40 glow-border-amber'
                    : 'border-red-500/40 glow-border-red'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      Risk Engine Assessment
                    </span>
                    <RiskBadge decision={transactionResult.decision} size="sm" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {transactionResult.referenceId}
                  </span>
                </div>

                {/* Score & Gauge Section */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-5 flex justify-center">
                    <ScoreGauge
                      score={transactionResult.riskScore}
                      decision={transactionResult.decision}
                      riskLevel={transactionResult.riskLevel}
                      size={160}
                    />
                  </div>

                  <div className="sm:col-span-7 space-y-3">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase block">
                        Engine Decision Summary
                      </span>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        {transactionResult.evaluation.summaryExplanation}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Processing Latency</span>
                        <span className="text-cyan-300 font-bold">
                          {transactionResult.executionTimeMs}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Auth Status</span>
                        <span className={`font-bold ${
                          transactionResult.authenticationStatus === 'VERIFIED' ? 'text-emerald-400' :
                          transactionResult.authenticationStatus === 'PENDING' ? 'text-amber-400' :
                          transactionResult.authenticationStatus === 'BLOCKED' ? 'text-red-400' :
                          'text-slate-300'
                        }`}>
                          {transactionResult.authenticationStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signal-by-Signal Breakdown Table */}
                <div className="mt-6 pt-5 border-t border-slate-800">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">
                    Signal Contributions Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    {transactionResult.evaluation.triggeredRules.map(rule => {
                      const isRisk = rule.contribution > 0;
                      return (
                        <div
                          key={rule.ruleCode}
                          className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 font-mono"
                        >
                          <div className="flex-1 truncate">
                            <span className="text-slate-200 font-sans font-medium text-xs block truncate">
                              {rule.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {rule.explanation}
                            </span>
                          </div>
                          <span className={`font-bold text-xs px-2 py-0.5 rounded border ${
                            isRisk
                              ? 'text-red-400 bg-red-500/10 border-red-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            {isRisk ? `+${rule.contribution}` : rule.contribution} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions: Run Another, Verify OTP, View Console */}
                <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={resetSimulation}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Run Another Simulation
                  </button>

                  {transactionResult.decision === 'CHALLENGE' && transactionResult.authenticationStatus === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setIsOtpModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Verify Step-Up OTP
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onNavigateToConsole}
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold font-mono transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    View in Risk Console
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* OTP Challenge Verification Modal */}
      {transactionResult && transactionResult.challenge && (
        <OtpChallengeModal
          isOpen={isOtpModalOpen}
          transactionId={transactionResult.id}
          referenceId={transactionResult.referenceId}
          amount={transactionResult.amount}
          currency={transactionResult.currency}
          demoTestOtp={transactionResult.challenge.demoTestOtp}
          onSuccess={handleOtpSuccess}
          onCancel={() => setIsOtpModalOpen(false)}
        />
      )}
    </div>
  );
};
