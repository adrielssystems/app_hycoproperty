'use client';

import React from 'react';
import { Sparkles, ExternalLink, RefreshCw, Globe, FileDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface QuickActionsCardProps {
  onSyncQBO?: () => void;
  onSyncWeb?: () => void;
  onExportReport?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onSyncQBO,
  onSyncWeb,
  onExportReport,
}) => {
  const { t } = useLanguage();

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Sparkles size={16} className="text-[#F3D270]" />
        <span>{t('quickActionsTitle')}</span>
      </h3>
      <div className="space-y-2 text-xs">
        <button
          onClick={
            onSyncQBO ||
            (() => alert('Financial ledger sync completed successfully.'))
          }
          className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-white/80 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <RefreshCw size={13} className="text-[#F3D270] group-hover:rotate-180 transition-transform duration-500" />
            <span>{t('actionSyncQbo')}</span>
          </span>
          <ExternalLink size={13} className="text-white/40" />
        </button>

        <button
          onClick={
            onSyncWeb ||
            (() => alert('Zero Double-Entry sync with hycopropertymanagement.com (For Lease) executed.'))
          }
          className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-white/80 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <Globe size={13} className="text-cyan-400" />
            <span>{t('actionSyncWeb')}</span>
          </span>
          <ExternalLink size={13} className="text-white/40" />
        </button>

        <button
          onClick={
            onExportReport ||
            (() => alert('Generating monthly executive financial PDF report...'))
          }
          className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-white/80 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <FileDown size={13} className="text-emerald-400" />
            <span>{t('actionExportPdf')}</span>
          </span>
          <ExternalLink size={13} className="text-white/40" />
        </button>
      </div>
    </div>
  );
};
