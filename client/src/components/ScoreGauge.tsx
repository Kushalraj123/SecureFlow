import React, { useEffect, useState } from 'react';
import type { Decision, RiskLevel } from '../types';

interface ScoreGaugeProps {
  score: number;
  decision: Decision;
  riskLevel: RiskLevel;
  size?: number;
  strokeWidth?: number;
  showSubtitle?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  decision,
  riskLevel,
  size = 180,
  strokeWidth = 14,
  showSubtitle = true,
}) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Smooth number counting animation
  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    if (start === end) {
      setDisplayScore(end);
      return;
    }

    const duration = 800; // ms
    const stepTime = 16;
    const steps = Math.floor(duration / stepTime);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const current = Math.round(start + (end - start) * (step / steps));
      setDisplayScore(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayScore(end);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Circumference for 270 degree arc (leaving bottom 90 deg open)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, displayScore))) / 100;

  const colorConfig = {
    ALLOW: {
      stroke: '#22C55E',
      glow: 'rgba(34, 197, 94, 0.4)',
      text: 'text-emerald-400',
      label: 'LOW RISK',
    },
    CHALLENGE: {
      stroke: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.4)',
      text: 'text-amber-400',
      label: 'ELEVATED RISK',
    },
    BLOCK: {
      stroke: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.4)',
      text: 'text-red-400',
      label: 'CRITICAL FRAUD',
    },
  }[decision] || {
    stroke: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.4)',
    text: 'text-cyan-400',
    label: 'CALCULATING',
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <svg
        width={size}
        height={size}
        className="transform rotate-135"
        style={{ filter: `drop-shadow(0 0 12px ${colorConfig.glow})` }}
      >
        {/* Background Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1F293D"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Animated Filled Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Center Score Counter */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 pointer-events-none">
        <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white drop-shadow-md">
          {displayScore}
        </span>
        <span className="text-xs uppercase tracking-widest text-slate-400 font-mono mt-0.5">
          / 100 Score
        </span>
        {showSubtitle && (
          <span className={`text-[11px] font-bold tracking-wider mt-1.5 px-2 py-0.5 rounded ${colorConfig.text} bg-slate-900/80 border border-slate-700/60`}>
            {colorConfig.label}
          </span>
        )}
      </div>
    </div>
  );
};
