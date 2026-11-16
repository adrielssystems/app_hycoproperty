'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  ShieldCheck,
  TrendingUp,
  Send,
  Building2,
  Calendar,
  Receipt,
  Sliders,
  Scale,
  Plus,
  Search,
  Filter,
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Link2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { NewExpenseModal } from '@/components/billing/NewExpenseModal';
import { LeaseOverridesModal } from '@/components/billing/LeaseOverridesModal';

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

interface ExpenseItem {
  id: number;
  property_id: number;
  property_name?: string;
  qbo_account_name: string;
  platform_category: string;
  default_recovery: string;
  vendor_name: string;
  amount: number;
  expense_date: string;
  fiscal_year: number;
  payment_method: string;
  description: string;
}

interface QBOAccountMapping {
  id: number;
  qbo_account_name: string;
  platform_category: string;
  default_recovery: 'Recoverable' | 'Lease-Specific' | 'Non-Recoverable';
  description?: string;
}

interface CAMReconciliationData {
  property: {
    id: number;
    name: string;
    address: string;
    type: string;
  };
  fiscal_year: number;
  metrics: {
    total_building_sqft: number;
    total_building_expenses: number;
    total_general_recoverable: number;
    total_lease_specific: number;
    total_non_recoverable: number;
    total_tenants_reconciled: number;
  };
  category_breakdown: {
    category: string;
    amount: number;
    recovery: string;
  }[];
  tenant_reconciliations: {
    unit_id: number;
    unit_number: string;
    tenant_name: string;
    area_sqft: number;
    pro_rata_share_pct: number;
    eligible_expenses_pool: number;
    allocated_cam_amount: number;
    cam_billed_amount: number;
    adjustment_balance: number;
    adjustment_status: 'UNDERBILLED' | 'OVERBILLED' | 'BALANCED';
    applied_overrides: {
      qbo_account_name: string;
      override_status: string;
      notes?: string;
    }[];
  }[];
  expenses_count: number;
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

  // Active Sub-Tab
  const [subTab, setSubTab] = useState<'invoices' | 'expenses' | 'mappings' | 'cam'>('invoices');

  // Modals state
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [selectedTenantForOverrides, setSelectedTenantForOverrides] = useState<any | null>(null);

  // Common filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Sub-tab 2: Expenses State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Sub-tab 3: Mappings State
  const [mappings, setMappings] = useState<QBOAccountMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [mappingCategoryFilter, setMappingCategoryFilter] = useState('ALL');
  const [mappingSearch, setMappingSearch] = useState('');

  // Sub-tab 4: CAM Reconciliation State
  const [camData, setCamData] = useState<CAMReconciliationData | null>(null);
  const [camLoading, setCamLoading] = useState(false);

