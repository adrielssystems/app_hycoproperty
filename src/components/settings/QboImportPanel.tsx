'use client';

import React, { useState } from 'react';
import {
  CloudDownload,
  Eye,
  Receipt,
  FileText,
  Users,
  Sliders,
  Building2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface PreviewSummary {
  accounts_total: number;
  expense_accounts_total: number;
  expenses_total: number;
  expenses_amount: number;
  bills_count: number;
  purchases_count: number;
  invoices_total: number;
  invoices_paid: number;
  invoices_open: number;
  invoices_amount: number;
  customers_total: number;
  property_refs_total: number;
}

interface PreviewResponse {
  realm_id: string;
  environment: string;
  summary: PreviewSummary;
  preview: {
    expense_accounts: Array<{ id: string; fullyQualifiedName: string; accountType: string }>;
    expenses: Array<{
      qboExpenseId: string;
      sourceType: string;
      vendorName: string;
      accountName: string;
      amount: number;
      expenseDate: string;
    }>;
    invoices: Array<{
      id: string;
      docNumber: string;
      customerName: string;
      totalAmt: number;
      dueDate: string;
      status: string;
    }>;
    customers: Array<{ id: string; displayName: string; email: string; balance: number }>;
    property_refs: Array<{ id: string; name: string; source: string }>;
  };
  local_properties: Array<{ id: number; name: string; address: string }>;
}

export const QboImportPanel: React.FC = () => {
  const { language } = useLanguage();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'expenses' | 'invoices' | 'accounts' | 'customers'>('expenses');

  // Selective Import Toggles (default: Accounts & Expenses for Phase 2 CAM)
  const [importAccounts, setImportAccounts] = useState(true);
  const [importExpenses, setImportExpenses] = useState(true);
  const [importInvoices, setImportInvoices] = useState(false);
  const [importCustomers, setImportCustomers] = useState(false);
  const [importClassesAsProperties, setImportClassesAsProperties] = useState(false);
  const [defaultPropertyId, setDefaultPropertyId] = useState<number>(1);

  const handleLoadPreview = async () => {
    try {
      setIsLoadingPreview(true);
      const res = await fetch('/api/integrations/quickbooks/import');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to read QuickBooks Online data');
      }

      setPreviewData(data as PreviewResponse);
      if (data.local_properties?.[0]?.id) {
        setDefaultPropertyId(Number(data.local_properties[0].id));
      }

      toastInfo(
        language === 'en'
          ? `Found ${data.summary.expenses_total} expenses, ${data.summary.invoices_total} invoices & ${data.summary.expense_accounts_total} expense accounts in QBO.`
          : `Se encontraron ${data.summary.expenses_total} gastos, ${data.summary.invoices_total} facturas y ${data.summary.expense_accounts_total} cuentas de gasto en QBO.`,
        language === 'en' ? 'Live QBO Preview Ready' : 'Vista Previa QBO Lista'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Preview error';
      toastError(message, 'QuickBooks Preview Error');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRunImport = async () => {
    if (
      !importAccounts &&
      !importExpenses &&
      !importInvoices &&
      !importCustomers &&
      !importClassesAsProperties
    ) {
      toastError(
        language === 'en'
          ? 'Select at least one dataset to import.'
          : 'Seleccione al menos un bloque de datos para importar.',
        language === 'en' ? 'Nothing Selected' : 'Sin Selección'
      );
      return;
    }

    try {
      setIsImporting(true);
      const res = await fetch('/api/integrations/quickbooks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          import_accounts: importAccounts,
          import_expenses: importExpenses,
          import_invoices: importInvoices,
          import_customers: importCustomers,
          import_classes_as_properties: importClassesAsProperties,
          default_property_id: defaultPropertyId,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Import failed');
      }

      const s = data.stats;
      const parts: string[] = [];
      if (s.accounts_synced > 0) parts.push(`${s.accounts_synced} accounts`);
      if (s.expenses_imported + s.expenses_updated > 0) {
        parts.push(`${s.expenses_imported} new / ${s.expenses_updated} updated expenses`);
      }
      if (s.invoices_imported + s.invoices_updated > 0) {
        parts.push(`${s.invoices_imported} new / ${s.invoices_updated} updated invoices`);
      }
      if (s.customers_synced > 0) parts.push(`${s.customers_synced} customers`);
      if (s.properties_imported > 0) parts.push(`${s.properties_imported} properties`);

      toastSuccess(
        parts.length > 0
          ? `${language === 'en' ? 'Imported' : 'Importado'}: ${parts.join(' · ')}`
          : language === 'en'
          ? 'QuickBooks data is already up to date.'
          : 'Los datos de QuickBooks ya están actualizados.',
        language === 'en' ? 'QBO Import Completed' : 'Importación QBO Completa'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Import failed';
      toastError(message, 'QuickBooks Import Error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/[0.08] p-6 sm:p-7 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#F3D270]">
            <CloudDownload size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {language === 'en'
                ? 'QuickBooks Data Import & Expense Sync'
                : 'Importación de Datos y Gastos desde QuickBooks'}
            </h3>
            <p className="text-xs text-white/50">
              {language === 'en'
                ? 'Preview live QBO records safely (zero writes) before selectively syncing Accounts, Bills, Expenses, Invoices or Customers.'
                : 'Previsualice los registros en vivo de QBO sin modificar la BD antes de importar selectivamente Cuentas, Gastos, Facturas o Clientes.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLoadPreview()}
          disabled={isLoadingPreview}
          className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoadingPreview ? (
            <RefreshCw size={14} className="animate-spin text-[#F3D270]" />
          ) : (
            <Eye size={14} className="text-[#F3D270]" />
          )}
          <span>
            {isLoadingPreview
              ? language === 'en'
                ? 'Scanning QBO...'
                : 'Consultando QBO...'
              : language === 'en'
              ? 'Preview QBO Data (Safe)'
              : 'Vista Previa QBO (Seguro)'}
          </span>
        </button>
      </div>

      {/* Live Preview Summary Cards */}
      {previewData && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-[#070D18]/80 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                <Sliders size={11} className="text-[#F3D270]" />
                <span>{language === 'en' ? 'Expense Accts' : 'Cuentas Gasto'}</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-white mt-1">
                {previewData.summary.expense_accounts_total}
              </div>
              <div className="text-[10px] text-white/40">
                / {previewData.summary.accounts_total} total
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070D18]/80 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <Receipt size={11} />
                <span>{language === 'en' ? 'Bills & Expenses' : 'Bills & Gastos'}</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-white mt-1">
                {previewData.summary.expenses_total}
              </div>
              <div className="text-[10px] font-mono text-emerald-400/80">
                ${previewData.summary.expenses_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070D18]/80 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                <FileText size={11} />
                <span>{language === 'en' ? 'Invoices' : 'Facturas'}</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-white mt-1">
                {previewData.summary.invoices_total}
              </div>
              <div className="text-[10px] font-mono text-white/45">
                {previewData.summary.invoices_paid} paid · {previewData.summary.invoices_open} open
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070D18]/80 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <Users size={11} />
                <span>{language === 'en' ? 'Customers' : 'Clientes'}</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-white mt-1">
                {previewData.summary.customers_total}
              </div>
              <div className="text-[10px] text-white/40">Active QBO</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070D18]/80 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
                <Building2 size={11} className="text-[#F3D270]" />
                <span>Classes / Locs</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-white mt-1">
                {previewData.summary.property_refs_total}
              </div>
              <div className="text-[10px] text-white/40">Property tags</div>
            </div>
          </div>

          {/* Selective Checkboxes + Default Property + Run Import */}
          <div className="p-4 rounded-xl bg-[#070D18]/75 border border-white/[0.07] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-[#D4AF37]/40">
                <input
                  type="checkbox"
                  checked={importAccounts}
                  onChange={(e) => setImportAccounts(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-white block">Chart of Accounts</span>
                  <span className="text-[10px] text-white/45">Links QBO IDs to CAM rules</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-[#D4AF37]/40">
                <input
                  type="checkbox"
                  checked={importExpenses}
                  onChange={(e) => setImportExpenses(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-white block">Bills & Expenses (CAM)</span>
                  <span className="text-[10px] text-white/45">
                    {previewData.summary.bills_count} Bills + {previewData.summary.purchases_count} Purchases
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-[#D4AF37]/40">
                <input
                  type="checkbox"
                  checked={importInvoices}
                  onChange={(e) => setImportInvoices(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-white block">Historical Invoices</span>
                  <span className="text-[10px] text-white/45">Deduplicated by QBO ID</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-[#D4AF37]/40">
                <input
                  type="checkbox"
                  checked={importCustomers}
                  onChange={(e) => setImportCustomers(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-white block">Customers → Tenants</span>
                  <span className="text-[10px] text-white/45">Syncs QBO Customer IDs</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-[#D4AF37]/40">
                <input
                  type="checkbox"
                  checked={importClassesAsProperties}
                  onChange={(e) => setImportClassesAsProperties(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-white block">Classes / Locations</span>
                  <span className="text-[10px] text-white/45">Import QBO property tags</span>
                </div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/50 whitespace-nowrap">
                  {language === 'en' ? 'Default property for untagged expenses:' : 'Propiedad por defecto (sin Class):'}
                </span>
                <select
                  value={defaultPropertyId}
                  onChange={(e) => setDefaultPropertyId(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-[#0B1526] border border-white/10 text-xs text-white focus:border-[#D4AF37] outline-none cursor-pointer"
                >
                  {previewData.local_properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => void handleRunImport()}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] text-[#070D18] text-xs font-bold shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>
                  {isImporting
                    ? language === 'en'
                      ? 'Importing...'
                      : 'Importando...'
                    : language === 'en'
                    ? 'Import Selected from QBO'
                    : 'Importar Seleccionados de QBO'}
                </span>
              </button>
            </div>
          </div>

          {/* Sample Live Records Inspector */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {(
                [
                  { id: 'expenses', label: `Expenses (${previewData.summary.expenses_total})` },
                  { id: 'invoices', label: `Invoices (${previewData.summary.invoices_total})` },
                  { id: 'accounts', label: `Expense Accts (${previewData.summary.expense_accounts_total})` },
                  { id: 'customers', label: `Customers (${previewData.summary.customers_total})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activePreviewTab === tab.id
                      ? 'bg-[#D4AF37]/20 text-[#F3D270] border border-[#D4AF37]/40'
                      : 'bg-white/[0.03] text-white/50 hover:text-white border border-white/[0.05]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-[#070D18]/70 border border-white/[0.06] overflow-x-auto">
              {activePreviewTab === 'expenses' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-wider text-white/40">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Vendor / Payee</th>
                      <th className="py-2.5 px-4">QBO Account</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {previewData.preview.expenses.map((e) => (
                      <tr key={e.qboExpenseId} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-mono text-white/70">{e.expenseDate}</td>
                        <td className="py-2.5 px-4 font-semibold text-white">{e.vendorName}</td>
                        <td className="py-2.5 px-4 text-[#F3D270]">{e.accountName}</td>
                        <td className="py-2.5 px-4 text-white/50">{e.sourceType}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                          ${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activePreviewTab === 'invoices' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-wider text-white/40">
                      <th className="py-2.5 px-4">Doc #</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {previewData.preview.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-mono text-[#F3D270]">
                          {inv.docNumber} <span className="text-white/35">(#{inv.id})</span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">{inv.customerName}</td>
                        <td className="py-2.5 px-4 font-mono text-white/70">{inv.dueDate}</td>
                        <td className="py-2.5 px-4 text-white/70">{inv.status}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                          ${inv.totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activePreviewTab === 'accounts' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-wider text-white/40">
                      <th className="py-2.5 px-4">QBO ID</th>
                      <th className="py-2.5 px-4">Account Name</th>
                      <th className="py-2.5 px-4">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {previewData.preview.expense_accounts.map((a) => (
                      <tr key={a.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-mono text-white/50">#{a.id}</td>
                        <td className="py-2.5 px-4 font-semibold text-white">{a.fullyQualifiedName}</td>
                        <td className="py-2.5 px-4 text-white/60">{a.accountType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activePreviewTab === 'customers' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-[10px] uppercase tracking-wider text-white/40">
                      <th className="py-2.5 px-4">QBO ID</th>
                      <th className="py-2.5 px-4">Customer Name</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {previewData.preview.customers.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-mono text-white/50">#{c.id}</td>
                        <td className="py-2.5 px-4 font-semibold text-white">{c.displayName}</td>
                        <td className="py-2.5 px-4 text-white/60">{c.email || '—'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                          ${c.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
