import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { CheckoutSimulatorPage } from './pages/CheckoutSimulatorPage';
import { RiskConsolePage } from './pages/RiskConsolePage';
import { JudgeSandboxPage } from './pages/JudgeSandboxPage';
import { sseClient } from './services/sse';
import { ShieldCheck, ShieldAlert, ShieldX, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'simulator' | 'console' | 'sandbox'>('landing');
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    referenceId: string;
    decision: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
    amount: number;
    currency: string;
    message: string;
  } | null>(null);

  // Initialize SSE stream listener on app mount
  useEffect(() => {
    sseClient.connect();

    const unsubNew = sseClient.on('transaction_created', (data: any) => {
      // Display small toast notification on incoming stream event
      setToastNotification({
        id: data.id,
        referenceId: data.referenceId,
        decision: data.decision,
        amount: data.amount,
        currency: data.currency,
        message: data.primaryReason,
      });

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        setToastNotification(prev => (prev?.id === data.id ? null : prev));
      }, 4500);
    });

    return () => {
      unsubNew();
      sseClient.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080D18] text-[#F8FAFC]">
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage onNavigate={tab => setActiveTab(tab)} />
        )}
        {activeTab === 'simulator' && (
          <CheckoutSimulatorPage onNavigateToConsole={() => setActiveTab('console')} />
        )}
        {activeTab === 'console' && (
          <RiskConsolePage />
        )}
        {activeTab === 'sandbox' && (
          <JudgeSandboxPage onNavigateToConsole={() => setActiveTab('console')} />
        )}
      </main>

      {/* Global Real-Time SSE Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-bounce-in">
          <div className={`p-4 rounded-xl glass-panel-elevated border shadow-2xl flex items-start gap-3 ${
            toastNotification.decision === 'ALLOW' ? 'border-emerald-500/40 glow-border-green' :
            toastNotification.decision === 'CHALLENGE' ? 'border-amber-500/40 glow-border-amber' :
            'border-red-500/40 glow-border-red'
          }`}>
            <div className="mt-0.5">
              {toastNotification.decision === 'ALLOW' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
              {toastNotification.decision === 'CHALLENGE' && <ShieldAlert className="w-5 h-5 text-amber-400" />}
              {toastNotification.decision === 'BLOCK' && <ShieldX className="w-5 h-5 text-red-400" />}
            </div>

            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white">
                  {toastNotification.referenceId}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400">
                  SSE STREAM
                </span>
              </div>
              <p className="text-slate-300 mt-0.5 text-[11px] truncate">
                {toastNotification.currency} {Number(toastNotification.amount).toLocaleString()} — {toastNotification.decision}
              </p>
              <button
                onClick={() => {
                  setActiveTab('console');
                  setToastNotification(null);
                }}
                className="text-[10px] text-cyan-400 hover:underline mt-1 block font-mono"
              >
                Inspect in Risk Console →
              </button>
            </div>

            <button
              onClick={() => setToastNotification(null)}
              className="text-slate-500 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
export default App;
