'use client';

import React, { useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Flame,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Ticket {
  id: number;
  ticket_code: string;
  property_name: string;
  suite_number: string;
  tenant_name: string;
  category: string;
  priority: string;
  status: string;
  assigned_technician: string;
  description: string;
  created_at: string;
}

interface MaintenanceViewProps {
  tickets: Ticket[];
  currentFilter?: string;
  searchQuery?: string;
  onRefresh?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  tickets,
  currentFilter = 'ALL',
  searchQuery = '',
  onRefresh,
}) => {
  const { language } = useLanguage();

  const fallbackTickets: Ticket[] = useMemo(() => {
    if (tickets && tickets.length > 0) return tickets;
    return [
      {
        id: 1,
        ticket_code: 'TCK-1045',
        property_name: 'Biscayne Executive Suites',
        suite_number: 'Suite 310',
        tenant_name: 'Nexus Creative Lab',
        category: 'Access Control',
        priority: 'LOW',
        status: 'RESOLVED',
        assigned_technician: 'Mario Gomez (Security Tech)',
        description: 'Keycard reader sensor recalibration completed at pedestrian main gate.',
        created_at: '2027-02-01 11:20',
      },
      {
        id: 2,
        ticket_code: 'TCK-1044',
        property_name: 'HYCO Residential Enclave',
        suite_number: 'Common Areas',
        tenant_name: 'Administration',
        category: 'Electrical',
        priority: 'LOW',
        status: 'RECEIVED',
        assigned_technician: 'Pending Assignment',
        description: 'Hallway motion light sensor requires recalibration and LED bulb replacement.',
        created_at: '2027-02-01 10:05',
      },
      {
        id: 3,
        ticket_code: 'TCK-1043',
        property_name: 'HYCO Logistics Hub',
        suite_number: 'Warehouse Bay 105',
        tenant_name: 'Atlas Trans & Freight',
        category: 'HVAC / Climate',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        assigned_technician: 'David Sun (AirCold Tech)',
        description: 'Biannual scheduled maintenance on rooftop condenser unit #2.',
        created_at: '2027-01-28 16:45',
      },
      {
        id: 4,
        ticket_code: 'TCK-1042',
        property_name: 'HYCO Tower Plaza',
        suite_number: 'Suite 402',
        tenant_name: 'Vanguard Capital',
        category: 'Plumbing',
        priority: 'HIGH',
        status: 'RESOLVED',
        assigned_technician: 'Carlos Plumbing Pros',
        description: 'Restroom pressure valve replacement and leak isolation executed in under 2 hours.',
        created_at: '2027-01-27 08:30',
      },
    ];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return fallbackTickets.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suite_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        !currentFilter ||
        currentFilter === 'ALL' ||
        currentFilter === 'all' ||
        currentFilter === 'tickets' ||
        item.status.toLowerCase() === currentFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [fallbackTickets, searchQuery, currentFilter]);

  const activeCount = useMemo(() => {
    return fallbackTickets.filter((t) => t.status !== 'RESOLVED').length;
  }, [fallbackTickets]);

  const resolvedCount = useMemo(() => {
    return fallbackTickets.filter((t) => t.status === 'RESOLVED').length;
  }, [fallbackTickets]);

  return (
    <div className="space-y-6 w-full">
      {/* Tickets List - Full Screen Cards */}
      <div className="space-y-3.5">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="glass-card rounded-2xl p-5 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              {/* Top row with badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#F3D270] tracking-wider bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/25">
                  {ticket.ticket_code}
                </span>

                <span className="text-white/40">&bull;</span>

                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#D4AF37]" />
                  {ticket.property_name} ({ticket.suite_number})
                </span>

                {/* Priority */}
                {ticket.priority === 'HIGH' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Flame size={10} /> HIGH PRIORITY
                  </span>
                )}
                {ticket.priority === 'MEDIUM' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    MEDIUM
                  </span>
                )}
                {ticket.priority === 'LOW' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.08] text-white/60">
                    STANDARD
                  </span>
                )}

                {/* Category Badge */}
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.04] text-white/70 border border-white/[0.06]">
                  {ticket.category}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                {ticket.description}
              </p>

              {/* Sub-info: Tenant & Technician */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/50 pt-1">
                <span>
                  {language === 'en' ? 'Tenant:' : 'Inquilino:'}{' '}
                  <strong className="text-white font-medium">{ticket.tenant_name}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  {language === 'en' ? 'Assigned Tech:' : 'Técnico Asignado:'}{' '}
                  <strong className="text-[#F3D270] font-medium">{ticket.assigned_technician}</strong>
                </span>
                <span>&bull;</span>
                <span className="text-white/40">{ticket.created_at}</span>
              </div>
            </div>

            {/* Right Status & Action button */}
            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.05]">
              {ticket.status === 'RESOLVED' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                  {language === 'en' ? 'Resolved' : 'Resuelto'}
                </span>
              ) : ticket.status === 'ASSIGNED' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Clock size={12} />
                  {language === 'en' ? 'In Progress' : 'En Curso'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <Clock size={12} />
                  {language === 'en' ? 'Received' : 'Recibido'}
                </span>
              )}

              <button
                onClick={() => alert(`Gestionando orden ${ticket.ticket_code}`)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-white transition-colors cursor-pointer"
              >
                {language === 'en' ? 'View Work Details' : 'Ver Detalles'} &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
