'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  PieChart,
  BarChart3,
  BarChart2,
  Scale,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  EyeOff,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export type ReportType =
  | 'RENT_ROLL'
  | 'TENANT_LEDGER'
  | 'AR_AGING'
  | 'PROPERTY_PNL'
  | 'CAM_RECONCILIATION'
  | 'LEASE_EXPIRATION'
  | 'OCCUPANCY_VACANCY';

interface ReportsViewProps {
  onRefresh?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const { language } = useLanguage();

  const [activeReport, setActiveReport] = useState<ReportType>('PROPERTY_PNL');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedTenantId, setSelectedTenantId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  // 1. Rent Roll Master Data
  const rentRollData = [
    {
      id: 1,
      property_id: 1,
      property_name: '7898 Zionsville Rd Commercial',
      unit_number: 'Suite 200',
      tenant_name: 'Circle City Tech Labs Inc.',
      sqft: 2400,
      base_rent: 3600.0,
      cam_monthly: 320.0,
      total_monthly: 3920.0,
      security_deposit: 7200.0,
      lease_start: '2025-01-01',
      lease_end: '2027-12-31',
      status: 'OCCUPIED',
    },
    {
      id: 2,
      property_id: 1,
      property_name: '7898 Zionsville Rd Commercial',
      unit_number: 'Suite 104',
      tenant_name: 'Indy Precision Logistics',
      sqft: 1250,
      base_rent: 2100.0,
      cam_monthly: 190.0,
      total_monthly: 2290.0,
      security_deposit: 4200.0,
      lease_start: '2025-11-01',
      lease_end: '2027-10-31',
      status: 'OCCUPIED',
    },
    {
      id: 3,
      property_id: 1,
      property_name: '7898 Zionsville Rd Commercial',
      unit_number: 'Suite 108',
      tenant_name: 'Midwest BioScience Innovations',
      sqft: 3150,
      base_rent: 4500.0,
      cam_monthly: 420.0,
      total_monthly: 4920.0,
      security_deposit: 9000.0,
      lease_start: '2024-05-01',
      lease_end: '2027-04-30',
      status: 'OCCUPIED',
    },
    {
      id: 4,
      property_id: 1,
      property_name: '7898 Zionsville Rd Commercial',
      unit_number: 'Suite 112',
      tenant_name: 'VACANT / AVAILABLE',
      sqft: 1800,
      base_rent: 0.0,
      cam_monthly: 0.0,
      total_monthly: 0.0,
      security_deposit: 0.0,
      lease_start: '-',
      lease_end: '-',
      status: 'AVAILABLE',
    },
    {
      id: 5,
      property_id: 2,
      property_name: 'Park 100 Industrial Center',
      unit_number: 'Warehouse Bay 4-A',
      tenant_name: 'Midwest Logistics Partners',
      sqft: 6800,
      base_rent: 8500.0,
      cam_monthly: 890.0,
      total_monthly: 9390.0,
      security_deposit: 17000.0,
      lease_start: '2025-06-01',
      lease_end: '2028-05-31',
      status: 'OCCUPIED',
    },
    {
      id: 6,
      property_id: 2,
      property_name: 'Park 100 Industrial Center',
      unit_number: 'Bay 4-B',
      tenant_name: 'Crossroads Freight Solutions',
      sqft: 5200,
      base_rent: 6400.0,
      cam_monthly: 680.0,
      total_monthly: 7080.0,
      security_deposit: 12800.0,
      lease_start: '2024-02-01',
      lease_end: '2027-01-31',
      status: 'OCCUPIED',
    },
    {
      id: 7,
      property_id: 3,
      property_name: 'Morris Street Flex Hub',
      unit_number: 'Flex Bay 12-B',
      tenant_name: 'Hoosier Supply Chain Corp',
      sqft: 3200,
      base_rent: 4400.0,
      cam_monthly: 460.0,
      total_monthly: 4860.0,
      security_deposit: 8800.0,
      lease_start: '2024-09-01',
      lease_end: '2027-08-31',
      status: 'OCCUPIED',
    },
  ];

  // 2. Tenant Ledger Data
  const tenantLedgerEntries = [
    {
      date: '2026-10-01',
      type: 'INVOICE',
      ref: 'INV-2026-1001',
      description: 'Monthly Base Rent & Estimated CAM (Suite 200)',
      charges: 3920.0,
      credits: 0.0,
      balance: 3920.0,
    },
    {
      date: '2026-10-03',
      type: 'PAYMENT',
      ref: 'REC-98101',
      description: 'ACH Direct Debit Payment received - Thank you',
      charges: 0.0,
      credits: 3920.0,
      balance: 0.0,
    },
    {
      date: '2026-11-01',
      type: 'INVOICE',
      ref: 'INV-2026-1101',
      description: 'Monthly Base Rent & Estimated CAM (Suite 200)',
      charges: 3920.0,
      credits: 0.0,
      balance: 3920.0,
    },
    {
      date: '2026-11-04',
      type: 'PAYMENT',
      ref: 'REC-99104',
      description: 'ACH Direct Debit Payment received - Thank you',
      charges: 0.0,
      credits: 3920.0,
      balance: 0.0,
    },
    {
      date: '2026-12-01',
      type: 'INVOICE',
      ref: 'INV-2026-1201',
      description: 'Monthly Base Rent & Estimated CAM (Suite 200)',
      charges: 3920.0,
      credits: 0.0,
      balance: 3920.0,
    },
    {
      date: '2026-12-02',
      type: 'PAYMENT',
      ref: 'REC-99202',
      description: 'ACH Direct Debit Payment received - Thank you',
      charges: 0.0,
      credits: 3920.0,
      balance: 0.0,
    },
    {
      date: '2026-12-31',
      type: 'CAM_TRUEUP',
      ref: 'CAM-ADJ-2026',
      description: '2026 Annual CAM Pro-Rata True-Up Adjustment (Underbilled)',
      charges: 248.50,
      credits: 0.0,
      balance: 248.50,
    },
  ];