  // Fallback invoices
  const fallbackInvoices: Invoice[] = useMemo(() => {
    if (invoices && invoices.length > 0) return invoices;
    return [
      {
        id: 101,
        invoice_number: 'INV-2027-001',
        qbo_invoice_id: 'REC-99401',
        tenant_name: 'Carlos Mendoza (Circle City Tech)',
        suite_reference: 'Suite 200 (Zionsville Rd)',
        amount: 3600.0,
        due_date: '2027-02-01',
        status: 'PAID',
        paid_at: '2027-02-01 09:30',
      },
      {
        id: 102,
        invoice_number: 'INV-2027-002',
        qbo_invoice_id: 'REC-99402',
        tenant_name: 'Elena Rostova (Midwest Logistics)',
        suite_reference: 'Warehouse Bay 4-A (Park 100)',
        amount: 8500.0,
        due_date: '2027-02-05',
        status: 'PAID',
        paid_at: '2027-02-04 14:15',
      },
      {
        id: 103,
        invoice_number: 'INV-2027-003',
        qbo_invoice_id: 'REC-99403',
        tenant_name: 'Marcus Sterling (Hoosier Supply Chain)',
        suite_reference: 'Flex Bay 12-B (Morris St)',
        amount: 4400.0,
        due_date: '2027-02-10',
        status: 'PENDING',
        paid_at: null,
      },
      {
        id: 104,
        invoice_number: 'INV-2027-004',
        qbo_invoice_id: 'REC-99404',
        tenant_name: 'Sofia Alarcon (Meridian Wellness)',
        suite_reference: 'Suite 310 (Meridian North)',
        amount: 2850.0,
        due_date: '2027-02-15',
        status: 'PENDING',
        paid_at: null,
      },
      {
        id: 105,
        invoice_number: 'INV-2027-005',
        qbo_invoice_id: 'REC-99405',
        tenant_name: 'David Sun (Apex BioTech)',
        suite_reference: 'Suite 104 (Zionsville Rd)',
        amount: 2100.0,
        due_date: '2027-02-01',
        status: 'PAID',
        paid_at: '2027-01-28 17:00',
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

  // Load Expenses
  const loadExpenses = async () => {
    setExpensesLoading(true);
    try {
      const res = await fetch(`/api/expenses?property_id=${selectedPropertyId}&fiscal_year=${selectedYear}`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Load Mappings
  const loadMappings = async () => {
    setMappingsLoading(true);
    try {
      const res = await fetch('/api/qbo');
      const data = await res.json();
      if (data.success) {
        setMappings(data.data);
      }
    } catch (err) {
      console.error('Failed to load mappings:', err);
    } finally {
      setMappingsLoading(false);
    }
  };

  // Load CAM Reconciliation
  const loadCAMReconciliation = async () => {
    setCamLoading(true);
    try {
      const res = await fetch(
        `/api/cam?property_id=${selectedPropertyId}&fiscal_year=${selectedYear}`
      );
      const data = await res.json();
      if (data.success) {
        setCamData(data.data);
      }
    } catch (err) {
      console.error('Failed to load CAM reconciliation:', err);
    } finally {
      setCamLoading(false);
    }
  };

  // Trigger loads when subTab changes
  useEffect(() => {
    if (subTab === 'expenses') {
      loadExpenses();
    } else if (subTab === 'mappings') {
      loadMappings();
    } else if (subTab === 'cam') {
      loadCAMReconciliation();
    }
  }, [subTab, selectedPropertyId, selectedYear]);

  // Toggle mapping recovery in real-time
  const handleToggleMappingRecovery = async (
    mapping: QBOAccountMapping,
    newRecovery: 'Recoverable' | 'Lease-Specific' | 'Non-Recoverable'
  ) => {
    try {
      const res = await fetch('/api/qbo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mapping.id,
          platform_category: mapping.platform_category,
          default_recovery: newRecovery,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMappings((prev) =>
          prev.map((m) => (m.id === mapping.id ? { ...m, default_recovery: newRecovery } : m))
        );
      }
    } catch (err) {
      console.error('Failed to update mapping recovery:', err);
    }
  };

  // Computed totals for expenses
  const expenseMetrics = useMemo(() => {
    let total = 0;
    let recoverable = 0;
    let leaseSpecific = 0;
    let nonRecoverable = 0;

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      total += amt;
      if (exp.default_recovery === 'Recoverable') recoverable += amt;
      else if (exp.default_recovery === 'Lease-Specific') leaseSpecific += amt;
      else nonRecoverable += amt;
    }

    return { total, recoverable, leaseSpecific, nonRecoverable };
  }, [expenses]);

  return (
    <div className="space-y-6 w-full">
      {/* Executive Sub-Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl bg-[#091322]/80 backdrop-blur-xl border border-white/[0.08]">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1">
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              subTab === 'invoices'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <DollarSign size={14} />
            {language === 'en' ? 'Invoices & Receivables' : 'Facturación & Cobros'}
          </button>

          <button
            onClick={() => setSubTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              subTab === 'expenses'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Receipt size={14} />
            {language === 'en' ? 'Property Expenses' : 'Gastos Operativos (QBO)'}
          </button>

          <button
            onClick={() => setSubTab('mappings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              subTab === 'mappings'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Sliders size={14} />
            {language === 'en' ? 'QBO Account Mapping' : 'Mapeo Cuentas QBO'}
          </button>

          <button
            onClick={() => setSubTab('cam')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              subTab === 'cam'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Scale size={14} />
            {language === 'en' ? 'CAM Reconciliation Engine' : 'Motor Conciliación CAM'}
          </button>
        </div>

        {/* Global Action / Secondary Filter */}
        {(subTab === 'expenses' || subTab === 'cam') && (
          <div className="flex items-center gap-2 px-2">
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(parseInt(e.target.value))}
              className="text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="1">7898 Zionsville Rd Commercial</option>
              <option value="2">Park 100 Industrial Center</option>
              <option value="3">Morris Street Flex Hub</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-xs bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="2026">FY 2026</option>
              <option value="2027">FY 2027</option>
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: INVOICES & RECEIVABLES                                         */}
      {/* ========================================================================= */}
      {subTab === 'invoices' && (
        <div className="space-y-6">
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
                      <td className="py-4 px-6">
                        <div className="font-bold text-white group-hover:text-[#F3D270] transition-colors font-mono">
                          {inv.invoice_number}
                        </div>
                        <span className="text-[10px] text-[#D4AF37] font-mono flex items-center gap-1 mt-0.5">
                          <ShieldCheck size={10} />
                          {inv.qbo_invoice_id.replace('QBO-', 'REC-')}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-white">{inv.tenant_name}</div>
                        <span className="text-[10px] text-white/40">Auto-Debit ACH</span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/[0.05] text-white/80 border border-white/[0.08]">
                          {inv.suite_reference}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-extrabold text-white text-sm">
                          ${Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-white/40">Net 30 Days</span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-white/80">{inv.due_date}</div>
                        {inv.paid_at && (
                          <span className="text-[10px] text-emerald-400">
                            {language === 'en' ? 'Paid:' : 'Pagado:'} {inv.paid_at.split(' ')[0]}
                          </span>
                        )}
                      </td>

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

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              alert(
                                language === 'en'
                                  ? `Downloading official invoice ${inv.invoice_number} (PDF)`
                                  : `Descargando factura oficial ${inv.invoice_number} (PDF)`
                              )
                            }
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
                      <div className="font-extrabold text-white text-sm">
                        ${Number(inv.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-[#D4AF37] font-mono">{inv.qbo_invoice_id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PROPERTY EXPENSES                                              */}
      {/* ========================================================================= */}
      {subTab === 'expenses' && (
        <div className="space-y-6">
          {/* Expense KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                  {language === 'en' ? 'Total Expenses' : 'Total Gastos'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  ${expenseMetrics.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-white/40">
                  {expenses.length} {language === 'en' ? 'bills recorded' : 'facturas registradas'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#F3D270]">
                <Receipt size={20} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Recoverable CAM' : 'CAM Recuperable'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  ${expenseMetrics.recoverable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-400/80">
                  {expenseMetrics.total > 0
                    ? ((expenseMetrics.recoverable / expenseMetrics.total) * 100).toFixed(1)
                    : 0}
                  % {language === 'en' ? 'pro-rata recoverable' : 'recuperable'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                  {language === 'en' ? 'Lease-Specific' : 'Por Contrato'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  ${expenseMetrics.leaseSpecific.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-amber-300/80">
                  {language === 'en' ? 'Subject to lease terms' : 'Sujeto a cláusulas'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <Sliders size={20} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Owner Non-Recoverable' : 'No Recuperable'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  ${expenseMetrics.nonRecoverable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-rose-400/80">
                  {language === 'en' ? 'Landlord overhead / capital' : 'Absorbido por dueño'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50">
              {language === 'en'
                ? 'Showing operating expenses synchronized from QuickBooks Online for this property.'
                : 'Mostrando gastos operativos sincronizados desde QuickBooks Online para esta propiedad.'}
            </div>
            <button
              onClick={() => setIsNewExpenseOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] text-xs font-bold shadow-lg hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              {language === 'en' ? 'Record Expense' : 'Registrar Gasto'}
            </button>
          </div>

          {/* Expenses Table */}
          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">{language === 'en' ? 'Date & Payee' : 'Fecha & Proveedor'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'QBO Account' : 'Cuenta QBO'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Platform Category' : 'Categoría'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Default Recovery' : 'Recuperación'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Payment Method' : 'Método Pago'}</th>
                    <th className="py-4 px-6 text-right">{language === 'en' ? 'Amount (USD)' : 'Monto (USD)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {expensesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40">
                        {language === 'en' ? 'Loading expenses...' : 'Cargando gastos...'}
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40">
                        {language === 'en' ? 'No expenses recorded for this fiscal year' : 'Sin gastos registrados'}
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{exp.vendor_name}</div>
                          <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1">
                            <Calendar size={11} />
                            {exp.expense_date}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-white/80">
                          {exp.qbo_account_name}
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.05] text-white/70 border border-white/[0.08]">
                            {exp.platform_category}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {exp.default_recovery === 'Recoverable' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 size={11} />
                              {language === 'en' ? 'Recoverable' : 'Recuperable'}
                            </span>
                          ) : exp.default_recovery === 'Lease-Specific' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Sliders size={11} />
                              {language === 'en' ? 'Lease-Specific' : 'Por Contrato'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <AlertCircle size={11} />
                              {language === 'en' ? 'Non-Recoverable' : 'No Recuperable'}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-white/60">
                          {exp.payment_method || 'ACH'}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="font-extrabold text-white text-sm">
                            ${Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          {exp.description && (
                            <div className="text-[10px] text-white/40 truncate max-w-xs ml-auto">
                              {exp.description}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: QBO ACCOUNT MAPPINGS                                           */}
      {/* ========================================================================= */}
      {subTab === 'mappings' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 text-white/30" size={14} />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search 43 QBO accounts...' : 'Buscar entre 43 cuentas QBO...'}
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <select
                value={mappingCategoryFilter}
                onChange={(e) => setMappingCategoryFilter(e.target.value)}
                className="text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="ALL">{language === 'en' ? 'All Categories' : 'Todas las Categorías'}</option>
                <option value="Utilities">Utilities</option>
                <option value="Landscaping">Landscaping</option>
                <option value="Insurance">Insurance</option>
                <option value="Property Taxes">Property Taxes</option>
                <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                <option value="Professional Fees">Professional Fees</option>
                <option value="Administrative">Administrative</option>
                <option value="Capital Expenditure">Capital Expenditure</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/?view=settings&tab=integrations"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#D4AF37]/15 text-[#F3D270] hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-[#D4AF37]/10"
              >
                <Link2 size={13} />
                <span>{language === 'en' ? 'Manage QBO OAuth & Services' : 'Gestionar Conexión QBO y Servicios'}</span>
                <ArrowUpRight size={13} />
              </a>

              <div className="text-xs text-white/50 text-right hidden sm:block">
                {language === 'en'
                  ? '43 Chart of Accounts Mappings'
                  : '43 Mapeos del Catálogo'}
              </div>
            </div>
          </div>

          {/* Mappings Table */}
          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">{language === 'en' ? 'QBO Account Name' : 'Cuenta en QBO'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Platform Category' : 'Categoría Plataforma'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Default CAM Recovery' : 'Recuperación Default'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Description / Purpose' : 'Descripción / Propósito'}</th>
                    <th className="py-4 px-6 text-right">{language === 'en' ? 'Toggle Default' : 'Cambiar Default'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {mappingsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-white/40">
                        {language === 'en' ? 'Loading account catalog...' : 'Cargando catálogo...'}
                      </td>
                    </tr>
                  ) : (
                    mappings
                      .filter((m) => {
                        const matchCat =
                          mappingCategoryFilter === 'ALL' ||
                          m.platform_category === mappingCategoryFilter;
                        const matchSearch =
                          !mappingSearch ||
                          m.qbo_account_name.toLowerCase().includes(mappingSearch.toLowerCase()) ||
                          m.platform_category.toLowerCase().includes(mappingSearch.toLowerCase()) ||
                          (m.description && m.description.toLowerCase().includes(mappingSearch.toLowerCase()));
                        return matchCat && matchSearch;
                      })
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-bold text-white font-mono">{m.qbo_account_name}</span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.05] text-white/80 border border-white/[0.08]">
                              {m.platform_category}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            {m.default_recovery === 'Recoverable' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 size={11} />
                                {language === 'en' ? 'Recoverable' : 'Recuperable'}
                              </span>
                            ) : m.default_recovery === 'Lease-Specific' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Sliders size={11} />
                                {language === 'en' ? 'Lease-Specific' : 'Por Contrato'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <AlertCircle size={11} />
                                {language === 'en' ? 'Non-Recoverable' : 'No Recuperable'}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-white/50 max-w-sm">
                            {m.description || 'Chart of accounts mapped entry'}
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleMappingRecovery(m, 'Recoverable')}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  m.default_recovery === 'Recoverable'
                                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-white/[0.03] text-white/40 hover:text-white'
                                }`}
                              >
                                Recov
                              </button>
                              <button
                                onClick={() => handleToggleMappingRecovery(m, 'Lease-Specific')}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  m.default_recovery === 'Lease-Specific'
                                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                                    : 'bg-white/[0.03] text-white/40 hover:text-white'
                                }`}
                              >
                                Lease
                              </button>
                              <button
                                onClick={() => handleToggleMappingRecovery(m, 'Non-Recoverable')}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  m.default_recovery === 'Non-Recoverable'
                                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                                    : 'bg-white/[0.03] text-white/40 hover:text-white'
                                }`}
                              >
                                Non-Rec
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CAM RECONCILIATION ENGINE                                      */}
      {/* ========================================================================= */}
      {subTab === 'cam' && (
        <div className="space-y-6">
          {/* Building Metrics Banner */}
          {camData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08]">
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                  {language === 'en' ? 'Building Rentable Area' : 'Área Rentable Edificio'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  {camData.metrics.total_building_sqft.toLocaleString()} sqft
                </span>
                <span className="text-[10px] text-white/40">
                  {camData.tenant_reconciliations.length} {language === 'en' ? 'suites occupied' : 'suites alquiladas'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08]">
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                  {language === 'en' ? 'Total Operating Expenses' : 'Total Gastos Operativos'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  ${camData.metrics.total_building_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#F3D270]">
                  FY {camData.fiscal_year} {language === 'en' ? 'incurred total' : 'incurrido total'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08]">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  {language === 'en' ? 'General Recoverable Pool' : 'Fondo General Recuperable'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  ${camData.metrics.total_general_recoverable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-400/80">
                  {language === 'en' ? 'Passed pro-rata to all tenants' : 'Distribuido pro-rata'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08]">
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                  {language === 'en' ? 'Lease-Specific Pool' : 'Fondo por Contrato'}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  ${camData.metrics.total_lease_specific.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-amber-300/80">
                  {language === 'en' ? 'Allocated per lease clauses' : 'Según cláusulas de contrato'}
                </span>
              </div>
            </div>
          )}

          {/* Golden Rule Explainer */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 to-[#B89222]/05 border border-[#D4AF37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#F3D270]">
              <Sparkles size={16} />
              <div>
                <span className="font-bold">
                  {language === 'en' ? 'Automated Pro-Rata Formula:' : 'Fórmula Pro-Rata Automatizada:'}
                </span>{' '}
                <span className="text-white/80">
                  Tenant Allocated CAM = (Eligible Expenses Pool) &times; (Unit SqFt / Building Rentable SqFt)
                </span>
              </div>
            </div>
            <span className="text-[11px] text-white/50">
              {language === 'en' ? 'Annual True-up Balance evaluated' : 'Balance Anual calculado'}
            </span>
          </div>

          {/* Reconciliation Matrix Table */}
          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">{language === 'en' ? 'Suite & Tenant' : 'Suite & Inquilino'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Area & Share %' : 'Área & Pro-Rata %'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Eligible Pool' : 'Fondo Elegible'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Allocated CAM' : 'CAM Asignado'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Billed in Year' : 'Facturado en Año'}</th>
                    <th className="py-4 px-6">{language === 'en' ? 'Adjustment Balance' : 'Balance Ajuste'}</th>
                    <th className="py-4 px-6 text-right">{language === 'en' ? 'Action / True-up' : 'Acción Ajuste'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {camLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-white/40">
                        {language === 'en' ? 'Calculating pro-rata reconciliation...' : 'Calculando pro-rata...'}
                      </td>
                    </tr>
                  ) : !camData || camData.tenant_reconciliations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-white/40">
                        {language === 'en' ? 'No tenant reconciliation available' : 'Sin datos de conciliación'}
                      </td>
                    </tr>
                  ) : (
                    camData.tenant_reconciliations.map((rec) => (
                      <tr key={rec.unit_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{rec.tenant_name}</div>
                          <div className="text-[11px] text-[#F3D270] font-semibold mt-0.5">
                            {rec.unit_number}
                          </div>
                          {rec.applied_overrides.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300">
                              <Sliders size={10} />
                              {rec.applied_overrides.length}{' '}
                              {language === 'en' ? 'lease overrides applied' : 'excepciones aplicadas'}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-medium text-white">{rec.area_sqft.toLocaleString()} sqft</div>
                          <span className="text-[11px] text-emerald-400 font-bold">
                            {rec.pro_rata_share_pct.toFixed(2)}%
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-medium text-white">
                            ${rec.eligible_expenses_pool.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-white/40">
                            {language === 'en' ? 'After lease rules' : 'Tras reglas contrato'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-extrabold text-white text-sm">
                            ${rec.allocated_cam_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-white/40">
                            {language === 'en' ? 'Actual CAM Share' : 'Cuota Real'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-medium text-white/80">
                            ${rec.cam_billed_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-white/40">
                            {language === 'en' ? 'Monthly Billed' : 'Facturado mensual'}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          {rec.adjustment_status === 'UNDERBILLED' ? (
                            <div>
                              <div className="font-extrabold text-amber-300 flex items-center gap-1">
                                <ArrowUpRight size={13} />
                                +${rec.adjustment_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {language === 'en' ? 'Underbilled (Invoice Due)' : 'Sub-facturado (Debe)'}
                              </span>
                            </div>
                          ) : rec.adjustment_status === 'OVERBILLED' ? (
                            <div>
                              <div className="font-extrabold text-emerald-400 flex items-center gap-1">
                                <ArrowDownLeft size={13} />
                                -${Math.abs(rec.adjustment_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {language === 'en' ? 'Overbilled (Credit Due)' : 'Sobre-facturado (Crédito)'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/[0.06] text-white/70">
                              <CheckCircle2 size={11} />
                              {language === 'en' ? 'Balanced' : 'Balanceado'}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setSelectedTenantForOverrides({
                                  id: rec.unit_id,
                                  unit_id: rec.unit_id,
                                  name: rec.tenant_name,
                                  company: rec.tenant_name,
                                  suite_number: rec.unit_number,
                                  property_name: camData.property.name,
                                })
                              }
                              title="Edit Lease CAM Overrides"
                              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors cursor-pointer"
                            >
                              <Sliders size={14} />
                            </button>

                            {rec.adjustment_status === 'UNDERBILLED' && (
                              <button
                                onClick={() =>
                                  alert(
                                    `Generando factura de ajuste CAM para ${rec.tenant_name} por $${rec.adjustment_balance.toFixed(2)}`
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#B89222] text-[#070D18] font-bold text-[11px] shadow transition-all cursor-pointer"
                              >
                                {language === 'en' ? 'Bill Adjustment' : 'Cobrar Ajuste'}
                              </button>
                            )}

                            {rec.adjustment_status === 'OVERBILLED' && (
                              <button
                                onClick={() =>
                                  alert(
                                    `Emitiendo nota de crédito CAM para ${rec.tenant_name} por $${Math.abs(rec.adjustment_balance).toFixed(2)}`
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] transition-all cursor-pointer"
                              >
                                {language === 'en' ? 'Issue Credit' : 'Emitir Crédito'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      <NewExpenseModal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        onSuccess={() => {
          loadExpenses();
          if (subTab === 'cam') loadCAMReconciliation();
        }}
      />

      {/* Lease CAM Overrides Modal */}
      {selectedTenantForOverrides && (
        <LeaseOverridesModal
          isOpen={!!selectedTenantForOverrides}
          onClose={() => setSelectedTenantForOverrides(null)}
          tenant={selectedTenantForOverrides}
          onSaveSuccess={() => {
            loadCAMReconciliation();
          }}
        />
      )}
    </div>
  );
};
