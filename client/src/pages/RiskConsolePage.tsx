import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Search, 
  Filter, 
  RotateCcw, 
  Radio, 
  TrendingUp, 
  ArrowUpRight, 
  BarChart2, 
  PieChart as PieIcon, 
  Clock, 
  ArrowRight,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { RiskBadge } from '../components/RiskBadge';
import { TransactionDetailDrawer } from '../components/TransactionDetailDrawer';
import { api } from '../services/api';
import { sseClient } from '../services/sse';
import type { 
  AnalyticsSummary, 
  RiskDistributionData, 
  TransactionListItem, 
  Decision 
} from '../types';

export const RiskConsolePage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [distributionData, setDistributionData] = useState<RiskDistributionData | null>(null);
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [decisionFilter, setDecisionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Real-time flash notification for newly ingested SSE transactions
  const [liveFlashId, setLiveFlashId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [sum, dist, txList] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getRiskDistribution(),
        api.getTransactions({
          page,
          limit: 15,
          search: searchTerm || undefined,
          decision: decisionFilter || undefined,
          status: statusFilter || undefined,
        }),
      ]);

      setSummary(sum);
      setDistributionData(dist);
      setTransactions(txList.transactions);
      setTotalPages(txList.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load risk console data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, searchTerm, decisionFilter, statusFilter]);

  // Subscribe to real-time Server-Sent Events (SSE)
  useEffect(() => {
    const unsubNew = sseClient.on('transaction_created', (newTx: any) => {
      setLiveFlashId(newTx.id);
      setTimeout(() => setLiveFlashId(null), 3000);

      // Prepend to transaction feed
      setTransactions(prev => [
        {
          id: newTx.id,
          reference_id: newTx.referenceId,
          amount: newTx.amount,
          currency: newTx.currency,
          customer_name: newTx.customerName,
          customer_email: '',
          merchant_name: 'SecureFlow Demo Store',
          risk_score: newTx.riskScore,
          decision: newTx.decision,
          authentication_status: newTx.authenticationStatus,
          execution_time_ms: 18,
          created_at: newTx.createdAt,
          device_trust: newTx.deviceTrust,
          ip_reputation: newTx.ipReputation,
          main_reason: newTx.primaryReason,
        },
        ...prev.slice(0, 14),
      ]);

      // Refresh aggregate metrics
      api.getAnalyticsSummary().then(setSummary).catch(() => {});
      api.getRiskDistribution().then(setDistributionData).catch(() => {});
    });

    const unsubUpdate = sseClient.on('transaction_updated', (updated: any) => {
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === updated.id
            ? { ...tx, authentication_status: updated.authenticationStatus }
            : tx
        )
      );
      api.getAnalyticsSummary().then(setSummary).catch(() => {});
    });

    return () => {
      unsubNew();
      unsubUpdate();
    };
  }, []);

  const pieColors = {
    ALLOW: '#22C55E',
    CHALLENGE: '#F59E0B',
    BLOCK: '#EF4444',
  };

  const pieChartData = distributionData ? [
    { name: 'ALLOW', value: distributionData.distribution.allow, color: pieColors.ALLOW },
    { name: 'CHALLENGE', value: distributionData.distribution.challenge, color: pieColors.CHALLENGE },
    { name: 'BLOCK', value: distributionData.distribution.block, color: pieColors.BLOCK },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 cyber-grid-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-4 h-4" />
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Risk Operations Console
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              LIVE TELEMETRY FEED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fraud operations monitor streamed live over Server-Sent Events (SSE).
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white text-xs font-semibold font-mono transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
        {/* KPI 1: Total */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">Total Volume</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {summary ? summary.totalTransactions : '—'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Transactions evaluated
          </span>
        </div>

        {/* KPI 2: Approved */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-emerald-400 block">Approved</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {summary ? summary.approvedTransactions : '—'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Frictionless / Verified
          </span>
        </div>

        {/* KPI 3: Challenged */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-amber-400 block">Challenged</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {summary ? summary.challengedTransactions : '—'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Step-up 2FA OTP
          </span>
        </div>

        {/* KPI 4: Blocked */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-red-400 block">Blocked</span>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">
            {summary ? summary.blockedTransactions : '—'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Terminated fraud
          </span>
        </div>

        {/* KPI 5: Avg Score */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-cyan-400 block">Avg Risk Score</span>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
            {summary ? `${summary.averageRiskScore}` : '—'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Out of 100 points
          </span>
        </div>

        {/* KPI 6: Approval Rate */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block">Approval Rate</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {summary ? `${summary.approvalRate}%` : '—'}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
            Frictionless index
          </span>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Chart 1: Risk Score Histogram */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Risk Score Distribution Histogram
            </h3>
            <span className="text-[10px] font-mono text-slate-500">10-PT BUCKETS</span>
          </div>

          <div className="h-56 w-full">
            {distributionData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData.histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#263449', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#00E5FF' }}
                  />
                  <Bar dataKey="count" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Decision Distribution Breakdown */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              Decisions
            </h3>
            <span className="text-[10px] font-mono text-slate-500">RATIO</span>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {distributionData && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      borderColor: '#263449', 
                      borderRadius: '8px', 
                      fontSize: '12px',
                      color: '#F8FAFC',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
                    }}
                    itemStyle={{ color: '#F8FAFC', fontWeight: '600' }}
                    labelStyle={{ color: '#00E5FF', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 text-[11px] font-mono pt-3 border-t border-slate-800 text-center">
            <div>
              <span className="text-emerald-400 block font-bold">
                {distributionData?.distribution.allow || 0}
              </span>
              <span className="text-slate-500 text-[10px]">ALLOW</span>
            </div>
            <div>
              <span className="text-amber-400 block font-bold">
                {distributionData?.distribution.challenge || 0}
              </span>
              <span className="text-slate-500 text-[10px]">CHALLENGE</span>
            </div>
            <div>
              <span className="text-red-400 block font-bold">
                {distributionData?.distribution.block || 0}
              </span>
              <span className="text-slate-500 text-[10px]">BLOCK</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Top Risk Indicators Triggered */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Top Indicators
            </h3>
            <span className="text-[10px] font-mono text-slate-500">FREQUENCY</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {distributionData?.topIndicators.slice(0, 4).map((ind, i) => (
              <div key={ind.rule_code || i} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium truncate block text-[11px] max-w-[140px]">
                    {ind.description}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-bold">
                    {ind.frequency}x
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>Avg: {ind.avgContribution > 0 ? `+${Math.round(ind.avgContribution)}` : Math.round(ind.avgContribution)} pts</span>
                  <span className="text-slate-600 truncate">{ind.rule_code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Feed Section with Live Stream */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 shadow-xl">
        {/* Controls Bar: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Reference or Customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <select
              value={decisionFilter}
              onChange={e => setDecisionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="">All Decisions</option>
              <option value="ALLOW">ALLOW</option>
              <option value="CHALLENGE">CHALLENGE</option>
              <option value="BLOCK">BLOCK</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>Showing recent activity ledger</span>
          </div>
        </div>

        {/* Live Transaction Feed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="pb-3 font-semibold">Reference ID</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Risk Score</th>
                <th className="pb-3 font-semibold">Decision</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Primary Risk Signal</th>
                <th className="pb-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => {
                  const isFlash = liveFlashId === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTransactionId(tx.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isFlash ? 'bg-cyan-500/10 glow-border-cyan animate-pulse' : ''
                      }`}
                    >
                      <td className="py-3.5 font-bold text-white flex items-center gap-1.5">
                        {tx.reference_id}
                        {isFlash && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </td>
                      <td className="py-3.5 text-slate-400 text-[11px]">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3.5 text-slate-300 font-sans">
                        {tx.customer_name || 'Anonymous Demo'}
                      </td>
                      <td className="py-3.5 font-bold text-slate-200">
                        {tx.currency} {Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
                          tx.risk_score >= 75 ? 'text-red-400 bg-red-500/10 border-red-500/30' :
                          tx.risk_score >= 30 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                          'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        }`}>
                          {tx.risk_score}/100
                        </span>
                      </td>
                      <td className="py-3.5">
                        <RiskBadge decision={tx.decision} size="sm" />
                      </td>
                      <td className="py-3.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          tx.authentication_status === 'VERIFIED' ? 'text-emerald-400' :
                          tx.authentication_status === 'PENDING' ? 'text-amber-400' :
                          tx.authentication_status === 'BLOCKED' ? 'text-red-400' :
                          'text-slate-400'
                        }`}>
                          {tx.authentication_status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 text-[11px] max-w-xs truncate font-sans">
                        {tx.main_reason || 'Signals evaluated within threshold'}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedTransactionId(tx.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transactionId={selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
      />
    </div>
  );
};
