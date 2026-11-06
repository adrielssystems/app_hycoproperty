'use client';

import React from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Building2,
  Users,
  DollarSign,
  Wrench,
  FileSpreadsheet,
  LayoutGrid,
  Settings,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

interface HeaderProps {
  currentTab: string;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onNewSuite?: () => void;
  onNewProperty?: () => void;
  onTriggerSync?: () => void;
  isSyncing?: boolean;
  onRunDiagnostics?: () => void;
  onNavigateOverview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
  onNewProperty,
  onTriggerSync,
  isSyncing = false,
  onNavigateOverview,
}) => {
  const { t, language } = useLanguage();

  // Properties portfolio filters
  const propertyFilters = [
    { id: 'ALL', label: language === 'en' ? 'All Portfolios' : 'Todos' },
    { id: 'Commercial', label: language === 'en' ? 'Commercial' : 'Comerciales' },
    { id: 'Industrial', label: language === 'en' ? 'Industrial' : 'Industriales' },
    { id: 'Residential', label: language === 'en' ? 'Residential' : 'Residenciales' },
  ];

  // Tenants status filters
  const tenantFilters = [
    { id: 'ALL', label: language === 'en' ? 'All Tenants' : 'Todos' },
    { id: 'ACTIVE', label: language === 'en' ? 'Active Leases' : 'Activos' },
    { id: 'RENEWAL_DUE', label: language === 'en' ? 'Renewal Due' : 'Por Renovar' },
  ];

  // Billing status filters
  const billingFilters = [
    { id: 'ALL', label: language === 'en' ? 'All Invoices' : 'Todas' },
    { id: 'PAID', label: language === 'en' ? 'Paid' : 'Pagadas' },
    { id: 'PENDING', label: language === 'en' ? 'Pending' : 'Pendientes' },
  ];

  // Maintenance status filters
  const maintenanceFilters = [
    { id: 'ALL', label: language === 'en' ? 'All Incidents' : 'Todos' },
    { id: 'RECEIVED', label: language === 'en' ? 'Received' : 'Recibidos' },
    { id: 'ASSIGNED', label: language === 'en' ? 'Assigned' : 'Asignados' },
    { id: 'RESOLVED', label: language === 'en' ? 'Resolved' : 'Resueltos' },
  ];

  const renderLogo = () => (
    <div
      onClick={onNavigateOverview}
      className="flex items-center cursor-pointer group shrink-0 pr-2 sm:pr-4 border-r border-white/[0.08]"
      title="HYCO Property Management"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hyco_brand_logo.png?v=9"
        alt="HYCO Property Management"
        className="h-8 sm:h-11 md:h-13 w-auto object-contain drop-shadow-md group-hover:brightness-110 transition-all"
      />
    </div>
  );

  const renderRightUtilities = () => (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <LanguageSwitcher />

      <button
        onClick={onRefresh}
        className="p-1.5 sm:p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
        title={language === 'en' ? 'Refresh data' : 'Actualizar datos'}
      >
        <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  );

  return (
    <div className="w-full">
      {/* Overview Toolbar */}
      {currentTab === 'overview' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 w-full">
          {/* Top/Left Row: Logo + Section Title + Mobile Utilities */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              {renderLogo()}
              <div className="flex items-center gap-1.5">
                <LayoutGrid size={16} className="text-[#F3D270]" />
                <span className="font-bold text-xs sm:text-base text-white tracking-tight whitespace-nowrap">
                  {language === 'en' ? 'Overview' : 'Resumen General'}
                </span>
              </div>
            </div>

            <div className="flex sm:hidden">
              {renderRightUtilities()}
            </div>
          </div>

          {/* Bottom/Right: Search bar & Desktop Utilities */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-64 lg:w-80">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl glass-input text-xs text-white placeholder-white/40 focus:border-[#D4AF37]"
              />
            </div>
            <div className="hidden sm:flex">
              {renderRightUtilities()}
            </div>
          </div>
        </div>
      )}

      {/* Properties Toolbar */}
      {currentTab === 'properties' && (
        <div className="flex flex-col gap-2.5 lg:gap-4 w-full">
          {/* Row 1: Logo + Title + Action Button + Utilities */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              {renderLogo()}
              <div className="flex items-center gap-1.5 shrink-0">
                <Building2 size={16} className="text-[#F3D270]" />
                <span className="font-bold text-xs sm:text-base text-white tracking-tight whitespace-nowrap">
                  {language === 'en' ? 'Properties' : 'Propiedades'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNewProperty && (
                <button
                  onClick={onNewProperty}
                  className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs text-[#070D18] bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] hover:opacity-95 transition-all shadow-md shadow-[#D4AF37]/20 whitespace-nowrap cursor-pointer shrink-0"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>{language === 'en' ? 'New Property' : 'Nueva'}</span>
                </button>
              )}
              {renderRightUtilities()}
            </div>
          </div>

          {/* Row 2: Filter Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
              {propertyFilters.map((f) => {
                const isActive = currentFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onFilterChange(f.id)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#080F1D] font-bold shadow-md'
                        : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={language === 'en' ? 'Search properties or suites...' : 'Buscar propiedades...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs text-white placeholder-white/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tenants Toolbar */}
      {currentTab === 'tenants' && (
        <div className="flex flex-col gap-2.5 lg:gap-4 w-full">
          {/* Row 1: Logo + Title + Action Button + Utilities */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              {renderLogo()}
              <div className="flex items-center gap-1.5 shrink-0">
                <Users size={16} className="text-[#F3D270]" />
                <span className="font-bold text-xs sm:text-base text-white tracking-tight whitespace-nowrap">
                  {language === 'en' ? 'Tenants' : 'Inquilinos'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert(language === 'en' ? 'Opening Onboard Tenant wizard...' : 'Abriendo asistente de nuevo inquilino...')}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs text-[#070D18] bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] hover:opacity-95 transition-all shadow-md shadow-[#D4AF37]/20 whitespace-nowrap cursor-pointer shrink-0"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>{language === 'en' ? 'New Lease' : 'Nuevo Contrato'}</span>
              </button>
              {renderRightUtilities()}
            </div>
          </div>

          {/* Row 2: Filter Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
              {tenantFilters.map((f) => {
                const isActive = currentFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onFilterChange(f.id)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#080F1D] font-bold shadow-md'
                        : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={language === 'en' ? 'Search tenant or suite...' : 'Buscar inquilino...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs text-white placeholder-white/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Billing Toolbar */}
      {currentTab === 'billing' && (
        <div className="flex flex-col gap-2.5 lg:gap-4 w-full">
          {/* Row 1: Logo + Title + Action Buttons + Utilities */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              {renderLogo()}
              <div className="flex items-center gap-1.5 shrink-0">
                <DollarSign size={16} className="text-[#F3D270]" />
                <span className="font-bold text-xs sm:text-base text-white tracking-tight whitespace-nowrap">
                  {language === 'en' ? 'Billing & Finance' : 'Finanzas'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onTriggerSync || (() => alert(language === 'en' ? 'Syncing financial ledger...' : 'Sincronizando libro contable...'))}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs text-[#070D18] bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] hover:opacity-95 transition-all shadow-md shadow-[#D4AF37]/20 whitespace-nowrap cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? '...' : (language === 'en' ? 'Sync' : 'Sincronizar')}</span>
              </button>
              {renderRightUtilities()}
            </div>
          </div>

          {/* Row 2: Filter Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
              {billingFilters.map((f) => {
                const isActive = currentFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onFilterChange(f.id)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#080F1D] font-bold shadow-md'
                        : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={language === 'en' ? 'Search invoice # or tenant...' : 'Buscar factura o inquilino...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs text-white placeholder-white/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Toolbar */}
      {currentTab === 'maintenance' && (
        <div className="flex flex-col gap-2.5 lg:gap-4 w-full">
          {/* Row 1: Logo + Title + Action Button + Utilities */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              {renderLogo()}
              <div className="flex items-center gap-1.5 shrink-0">
                <Wrench size={16} className="text-[#F3D270]" />
                <span className="font-bold text-xs sm:text-base text-white tracking-tight whitespace-nowrap">
                  {language === 'en' ? 'Helpdesk' : 'Mantenimiento'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert(language === 'en' ? 'Opening New Ticket Dispatch modal...' : 'Abriendo creación de nueva orden de trabajo...')}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs text-[#070D18] bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] hover:opacity-95 transition-all shadow-md shadow-[#D4AF37]/20 whitespace-nowrap cursor-pointer shrink-0"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>{language === 'en' ? 'New Ticket' : 'Nueva Orden'}</span>
              </button>
              {renderRightUtilities()}
            </div>
          </div>

          {/* Row 2: Filter Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
              {maintenanceFilters.map((f) => {
                const isActive = currentFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onFilterChange(f.id)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#080F1D] font-bold shadow-md'
                        : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.05]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={language === 'en' ? 'Search ticket or property...' : 'Buscar ticket o propiedad...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl glass-input text-xs text-white placeholder-white/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Settings Toolbar */}
      {currentTab === 'settings' && (
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {renderLogo()}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Settings size={17} className="text-[#F3D270]" />
              <span className="font-bold text-xs sm:text-base text-white tracking-tight whitespace-nowrap">
                {language === 'en' ? 'Settings & Staff Permissions' : 'Ajustes y Permisos de Usuarios'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderRightUtilities()}
          </div>
        </div>
      )}
    </div>
  );
};
