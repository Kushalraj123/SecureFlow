import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  RotateCcw, 
  Play, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Cpu, 
  Globe, 
  MousePointer, 
  Clock, 
  Keyboard, 
  Zap, 
  CheckCircle2, 
  Layers, 
  HelpCircle 
} from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';
import { RiskBadge } from '../components/RiskBadge';
import { OtpChallengeModal } from '../components/OtpChallengeModal';
import { api } from '../services/api';
import type { 
  TransactionSignals, 
  RiskEngineResult, 
  TransactionResponse,
  DeviceTrust, 
  IpReputation, 
  GeoVelocity, 
  TypingCadence, 
  TransactionVelocity 
} from '../types';

interface JudgeSandboxPageProps {
  onNavigateToConsole: () => void;
}

export const JudgeSandboxPage: React.FC<JudgeSandboxPageProps> = ({
  onNavigateToConsole,
}) => {
  // Sandbox Interactive Inputs
  const [amount, setAmount] = useState<number>(3500);
  const [deviceTrust, setDeviceTrust] = useState<DeviceTrust>('UNKNOWN');
  const [ipReputation, setIpReputation] = useState<IpReputation>('GOOD');
  const [geoVelocity, setGeoVelocity] = useState<GeoVelocity>('NORMAL');
  const [dwellTime, setDwellTime] = useState<number>(3.0);
  const [mouseEntropy, setMouseEntropy] = useState<number>(0.75);
  const [pasteDetected, setPasteDetected] = useState<boolean>(false);
  const [typingCadence, setTypingCadence] = useState<TypingCadence>('NORMAL');
  const [transactionVelocity, setTransactionVelocity] = useState<TransactionVelocity>('NORMAL');

  // Real-time calculation preview state (non-persisted)
  const [previewResult, setPreviewResult] = useState<RiskEngineResult | null>(null);
  const [isScoring, setIsScoring] = useState<boolean>(false);

  // Explicit record state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTx, setRecordedTx] = useState<TransactionResponse | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);

  // Debounced real-time preview computation
  useEffect(() => {
    setIsScoring(true);
    const timer = setTimeout(() => {
      const signals: TransactionSignals = {
        deviceTrust,
        ipReputation,
        geographicVelocityStatus: geoVelocity,
        dwellTime,
        mouseEntropy,
        pasteDetected,
        typingCadence,
        transactionVelocity,
        ipAddress: ipReputation === 'BLACKLISTED' ? '45.146.164.110 (Tor)' : ipReputation === 'SUSPICIOUS' ? '185.220.101.4 (VPN)' : '103.21.244.18',
        location: geoVelocity === 'IMPOSSIBLE_TRAVEL' ? 'Frankfurt, Germany (Anomaly)' : 'Mumbai, India',
        deviceId: deviceTrust === 'TRUSTED' ? 'dev_trusted_mac' : 'dev_sandbox_client',
      };

      api.previewScore(signals, amount)
        .then(res => setPreviewResult(res))
        .catch(err => console.error('Preview scoring error', err))
        .finally(() => setIsScoring(false));
    }, 120);

    return () => clearTimeout(timer);
  }, [
    amount,
    deviceTrust,
    ipReputation,
    geoVelocity,
    dwellTime,
    mouseEntropy,
    pasteDetected,
    typingCadence,
    transactionVelocity,
  ]);

  // Persona Presets
  const loadPreset = (preset: 'RETURNING' | 'VPN' | 'BOT') => {
    setRecordedTx(null);
    if (preset === 'RETURNING') {
      setDeviceTrust('TRUSTED');
      setIpReputation('GOOD');
      setGeoVelocity('NORMAL');
      setDwellTime(4.8);
      setMouseEntropy(0.88);
      setPasteDetected(false);
      setTypingCadence('NORMAL');
      setTransactionVelocity('NORMAL');
      setAmount(1850);
    } else if (preset === 'VPN') {
      setDeviceTrust('NEW');
      setIpReputation('SUSPICIOUS');
      setGeoVelocity('IMPOSSIBLE_TRAVEL');
      setDwellTime(3.2);
      setMouseEntropy(0.72);
      setPasteDetected(false);
      setTypingCadence('NORMAL');
      setTransactionVelocity('NORMAL');
      setAmount(9200);
    } else {
      setDeviceTrust('NEW');
      setIpReputation('BLACKLISTED');
      setGeoVelocity('IMPOSSIBLE_TRAVEL');
      setDwellTime(0.42);
      setMouseEntropy(0.05);
      setPasteDetected(true);
      setTypingCadence('BOT_LIKE');
      setTransactionVelocity('BURST');
      setAmount(49000);
    }
  };

  const resetDefaults = () => {
    setRecordedTx(null);
    setDeviceTrust('UNKNOWN');
    setIpReputation('GOOD');
    setGeoVelocity('NORMAL');
    setDwellTime(3.0);
    setMouseEntropy(0.75);
    setPasteDetected(false);
    setTypingCadence('NORMAL');
    setTransactionVelocity('NORMAL');
    setAmount(3500);
  };

  // Explicit Record Simulation Action
  const handleRecordSimulation = async () => {
    setIsRecording(true);
    setRecordedTx(null);

    const signals: TransactionSignals = {
      deviceTrust,
      ipReputation,
      geographicVelocityStatus: geoVelocity,
      dwellTime,
      mouseEntropy,
      pasteDetected,
      typingCadence,
      transactionVelocity,
      ipAddress: ipReputation === 'BLACKLISTED' ? '45.146.164.110 (Tor)' : ipReputation === 'SUSPICIOUS' ? '185.220.101.4 (VPN)' : '103.21.244.18',
      location: geoVelocity === 'IMPOSSIBLE_TRAVEL' ? 'Frankfurt, Germany (Anomaly)' : 'Mumbai, India',
      deviceId: deviceTrust === 'TRUSTED' ? 'dev_trusted_mac' : 'dev_sandbox_client',
    };

    try {
      const res = await api.createTransaction({
        amount,
        currency: 'INR',
        customerName: 'Evaluator Sandbox User',
        customerEmail: 'evaluator.sandbox@secureflow.demo',
        merchantName: 'SecureFlow Sandbox Target',
        signals,
      });

      setRecordedTx(res);
      if (res.decision === 'CHALLENGE') {
        setIsOtpModalOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record simulation');
    } finally {
      setIsRecording(false);
    }
  };

  const handleOtpSuccess = () => {
    setIsOtpModalOpen(false);
    if (recordedTx) {
      setRecordedTx({
        ...recordedTx,
        authenticationStatus: 'VERIFIED',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 cyber-grid-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Judge Sandbox & Engine Tuning
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Independently test all 9 telemetry signal parameters in real-time. Live preview calculates on-the-fly without database writes.
          </p>
        </div>

        {/* Quick Load Persona Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset('RETURNING')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold font-mono transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Load Returning Customer
          </button>
          <button
            type="button"
            onClick={() => loadPreset('VPN')}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold font-mono transition-colors flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Load Suspicious VPN
          </button>
          <button
            type="button"
            onClick={() => loadPreset('BOT')}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold font-mono transition-colors flex items-center gap-1.5"
          >
            <ShieldX className="w-3.5 h-3.5 text-red-400" />
            Load Bot Attack
          </button>
          <button
            type="button"
            onClick={resetDefaults}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition-colors"
            title="Reset Inputs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Preview Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Adjust Telemetry Signals
            </h3>

            {/* 1. Device Trust */}
            <div className="text-xs">
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                <span>Device Trust Signature</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {deviceTrust === 'TRUSTED' ? '-15 pts' : deviceTrust === 'NEW' ? '+15 pts' : '0 pts'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {(['TRUSTED', 'UNKNOWN', 'NEW'] as DeviceTrust[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDeviceTrust(t)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      deviceTrust === t
                        ? t === 'TRUSTED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                          : t === 'NEW'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. IP Reputation */}
            <div className="text-xs">
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                <span>IP & ASN Threat Intelligence</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {ipReputation === 'BLACKLISTED' ? '+40 pts' : ipReputation === 'SUSPICIOUS' ? '+20 pts' : '0 pts'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {(['GOOD', 'SUSPICIOUS', 'BLACKLISTED'] as IpReputation[]).map(rep => (
                  <button
                    key={rep}
                    type="button"
                    onClick={() => setIpReputation(rep)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      ipReputation === rep
                        ? rep === 'GOOD'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : rep === 'SUSPICIOUS'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {rep}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Geographic Velocity */}
            <div className="text-xs">
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                <span>Geographic Velocity (Impossible Travel)</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {geoVelocity === 'IMPOSSIBLE_TRAVEL' ? '+35 pts' : '0 pts'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                {(['NORMAL', 'IMPOSSIBLE_TRAVEL'] as GeoVelocity[]).map(geo => (
                  <button
                    key={geo}
                    type="button"
                    onClick={() => setGeoVelocity(geo)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      geoVelocity === geo
                        ? geo === 'IMPOSSIBLE_TRAVEL'
                          ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {geo === 'IMPOSSIBLE_TRAVEL' ? 'IMPOSSIBLE TRAVEL' : 'NORMAL'}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Dwell Time Slider */}
            <div className="text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-medium">Form Dwell Time</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {dwellTime.toFixed(1)}s{' '}
                  <span className="text-slate-500 font-normal">
                    ({dwellTime < 1.0 ? '+20 pts (< 1.0s)' : dwellTime >= 2.0 ? '-10 pts (>= 2.0s)' : '0 pts'})
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="10.0"
                step="0.1"
                value={dwellTime}
                onChange={e => setDwellTime(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0.2s (Bot Spike)</span>
                <span>2.0s Threshold</span>
                <span>10.0s (Human Review)</span>
              </div>
            </div>

            {/* 5. Mouse Entropy Slider */}
            <div className="text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-medium">Mouse Movement Entropy</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {mouseEntropy.toFixed(2)}{' '}
                  <span className="text-slate-500 font-normal">
                    ({mouseEntropy <= 0.20 ? '+20 pts (<= 0.20)' : '0 pts'})
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.01"
                value={mouseEntropy}
                onChange={e => setMouseEntropy(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0.00 (Synthetic Line)</span>
                <span>0.20 Cutoff</span>
                <span>1.00 (Human Jitter)</span>
              </div>
            </div>

            {/* 6. Paste Detection Toggle */}
            <div className="text-xs flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-slate-200 font-medium block">Form Paste Injection</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Populate credentials via clipboard buffer (+15 pts)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPasteDetected(!pasteDetected)}
                className={`px-3 py-1.5 rounded-lg border font-mono font-bold transition-all ${
                  pasteDetected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {pasteDetected ? 'DETECTED (+15)' : 'NO PASTE'}
              </button>
            </div>

            {/* 7. Typing Cadence */}
            <div className="text-xs">
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                <span>Typing Cadence Dynamics</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {typingCadence === 'BOT_LIKE' ? '+15 pts' : typingCadence === 'NORMAL' ? '-5 pts' : '0 pts'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {(['NORMAL', 'IRREGULAR', 'BOT_LIKE'] as TypingCadence[]).map(cad => (
                  <button
                    key={cad}
                    type="button"
                    onClick={() => setTypingCadence(cad)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      typingCadence === cad
                        ? cad === 'NORMAL'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : cad === 'BOT_LIKE'
                          ? 'bg-red-500/20 text-red-300 border-red-500/50'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cad}
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Transaction Velocity */}
            <div className="text-xs">
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
                <span>Transaction Velocity Frequency</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {transactionVelocity === 'BURST' ? '+30 pts' : transactionVelocity === 'HIGH' ? '+20 pts' : '0 pts'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {(['NORMAL', 'HIGH', 'BURST'] as TransactionVelocity[]).map(vel => (
                  <button
                    key={vel}
                    type="button"
                    onClick={() => setTransactionVelocity(vel)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      transactionVelocity === vel
                        ? vel === 'BURST'
                          ? 'bg-red-500/20 text-red-300 border-red-500/50'
                          : vel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {vel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview & Record Simulation Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Panel (Non-Persisted) */}
          <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Live Indicator Banner */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Live Engine Calculation
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SANDBOX PREVIEW
              </span>
            </div>

            {/* Gauge */}
            <div className="py-2 flex justify-center">
              {previewResult ? (
                <ScoreGauge
                  score={previewResult.finalScore}
                  decision={previewResult.decision}
                  riskLevel={previewResult.riskLevel}
                  size={180}
                />
              ) : (
                <div className="w-44 h-44 rounded-full border-4 border-slate-800 flex items-center justify-center text-slate-500 text-xs font-mono">
                  Scoring...
                </div>
              )}
            </div>

            {/* Decision Status Banner */}
            {previewResult && (
              <div className="mt-4 text-center">
                <div className="inline-block">
                  <RiskBadge decision={previewResult.decision} size="lg" />
                </div>
                <p className="text-xs text-slate-300 mt-3 font-sans leading-relaxed">
                  {previewResult.primaryReason}
                </p>
              </div>
            )}

            {/* Dynamic Rule Contributions List */}
            {previewResult && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block mb-2.5">
                  Triggered Rule Weights (Net Score: {previewResult.finalScore})
                </span>
                <div className="space-y-1.5 text-xs font-mono max-h-48 overflow-y-auto">
                  {previewResult.triggeredRules.map(r => (
                    <div
                      key={r.ruleCode}
                      className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300 truncate">{r.name}</span>
                      <span className={`font-bold shrink-0 ml-2 ${
                        r.contribution > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {r.contribution > 0 ? `+${r.contribution}` : r.contribution} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explicit Run & Record Simulation Button */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={handleRecordSimulation}
                disabled={isRecording}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
              >
                {isRecording ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Writing to SQLite Ledger & SSE...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run & Record Transaction</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-500 font-mono text-center mt-2">
                Persists record to SQLite WAL and broadcasts via live SSE stream.
              </p>
            </div>
          </div>

          {/* Recorded Confirmation Card */}
          {recordedTx && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono space-y-2"
            >
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Recorded: {recordedTx.referenceId}
                </span>
                <span className="text-[10px] text-slate-400">{recordedTx.executionTimeMs}ms compute</span>
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Transaction saved and streamed to Risk Operations Console.
              </p>
              <div className="flex gap-2 pt-1">
                {recordedTx.decision === 'CHALLENGE' && recordedTx.authenticationStatus === 'PENDING' && (
                  <button
                    onClick={() => setIsOtpModalOpen(true)}
                    className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Verify Demo OTP
                  </button>
                )}
                <button
                  onClick={onNavigateToConsole}
                  className="px-3 py-1 rounded bg-slate-800 text-cyan-400 text-xs hover:bg-slate-700"
                >
                  View in Console →
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* OTP Challenge Modal for Sandbox-Recorded Transactions */}
      {recordedTx && recordedTx.challenge && (
        <OtpChallengeModal
          isOpen={isOtpModalOpen}
          transactionId={recordedTx.id}
          referenceId={recordedTx.referenceId}
          amount={recordedTx.amount}
          currency={recordedTx.currency}
          demoTestOtp={recordedTx.challenge.demoTestOtp}
          onSuccess={handleOtpSuccess}
          onCancel={() => setIsOtpModalOpen(false)}
        />
      )}
    </div>
  );
};
