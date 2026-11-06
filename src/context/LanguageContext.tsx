'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

export const translations: Translations = {
  // Brand & Login
  brandTitle: {
    en: 'HYCO Property Management',
    es: 'HYCO Property Management',
  },
  loginSubtitle: {
    en: 'Admin & Operations Portal',
    es: 'Portal Administrativo & Operaciones',
  },
  emailLabel: {
    en: 'Email Address',
    es: 'Correo Electrónico',
  },
  passwordLabel: {
    en: 'Password',
    es: 'Contraseña',
  },
  rememberMe: {
    en: 'Remember me',
    es: 'Recordarme',
  },
  forgotPassword: {
    en: 'Forgot password?',
    es: '¿Olvidaste tu contraseña?',
  },
  signInButton: {
    en: 'Sign In',
    es: 'Iniciar Sesión',
  },
  signingIn: {
    en: 'Signing in...',
    es: 'Iniciando sesión...',
  },
  loginFooter: {
    en: '© 2027 HYCO Property Management • Commercial, Industrial & Residential',
    es: '© 2027 HYCO Property Management • Comercial, Industrial y Residencial',
  },

  // Navigation
  navOverview: { en: 'Overview', es: 'Resumen General' },
  navProperties: { en: 'Buildings & Suites', es: 'Edificios & Suites' },
  navTenants: { en: 'Tenants', es: 'Inquilinos' },
  navBilling: { en: 'Billing & Finance', es: 'Facturación & Finanzas' },
  navMaintenance: { en: 'Helpdesk Tickets', es: 'Tickets de Ayuda' },
  navSync: { en: 'Live Cloud Sync', es: 'Sincronización Cloud' },
  signOut: { en: 'Sign Out', es: 'Cerrar Sesión' },

  // Header & Status
  headerTitle: { en: 'HYCO Operations Hub', es: 'Centro de Operaciones HYCO' },
  headerSubtitle: {
    en: 'Commercial, industrial, and residential real-estate portfolio management.',
    es: 'Gestión integral de portafolio comercial, industrial y residencial.',
  },
  searchPlaceholder: {
    en: 'Search buildings, suites, invoices or tenants...',
    es: 'Buscar edificios, suites, facturas o inquilinos...',
  },
  filterAll: { en: 'All', es: 'Todos' },
  filterProperties: { en: 'Properties', es: 'Propiedades' },
  filterInvoices: { en: 'Invoices', es: 'Facturas' },
  filterTickets: { en: 'Active Tickets', es: 'Tickets Activos' },
  btnNewSuite: { en: 'New Suite', es: 'Nueva Suite' },
  newSuiteButton: { en: 'New Suite', es: 'Nueva Suite' },
  dbStatus: { en: 'Cloud Sync: Active', es: 'Cloud Sync: Activo' },
  qboStatus: { en: 'Financial Ledger: Synced', es: 'Libro Contable: Al Día' },

  // Stats Cards
  statTotalProperties: { en: 'Total Properties', es: 'Total Propiedades' },
  statOccupancyRate: { en: 'Occupancy Rate', es: 'Tasa de Ocupación' },
  statMonthlyRevenue: { en: 'Monthly Revenue', es: 'Recaudación Mensual' },
  statActiveHelpdesk: { en: 'Active Helpdesk', es: 'Helpdesk Activo' },
  statUnitsManaged: { en: 'managed suites', es: 'suites administradas' },
  statOccupiedUnits: { en: 'occupied', es: 'alquiladas' },
  statAvailableUnits: { en: 'available', es: 'disponibles' },
  statPendingRevenue: { en: 'in process', es: 'en proceso' },
  statSlaMet: { en: '100% SLA compliance', es: '100% cumplimiento SLA' },

  // Properties Section
  propertiesTitle: { en: 'HYCO Buildings & Complexes', es: 'Edificios y Complejos HYCO' },
  propertiesSubtitle: {
    en: 'Zero Double-Entry sync with Public Website (For Lease section)',
    es: 'Cero Doble Carga: sincronización automática con la Web Pública',
  },
  addSuiteLink: { en: '+ Add Suite', es: '+ Agregar Suite' },
  totalSuites: { en: 'Total Suites', es: 'Total Suites' },
  availableForRent: { en: 'for lease', es: 'para renta' },
  fullyOccupied: { en: '100% Leased', es: 'Completo' },
  occupancyLabel: { en: 'Occupancy', es: 'Ocupación' },

  // Financial Billing Section
  qboSectionTitle: {
    en: 'Invoices & Financial Ledger',
    es: 'Facturación y Libro Contable',
  },
  qboSectionSubtitle: {
    en: 'Automated invoice emission according to lease agreements and real-time reconciliation upon payment approval.',
    es: 'Emisión automatizada de facturas según contratos y conciliación automática con aprobación bancaria.',
  },
  colInvoiceNumber: { en: 'Invoice # / Ref', es: 'No. Factura / Ref' },
  colTenant: { en: 'Tenant', es: 'Inquilino' },
  colSuite: { en: 'Suite', es: 'Suite / Unidad' },
  colAmount: { en: 'Amount', es: 'Monto Total' },
  colDueDate: { en: 'Due Date', es: 'Vencimiento' },
  colStatus: { en: 'Status', es: 'Estado' },
  colAction: { en: 'Action', es: 'Acción' },
  statusReconciled: { en: 'Reconciled', es: 'Conciliado' },
  statusPending: { en: 'Pending Payment', es: 'Pendiente Pago' },
  statusOverdue: { en: 'Overdue', es: 'Vencido' },

  // Helpdesk Section
  helpdeskTitle: {
    en: 'Real-Time Maintenance & Helpdesk',
    es: 'Helpdesk & Mantenimiento en Tiempo Real',
  },
  helpdeskSubtitle: {
    en: 'Single official support channel for tenant requests submitted through PWA Portal.',
    es: 'Canal único y oficial para solicitudes técnicas reportadas desde el portal de inquilinos PWA.',
  },
  tenantLabel: { en: 'Tenant', es: 'Inquilino' },
  techLabel: { en: 'Technician', es: 'Técnico' },
  statusReceived: { en: 'Received', es: 'Recibido' },
  statusInReview: { en: 'In Review', es: 'En Revisión' },
  statusAssigned: { en: 'Assigned', es: 'Técnico Asignado' },
  statusResolved: { en: 'Resolved', es: 'Resuelto' },

  // Right Panel & Collections
  operationalSummary: { en: 'Operational Summary', es: 'Resumen Operativo' },
  colQboPaid: { en: 'Reconciled Collections', es: 'Cobros Conciliados' },
  colQboPaidSub: { en: 'Bank reconciliation current', es: 'Conciliación bancaria al día' },
  colQboPending: { en: 'Pending Receivables', es: 'Cobros Pendientes' },
  colQboPendingSub: { en: 'Invoices issued & pending', es: 'Facturas emitidas pendientes' },
  colOccupancy: { en: 'Portfolio Occupancy', es: 'Ocupación de Portafolio' },
  colHelpdesk: { en: 'Tenant Helpdesk', es: 'Helpdesk Inquilinos' },
  colHelpdeskSub: { en: 'Active open incidents', es: 'Incidencias activas en curso' },
  colWebSync: { en: 'Public Website Sync', es: 'Sincronización Web Pública' },
  colWebSyncSub: { en: 'Zero Double-Entry (For Lease)', es: 'Cero Doble Carga (For Lease)' },
  dbQboSynced: { en: 'All Systems Synced', es: 'Sistemas Sincronizados' },

  // Quick Actions
  quickActionsTitle: { en: 'Admin Quick Actions', es: 'Accesos Rápidos del Administrador' },
  actionSyncQbo: { en: 'Sync Financial Ledger', es: 'Sincronizar Libro Contable' },
  actionSyncWeb: { en: 'Update Public Web (For Lease)', es: 'Actualizar Web Pública (For Lease)' },
  actionExportPdf: { en: 'Export Monthly Financial Report', es: 'Exportar Reporte Contable Mensual' },

  // Modals
  modalLogoutTitle: { en: 'Sign Out Confirmation', es: 'Confirmar Cierre de Sesión' },
  modalLogoutText: {
    en: 'Are you sure you want to sign out from HYCO Property Management? You will need to authenticate again to manage leases and operations.',
    es: '¿Confirmas que deseas cerrar tu sesión en HYCO Property Management? Tendrás que autenticarte de nuevo para gestionar suites y operaciones.',
  },
  modalCancel: { en: 'Cancel', es: 'Cancelar' },
  modalSignOutBtn: { en: 'Sign Out', es: 'Sí, Cerrar Sesión' },

  modalNewSuiteTitle: { en: 'Register New Suite / Unit', es: 'Registrar Nueva Suite / Espacio' },
  modalNewSuiteSub: {
    en: 'Zero Double-Entry: instantly published to Public Web (For Lease) and Tenant Referral App.',
    es: 'Cero Doble Carga: publicación instantánea en la Web Pública y app de inquilinos.',
  },
  modalShareTitle: { en: 'Share Suite (Deep Linking)', es: 'Compartir Suite (Deep Linking)' },
  modalShareSub: {
    en: 'Generate a direct referral link for prospects and real-estate brokers.',
    es: 'Genera un enlace directo para prospectos, clientes o agentes inmobiliarios.',
  },
  copied: { en: 'Copied', es: 'Copiado' },
  copy: { en: 'Copy', es: 'Copiar' },
  directLink: { en: 'Direct Referral Link', es: 'Enlace de Recomendación Directo' },
  shareVia: { en: 'Share Instantly Via:', es: 'Compartir Inmediatamente Por:' },
  close: { en: 'Close', es: 'Cerrar' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default language is natively ENGLISH ('en')
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('hyco_lang') as Language;
    if (saved === 'en' || saved === 'es') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hyco_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'es' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: keyof typeof translations): string => {
    if (!translations[key]) return String(key);
    return translations[key][language] || translations[key].en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

