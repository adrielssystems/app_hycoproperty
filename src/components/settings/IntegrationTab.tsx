'use client';

import React, { useState, useEffect } from 'react';
import {
  Link2,
  Wifi,
  WifiOff,
  LogOut,
  ExternalLink,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { GroupedCategory, QuickBooksItem } from '@/lib/quickbooksUtils';
import { QboImportPanel } from '@/components/settings/QboImportPanel';

// HYCO Commercial Real Estate Internal Services to Map
const INTERNAL_SERVICES = [
  {
    key: 'base_commercial_rent',
    labelEn: 'Base Commercial Rent',
    labelEs: 'Alquiler Base Comercial',
    descEn: 'Primary monthly suite rental charges',
    descEs: 'Canon mensual de alquiler de suites comerciales',
  },
  {
    key: 'cam_operating_recovery',
    labelEn: 'CAM Operating Recovery',
    labelEs: 'Recuperación Operativa CAM',
    descEn: 'Common Area Maintenance pro-rata monthly recovery',
    descEs: 'Cuota mensual pro-rata de mantenimiento de áreas comunes',
  },
  {
    key: 'cam_true_up_adjustment',
    labelEn: 'CAM True-Up Adjustment',
    labelEs: 'Ajuste de Conciliación Anual CAM',
    descEn: 'Year-end reconciliation settlement invoice or credit',
    descEs: 'Factura o crédito de ajuste al cierre del año fiscal',
  },
  {
    key: 'property_taxes_pass_through',
    labelEn: 'Real Estate Property Taxes',
    labelEs: 'Impuestos Inmobiliarios Prediales',
    descEn: 'County property tax pro-rata allocation pass-through',
    descEs: 'Distribución pro-rata de impuestos prediales del condado',
  },
  {
    key: 'building_insurance_surcharge',
    labelEn: 'Building Hazard & Liability Insurance',
    labelEs: 'Seguro de Edificio y Responsabilidad',
    descEn: 'Commercial property policy surcharge recovery',
    descEs: 'Sobretasa por póliza de seguro del complejo',
  },
  {
    key: 'utility_waste_surcharge',
    labelEn: 'Utility & Waste Metered Surcharge',
    labelEs: 'Servicios Públicos y Desechos Medidos',
    descEn: 'Metered water, electrical and dumpster disposal chargeback',
    descEs: 'Cobro de agua, luz y recolección de basura',
  },
  {
    key: 'late_payment_penalty',
    labelEn: 'Late Payment Penalty Fee',
    labelEs: 'Recargo por Pago Tardío / Mora',
    descEn: 'Contractual fee for payments past due',
    descEs: 'Penalidad contractual por mora en el canon',
  },
  {
    key: 'security_deposit_liability',
    labelEn: 'Security Deposit Liability',
    labelEs: 'Depósito en Garantía (Pasivo)',
    descEn: 'Refundable commercial lease security deposit escrow',
    descEs: 'Depósito reembolsable de contrato comercial en custodia',
  },
  {
    key: 'maintenance_chargeback',
    labelEn: 'Suite Repair & Maintenance Chargeback',
    labelEs: 'Cobro Directo por Reparaciones en Suite',
    descEn: 'Tenant-specific internal maintenance service chargeback',
    descEs: 'Cobro por reparaciones directas solicitadas por inquilino',
  },
];

export const IntegrationTab: React.FC = () => {
  const { language } = useLanguage();

  // Integration State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [realmId, setRealmId] = useState<string | null>(null);
  const [isEnvConfigured, setIsEnvConfigured] = useState<boolean>(false);
  const [qbEnvironment, setQbEnvironment] = useState<string>('production');
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState<boolean>(false);
  const [serviceConfig, setServiceConfig] = useState<Record<string, { qb_id: string; qb_name: string }>>({});

  // QBO Catalog State
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategory[]>([]);
  const [rawItems, setRawItems] = useState<QuickBooksItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [catalogSource, setCatalogSource] = useState<'live' | 'sample'>('sample');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // UI Feedback & Modals
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [isSavingMappings, setIsSavingMappings] = useState<boolean>(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);

  // 1. Fetch Integration Settings
  const fetchIntegrationSettings = async () => {
    try {
      const res = await fetch('/api/settings/integrations');
      const data = await res.json();

      if (data.success && data.integration) {
        setIsConnected(Boolean(data.integration.is_connected));
        setRealmId(data.integration.realm_id || null);
        setIsEnvConfigured(Boolean(data.integration.is_env_configured));
        setQbEnvironment(data.integration.environment || 'production');
        setTokenExpiresAt(data.integration.token_expires_at || null);
        setServiceConfig(data.integration.service_config || {});
      }
    } catch (err) {
      console.error('Error loading integration settings:', err);
    }
  };

  // 2. Fetch QuickBooks Items & Services
  const fetchItems = async (isManualSync = false) => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/integrations/quickbooks/items');
      const data = await res.json();

      if (data.success) {
        const source = data.source === 'live' ? 'live' : 'sample';
        setGroupedCategories(data.items || []);
        setRawItems(data.rawItems || []);
        setTotalItems(data.total || 0);
        setCatalogSource(source);

        if (isManualSync) {
          if (source === 'live') {
            toastSuccess(
              language === 'en'
                ? `Synced ${data.total || 0} live products & services from QuickBooks`
                : `Sincronizados ${data.total || 0} productos y servicios en vivo desde QuickBooks`,
              'QuickBooks Sync'
            );
          } else {
            toastInfo(
              data.notice ||
                (language === 'en'
                  ? 'Showing local fallback catalog (QuickBooks not linked or unreachable).'
                  : 'Mostrando catálogo local de respaldo (QuickBooks no vinculado o inaccesible).'),
              'Catalog Fallback'
            );
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching QBO items:', err);
      if (isManualSync) {
        toastError(
          language === 'en'
            ? 'Error syncing catalog from QuickBooks'
            : 'Error al sincronizar catálogo desde QuickBooks',
          'Sync Error'
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial Load & OAuth Callback Toast Feedback
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qbConnected = params.get('qb_connected');
        const qbError = params.get('qb_error');
        const errorParam = params.get('error');

        if (qbConnected === 'true') {
          toastSuccess(
            language === 'en'
              ? 'QuickBooks Online account connected successfully.'
              : 'Cuenta de QuickBooks Online conectada con éxito.',
            'QuickBooks Linked'
          );
        } else if (qbError) {
          toastError(qbError, 'QuickBooks OAuth Error');
        } else if (errorParam === 'missing_qb_credentials') {
          toastError(
            language === 'en'
              ? 'Missing QB_CLIENT_ID or QB_CLIENT_SECRET in environment variables.'
              : 'Faltan QB_CLIENT_ID o QB_CLIENT_SECRET en las variables de entorno.',
            'Configuration Missing'
          );
        }

        if (qbConnected || qbError || errorParam) {
          const cleanUrl = `${window.location.pathname}?view=settings&tab=integrations`;
          window.history.replaceState({}, '', cleanUrl);
        }
      }

      if (!active) return;
      await Promise.all([fetchIntegrationSettings(), fetchItems(false)]);
    };

    void init();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Service Mappings
  const handleSaveMappings = async () => {
    try {
      setIsSavingMappings(true);
      const res = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_config: serviceConfig }),
      });

      const data = await res.json();
      if (data.success) {
        toastSuccess(
          language === 'en'
            ? 'Service item mappings saved successfully'
            : 'Mapeo de servicios guardado exitosamente',
          language === 'en' ? 'Mappings Saved' : 'Mapeos Guardados'
        );
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving mappings';
      toastError(message, 'Mapping Error');
    } finally {
      setIsSavingMappings(false);
    }
  };

  // Test / Force Token Rotation
  const handleRenewToken = async () => {
    try {
      setIsRenewing(true);
      const res = await fetch('/api/integrations/quickbooks/refresh', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to renew QuickBooks token');
      }

      setTokenExpiresAt(data.token_expires_at || null);
      toastSuccess(
        language === 'en'
          ? 'OAuth token rotated and encrypted successfully.'
          : 'Token OAuth renovado y cifrado correctamente.',
        language === 'en' ? 'Auto-Renewal Verified' : 'Auto-Renovación Verificada'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error renewing token';
      toastError(message, 'Renewal Error');
    } finally {
      setIsRenewing(false);
    }
  };

  // Disconnect QuickBooks
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const res = await fetch('/api/settings/integrations', { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setIsConnected(false);
        setRealmId(null);
        setShowDisconnectModal(false);
        toastSuccess(
          language === 'en'
            ? 'QuickBooks disconnected successfully'
            : 'QuickBooks desconectado exitosamente',
          'Disconnected'
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error disconnecting';
      toastError(message, 'Disconnect Error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleSelectChange = (serviceKey: string, itemId: string) => {
    if (!itemId) {
      setServiceConfig((prev) => {
        const next = { ...prev };
        delete next[serviceKey];
        return next;
      });
      return;
    }

    const item = rawItems.find((i) => i.Id === itemId);
    if (item) {
      setServiceConfig((prev) => ({
        ...prev,
        [serviceKey]: {
          qb_id: item.Id,
          qb_name: item.Name,
        },
      }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      {/* ========================================================================= */}
      {/* CARD 1: QUICKBOOKS ONLINE INTEGRATION (CONNECTION CARD)                  */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl border border-white/[0.08] p-6 sm:p-7 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Link2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                QuickBooks Online Integration
              </h3>
              <p className="text-xs text-white/50">
                {language === 'en'
                  ? 'Bidirectional synchronization for general ledger, bills, and invoicing.'
                  : 'Sincronización bidireccional para libro mayor, gastos y facturación.'}
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2">
            {qbEnvironment === 'sandbox' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Sandbox
              </span>
            )}
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Wifi size={13} />
                Linked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/[0.06] text-white/50 border border-white/[0.1]">
                <WifiOff size={13} />
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Environment Alert if QB credentials are missing */}
        {!isEnvConfigured && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">
                {language === 'en' ? 'Environment Configuration Missing' : 'Variables de Entorno Incompletas'}
              </span>
              <p className="text-amber-200/80">
                {language === 'en'
                  ? 'Please set QB_CLIENT_ID and QB_CLIENT_SECRET in your Easypanel Environment tab before connecting.'
                  : 'Configure QB_CLIENT_ID y QB_CLIENT_SECRET en la pestaña Environment de Easypanel para habilitar OAuth 2.0.'}
              </p>
            </div>
          </div>
        )}

        {/* Body Container */}
        <div className="p-5 rounded-xl bg-[#070D18]/70 border border-white/[0.06] space-y-4">
          {isConnected && realmId && (
            <div className="space-y-2.5 pb-3 border-b border-white/[0.05]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-medium">Connected Realm ID:</span>
                <code className="px-2.5 py-1 rounded bg-white/[0.08] text-[#F3D270] font-mono font-bold text-xs border border-white/[0.1]">
                  {realmId}
                </code>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 text-white/60">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>
                    {language === 'en' ? 'Auto-Renewal:' : 'Auto-Renovación:'}{' '}
                    <strong className="text-emerald-400 font-semibold">
                      {language === 'en' ? 'Active (24/7 Keep-Alive)' : 'Activa (Keep-Alive 24/7)'}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {tokenExpiresAt && (
                    <span className="text-[11px] font-mono text-white/45">
                      {language === 'en' ? 'Next cycle:' : 'Próximo ciclo:'}{' '}
                      {new Date(tokenExpiresAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleRenewToken}
                    disabled={isRenewing}
                    className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#F3D270] border border-[#D4AF37]/30 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={isRenewing ? 'animate-spin' : ''} />
                    <span>
                      {isRenewing
                        ? language === 'en' ? 'Renewing...' : 'Renovando...'
                        : language === 'en' ? 'Renew Now' : 'Renovar Ahora'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Disconnect Button (Only visible if connected) */}
            {isConnected ? (
              <button
                type="button"
                onClick={() => setShowDisconnectModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={14} />
                <span>{language === 'en' ? 'Disconnect QuickBooks' : 'Desconectar QuickBooks'}</span>
              </button>
            ) : (
              <div className="text-xs text-white/40 flex items-center gap-1.5">
                <HelpCircle size={14} />
                <span>
                  {language === 'en'
                    ? 'Click connect to initiate Intuit OAuth authorization.'
                    : 'Haga clic en conectar para iniciar la autorización OAuth de Intuit.'}
                </span>
              </div>
            )}

            {/* Connect / Reconnect Button */}
            <a
              href="/api/integrations/quickbooks/auth"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>
                {isConnected
                  ? language === 'en' ? 'Reconnect QuickBooks' : 'Reconectar QuickBooks'
                  : language === 'en' ? 'Connect with QuickBooks' : 'Conectar con QuickBooks'}
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: LIVE QBO IMPORT & PHASE 2 EXPENSE SYNC (WHEN CONNECTED)          */}
      {/* ========================================================================= */}
      {isConnected && <QboImportPanel />}

      {/* ========================================================================= */}
      {/* CARD 3: SERVICE ITEM MAPPINGS (VISIBLE WHEN is_connected === true)        */}
      {/* ========================================================================= */}
      {isConnected && (
        <div className="glass-card rounded-2xl border border-white/[0.08] p-6 sm:p-7 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-[#F3D270]" />
                Service Item Mappings
              </h3>
              <p className="text-xs text-white/50">
                {language === 'en'
                  ? 'Map internal real estate services to their corresponding QuickBooks items.'
                  : 'Mapee los servicios inmobiliarios internos a sus respectivos ítems de QuickBooks.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveMappings}
              disabled={isSavingMappings}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>
                {isSavingMappings
                  ? language === 'en' ? 'Saving...' : 'Guardando...'
                  : language === 'en' ? 'Save Mappings' : 'Guardar Mapeos'}
              </span>
            </button>
          </div>

          {/* Grid of Service Mappings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {INTERNAL_SERVICES.map((service) => {
              const currentMappedId = serviceConfig[service.key]?.qb_id || '';

              return (
                <div
                  key={service.key}
                  className="p-4 rounded-xl bg-[#070D18]/70 border border-white/[0.06] space-y-2 hover:border-[#D4AF37]/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white block">
                      {language === 'en' ? service.labelEn : service.labelEs}
                    </label>
                    {currentMappedId && (
                      <span className="text-[10px] font-mono text-[#F3D270] font-semibold">
                        ID: {currentMappedId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40 leading-snug">
                    {language === 'en' ? service.descEn : service.descEs}
                  </p>

                  <select
                    value={currentMappedId}
                    onChange={(e) => handleSelectChange(service.key, e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs text-white focus:border-[#D4AF37] focus:bg-[#0B1526] outline-none transition-all cursor-pointer"
                  >
                    <option value="" className="bg-[#0B1526] text-white/50">
                      -- Select QBO Item --
                    </option>
                    {rawItems.map((item) => (
                      <option key={item.Id} value={item.Id} className="bg-[#0B1526] text-white">
                        {item.Name} {item.UnitPrice ? `($${item.UnitPrice})` : ''} [{item.Type}]
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CARD 3: QBO PRODUCTS & SERVICES (CATALOG SYNCHRONIZATION)                 */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl border border-white/[0.08] p-6 sm:p-7 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white">
              QBO Products & Services
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30">
              {totalItems} items
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                catalogSource === 'live'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/[0.06] text-white/50 border-white/[0.1]'
              }`}
            >
              {catalogSource === 'live' ? 'Live QBO' : 'Sample'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchItems(true)}
            disabled={isSyncing}
            className="py-2 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin text-[#F3D270]' : ''} />
            <span>{isSyncing ? (language === 'en' ? 'Syncing...' : 'Sincronizando...') : (language === 'en' ? 'Sync from QBO' : 'Sincronizar QBO')}</span>
          </button>
        </div>

        {/* Collapsible Categories Table */}
        <div className="space-y-4">
          {groupedCategories.length === 0 ? (
            <div className="text-center py-8 text-xs text-white/40">
              {language === 'en' ? 'No items found in QuickBooks catalog.' : 'No se encontraron ítems en el catálogo de QuickBooks.'}
            </div>
          ) : (
            groupedCategories.map((cat) => {
              const isCollapsed = Boolean(collapsedCategories[cat.categoryId]);

              return (
                <div
                  key={cat.categoryId}
                  className="rounded-xl bg-[#070D18]/70 border border-white/[0.06] overflow-hidden"
                >
                  {/* Category Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.categoryId)}
                    className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between text-left cursor-pointer border-b border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight size={15} className="text-white/40" />
                      ) : (
                        <ChevronDown size={15} className="text-[#F3D270]" />
                      )}
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {cat.categoryName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-white/50">
                      {cat.items.length} {language === 'en' ? 'items' : 'ítems'}
                    </span>
                  </button>

                  {/* Items Table */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto scrollbar-none">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.04] text-[10px] font-semibold text-white/40 uppercase tracking-wider bg-white/[0.01]">
                            <th className="py-2.5 px-4">Product / Service Name</th>
                            <th className="py-2.5 px-4">Description</th>
                            <th className="py-2.5 px-4">Type</th>
                            <th className="py-2.5 px-4 text-right">Price</th>
                            <th className="py-2.5 px-4 text-right">Cost</th>
                            <th className="py-2.5 px-4">Income Account</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {cat.items.map((item) => (
                            <tr key={item.Id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-bold text-white block">{item.Name}</span>
                                <span className="text-[10px] font-mono text-white/40">ID: {item.Id}</span>
                              </td>
                              <td className="py-3 px-4 text-white/60 text-[11px] max-w-xs truncate">
                                {item.Description || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.05] text-white/70 border border-white/[0.08]">
                                  {item.Type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-white">
                                {item.UnitPrice ? `$${item.UnitPrice.toFixed(2)}` : '$0.00'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-white/50">
                                {item.PurchaseCost ? `$${item.PurchaseCost.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-3 px-4 text-white/60 text-[11px]">
                                {item.IncomeAccountRef?.name || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {language === 'en' ? 'Disconnect QuickBooks Online?' : '¿Desconectar QuickBooks Online?'}
                </h4>
                <p className="text-xs text-white/50">
                  {language === 'en'
                    ? 'Automated bill and invoice syncing will be paused.'
                    : 'La sincronización automática de gastos y facturas se pausará.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70">
              {language === 'en'
                ? 'This will safely remove stored access and refresh tokens. You can reconnect anytime.'
                : 'Esto eliminará los tokens de acceso guardados. Puede volver a conectar en cualquier momento.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isDisconnecting
                  ? language === 'en' ? 'Disconnecting...' : 'Desconectando...'
                  : language === 'en' ? 'Yes, Disconnect' : 'Sí, Desconectar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
