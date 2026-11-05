'use client';

import React from 'react';
import { Building2, Users, DollarSign, Wrench } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { TicketsList } from '@/components/TicketsList';
import { RightSidebarPanel } from '@/components/RightSidebarPanel';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { useLanguage } from '@/context/LanguageContext';

interface OverviewViewProps {
  stats: any;
  properties?: any[];
  invoices?: any[];
  tickets: any[];
  onOpenNewSuite?: () => void;
  onShareProperty?: (property: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  tickets,
  onNavigateTab,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 w-full">
      {/* 4 V18 Stats Cards Row (Full Width) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatsCard
          title={t('statTotalProperties')}
          value={String(stats.totalProperties)}
          change="+12.5%"
          isPositive={true}
          icon={Building2}
          subtitle={`${stats.totalUnits} ${t('statUnitsManaged')}`}
          gradient="from-cyan-500/20 via-sky-500/5 to-transparent"
        />

        <StatsCard
          title={t('statOccupancyRate')}
          value={`${stats.occupancyRate}%`}
          change="+4.2%"
          isPositive={true}
          icon={Users}
          subtitle={`${stats.occupiedUnits} ${t('statOccupiedUnits')} / ${stats.availableUnits} ${t('statAvailableUnits')}`}
          gradient="from-emerald-500/20 via-teal-500/5 to-transparent"
        />

        <StatsCard
          title={t('statMonthlyRevenue')}
          value={`$${stats.totalRevenuePaid.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          change="+18.4%"
          isPositive={true}
          icon={DollarSign}
          subtitle={`$${stats.totalRevenuePending.toLocaleString('en-US', { minimumFractionDigits: 0 })} ${t('statPendingRevenue')}`}
          gradient="from-[#D4AF37]/25 via-amber-500/5 to-transparent"
        />

        <StatsCard
          title={t('statActiveHelpdesk')}
          value={String(stats.activeTicketsCount)}
          change="SLA 100%"
          isPositive={true}
          icon={Wrench}
          subtitle={t('statSlaMet')}
          gradient="from-purple-500/20 via-indigo-500/5 to-transparent"
        />
      </div>

      {/* Main Content Grid: Expanded to full screen */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
        {/* Left 2 Columns: Live Incident Dispatch & Tickets */}
        <div className="xl:col-span-2 space-y-6">
          <TicketsList tickets={tickets} />
        </div>

        {/* Right 1 Column: Operational Summary & Quick Actions */}
        <div className="space-y-6">
          <RightSidebarPanel
            stats={stats}
            onSelectCollection={(type) => {
              if (type === 'qbo-paid' || type === 'qbo-pending') {
                onNavigateTab('billing');
              } else if (type === 'tickets') {
                onNavigateTab('maintenance');
              } else if (type === 'occupancy' || type === 'web-sync') {
                onNavigateTab('properties');
              }
            }}
          />

          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
};

