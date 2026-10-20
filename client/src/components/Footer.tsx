import React from 'react';
import { Shield, Lock, Database, Radio, Cpu, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#263449] bg-[#080D18] text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white tracking-tight">
                SecureFlow <span className="text-cyan-400 font-mono text-xs">v1.0 (AegisGuard)</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              AI-inspired adaptive online transaction authentication and real-time fraud prevention engine.
              Demonstrates frictionless transaction approvals, risk step-up challenges via OTP, and deterministic fraud blocks.
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2 max-w-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Academic & Hackathon Demonstration Environment:</strong> All cards, telemetry signals, IP reputations, and OTP verifications are synthetic demo data. No real payment credentials or personal identifiers are stored or processed.
              </span>
            </div>
          </div>

          {/* Col 2: Architecture Highlights */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Core Architecture
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-400 font-mono">
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Deterministic Scoring [0–100]
              </li>
              <li className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Server-Sent Events (SSE) Live Feed
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                SQLite WAL High-Concurrency DB
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Constant-Time SHA-256 OTP Hash
              </li>
            </ul>
          </div>

          {/* Col 3: Thresholds */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Decision Tiers
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                <span>0 – 29 pts</span>
                <strong>ALLOW (Frictionless)</strong>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px]">
                <span>30 – 74 pts</span>
                <strong>CHALLENGE (2FA OTP)</strong>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[11px]">
                <span>75 – 100 pts</span>
                <strong>BLOCK (Rejection)</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#263449] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div>
            Built with React 19, TypeScript, Express, Tailwind CSS, Recharts & Framer Motion.
          </div>
          <div>
            College Major Project & Technical Evaluation Demonstration
          </div>
        </div>
      </div>
    </footer>
  );
};
