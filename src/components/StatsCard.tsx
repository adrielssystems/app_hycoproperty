'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
  icon: LucideIcon;
  gradient?: string;
  subtitle?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  gradient = 'from-[#D4AF37]/20 via-[#D4AF37]/5 to-transparent',
  subtitle,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="glass-card p-4 sm:p-6 rounded-2xl relative overflow-hidden group border border-white/[0.08] hover:border-[#D4AF37]/40 bg-gradient-to-b from-white/[0.05] to-white/[0.01] backdrop-blur-xl"
    >
      {/* Background ambient gradient glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none bg-gradient-to-br ${gradient}`}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <p className="text-sm font-medium text-white/60 tracking-wide">{title}</p>
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#F3D270] group-hover:scale-110 group-hover:border-[#D4AF37]/50 transition-all duration-300">
          <Icon size={20} />
        </div>
      </div>

      <div className="flex items-baseline justify-between relative z-10">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-1">
            {value}
          </h2>
          {subtitle && (
            <p className="text-xs text-white/40">{subtitle}</p>
          )}
        </div>

        <p
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isPositive
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          }`}
        >
          <ArrowUpRight size={14} className={isPositive ? '' : 'rotate-90'} />
          {change}
        </p>
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

