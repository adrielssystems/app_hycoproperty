'use client';

import React, { useMemo } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  TrendingUp,
  Send,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Invoice {
  id: number;
  invoice_number: string;
  qbo_invoice_id: string;
  tenant_name: string;
  suite_reference: string;
  amount: number | string;
  due_date: string;
  status: string;
  paid_at?: string | null;
}

interface BillingViewProps {
  invoices: Invoice[];
  stats: any;
  currentFilter?: string;
  searchQuery?: string;
  onRefresh?: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  invoices,
  stats,
  currentFilter = 'ALL',
  searchQuery = '',
  onRefresh,
}) => {
  const { language } = useLanguage();

  const fallbackInvoices: Invoice[] = useMemo(() => {
    if (invoices && invoices.length > 0) return invoices;
    return [
      {
        id: 101,
        invoice_number: 'INV-2026-001',
        qbo_invoice_id: 'REC-99401',
        tenant_name: 'Carlos Mendoza (Circle City Tech)',
        suite_reference: 'Suite 200 (Zionsville Rd)',
        amount: 3600.0,
        due_date: '2026-03-01',
        status: 'PAID',
        paid_at: '2026-03-01 09:30',
      },
      {
        id: 102,
        invoice_number: 'INV-2026-002',
        qbo_invoice_id: 'REC-99402',
        tenant_name: 'Elena Rostova (Midwest Logistics)',
        suite_reference: 'Warehouse Bay 4-A (Park 100)',
        amount: 8500.0,
        due_date: '2026-03-05',
        status: 'PAID',
        paid_at: '2026-03-04 14:15',
      },
      {
        id: 103,
        invoice_number: 'INV-2026-003',
        qbo_invoice_id: 'REC-99403',
        tenant_name: 'Marcus Sterling (Hoosier Supply Chain)',
        suite_reference: 'Flex Bay 12-B (Morris St)',
        amount: 4400.0,
        due_date: '2026-03-10',
        status: 'PENDING',
        paid_at: null,
      },
      {
        id: 104,
        invoice_number: 'INV-2026-004',
        qbo_invoice_id: 'REC-99404',
        tenant_name: 'Sofia Alarcon (Meridian Wellness)',
        suite_reference: 'Suite 310 (Meridian North)',
        amount: 2850.0,
        due_date: '2026-03-12',
        status: 'PENDING',
        paid_at: null,
      },
      {
        id: 105,
        invoice_number: 'INV-2026-005',
        qbo_invoice_id: 'REC-99405',
        tenant_name: 'David Sun (Apex BioTech)',
        suite_reference: 'Suite 104 (Zionsville Rd)',
        amount: 2100.0,
        due_date: '2026-03-01',
        status: 'PAID',
        paid_at: '2026-02-28 17:00',
      },
    ];
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return fallbackInvoices.filter((inv) => {
      const matchSearch =
        !searchQuery ||
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.suite_reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.qbo_invoice_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        !currentFilter ||
        currentFilter === 'ALL' ||
        currentFilter === 'all' ||
        currentFilter === 'invoices' ||
        inv.status === currentFilter;

      return matchSearch && matchStatus;
    });
  }, [fallbackInvoices, searchQuery, currentFilter]);

  const paidTotal = useMemo(() => {
    return fallbackInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [fallbackInvoices]);

  const pendingTotal = useMemo(() => {
    return fallbackInvoices
      .filter((i) => i.status !== 'PAID')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [fallbackInvoices]);

  return (
    <div className="space-y-6 w-full">
      {/* Invoices List / Table */}
      <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                <th className="py-4 px-6">{language === 'en' ? 'Invoice / Ref' : 'Factura / Ref'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Tenant / Recipient' : 'Inquilino / Receptor'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Suite / Property' : 'Suite / Propiedad'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Amount (USD)' : 'Monto (USD)'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Due Date' : 'Vencimiento'}</th>
                <th className="py-4 px-6">{language === 'en' ? 'Status & Sync' : 'Estado & Sincronización'}</th>
                <th className="py-4 px-6 text-right">{language === 'en' ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-xs">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Invoice # & QBO ID */}
                  <td className="py-4 px-6">
                    <div className="font-bold text-white group-hover:text-[#F3D270] transition-colors font-mono">
                      {inv.invoice_number}
                    </div>
                    <span className="text-[10px] text-[#D4AF37] font-mono flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={10} />
                      {inv.qbo_invoice_id.replace('QBO-', 'REC-')}
                    </span>
                  </td>

                  {/* Tenant */}
                  <td className="py-4 px-6">
                    <div className="font-medium text-white">{inv.tenant_name}</div>
                    <span className="text-[10px] text-white/40">Auto-Debit ACH</span>
                  </td>

                  {/* Suite Reference */}
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/[0.05] text-white/80 border border-white/[0.08]">
                      {inv.suite_reference}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-4 px-6">
                    <div className="font-extrabold text-white text-sm">
                      ${Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-white/40">Net 30 Days</span>
                  </td>

                  {/* Due Date */}
                  <td className="py-4 px-6">
                    <div className="font-medium text-white/80">{inv.due_date}</div>
                    {inv.paid_at && (
                      <span className="text-[10px] text-emerald-400">
                        {language === 'en' ? 'Paid:' : 'Pagado:'} {inv.paid_at.split(' ')[0]}
                      </span>
                    )}
                  </td>

                  {/* Status & Sync */}
                  <td className="py-4 px-6">
                    {inv.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} />
                        {language === 'en' ? 'Paid & Reconciled' : 'Pagado & Conciliado'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock size={11} />
                        {language === 'en' ? 'Pending Payment' : 'Pendiente de Cobro'}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => alert(language === 'en' ? `Downloading official invoice ${inv.invoice_number} (PDF)` : `Descargando factura oficial ${inv.invoice_number} (PDF)`)}
                        title={language === 'en' ? 'Download PDF Invoice' : 'Descargar Factura PDF'}
                        className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors cursor-pointer"
                      >
                        <Download size={14} />
                      </button>
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => alert(`Enviando recordatorio de pago a ${inv.tenant_name}`)}
                          title={language === 'en' ? 'Send Payment Reminder' : 'Enviar Recordatorio de Pago'}
                          className="p-2 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#F3D270] transition-colors cursor-pointer"
                        >
                          <Send size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Invoices Cards */}
        <div className="block md:hidden p-3 space-y-3">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-white text-sm font-mono">{inv.invoice_number}</div>
                  <div className="text-xs text-white/80 font-medium mt-0.5">{inv.tenant_name}</div>
                  <div className="text-[11px] text-white/40">{inv.suite_reference}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-white text-base">
                    ${Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-white/40">{inv.due_date}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                {inv.status === 'PAID' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={10} /> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Clock size={10} /> Pending
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Descargando factura ${inv.invoice_number}`)}
                    className="p-1.5 rounded-lg bg-white/[0.06] text-white/70"
                    title="PDF"
                  >
                    <Download size={13} />
                  </button>
                  {inv.status !== 'PAID' && (
                    <button
                      onClick={() => alert(`Enviando recordatorio a ${inv.tenant_name}`)}
                      className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#F3D270]"
                      title="Recordatorio"
                    >
                      <Send size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
