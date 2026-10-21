import React from 'react';
import { 
  Activity, 
  Cpu, 
  Clock, 
  MousePointer, 
  ClipboardCheck, 
  ShieldAlert, 
  Globe, 
  Keyboard, 
  Radio
} from 'lucide-react';
import type { TransactionSignals } from '../types';

interface SignalTelemetryStreamProps {
  signals: TransactionSignals;
  liveDwellTime?: number;
  liveMouseEntropy?: number;
}

export const SignalTelemetryStream: React.FC<SignalTelemetryStreamProps> = ({
  signals,
  liveDwellTime,
  liveMouseEntropy,
}) => {
  const dwell = liveDwellTime !== undefined ? liveDwellTime : signals.dwellTime;
  const entropy = liveMouseEntropy !== undefined ? liveMouseEntropy : signals.mouseEntropy;

  const getDeviceTrustColor = (trust: string) => {
    switch (trust) {
      case 'TRUSTED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'NEW': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-300 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getIpRepColor = (rep: string) => {
    switch (rep) {
      case 'GOOD': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'SUSPICIOUS': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'BLACKLISTED': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-300 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getGeoColor = (geo: string) => {
    return geo === 'IMPOSSIBLE_TRAVEL'
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getCadenceColor = (cadence: string) => {
    switch (cadence) {
      case 'NORMAL': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'BOT_LIKE': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 relative overflow-hidden">
      {/* Header with live signal indicator */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Silent Telemetry Sensor Stream
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Passive behavioral biometrics & zero-friction signal ingestion
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          MODE: PASSIVE DEMO
        </span>
      </div>

      {/* Grid of telemetry sensors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        {/* Sensor 1: Device ID & Trust */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Device Trust</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${getDeviceTrustColor(signals.deviceTrust)}`}>
              {signals.deviceTrust}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-200 truncate mt-1">
            {signals.deviceId || 'dev_hw_88f92c'}
          </div>
        </div>

        {/* Sensor 2: Session Dwell Time */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Session Dwell</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${dwell < 1.0 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
              {dwell < 1.0 ? 'FAST (<1s)' : 'NORMAL'}
            </span>
          </div>
          <div className="font-mono text-sm text-cyan-300 font-bold mt-1">
            {dwell.toFixed(2)}s
          </div>
        </div>

        {/* Sensor 3: Mouse Entropy */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <MousePointer className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Mouse Entropy</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${entropy <= 0.2 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
              {entropy <= 0.2 ? 'BOT' : 'HUMAN'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${entropy <= 0.2 ? 'bg-red-400' : 'bg-cyan-400'}`}
                style={{ width: `${Math.min(100, entropy * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-slate-200 shrink-0">
              {entropy.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Sensor 4: Paste Detection */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <ClipboardCheck className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Paste Event</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${signals.pasteDetected ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
              {signals.pasteDetected ? 'YES (+15)' : 'NO'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 truncate mt-1">
            {signals.pasteDetected ? 'Direct Clipboard Injection' : 'Direct Keystroke Entry'}
          </div>
        </div>

        {/* Sensor 5: IP Reputation */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">IP Reputation</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${getIpRepColor(signals.ipReputation)}`}>
              {signals.ipReputation === 'BLACKLISTED' ? 'BLACKLIST' : signals.ipReputation}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 truncate mt-1">
            {signals.ipAddress || '103.21.244.18'}
          </div>
        </div>

        {/* Sensor 6: Geographic Velocity */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <ShieldAlert className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Geo Velocity</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${getGeoColor(signals.geographicVelocityStatus)}`}>
              {signals.geographicVelocityStatus === 'IMPOSSIBLE_TRAVEL' ? 'ANOMALY (+35)' : 'NORMAL'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 truncate mt-1">
            {signals.location || 'Mumbai, Maharashtra, IN'}
          </div>
        </div>

        {/* Sensor 7: Typing Cadence */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <Keyboard className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Typing Dynamics</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${getCadenceColor(signals.typingCadence)}`}>
              {signals.typingCadence === 'BOT_LIKE' ? 'BOT (+15)' : signals.typingCadence === 'NORMAL' ? 'NORMAL' : 'IRREGULAR'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 truncate mt-1">
            {signals.typingCadence === 'BOT_LIKE' ? 'Zero Variance (Script)' : 'Natural Human Variance'}
          </div>
        </div>

        {/* Sensor 8: Velocity Indicator */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-1 text-slate-400 mb-1 min-w-0">
            <span className="text-[11px] font-medium flex items-center gap-1 truncate min-w-0">
              <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Tx Velocity</span>
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap leading-none ${signals.transactionVelocity === 'BURST' ? 'text-red-400 bg-red-500/10 border-red-500/20' : signals.transactionVelocity === 'HIGH' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
              {signals.transactionVelocity === 'BURST' ? 'BURST (+30)' : signals.transactionVelocity === 'HIGH' ? 'HIGH (+20)' : 'NORMAL'}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 truncate mt-1">
            {signals.transactionVelocity === 'BURST' ? 'Card-Testing Burst (+30)' : signals.transactionVelocity === 'HIGH' ? 'Elevated (+20)' : 'Standard Pace (0)'}
          </div>
        </div>
      </div>
    </div>
  );
};