  // 3. A/R Aging Data
  const arAgingData = [
    {
      tenant: 'Carlos Mendoza (Circle City Tech)',
      suite: 'Suite 200 (Zionsville Rd)',
      total_balance: 0.0,
      current: 0.0,
      days_30: 0.0,
      days_60: 0.0,
      days_90_plus: 0.0,
      last_payment: '2027-02-01',
      status: 'CURRENT',
    },
    {
      tenant: 'Marcus Sterling (Hoosier Supply Chain)',
      suite: 'Flex Bay 12-B (Morris St)',
      total_balance: 4400.0,
      current: 4400.0,
      days_30: 0.0,
      days_60: 0.0,
      days_90_plus: 0.0,
      last_payment: '2027-01-08',
      status: 'CURRENT',
    },
    {
      tenant: 'Sofia Alarcon (Meridian Wellness)',
      suite: 'Suite 310 (Meridian North)',
      total_balance: 5700.0,
      current: 2850.0,
      days_30: 2850.0,
      days_60: 0.0,
      days_90_plus: 0.0,
      last_payment: '2026-12-15',
      status: 'OVERDUE_30',
    },
    {
      tenant: 'Elena Rostova (Midwest Logistics)',
      suite: 'Warehouse Bay 4-A (Park 100)',
      total_balance: 0.0,
      current: 0.0,
      days_30: 0.0,
      days_60: 0.0,
      days_90_plus: 0.0,
      last_payment: '2027-02-04',
      status: 'CURRENT',
    },
  ];

  // 4. Property P&L Data
  const propertyPnlData = {
    operating_income: [
      { item: 'Base Rental Revenue', qbo_account: 'Rental Income', amount: 372000.0 },
      { item: 'CAM Operating Recoveries', qbo_account: 'CAM Reimbursements', amount: 38400.0 },
      { item: 'Late Fees & Parking Permits', qbo_account: 'Fee Revenue', amount: 3600.0 },
    ],
    operating_expenses: [
      { category: 'Property Taxes', qbo_account: 'Marion County Property Taxes', amount: 56800.0, color: '#3B82F6' },
      { category: 'Utilities & Trash', qbo_account: 'Utilities & Waste Disposal', amount: 28450.0, color: '#10B981' },
      { category: 'Insurance', qbo_account: 'Commercial Property Insurance', amount: 27400.0, color: '#F59E0B' },
      { category: 'Repairs & Maintenance', qbo_account: 'Repairs & Maintenance (HVAC, Paving)', amount: 24900.0, color: '#EC4899' },
      { category: 'Landscaping & Grounds', qbo_account: 'Landscaping', amount: 14200.0, color: '#8B5CF6' },
      { category: 'Professional & Legal Fees', qbo_account: 'Legal & Accounting', amount: 8400.0, color: '#64748B' },
    ],
    non_operating_expenses: [
      { item: 'Advertising & Marketing', qbo_account: 'Advertising (Owner)', amount: 5700.0 },
      { item: 'Capital Remodeling & Pylon Sign', qbo_account: 'Capital Expenditure', amount: 18500.0 },
      { item: 'Management Administrative SaaS', qbo_account: 'SaaS & Bank Fees', amount: 4200.0 },
    ],
  };

  // 5. CAM Reconciliation Comparison Data
  const camComparisonData = [
    {
      suite: 'Suite 200',
      tenant: 'Circle City Tech Labs',
      pro_rata_pct: 35.29,
      allocated_cam: 10495.42,
      billed_cam: 3840.0,
      adjustment: 6655.42,
      status: 'UNDERBILLED',
    },
    {
      suite: 'Suite 104',
      tenant: 'Indy Precision Logistics',
      pro_rata_pct: 18.38,
      allocated_cam: 5466.3,
      billed_cam: 2280.0,
      adjustment: 3186.3,
      status: 'UNDERBILLED',
    },
    {
      suite: 'Suite 108',
      tenant: 'Midwest BioScience',
      pro_rata_pct: 46.32,
      allocated_cam: 13775.8,
      billed_cam: 5040.0,
      adjustment: 8735.8,
      status: 'UNDERBILLED',
    },
  ];

