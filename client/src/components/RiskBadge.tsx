import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { Decision } from '../types';

interface RiskBadgeProps {
  decision: Decision;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  decision,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    ALLOW: {
      label: 'ALLOW',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(34,197,94,0.25)]',
      icon: ShieldCheck,
    },
    CHALLENGE: {
      label: 'CHALLENGE',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      icon: ShieldAlert,
    },
    BLOCK: {
      label: 'BLOCK',
      color: 'bg-red-500/10 text-red-400 border-red-500/30',
      glow: 'shadow-[0_0_12px_rgba(239,68,68,0.25)]',
      icon: ShieldX,
    },
  }[decision] || {
    label: decision,
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    glow: '',
    icon: ShieldCheck,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3.5 py-1.5 gap-2',
  }[size];

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${config.color} ${config.glow} ${sizeClasses}`}
    >
      {showIcon && <IconComponent className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span className="tracking-wider uppercase">{config.label}</span>
    </span>
  );
};
