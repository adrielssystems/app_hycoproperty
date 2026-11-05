'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle2, Clock, UserCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Ticket {
  id: number;
  ticket_code: string;
  property_name: string;
  suite_number: string;
  tenant_name: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  status: 'RECEIVED' | 'IN_REVIEW' | 'ASSIGNED' | 'RESOLVED' | string;
  assigned_technician?: string;
  description: string;
  created_at: string;
}

interface TicketsListProps {
  tickets: Ticket[];
  onTicketSelect?: (ticket: Ticket) => void;
}

export const TicketsList: React.FC<TicketsListProps> = ({ tickets, onTicketSelect }) => {
  const { t } = useLanguage();

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return {
          label: t('statusResolved'),
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: CheckCircle2,
        };
      case 'ASSIGNED':
        return {
          label: t('statusAssigned'),
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          icon: UserCheck,
        };
      case 'IN_REVIEW':
        return {
          label: t('statusInReview'),
          color: 'bg-[#D4AF37]/15 text-[#F3D270] border-[#D4AF37]/30',
          icon: Clock,
        };
      case 'RECEIVED':
      default:
        return {
          label: t('statusReceived'),
          color: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          icon: Clock,
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'LOW':
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/[0.08]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Wrench size={18} className="text-[#F3D270]" />
          <span>{t('helpdeskTitle')}</span>
        </h2>
      </div>

      <div className="space-y-3">
        {tickets.map((tItem) => {
          const statusInfo = getStatusDisplay(tItem.status);
          const StatusIcon = statusInfo.icon;

          return (
            <motion.div
              key={tItem.id}
              whileHover={{ y: -2 }}
              onClick={() => onTicketSelect?.(tItem)}
              className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-[#D4AF37]/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#F3D270] shrink-0 mt-0.5">
                  <Wrench size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm text-white">{tItem.ticket_code}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-xs text-white/70 font-medium">
                      {tItem.property_name} ({tItem.suite_number})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(
                        tItem.priority
                      )}`}
                    >
                      {tItem.priority}
                    </span>
                  </div>

                  <p className="text-xs text-white/60 line-clamp-1">{tItem.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-white/40 mt-2">
                    <span>{t('tenantLabel')}: <strong className="text-white/70">{tItem.tenant_name}</strong></span>
                    {tItem.assigned_technician && (
                      <span>
                        {t('techLabel')}: <strong className="text-cyan-300">{tItem.assigned_technician}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Action Badge */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
                >
                  <StatusIcon size={13} />
                  {statusInfo.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