  // 6. Lease Expiration Data
  const leaseExpirationData = [
    {
      tenant: 'Sofia Alarcon (Meridian Wellness)',
      suite: 'Suite 310',
      property: 'Meridian North Executive',
      sqft: 1100,
      monthly_rent: 2850.0,
      expiration_date: '2027-02-28',
      quarter: 'Q1 2027',
      days_remaining: 15,
      urgency: 'IMMEDIATE',
      renewal_status: 'Negotiating Extension',
    },
    {
      tenant: 'Midwest BioScience Innovations',
      suite: 'Suite 108',
      property: '7898 Zionsville Rd Commercial',
      sqft: 3150,
      monthly_rent: 4500.0,
      expiration_date: '2027-04-30',
      quarter: 'Q2 2027',
      days_remaining: 76,
      urgency: 'HIGH',
      renewal_status: 'Renewal Sent',
    },
    {
      tenant: 'Hoosier Supply Chain Corp',
      suite: 'Flex Bay 12-B',
      property: 'Morris Street Flex Hub',
      sqft: 3200,
      monthly_rent: 4400.0,
      expiration_date: '2027-08-31',
      quarter: 'Q3 2027',
      days_remaining: 199,
      urgency: 'MEDIUM',
      renewal_status: 'Pending Review',
    },
    {
      tenant: 'Indy Precision Logistics',
      suite: 'Suite 104',
      property: '7898 Zionsville Rd Commercial',
      sqft: 1250,
      monthly_rent: 2100.0,
      expiration_date: '2027-10-31',
      quarter: 'Q4 2027',
      days_remaining: 260,
      urgency: 'LOW',
      renewal_status: 'Active',
    },
    {
      tenant: 'Circle City Tech Labs Inc.',
      suite: 'Suite 200',
      property: '7898 Zionsville Rd Commercial',
      sqft: 2400,
      monthly_rent: 3600.0,
      expiration_date: '2027-12-31',
      quarter: 'Q4 2027',
      days_remaining: 321,
      urgency: 'LOW',
      renewal_status: 'Active',
    },
  ];

  // 7. Occupancy & Vacancy Data
  const occupancyData = [
    {
      property: '7898 Zionsville Rd Commercial',
      total_suites: 36,
      occupied_suites: 33,
      vacant_suites: 3,
      total_sqft: 42000,
      occupied_sqft: 38400,
      physical_occupancy: 91.67,
      economic_occupancy: 93.4,
      monthly_vacancy_loss: 4200.0,
    },
    {
      property: 'Park 100 Industrial Center',
      total_suites: 24,
      occupied_suites: 22,
      vacant_suites: 2,
      total_sqft: 68000,
      occupied_sqft: 62500,
      physical_occupancy: 91.67,
      economic_occupancy: 92.1,
      monthly_vacancy_loss: 6500.0,
    },
    {
      property: 'Morris Street Flex Hub',
      total_suites: 16,
      occupied_suites: 14,
      vacant_suites: 2,
      total_sqft: 28000,
      occupied_sqft: 24500,
      physical_occupancy: 87.5,
      economic_occupancy: 89.0,
      monthly_vacancy_loss: 3800.0,
    },
    {
      property: 'Meridian North Executive Suites',
      total_suites: 28,
      occupied_suites: 27,
      vacant_suites: 1,
      total_sqft: 32000,
      occupied_sqft: 30900,
      physical_occupancy: 96.43,
      economic_occupancy: 97.2,
      monthly_vacancy_loss: 1950.0,
    },
  ];

  // Filtered Rent Roll
  const filteredRentRoll = useMemo(() => {
    return rentRollData.filter((item) => {
      const matchProperty =
        selectedPropertyId === 'ALL' || item.property_id.toString() === selectedPropertyId;
      const matchSearch =
        !searchQuery ||
        item.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.property_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProperty && matchSearch;
    });
  }, [rentRollData, selectedPropertyId, searchQuery]);

  const rentRollTotals = useMemo(() => {
    let sqft = 0;
    let base = 0;
    let cam = 0;
    let total = 0;
    let deposit = 0;

    for (const r of filteredRentRoll) {
      sqft += r.sqft;
      base += r.base_rent;
      cam += r.cam_monthly;
      total += r.total_monthly;
      deposit += r.security_deposit;
    }

    return { sqft, base, cam, total, deposit };
  }, [filteredRentRoll]);

  // Total P&L metrics
  const totalRevenue = propertyPnlData.operating_income.reduce((a, b) => a + b.amount, 0);
  const totalOperatingExp = propertyPnlData.operating_expenses.reduce((a, b) => a + b.amount, 0);
  const totalNetOperatingIncome = totalRevenue - totalOperatingExp;
  const totalCapExAdmin = propertyPnlData.non_operating_expenses.reduce((a, b) => a + b.amount, 0);
  const netCashFlow = totalNetOperatingIncome - totalCapExAdmin;

