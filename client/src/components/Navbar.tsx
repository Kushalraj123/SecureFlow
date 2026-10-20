import React, { useEffect, useState } from 'react';
import { Shield, Radio, Terminal, ShoppingCart, Sliders, LayoutDashboard } from 'lucide-react';
import { sseClient } from '../services/sse';

interface NavbarProps {
  activeTab: 'landing' | 'simulator' | 'console' | 'sandbox';
  setActiveTab: (tab: 'landing' | 'simulator' | 'console' | 'sandbox') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [sseState, setSseState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    return sseClient.onStateChange(setSseState);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#263449] bg-[#080D18]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                Secure<span className="text-cyan-400">Flow</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                AEGIS-GUARD
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Adaptive Transaction Authentication
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'landing'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Checkout Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Risk Console</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Judge Sandbox</span>
          </button>
        </nav>

        {/* Live SSE Status Pill */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              {sseState === 'connected' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              ) : sseState === 'connecting' ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              )}
            </span>
            <span className={sseState === 'connected' ? 'text-emerald-400' : 'text-slate-400'}>
              {sseState === 'connected' ? 'LIVE SSE' : sseState === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
            </span>
          </div>

          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
            DEMO MODE
          </span>
        </div>
      </div>
    </header>
  );
};
