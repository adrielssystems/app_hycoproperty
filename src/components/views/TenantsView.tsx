'use client';

import React, { useMemo } from 'react';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Tenant {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  property_name: string;
  suite_number: string;
  monthly_rent: number | string;
  lease_start: string;
  lease_end: string;
  qbo_customer_id: string;
  status: string;
}

interface TenantsViewProps {
  tenants: Tenant[];
  currentFilter?: string;
  searchQuery?: string;
  onOpenNewSuite?: () => void;
}

export const TenantsView: React.FC<TenantsViewProps> = ({
  tenants,
  currentFilter = 'ALL',
  searchQuery = '',
  onOpenNewSuite,
}) => {
  const { language } = useLanguage();

  // Fallback seed tenants if empty
  const activeTenantsList: Tenant[] = useMemo(() => {
    if (tenants && tenants.length > 0) return tenants;
    return [
      {
        id: 1,
        name: 'Carlos Mendoza',
        company: 'Circle City Tech Labs LLC',
        email: 'carlos@circlecitytech.com',
        phone: '+1 (317) 555-0192',
        property_name: '7898 Zionsville Rd Commercial Center',
        suite_number: 'Suite 200',
        monthly_rent: 3600,
        lease_start: '2025-01-01',
        lease_end: '2027-12-31',
        qbo_customer_id: 'ACCT-8801',
        status: 'ACTIVE',
      },
      {
        id: 2,
        name: 'Elena Rostova',
        company: 'Midwest Logistics Partners',
        email: 'e.rostova@midwestlogistics.com',
        phone: '+1 (317) 555-0144',
        property_name: 'Park 100 Industrial Center',
        suite_number: 'Warehouse Bay 4-A',
        monthly_rent: 8500,
        lease_start: '2025-06-01',
        lease_end: '2028-05-31',
        qbo_customer_id: 'ACCT-8802',
        status: 'ACTIVE',
      },
      {
        id: 3,
        name: 'Marcus Sterling',
        company: 'Hoosier Supply Chain Corp',
        email: 'msterling@hoosiersupply.com',
        phone: '+1 (317) 555-0188',
        property_name: 'Morris Street Flex & Service Hub',
        suite_number: 'Flex Bay 12-B',
        monthly_rent: 4400,
        lease_start: '2024-09-01',
        lease_end: '2027-08-31',
        qbo_customer_id: 'ACCT-8803',
        status: 'ACTIVE',
      },
      {
        id: 4,
        name: 'Sofia Alarcon',
        company: 'Meridian Wellness Center',
        email: 'salarcon@meridianwellness.org',
        phone: '+1 (317) 555-0112',
        property_name: 'Meridian North Executive Suites',
        suite_number: 'Suite 310',
        monthly_rent: 2850,
        lease_start: '2026-03-01',
        lease_end: '2027-02-28',
        qbo_customer_id: 'ACCT-8804',
        status: 'RENEWAL_DUE',
      },
      {
        id: 5,
        name: 'David Sun',
        company: 'Apex BioTech Dynamics',
        email: 'dsun@apexbiodynamics.com',
        phone: '+1 (317) 555-0277',
        property_name: '7898 Zionsville Rd Commercial Center',
        suite_number: 'Suite 104',
        monthly_rent: 2100,
        lease_start: '2025-11-01',
        lease_end: '2027-10-31',
        qbo_customer_id: 'ACCT-8805',
        status: 'ACTIVE',
      },
    ];
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    return activeTenantsList.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suite_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.qbo_customer_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        !currentFilter ||
        currentFilter === 'ALL' ||
        currentFilter === 'all' ||
        currentFilter === 'tenants' ||
        item.status === currentFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeTenantsList, searchQuery, currentFilter]);

  const totalMonthlyRoll = useMemo(() => {
    return activeTenantsList.reduce((acc, t) => acc + Number(t.monthly_rent || 0), 0);
  }, [activeTenantsList]);

  return (
    <div className="space-y-6 w-full">
      {/* Tenants List / Table */}
      <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                <th className="py-4 px-6">{language === 'en' ? 'Tenant / Company' : 'Inquilino / Empresa'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Property & Suite' : 'Propiedad y Suite'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Contact Info' : 'Contacto'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Monthly Rent' : 'Renta Mensual'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Lease Term' : 'Plazo Contrato'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Status & ID' : 'Estado & ID'}</th>
                <th className="py-4 px-6 text-right">{language === 'en' ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs">
              {filteredTenants.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Tenant & Company */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E3A5F] to-[#0B1526] border border-[#D4AF37]/30 flex items-center justify-center font-bold text-xs text-[#F3D270] shadow-md">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-[#F3D270] transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-white/50 font-medium">{item.company}</div>
                      </div>
                    </div>
                  </td>

                  {/* Property & Suite */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-[#D4AF37]" />
                      <span className="font-medium text-white">{item.property_name}</span>
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/[0.06] text-white/70">
                      {item.suite_number}
                    </span>
                  </td>

                  {/* Contact Info */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <a
                        href={`mailto:${item.email}`}
                        className="text-white/70 hover:text-[#F3D270] transition-colors flex items-center gap-1.5"
                      >
                        <Mail size={12} className="text-white/40" />
                        {item.email}
                      </a>
                      <span className="text-white/50 flex items-center gap-1.5">
                        <Phone size={12} className="text-white/40" />
                        {item.phone}
                      </span>
                    </div>
                  </td>

                  {/* Monthly Rent */}
                  <td className="py-4 px-6">
                    <div className="font-extrabold text-white text-sm">
                      ${Number(item.monthly_rent).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </div>
                    <span className="text-[10px] text-white/40">{language === 'en' ? '/ month USD' : '/ mes USD'}</span>
                  </td>

                  {/* Lease Term */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-white/80 font-medium">
                      <Calendar size={13} className="text-white/40" />
                      <span>{item.lease_start} &rarr; {item.lease_end}</span>
                    </div>
                    <span className="text-[10px] text-white/40">
                      {language === 'en' ? 'Standard 24-36 Mo Term' : 'Contrato Multianual'}
                    </span>
                  </td>

                  {/* Status & QBO Customer ID */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      {item.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {language === 'en' ? 'Active Lease' : 'Contrato Activo'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 w-fit">
                          <AlertCircle size={10} />
                          {language === 'en' ? 'Renewal Due' : 'Por Renovar'}
                        </span>
                      )}
                      <span className="text-[10px] text-white/40 font-mono tracking-tight">
                        {item.qbo_customer_id.replace('QBO-', 'ACCT-')}
                      </span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => alert(`Enviando estado de cuenta a ${item.email}`)}
                        title={language === 'en' ? 'Send Statement / Email' : 'Enviar Estado de Cuenta'}
                        className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors cursor-pointer"
                      >
                        <Mail size={14} />
                      </button>
                      <button
                        onClick={() => alert(`Abriendo expediente de contrato para ${item.name}`)}
                        title={language === 'en' ? 'View Lease Agreement' : 'Ver Contrato de Arrendamiento'}
                        className="p-2 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#F3D270] transition-colors cursor-pointer"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Tenants Cards */}
        <div className="block md:hidden p-3 space-y-3">
          {filteredTenants.map((item) => (
            <div key={item.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] border border-[#D4AF37]/30 flex items-center justify-center font-bold text-xs text-[#F3D270]">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{item.name}</div>
                    <div className="text-[10px] text-white/50">{item.company}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-white text-sm">
                    ${Number(item.monthly_rent).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-white/40">/mo</div>
                </div>
              </div>

              <div className="text-[11px] text-white/70 flex items-center justify-between">
                <span>{item.property_name}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/80 font-bold">{item.suite_number}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px]">
                {item.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <AlertCircle size={10} /> Renewal Due
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <a
                    href={`mailto:${item.email}`}
                    className="p-1.5 rounded-lg bg-white/[0.06] text-white/70"
                    title="Email"
                  >
                    <Mail size={12} />
                  </a>
                  <a
                    href={`tel:${item.phone}`}
                    className="p-1.5 rounded-lg bg-white/[0.06] text-white/70"
                    title="Phone"
                  >
                    <Phone size={12} />
                  </a>
                  <button
                    onClick={() => alert(`Expediente de ${item.name}`)}
                    className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#F3D270]"
                    title="Contrato"
                  >
                    <FileText size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