  // Handler for Export / Print
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    alert(
      language === 'en'
        ? `Exporting ${activeReport} report data to CSV spreadsheet.`
        : `Exportando reporte ${activeReport} a hoja de cálculo CSV.`
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Report Selector Tabs */}
      <div className="p-2 rounded-2xl bg-[#091322]/85 backdrop-blur-xl border border-white/[0.08] shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1">
          <button
            onClick={() => setActiveReport('PROPERTY_PNL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeReport === 'PROPERTY_PNL'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <TrendingUp size={13} />
            1. {language === 'en' ? 'Property P&L' : 'P&L Propiedad'}
          </button>

          <button
            onClick={() => setActiveReport('CAM_RECONCILIATION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeReport === 'CAM_RECONCILIATION'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Scale size={13} />
            2. {language === 'en' ? 'CAM Reconciliation' : 'Conciliación CAM'}
          </button>

          <button
            onClick={() => setActiveReport('RENT_ROLL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeReport === 'RENT_ROLL'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Building2 size={13} />
            3. {language === 'en' ? 'Rent Roll' : 'Rent Roll'}
          </button>

          <button
            onClick={() => setActiveReport('AR_AGING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeReport === 'AR_AGING'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Clock size={13} />
            4. {language === 'en' ? 'A/R Aging' : 'Antigüedad A/R'}
          </button>

          <button
            onClick={() => setActiveReport('OCCUPANCY_VACANCY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeReport === 'OCCUPANCY_VACANCY'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <PieChart size={13} />
            5. {language === 'en' ? 'Occupancy / Vacancy' : 'Ocupación & Vacancia'}
          </button>

          <button
            onClick={() => setActiveReport('LEASE_EXPIRATION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeReport === 'LEASE_EXPIRATION'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Calendar size={13} />
            6. {language === 'en' ? 'Lease Expirations' : 'Vencimiento Contratos'}
          </button>

          <button
            onClick={() => setActiveReport('TENANT_LEDGER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeReport === 'TENANT_LEDGER'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <FileText size={13} />
            7. {language === 'en' ? 'Tenant Ledger' : 'Libro Inquilino'}
          </button>
        </div>
      </div>

      {/* Control Filters, Charts Toggle & Export Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">{language === 'en' ? 'All Portfolio Properties' : 'Todo el Portafolio'}</option>
            <option value="1">7898 Zionsville Rd Commercial Center</option>
            <option value="2">Park 100 Industrial Center</option>
            <option value="3">Morris Street Flex Hub</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-xs bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="2026">FY 2026</option>
            <option value="2027">FY 2027</option>
          </select>

          {activeReport === 'TENANT_LEDGER' && (
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(parseInt(e.target.value))}
              className="text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="1">Carlos Mendoza — Suite 200 (Circle City Tech Labs)</option>
              <option value="2">Elena Rostova — Bay 4-A (Midwest Logistics)</option>
              <option value="3">Marcus Sterling — Bay 12-B (Hoosier Supply Chain)</option>
              <option value="4">Sofia Alarcon — Suite 310 (Meridian Wellness)</option>
            </select>
          )}

          {/* Charts Display Toggle */}
          <button
            onClick={() => setShowCharts((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCharts
                ? 'bg-[#D4AF37]/20 text-[#F3D270] border border-[#D4AF37]/40 shadow-sm shadow-[#D4AF37]/10'
                : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:text-white'
            }`}
          >
            {showCharts ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>{language === 'en' ? 'Visual Charts' : 'Gráficos Analíticos'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={13} />
            {language === 'en' ? 'Export CSV' : 'Exportar CSV'}
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={13} />
            {language === 'en' ? 'Print / PDF' : 'Imprimir / PDF'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REPORT: PROPERTY P&L (WITH ADVANCED WATERFALL & EXPENSE CHARTS)           */}
      {/* ========================================================================= */}
      {activeReport === 'PROPERTY_PNL' && (
        <div className="space-y-6">
          {/* Visual Charts Section */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Waterfall Cashflow Bar Chart */}
              <div className="lg:col-span-7 glass-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="text-[#F3D270]" size={16} />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'en' ? 'Financial Flow & NOI Waterfall' : 'Flujo Financiero & Cascada NOI'}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400">
                    61.3% {language === 'en' ? 'NOI Margin' : 'Margen NOI'}
                  </span>
                </div>

                {/* Comparative Visual Bars */}
                <div className="space-y-3 pt-2">
                  {/* Gross Revenue */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/80 font-medium">1. Gross Revenue (Income)</span>
                      <span className="font-bold text-emerald-400 font-mono">${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full w-full" />
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/80 font-medium">2. (-) Operating Expenses</span>
                      <span className="font-bold text-amber-300 font-mono">-${totalOperatingExp.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                        style={{ width: `${(totalOperatingExp / totalRevenue) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* NOI */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#F3D270] font-bold">3. (=) Net Operating Income (NOI)</span>
                      <span className="font-extrabold text-[#F3D270] font-mono">${totalNetOperatingIncome.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-white/[0.06] overflow-hidden p-0.5 border border-[#D4AF37]/30">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3D270] rounded-full shadow-md"
                        style={{ width: `${(totalNetOperatingIncome / totalRevenue) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Free Cashflow */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60 font-medium">4. (-) Owner CapEx & Overhead</span>
                      <span className="font-bold text-rose-400 font-mono">-${totalCapExAdmin.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-rose-500/80 rounded-full"
                        style={{ width: `${(totalCapExAdmin / totalRevenue) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-white font-bold">Net Free Cash Flow to Owner:</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">${netCashFlow.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expense Category Breakdown Chart */}
              <div className="lg:col-span-5 glass-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-2">
                  <PieChart className="text-[#F3D270]" size={16} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'en' ? 'Operating Expense Distribution' : 'Distribución Gastos Operativos'}
                  </h4>
                </div>

                <div className="space-y-2.5 pt-1">
                  {propertyPnlData.operating_expenses.map((exp, idx) => {
                    const pct = ((exp.amount / totalOperatingExp) * 100).toFixed(1);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-white/80 font-medium flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: exp.color }} />
                            {exp.category}
                          </span>
                          <div className="font-mono text-white/90">
                            ${exp.amount.toLocaleString()} <span className="text-white/40">({pct}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: exp.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* P&L Statement Financial Table */}
          <div className="glass-card rounded-2xl border border-white/[0.08] p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Comprehensive Property Operating Statement (P&L)</h3>
              <p className="text-xs text-white/50">Fiscal Year {selectedYear} • Standard Real Estate GAAP Breakdown</p>
            </div>

            {/* Income Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#F3D270] uppercase tracking-wider pb-1 border-b border-[#F3D270]/20">
                <span>1. Operating Rental Revenue</span>
                <span>Amount (USD)</span>
              </div>
              {propertyPnlData.operating_income.map((inc, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 text-white/80">
                  <span>{inc.item} <span className="text-[10px] text-white/30 font-mono">({inc.qbo_account})</span></span>
                  <span className="font-mono text-white">${inc.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/[0.06] text-white">
                <span>Total Operating Income (Gross Revenue)</span>
                <span className="text-emerald-400 font-mono">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider pb-1 border-b border-amber-300/20">
                <span>2. Operating & CAM Expenses (From QBO)</span>
                <span>Amount (USD)</span>
              </div>
              {propertyPnlData.operating_expenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 text-white/80">
                  <span>{exp.category} <span className="text-[10px] text-white/30 font-mono">({exp.qbo_account})</span></span>
                  <span className="font-mono text-white">${exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-white/[0.06] text-white">
                <span>Total Operating Expenses</span>
                <span className="text-amber-300 font-mono">
                  ${totalOperatingExp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Net Operating Income (NOI) */}
            <div className="p-4 rounded-xl bg-[#0B172A] border border-[#D4AF37]/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#F3D270] uppercase tracking-wider block">Net Operating Income (NOI)</span>
                <span className="text-[10px] text-white/40">Gross Operating Income minus Total Operating Expenses</span>
              </div>
              <div className="text-xl font-extrabold text-[#F3D270] font-mono">
                ${totalNetOperatingIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Capital & Non-Recoverables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-rose-300 uppercase tracking-wider pb-1 border-b border-rose-300/20">
                <span>3. Non-Recoverable Overhead & Capital Expenditures</span>
                <span>Amount (USD)</span>
              </div>
              {propertyPnlData.non_operating_expenses.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 text-white/80">
                  <span>{item.item} <span className="text-[10px] text-white/30 font-mono">({item.qbo_account})</span></span>
                  <span className="font-mono text-white">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT: CAM RECONCILIATION (WITH VISUAL COMPARATIVE CHARTS)               */}
      {/* ========================================================================= */}
      {activeReport === 'CAM_RECONCILIATION' && (
        <div className="space-y-6">
          {/* Visual Analytics Charts */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* CAM Allocation vs Billed Comparison Bar Chart */}
              <div className="lg:col-span-8 glass-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="text-[#F3D270]" size={16} />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'en' ? 'Actual CAM Share vs Billed Collections (Annual)' : 'CAM Real Asignado vs Facturado Anual'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-[#F3D270]">
                      <span className="w-2.5 h-2.5 rounded bg-[#D4AF37]" /> Actual Allocated
                    </span>
                    <span className="flex items-center gap-1 text-white/60">
                      <span className="w-2.5 h-2.5 rounded bg-white/30" /> Monthly Billed
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {camComparisonData.map((item, i) => {
                    const maxVal = 15000;
                    const allocatedWidth = (item.allocated_cam / maxVal) * 100;
                    const billedWidth = (item.billed_cam / maxVal) * 100;

                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{item.suite}</span>{' '}
                            <span className="text-white/50 text-[11px]">({item.tenant})</span>
                          </div>
                          <div className="font-mono text-amber-300 font-bold text-xs flex items-center gap-1">
                            <ArrowUpRight size={12} />
                            +${item.adjustment.toLocaleString('en-US', { minimumFractionDigits: 2 })} Due
                          </div>
                        </div>

                        {/* Dual Bar Representation */}
                        <div className="space-y-1">
                          <div className="w-full h-3 rounded-md bg-white/[0.04] overflow-hidden flex items-center">
                            <div
                              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3D270] rounded-md transition-all duration-500"
                              style={{ width: `${allocatedWidth}%` }}
                            />
                            <span className="text-[10px] text-white/70 ml-2 font-mono">
                              ${item.allocated_cam.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-md bg-white/[0.04] overflow-hidden flex items-center">
                            <div
                              className="h-full bg-white/40 rounded-md transition-all duration-500"
                              style={{ width: `${billedWidth}%` }}
                            />
                            <span className="text-[9px] text-white/40 ml-2 font-mono">
                              ${item.billed_cam.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expense Pool Composition Card */}
              <div className="lg:col-span-4 glass-card p-5 rounded-2xl border border-white/[0.08] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="text-[#F3D270]" size={16} />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'en' ? 'Building Pool Recovery' : 'Composición del Fondo'}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-400 font-semibold">General Recoverable (78%)</span>
                        <span className="font-mono text-white">$124,800</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full w-[78%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-300 font-semibold">Lease-Specific (14%)</span>
                        <span className="font-mono text-white">$22,400</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-[14%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-rose-400 font-semibold">Non-Recoverable (8%)</span>
                        <span className="font-mono text-white">$12,950</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full w-[8%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-white/50">
                  <span className="text-[#F3D270] font-bold block mb-0.5">Golden Rule Active:</span>
                  Lease-level contract stipulations override account recovery defaults automatically.
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">Suite & Tenant</th>
                    <th className="py-4 px-6">Area (SqFt)</th>
                    <th className="py-4 px-6">Pro-Rata Share</th>
                    <th className="py-4 px-6">Eligible CAM Pool</th>
                    <th className="py-4 px-6">Allocated CAM</th>
                    <th className="py-4 px-6">Billed in Year</th>
                    <th className="py-4 px-6 text-right">Adjustment Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">
                      Suite 200 (Circle City Tech Labs)
                    </td>
                    <td className="py-3.5 px-6 font-mono text-white/80">2,400</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-400">35.29%</td>
                    <td className="py-3.5 px-6 font-mono text-white">$29,740.50</td>
                    <td className="py-3.5 px-6 font-bold font-mono text-white">$10,495.42</td>
                    <td className="py-3.5 px-6 font-mono text-white/80">$3,840.00</td>
                    <td className="py-3.5 px-6 text-right font-extrabold font-mono text-amber-300">+$6,655.42</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">
                      Suite 104 (Indy Precision Logistics)
                    </td>
                    <td className="py-3.5 px-6 font-mono text-white/80">1,250</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-400">18.38%</td>
                    <td className="py-3.5 px-6 font-mono text-white">$29,740.50</td>
                    <td className="py-3.5 px-6 font-bold font-mono text-white">$5,466.30</td>
                    <td className="py-3.5 px-6 font-mono text-white/80">$2,280.00</td>
                    <td className="py-3.5 px-6 text-right font-extrabold font-mono text-amber-300">+$3,186.30</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-bold text-white">
                      Suite 108 (Midwest BioScience Innovations)
                    </td>
                    <td className="py-3.5 px-6 font-mono text-white/80">3,150</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-400">46.32%</td>
                    <td className="py-3.5 px-6 font-mono text-white">$29,740.50</td>
                    <td className="py-3.5 px-6 font-bold font-mono text-white">$13,775.80</td>
                    <td className="py-3.5 px-6 font-mono text-white/80">$5,040.00</td>
                    <td className="py-3.5 px-6 text-right font-extrabold font-mono text-amber-300">+$8,735.80</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT: RENT ROLL (WITH PROPERTY REVENUE COMPARATIVE BARS)                */}
      {/* ========================================================================= */}
      {activeReport === 'RENT_ROLL' && (
        <div className="space-y-4">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#091322]/80 border border-white/[0.08]">
              <span className="text-[10px] text-white/40 uppercase font-semibold block">Total Managed Area</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{rentRollTotals.sqft.toLocaleString()} sqft</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#091322]/80 border border-white/[0.08]">
              <span className="text-[10px] text-white/40 uppercase font-semibold block">Monthly Base Rent</span>
              <span className="text-lg font-bold text-white mt-0.5 block">${rentRollTotals.base.toLocaleString()}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#091322]/80 border border-white/[0.08]">
              <span className="text-[10px] text-white/40 uppercase font-semibold block">Monthly CAM Pool</span>
              <span className="text-lg font-bold text-[#F3D270] mt-0.5 block">${rentRollTotals.cam.toLocaleString()}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#091322]/80 border border-white/[0.08]">
              <span className="text-[10px] text-white/40 uppercase font-semibold block">Annual Gross Potential</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">${(rentRollTotals.total * 12).toLocaleString()}</span>
            </div>
          </div>

          {/* Visual Charts Section */}
          {showCharts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'en' ? 'Monthly Collections by Complex' : 'Recaudación Mensual por Edificio'}
                  </h4>
                  <span className="text-[10px] text-[#F3D270] font-semibold">Indianapolis Portfolio</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white/80">7898 Zionsville Rd Commercial</span>
                      <span className="font-mono text-white">$11,130/mo</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3D270] rounded-full w-[40%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white/80">Park 100 Industrial Center</span>
                      <span className="font-mono text-white">$16,470/mo</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full w-[60%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-white/80">Morris Street Flex Hub</span>
                      <span className="font-mono text-white">$4,860/mo</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full w-[20%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'en' ? 'Rent vs CAM Revenue Share' : 'Distribución Renta Base vs CAM'}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-semibold">89.4% Base / 10.6% CAM</span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Base Rental Revenue</span>
                      <span className="font-mono text-white font-bold">${rentRollTotals.base.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B89222] rounded-full w-[89%]" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs text-white/70">
                      <span>CAM Maintenance Pool</span>
                      <span className="font-mono text-[#F3D270] font-bold">${rentRollTotals.cam.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[11%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">Suite & Property</th>
                    <th className="py-4 px-6">Tenant Name</th>
                    <th className="py-4 px-6">Area (SqFt)</th>
                    <th className="py-4 px-6">Base Rent</th>
                    <th className="py-4 px-6">Monthly CAM</th>
                    <th className="py-4 px-6">Total Billed</th>
                    <th className="py-4 px-6">Security Deposit</th>
                    <th className="py-4 px-6">Lease Term</th>
                    <th className="py-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredRentRoll.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-white">{row.unit_number}</div>
                        <div className="text-[10px] text-white/40">{row.property_name}</div>
                      </td>
                      <td className="py-3.5 px-6 font-medium text-white/90">{row.tenant_name}</td>
                      <td className="py-3.5 px-6 font-mono text-white/80">{row.sqft.toLocaleString()}</td>
                      <td className="py-3.5 px-6 font-mono text-white">${row.base_rent.toFixed(2)}</td>
                      <td className="py-3.5 px-6 font-mono text-[#D4AF37]">${row.cam_monthly.toFixed(2)}</td>
                      <td className="py-3.5 px-6 font-bold font-mono text-white">${row.total_monthly.toFixed(2)}</td>
                      <td className="py-3.5 px-6 font-mono text-white/60">${row.security_deposit.toFixed(2)}</td>
                      <td className="py-3.5 px-6 text-white/60 text-[11px]">
                        {row.lease_start} &rarr; {row.lease_end}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {row.status === 'OCCUPIED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Occupied
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.06] text-white/50">
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT: A/R AGING (WITH VISUAL AGING BUCKETS BARS)                         */}
      {/* ========================================================================= */}
      {activeReport === 'AR_AGING' && (
        <div className="space-y-4">
          {showCharts && (
            <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-[#F3D270]" size={16} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'en' ? 'Accounts Receivable Aging Distribution' : 'Distribución Antigüedad de Cobro'}
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-400">
                  96.8% Collection Efficiency
                </span>
              </div>

              {/* Progress bar of buckets */}
              <div className="space-y-2">
                <div className="w-full h-4 rounded-xl bg-white/[0.06] overflow-hidden flex">
                  <div className="h-full bg-emerald-400 w-[72%]" title="Current (0-30 Days): $7,250" />
                  <div className="h-full bg-amber-400 w-[28%]" title="31-60 Days: $2,850" />
                  <div className="h-full bg-rose-500 w-[0%]" title="61-90+ Days: $0" />
                </div>
                <div className="flex items-center justify-between text-xs text-white/60 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    Current (0-30d): <strong className="text-white font-mono">$7,250 (71.8%)</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    31-60 Days: <strong className="text-amber-300 font-mono">$2,850 (28.2%)</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    90+ Days: <strong className="text-white/40 font-mono">$0.00 (0.0%)</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">Tenant & Suite</th>
                    <th className="py-4 px-6 text-right">Total Balance</th>
                    <th className="py-4 px-6 text-right">Current (0-30 Days)</th>
                    <th className="py-4 px-6 text-right">31-60 Days</th>
                    <th className="py-4 px-6 text-right">61-90 Days</th>
                    <th className="py-4 px-6 text-right">90+ Days</th>
                    <th className="py-4 px-6 text-right">Aging Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {arAgingData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{row.tenant}</div>
                        <div className="text-[10px] text-white/40">{row.suite}</div>
                      </td>
                      <td className="py-4 px-6 text-right font-bold font-mono text-white text-sm">
                        ${row.total_balance.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-white/80">
                        ${row.current.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-amber-300">
                        ${row.days_30.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-white/40">
                        ${row.days_60.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-white/40">
                        ${row.days_90_plus.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {row.status === 'CURRENT' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Current
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            30+ Days Past Due
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT: OCCUPANCY & VACANCY (WITH COMPARATIVE OCCUPANCY BARS)              */}
      {/* ========================================================================= */}
      {activeReport === 'OCCUPANCY_VACANCY' && (
        <div className="space-y-4">
          {showCharts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'en' ? 'Physical vs Economic Occupancy' : 'Ocupación Física vs Económica'}
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-bold">94.2% Portfolio Average</span>
                </div>

                <div className="space-y-3 pt-1">
                  {occupancyData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/80 font-medium">{item.property}</span>
                        <span className="font-mono text-emerald-400 font-bold">{item.physical_occupancy}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden flex gap-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                          style={{ width: `${item.physical_occupancy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-white/[0.08] flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    {language === 'en' ? 'Total Vacancy Loss Impact' : 'Pérdida Mensual por Vacancia'}
                  </h4>
                  <p className="text-xs text-white/50">
                    Calculated opportunity cost across unleased square footage in Marion County.
                  </p>
                  <div className="text-2xl font-extrabold text-rose-400 font-mono mt-3">
                    -$16,450.00 / month
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs flex items-center justify-between">
                  <span className="text-white/60">Portfolio Vacant Suites:</span>
                  <span className="font-bold text-white font-mono">8 Suites Available</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">Property / Complex</th>
                    <th className="py-4 px-6">Suites (Occ / Total)</th>
                    <th className="py-4 px-6">Area (Occ / Total SqFt)</th>
                    <th className="py-4 px-6">Physical Occupancy</th>
                    <th className="py-4 px-6">Economic Occupancy</th>
                    <th className="py-4 px-6 text-right">Monthly Vacancy Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {occupancyData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-bold text-white">{row.property}</td>
                      <td className="py-4 px-6 text-white/80">
                        {row.occupied_suites} / {row.total_suites} suites
                      </td>
                      <td className="py-4 px-6 font-mono text-white/80">
                        {row.occupied_sqft.toLocaleString()} / {row.total_sqft.toLocaleString()} sqft
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">{row.physical_occupancy}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${row.physical_occupancy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">{row.economic_occupancy}%</td>
                      <td className="py-4 px-6 text-right font-bold font-mono text-rose-400">
                        -${row.monthly_vacancy_loss.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT: LEASE EXPIRATIONS (WITH QUARTERLY TIMELINE)                       */}
      {/* ========================================================================= */}
      {activeReport === 'LEASE_EXPIRATION' && (
        <div className="space-y-4">
          {showCharts && (
            <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {language === 'en' ? 'Upcoming Lease Expirations by Quarter' : 'Vencimientos de Contratos por Trimestre'}
                </h4>
                <span className="text-[11px] text-amber-300 font-semibold">FY 2027 Expirations</span>
              </div>

              <div className="grid grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-semibold">Q1 2027</span>
                  <div className="text-base font-bold text-rose-400 mt-1">1 Lease</div>
                  <span className="text-[10px] text-white/50">$2,850/mo</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-semibold">Q2 2027</span>
                  <div className="text-base font-bold text-amber-300 mt-1">1 Lease</div>
                  <span className="text-[10px] text-white/50">$4,500/mo</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-semibold">Q3 2027</span>
                  <div className="text-base font-bold text-white mt-1">1 Lease</div>
                  <span className="text-[10px] text-white/50">$4,400/mo</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                  <span className="text-[10px] text-white/40 uppercase font-semibold">Q4 2027</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">2 Leases</div>
                  <span className="text-[10px] text-white/50">$5,700/mo</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">Tenant & Suite</th>
                    <th className="py-4 px-6">Property</th>
                    <th className="py-4 px-6">Area (SqFt)</th>
                    <th className="py-4 px-6">Monthly Rent</th>
                    <th className="py-4 px-6">Expiration Date</th>
                    <th className="py-4 px-6">Days Remaining</th>
                    <th className="py-4 px-6 text-right">Renewal Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {leaseExpirationData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{row.tenant}</div>
                        <div className="text-[10px] text-[#F3D270]">{row.suite}</div>
                      </td>
                      <td className="py-4 px-6 text-white/70">{row.property}</td>
                      <td className="py-4 px-6 font-mono text-white/80">{row.sqft.toLocaleString()}</td>
                      <td className="py-4 px-6 font-mono text-white font-bold">${row.monthly_rent.toFixed(2)}</td>
                      <td className="py-4 px-6 font-mono text-white">{row.expiration_date}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`font-bold ${
                            row.urgency === 'IMMEDIATE'
                              ? 'text-rose-400'
                              : row.urgency === 'HIGH'
                              ? 'text-amber-400'
                              : 'text-white/60'
                          }`}
                        >
                          {row.days_remaining} days
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/[0.05] text-white/80 border border-white/[0.08]">
                          {row.renewal_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT: TENANT LEDGER                                                     */}
      {/* ========================================================================= */}
      {activeReport === 'TENANT_LEDGER' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#091322]/90 border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Tenant Account Statement</span>
              <h3 className="text-base font-bold text-white mt-0.5">Circle City Tech Labs Inc. (Carlos Mendoza)</h3>
              <p className="text-xs text-[#D4AF37]">7898 Zionsville Rd Commercial Center • Suite 200 (2,400 sqft)</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-white/50 block">Current Balance</span>
              <span className="text-xl font-extrabold text-amber-300">$248.50</span>
              <span className="text-[10px] text-white/40 block">Net 30 True-up</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    <th className="py-4 px-6">Posting Date</th>
                    <th className="py-4 px-6">Type & Reference</th>
                    <th className="py-4 px-6">Description / Memo</th>
                    <th className="py-4 px-6 text-right">Charges (USD)</th>
                    <th className="py-4 px-6 text-right">Payments / Credits</th>
                    <th className="py-4 px-6 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {tenantLedgerEntries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-6 font-mono text-white/80">{row.date}</td>
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-white font-mono block">{row.ref}</span>
                        <span className="text-[10px] text-white/40">{row.type}</span>
                      </td>
                      <td className="py-3.5 px-6 text-white/80 max-w-sm">{row.description}</td>
                      <td className="py-3.5 px-6 text-right font-mono text-white">
                        {row.charges > 0 ? `$${row.charges.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-emerald-400">
                        {row.credits > 0 ? `$${row.credits.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold font-mono text-white">
                        ${row.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
