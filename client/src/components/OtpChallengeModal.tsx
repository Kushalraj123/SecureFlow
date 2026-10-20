import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, KeyRound, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

interface OtpChallengeModalProps {
  isOpen: boolean;
  transactionId: string;
  referenceId: string;
  amount: number;
  currency: string;
  demoTestOtp?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OtpChallengeModal: React.FC<OtpChallengeModalProps> = ({
  isOpen,
  transactionId,
  referenceId,
  amount,
  currency,
  demoTestOtp,
  onSuccess,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeCode, setActiveCode] = useState<string | undefined>(demoTestOtp);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [isLocked, setIsLocked] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isLocked || successMsg) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMsg('Verification code has expired. Please request a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isLocked, successMsg]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
      setActiveCode(demoTestOtp);
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setSuccessMsg(null);
      setTimeLeft(300);
      setAttemptsRemaining(3);
      setIsLocked(false);
    }
  }, [isOpen, demoTestOtp]);

  const handleDigitChange = (index: number, value: string) => {
    if (isLocked || successMsg) return;

    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    if (pasted.length >= 6) {
      inputsRef.current[5]?.focus();
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  };

  const fillDemoCode = () => {
    if (!activeCode) return;
    const split = activeCode.split('').slice(0, 6);
    setDigits(split);
    inputsRef.current[5]?.focus();
    setErrorMsg(null);
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length !== 6) {
      setErrorMsg('Please enter a full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.verifyOtp(transactionId, otp);
      setSuccessMsg(res.message || 'OTP verified successfully!');

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00E5FF', '#22C55E', '#3B82F6'],
      });

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
      if (err.message?.includes('exceeded') || err.message?.includes('locked')) {
        setIsLocked(true);
      } else {
        setAttemptsRemaining(prev => Math.max(0, prev - 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.resendOtp(transactionId);
      setActiveCode(res.data.demoTestOtp);
      setTimeLeft(300);
      setAttemptsRemaining(3);
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg glass-panel-elevated rounded-2xl p-6 sm:p-8 shadow-2xl border border-amber-500/30 overflow-hidden"
        >
          {/* Top glowing cyber accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500" />

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  STEP-UP CHALLENGE REQUIRED
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {referenceId}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Two-Factor OTP Verification
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Telemetry signals flagged suspicious anomaly. Please enter the 6-digit security code to authenticate payment of{' '}
                <span className="text-white font-semibold">{currency} {amount.toLocaleString()}</span>.
              </p>
            </div>
          </div>

          {/* Test OTP Demonstration Chip */}
          {activeCode && (
            <div className="mt-5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                    Evaluator Demo Code
                  </span>
                  <span className="font-mono text-base font-bold text-white tracking-widest">
                    {activeCode}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCode}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                Auto-Fill Code
              </button>
            </div>
          )}

          {/* 6-Digit Pin Input */}
          <div className="mt-6">
            <label className="block text-xs font-medium text-slate-300 mb-2.5 text-center">
              Enter 6-Digit One-Time Passcode
            </label>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={isLocked || !!successMsg || loading}
                  onChange={e => handleDigitChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-slate-900 border text-white transition-all outline-none focus:ring-2 ${
                    digit
                      ? 'border-cyan-400 bg-slate-800/80 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                      : 'border-slate-700 hover:border-slate-600 focus:border-cyan-400'
                  } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Timer & Attempts Info */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span className="flex items-center gap-1.5">
              Expires in: <strong className={timeLeft < 60 ? 'text-red-400' : 'text-slate-200'}>{formatTimer(timeLeft)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              Attempts remaining: <strong className={attemptsRemaining <= 1 ? 'text-red-400' : 'text-slate-200'}>{attemptsRemaining} of 3</strong>
            </span>
          </div>

          {/* Status Messages */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3.5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || isLocked || !!successMsg}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Resend Code
            </button>

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || isLocked || !!successMsg || digits.join('').length !== 6}
              className="w-full flex-1 py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : successMsg ? (
                <span className="flex items-center gap-2 text-emerald-950">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Authorize & Approve
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Dismiss / Review Transaction
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
