import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  ArrowRight, 
  Cpu, 
  Radio, 
  Lock, 
  Zap, 
  Activity, 
  Terminal, 
  Sliders, 
  CheckCircle2, 
  Server, 
  Database 
} from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';
import { RiskBadge } from '../components/RiskBadge';

interface LandingPageProps {
  onNavigate: (tab: 'simulator' | 'console' | 'sandbox') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="relative min-h-screen cyber-grid-bg">
      <div className="cyber-radial-overlay min-h-screen">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>AI-INSPIRED ADAPTIVE AUTHENTICATION ENGINE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Secure Every Transaction.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400">
                  Frictionlessly.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Replace rigid one-size-fits-all fraud checks with continuous, real-time risk intelligence. SecureFlow analyzes non-invasive behavioral telemetry, device signatures, and network entropy to dynamically approve legitimate checkouts, challenge suspicious anomalies, or instantly terminate attacks.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('simulator')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(0,229,255,0.35)] transition-all flex items-center gap-2 group"
                >
                  Launch Simulator
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('console')}
                  className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 hover:border-cyan-400/50 shadow-md transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Explore Security Dashboard
                </button>

                <button
                  onClick={() => onNavigate('sandbox')}
                  className="px-5 py-3.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 hover:text-white font-mono text-xs border border-slate-800 transition-all flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Judge Sandbox
                </button>
              </div>

              {/* Key Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block">Scoring Engine</span>
                  <strong className="text-white text-sm">Deterministic [0–100]</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Real-Time Sync</span>
                  <strong className="text-cyan-400 text-sm">Live SSE Streams</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Database</span>
                  <strong className="text-white text-sm">SQLite WAL Mode</strong>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Hero Interactive Visualization Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,229,255,0.12)] relative">
                {/* Header chip */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono text-cyan-300 font-semibold uppercase">
                      Live Telemetry Evaluator
                    </span>
                  </div>
                  <RiskBadge decision="ALLOW" size="sm" />
                </div>

                {/* Score Gauge */}
                <div className="py-2 flex justify-center">
                  <ScoreGauge
                    score={12}
                    decision="ALLOW"
                    riskLevel="LOW"
                    size={170}
                  />
                </div>

                {/* Simulated Telemetry Feed Preview */}
                <div className="space-y-2 mt-4 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Hardware Fingerprint</span>
                    <span className="text-emerald-400">TRUSTED TOKEN (-15 pts)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Mouse Trajectory Jitter</span>
                    <span className="text-emerald-400">NATURAL HUMAN (0.89)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Impossible Travel Check</span>
                    <span className="text-emerald-400">CLEAR (0 km/h anomaly)</span>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Frictionless checkout authorized in <strong>14ms</strong> without prompting customer.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Visual Decision Flow Section: Allow -> Challenge -> Block */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#263449]">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-2">
              Decision Boundary Matrix
            </h2>
              <p className="text-2xl sm:text-3xl font-bold text-white">
              Dynamic Risk-Scoring Continuum
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Every authorization undergoes real-time signal classification, clamping between 0 and 100 with transparent reason codes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Allow Tier */}
            <div className="glass-panel rounded-2xl p-6 border-t-4 border-t-emerald-500 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SCORE: 0 – 29
                </span>
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">ALLOW</h3>
              <p className="text-xs text-emerald-400 font-mono mb-3">Frictionless 1-Click Approval</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Legitimate customer on trusted device with natural human biometrics and authentic IP reputation. No 2FA interruptions or checkout friction.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
                <div>• Hardware token verified: -15 pts</div>
                <div>• Cognitive dwell time: -10 pts</div>
                <div>• Human keystroke dynamics: -5 pts</div>
              </div>
            </div>

            {/* Challenge Tier */}
            <div className="glass-panel rounded-2xl p-6 border-t-4 border-t-amber-500 hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  SCORE: 30 – 74
                </span>
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">CHALLENGE</h3>
              <p className="text-xs text-amber-400 font-mono mb-3">Step-Up 2FA OTP Required</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Elevated risk profile detected, such as commercial VPN hops or unrecognized browsers. Seamlessly steps up security with short-lived 6-digit OTP verification.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
                <div>• Unknown hardware signature: +15 pts</div>
                <div>• Data center / VPN IP: +20 pts</div>
                <div>• Impossible velocity hop: +35 pts</div>
              </div>
            </div>

            {/* Block Tier */}
            <div className="glass-panel rounded-2xl p-6 border-t-4 border-t-red-500 hover:border-red-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  SCORE: 75 – 100
                </span>
                <ShieldX className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">BLOCK</h3>
              <p className="text-xs text-red-400 font-mono mb-3">Instant Fraud Termination</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                High-confidence fraud threat. Automated credential-stuffing, blacklisted Tor exit nodes, synthetic mouse trajectories, and paste injections terminated instantly.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
                <div>• Threat intelligence blacklist: +40 pts</div>
                <div>• Sub-second form submission: +20 pts</div>
                <div>• Zero mouse trajectory entropy: +20 pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#263449]">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-2">
              Security Pillars
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              Engineered for Enterprise Defense
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/30 transition-all group">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Adaptive Authentication
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never frustrate genuine cardholders with unnecessary CAPTCHAs or OTPs. Authentication dynamically adapts in sub-50 milliseconds based on risk scores.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/30 transition-all group">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Real-Time Risk Intelligence
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-dimensional telemetry ingestion monitors cursor physics, form dwell time, clipboard activity, device tokens, and geographic transit feasibility.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/30 transition-all group">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Privacy-First Design
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero invasive tracking. Employs synthetic payment tokens and non-invasive telemetry. No personal passwords, plain card details, or clipboard contents are logged.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack Badges */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#263449]">
          <div className="glass-panel rounded-2xl p-8 border border-slate-800">
            <h3 className="text-center text-xs font-mono uppercase tracking-widest text-slate-400 mb-6">
              Full-Stack Demonstration Technology Stack
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block text-sm">React 19</span>
                <span className="text-[10px] text-slate-400 font-mono">Vite + TypeScript</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block text-sm">Tailwind CSS</span>
                <span className="text-[10px] text-slate-400 font-mono">Custom Cyber Theme</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block text-sm">Node + Express</span>
                <span className="text-[10px] text-slate-400 font-mono">REST Security APIs</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block text-sm">SQLite WAL</span>
                <span className="text-[10px] text-slate-400 font-mono">Better-SQLite3</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block text-sm">Live SSE</span>
                <span className="text-[10px] text-slate-400 font-mono">Server-Sent Events</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 font-bold block text-sm">Zod & Crypto</span>
                <span className="text-[10px] text-slate-400 font-mono">Schema & SHA-256</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
