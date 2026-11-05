'use client';

import React from 'react';
import { FileCheck2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Invoice {
  id: number;
  invoice_number: string;
  qbo_invoice_id: string;
  tenant_name: string;
  suite_reference: string;
  amount: number | string;
  due_date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | string;
  paid_at?: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  onInvoiceAction?: (invoice: Invoice) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({ invoices, onInvoiceAction }) => {
  const { t } = useLanguage();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileCheck2 size={12} />
            {t('statusReconciled')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={12} />
            {t('statusOverdue')}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-[#F3D270] border border-amber-500/20">
            <Clock size={12} />
            {t('statusPending')}
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span>{t('qboSectionTitle')}</span>
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">{t('colInvoiceNumber')}</th>
              <th className="py-3 px-3">{t('colTenant')}</th>
              <th className="py-3 px-3">{t('colSuite')}</th>
              <th className="py-3 px-3">{t('colAmount')}</th>
              <th className="py-3 px-3">{t('colDueDate')}</th>
              <th className="py-3 px-3">{t('colStatus')}</th>
              <th className="py-3 px-3 text-right">{t('colAction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                onClick={() => onInvoiceAction?.(inv)}
              >
                <td className="py-3 px-3">
                  <div className="font-bold text-white group-hover:text-[#F3D270] transition-colors">
                    {inv.invoice_number}
                  </div>
                  <div className="text-[10px] text-white/40">{inv.qbo_invoice_id ? inv.qbo_invoice_id.replace('QBO-', 'REC-') : 'AUT-REC'}</div>
                </td>
                <td className="py-3 px-3 font-medium text-white/90">
                  {inv.tenant_name}
                </td>
                <td className="py-3 px-3 text-white/70">
                  <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]">
                    {inv.suite_reference}
                  </span>
                </td>
                <td className="py-3 px-3 font-bold text-white text-sm">
                  ${parseFloat(String(inv.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-white/60">
                  {new Date(inv.due_date).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-3">
                  {getStatusBadge(inv.status)}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-[#D4AF37]/20 group-hover:text-[#F3D270] text-white/40 transition-colors cursor-pointer"
                    title="View details"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
