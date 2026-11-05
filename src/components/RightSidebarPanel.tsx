'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  DollarSign,
  Users,
  Wrench,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface RightSidebarPanelProps {
  stats: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    availableUnits: number;
    totalRevenuePaid: number;
    totalRevenuePending: number;
    activeTicketsCount: number;
  };
  onSelectCollection?: (type: string) => void;
}

export const RightSidebarPanel: React.FC<RightSidebarPanelProps> = ({
  stats,
  onSelectCollection,
}) => {
  const { t } = useLanguage();

  const collections = [
    {
      id: 'qbo-paid',
      title: t('colQboPaid'),
      subtitle: t('colQboPaidSub'),
      count: `$${stats.totalRevenuePaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      progress: 82,
    },
    {
      id: 'qbo-pending',
      title: t('colQboPending'),
      subtitle: t('colQboPendingSub'),
      count: `$${stats.totalRevenuePending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: FileText,
      color: 'text-[#F3D270] bg-[#D4AF37]/10 border-[#D4AF37]/20',
      progress: 35,
    },
    {
      id: 'occupancy',
      title: t('colOccupancy'),
      subtitle: `${stats.occupiedUnits} / ${stats.totalUnits} ${t('colOccupancy')}`,
      count: `${stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 94}%`,
      icon: Users,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      progress: stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 94,
    },
    {
      id: 'tickets',
      title: t('colHelpdesk'),
      subtitle: t('colHelpdeskSub'),
      count: `${stats.activeTicketsCount}`,
      icon: Wrench,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      progress: stats.activeTicketsCount * 20,
    },
    {
      id: 'web-sync',
      title: t('colWebSync'),
      subtitle: t('colWebSyncSub'),
      count: `${stats.availableUnits} ${t('statAvailableUnits')}`,
      icon: Globe,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      progress: 100,
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {t('operationalSummary')}
          </h2>
          <span className="p-1.5 rounded-lg bg-white/[0.05] text-white/50 hover:text-white cursor-pointer transition-colors">
            <TrendingUp size={15} />
          </span>
        </div>

        <div className="space-y-4">
          {collections.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                whileHover={{ x: 3 }}
                onClick={() => onSelectCollection?.(item.id)}
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${item.color}`}
                    >
                      <Icon size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-[#F3D270] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-white/40">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white">{item.count}</span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F3D270] transition-all duration-500"
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {t('dbQboSynced')}
        </span>
        <span className="font-semibold text-white/80">HYCO Core v1.0</span>
      </div>
    </div>
  );
};
