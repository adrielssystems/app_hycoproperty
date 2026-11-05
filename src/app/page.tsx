'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

import {
  Sidebar,
  Header,
  LogoutModal,
  NewSuiteModal,
  ShareSuiteModal,
  PropertyModal,
  OverviewView,
  PropertiesView,
  TenantsView,
  BillingView,
  MaintenanceView,
} from '@/components';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  // Navigation tab state ('overview' | 'properties' | 'tenants' | 'billing' | 'maintenance' | 'sync')
  const [currentTab, setCurrentTab] = useState('overview');
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNewSuiteModalOpen, setIsNewSuiteModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<any | null>(null);
  const [shareProperty, setShareProperty] = useState<{ id: number; name: string; address: string } | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User session
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatar_url: string;
  } | null>(null);

  // Dashboard Data State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 4,
    totalUnits: 120,
    occupiedUnits: 113,
    availableUnits: 7,
    occupancyRate: '94.2',
    totalRevenuePaid: 9700.0,
    totalRevenuePending: 10450.0,
    activeTicketsCount: 3,
    qboSyncStatus: 'ONLINE_SYNCED',
    dbStatus: 'CONNECTED_POSTGRES',
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  // Check Auth & Fetch Data
  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.authenticated && authData.user) {
        setUser(authData.user);
      } else {
        router.push('/login');
        return;
      }

      const dashRes = await fetch('/api/dashboard');
      const dashData = await dashRes.json();

      if (dashData.success) {
        setStats(dashData.stats);
        setProperties(dashData.properties || []);
        setUnits(dashData.units || []);
        setInvoices(dashData.invoices || []);
        setTickets(dashData.tickets || []);
        setTenants(dashData.tenants || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Logout
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  // Add new suite
  const handleSuiteCreated = (newSuite: any) => {
    setStats((prev) => ({
      ...prev,
      availableUnits: prev.availableUnits + 1,
      totalUnits: prev.totalUnits + 1,
    }));
    loadDashboardData();
    alert(`¡Suite ${newSuite.unit_number} registrada y sincronizada con éxito en la Web Pública!`);
  };

  // Switch tab reset filters
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setCurrentFilter('ALL');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center text-white">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E3A5F] to-[#0A1628] border border-[#D4AF37]/50 flex items-center justify-center animate-pulse">
            <span className="text-[#F3D270] font-black text-2xl">H</span>
          </div>
        </div>
        <p className="text-sm text-white/60">Cargando panel de operaciones...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#070D18] text-slate-100 flex flex-col overflow-hidden">
      {/* PINNED / FIXED FULL-WIDTH TOP HEADER */}
      <header className="shrink-0 z-30 bg-[#070D18]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 py-3">
        <Header
          currentTab={currentTab}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={loadDashboardData}
          isRefreshing={isRefreshing}
          onNewSuite={() => setIsNewSuiteModalOpen(true)}
          onNewProperty={() => {
            setPropertyToEdit(null);
            setIsPropertyModalOpen(true);
          }}
          onNavigateOverview={() => setCurrentTab('overview')}
        />
      </header>

      {/* BODY WORKSPACE AREA: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative w-full">
        {/* Floating Pill Sidebar (starts exactly where the KPIs begin!) */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          onOpenLogout={() => setIsLogoutModalOpen(true)}
          user={user}
        />

        {/* SCROLLABLE MAIN CONTENT (Cards, Tables, and Lists scroll here) */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 pl-3 md:pl-24 pt-3 sm:pt-5 pb-24 md:pb-6 scrollbar-thin">
          {currentTab === 'overview' && (
            <OverviewView
              stats={stats}
              properties={properties}
              invoices={invoices}
              tickets={tickets}
              onOpenNewSuite={() => setIsNewSuiteModalOpen(true)}
              onShareProperty={(prop) => setShareProperty(prop)}
              onNavigateTab={handleTabChange}
            />
          )}

          {currentTab === 'properties' && (
            <PropertiesView
              properties={properties}
              units={units}
              currentFilter={currentFilter}
              searchQuery={searchQuery}
              onOpenNewSuite={() => setIsNewSuiteModalOpen(true)}
              onOpenNewProperty={() => {
                setPropertyToEdit(null);
                setIsPropertyModalOpen(true);
              }}
              onEditProperty={(prop) => {
                setPropertyToEdit(prop);
                setIsPropertyModalOpen(true);
              }}
              onShareProperty={(prop) => setShareProperty(prop)}
              onRefreshData={loadDashboardData}
            />
          )}

          {currentTab === 'tenants' && (
            <TenantsView
              tenants={tenants}
              currentFilter={currentFilter}
              searchQuery={searchQuery}
              onOpenNewSuite={() => setIsNewSuiteModalOpen(true)}
            />
          )}

          {currentTab === 'billing' && (
            <BillingView
              invoices={invoices}
              stats={stats}
              currentFilter={currentFilter}
              searchQuery={searchQuery}
              onRefresh={loadDashboardData}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceView
              tickets={tickets}
              currentFilter={currentFilter}
              searchQuery={searchQuery}
              onRefresh={loadDashboardData}
            />
          )}
        </main>
      </div>

      {/* Modals Components */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />

      <NewSuiteModal
        isOpen={isNewSuiteModalOpen}
        onClose={() => setIsNewSuiteModalOpen(false)}
        onSuccess={handleSuiteCreated}
      />

      <PropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSuccess={loadDashboardData}
        propertyToEdit={propertyToEdit}
      />

      <ShareSuiteModal
        isOpen={!!shareProperty}
        onClose={() => setShareProperty(null)}
        property={shareProperty}
      />
    </div>
  );
}
