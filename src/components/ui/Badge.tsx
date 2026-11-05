'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }[size];

  const variantStyles = {
    gold: {
      pill: 'bg-[#D4AF37]/10 text-[#F3D270] border-[#D4AF37]/30',
      dot: 'bg-[#F3D270]',
    },
    emerald: {
      pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    amber: {
      pill: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    rose: {
      pill: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      dot: 'bg-rose-400',
    },
    cyan: {
      pill: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      dot: 'bg-cyan-400',
    },
    purple: {
      pill: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      dot: 'bg-purple-400',
    },
    slate: {
      pill: 'bg-white/[0.05] text-white/70 border-white/10',
      dot: 'bg-white/50',
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeStyles} ${variantStyles.pill} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${variantStyles.dot} ${
            pulse ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

