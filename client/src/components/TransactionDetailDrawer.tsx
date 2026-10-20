import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Clock, Cpu, Globe, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, FileText, Copy, Check } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import { ScoreGauge } from './ScoreGauge';
import { api } from '../services/api';

interface TransactionDetailDrawerProps {
  transactionId: string | null;
  onClose: () => void;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transactionId,
  onClose,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      setData(null);
      return;
    }

    setLoading(true);
    api.getTransactionDetails(transactionId)
      .then(res => setData(res))
      .catch(err => console.error('Failed to load transaction details', err))
      .finally(() => setLoading(false));
  }, [transactionId]);

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!transactionId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl h-full bg-[#111827] border-l border-[#263449] shadow-2xl overflow-y-auto flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#263449] flex items-center justify-between sticky top-0 bg-[#111827]/90 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Transaction Forensics
                  </h2>
                  {data && <RiskBadge decision={data.decision} size="sm" />}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                  <span>{data?.reference_id || transactionId}</span>
                  {data?.reference_id && (
                    <button
                      onClick={() => copyRef(data.reference_id)}
                      className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-mono">Loading transaction signals and audit ledger...</p>
            </div>
          ) : data ? (
            <div className="p-6 space-y-6 flex-1">
              {/* Top Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#172033]/60 border border-[#263449]">
                <div className="flex flex-col items-center justify-center p-2 border-b sm:border-b-0 sm:border-r border-[#263449]">
                  <ScoreGauge
                    score={data.risk_score}
                    decision={data.decision}
                    riskLevel={data.risk_score >= 75 ? 'HIGH' : data.risk_score >= 30 ? 'MEDIUM' : 'LOW'}
                    size={130}
                    strokeWidth={10}
                    showSubtitle={false}
                  />
                  <span className="text-xs font-semibold mt-2 text-slate-300">
                    Decision: {data.decision}
                  </span>
                </div>

                <div className="col-span-2 space-y-3 pl-0 sm:pl-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Amount</span>
                      <strong className="text-white font-mono text-sm">
                        {data.currency} {Number(data.amount).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Authentication Status</span>
                      <span className={`inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded border mt-0.5 ${
                        data.authentication_status === 'VERIFIED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        data.authentication_status === 'PENDING' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        data.authentication_status === 'BLOCKED' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                        'text-slate-300 bg-slate-500/10 border-slate-500/20'
                      }`}>
                        {data.authentication_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Customer</span>
                      <span className="text-white font-medium truncate block">
                        {data.customer_name || 'Anonymous Demo'}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate block font-mono">
                        {data.customer_email || 'n/a'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Engine Execution Latency</span>
                      <span className="text-cyan-400 font-mono text-xs">
                        {data.execution_time_ms}ms compute
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#263449] text-xs">
                    <span className="text-slate-400 block text-[11px]">Created At</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {new Date(data.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signals Breakdown */}
              {data.signals && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5 mb-3">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    Ingested Telemetry Signals
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Device Trust</span>
                      <strong className="text-white font-mono">{data.signals.device_trust}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">IP Reputation</span>
                      <strong className="text-white font-mono">{data.signals.ip_reputation}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Geo Velocity</span>
                      <strong className="text-white font-mono">{data.signals.geographic_velocity_status}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Session Dwell Time</span>
                      <strong className="text-white font-mono">{Number(data.signals.dwell_time).toFixed(2)}s</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Mouse Entropy</span>
                      <strong className="text-white font-mono">{Number(data.signals.mouse_entropy).toFixed(2)}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Paste Injection</span>
                      <strong className="text-white font-mono">{data.signals.paste_detected ? 'Yes (+15)' : 'No'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Rule Breakdown & Explanations */}
              {data.reasons && data.reasons.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5 mb-3">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Deterministic Rule Contributions
                  </h3>
                  <div className="space-y-2">
                    {data.reasons.map((r: any) => {
                      const isRisk = r.score_contribution > 0;
                      return (
                        <div
                          key={r.id}
                          className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{r.description}</span>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">{r.rule_code}</span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                            isRisk
                              ? 'text-red-400 bg-red-500/10 border-red-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            {isRisk ? (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                +{r.score_contribution} pts
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="w-3 h-3" />
                                {r.score_contribution} pts
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Audit Trail Timeline */}
              {data.auditEvents && data.auditEvents.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5 mb-3">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Immutable Audit Ledger
                  </h3>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {data.auditEvents.map((evt: any) => (
                      <div key={evt.id} className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-900" />
                        <div className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan-300 text-[11px]">{evt.event_type}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(evt.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-0.5">{evt.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Transaction details could not be found.
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
