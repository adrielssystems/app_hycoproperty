'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldAlert,
  Save,
  CheckCircle2,
  FileText,
  Sliders,
  Building2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface LeaseOverridesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: {
    id: number;
    name: string;
    company: string;
    suite_number: string;
    property_name: string;
    unit_id?: number;
  } | null;
  onSaveSuccess?: () => void;
}

interface MappingItem {
  id: number;
  qbo_account_name: string;
  platform_category: string;
  default_recovery: 'Recoverable' | 'Lease-Specific' | 'Non-Recoverable';
  description?: string;
}

interface OverrideItem {
  id?: number;
  unit_id: number;
  account_mapping_id: number;
  qbo_account_name: string;
  platform_category: string;
  default_recovery: string;
  override_status: 'Included' | 'Excluded';
  notes?: string;
}

export const LeaseOverridesModal: React.FC<LeaseOverridesModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSaveSuccess,
}) => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'LEASE_SPECIFIC' | 'ALL'>('LEASE_SPECIFIC');
  const [savedSuccessBanner, setSavedSuccessBanner] = useState(false);

  // Derive unit ID from tenant
  const unitId = tenant?.unit_id || tenant?.id || 1;

  useEffect(() => {
    if (!isOpen || !tenant) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [mapRes, overRes] = await Promise.all([
          fetch('/api/qbo'),
          fetch(`/api/leases?unit_id=${unitId}`),
        ]);

        const mapData = await mapRes.json();
        const overData = await overRes.json();

        if (mapData.success) {
          setMappings(mapData.data);
        }
        if (overData.success) {
          setOverrides(overData.data);
        }
      } catch (err) {
        console.error('Failed to load overrides data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, tenant, unitId]);

  if (!isOpen || !tenant) return null;

  const handleToggleOverride = async (
    mapping: MappingItem,
    status: 'Included' | 'Excluded' | 'DEFAULT'
  ) => {
    try {
      if (status === 'DEFAULT') {
        // Remove override
        await fetch(
          `/api/leases?unit_id=${unitId}&account_mapping_id=${mapping.id}`,
          { method: 'DELETE' }
        );
        setOverrides((prev) =>
          prev.filter((o) => o.account_mapping_id !== mapping.id)
        );
      } else {
        // Upsert override
        const res = await fetch('/api/leases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unit_id: unitId,
            account_mapping_id: mapping.id,
            override_status: status,
            notes: `Contract stipulation for ${tenant.company} (${mapping.qbo_account_name})`,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setOverrides((prev) => {
            const next = prev.filter((o) => o.account_mapping_id !== mapping.id);
            return [
              ...next,
              {
                unit_id: unitId,
                account_mapping_id: mapping.id,
                qbo_account_name: mapping.qbo_account_name,
                platform_category: mapping.platform_category,
                default_recovery: mapping.default_recovery,
                override_status: status,
                notes: `Contract stipulation for ${tenant.company} (${mapping.qbo_account_name})`,
              },
            ];
          });
        }
      }
      setSavedSuccessBanner(true);
      setTimeout(() => setSavedSuccessBanner(false), 2500);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Error toggling override:', err);
    }
  };

  const handleUpdateNotes = async (mappingId: number, notes: string) => {
    const existing = overrides.find((o) => o.account_mapping_id === mappingId);
    if (!existing) return;

    try {
      await fetch('/api/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          account_mapping_id: mappingId,
          override_status: existing.override_status,
          notes,
        }),
      });
      setOverrides((prev) =>
        prev.map((o) =>
          o.account_mapping_id === mappingId ? { ...o, notes } : o
        )
      );
    } catch (err) {
      console.error('Error updating override notes:', err);
    }
  };

  const displayedMappings = mappings.filter((m) => {
    if (activeFilter === 'LEASE_SPECIFIC') {
      return (
        m.default_recovery === 'Lease-Specific' ||
        overrides.some((o) => o.account_mapping_id === m.id)
      );
    }
    return true;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A1220] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#070D18]/90">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="text-[#F3D270]" size={18} />
                <h3 className="text-base font-bold text-white tracking-wide">
                  {language === 'en'
                    ? 'Lease-Level CAM Recovery Rules & Overrides'
                    : 'Reglas de Recuperación CAM por Contrato'}
                </h3>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                <span className="text-white font-medium">{tenant.company}</span>
                <span>•</span>
                <span className="text-[#D4AF37] font-semibold">{tenant.suite_number}</span>
                <span>•</span>
                <span>{tenant.property_name}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Golden Rule Banner */}
          <div className="px-6 py-3 bg-gradient-to-r from-[#D4AF37]/15 to-[#B89222]/05 border-b border-[#D4AF37]/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#F3D270]">
              <ShieldAlert size={15} />
              <span className="font-semibold">
                {language === 'en'
                  ? 'Golden Rule: Lease-level settings always override account-level defaults.'
                  : 'Regla de Oro: Los ajustes de contrato siempre anulan los valores predeterminados contables.'}
              </span>
            </div>
            {savedSuccessBanner && (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px] animate-fadeIn">
                <CheckCircle2 size={13} />
                {language === 'en' ? 'Rules saved instantly' : 'Reglas guardadas'}
              </span>
            )}
          </div>

          {/* Filter Bar */}
          <div className="px-6 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter('LEASE_SPECIFIC')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeFilter === 'LEASE_SPECIFIC'
                    ? 'bg-[#D4AF37] text-[#070D18]'
                    : 'bg-white/[0.04] text-white/60 hover:text-white'
                }`}
              >
                {language === 'en'
                  ? 'Lease-Specific Accounts & Active Overrides'
                  : 'Cuentas Específicas & Excepciones'}
              </button>
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-[#D4AF37] text-[#070D18]'
                    : 'bg-white/[0.04] text-white/60 hover:text-white'
                }`}
              >
                {language === 'en' ? 'All 43 QBO Accounts' : 'Las 43 Cuentas QBO'}
              </button>
            </div>
            <div className="text-[11px] text-white/40">
              {overrides.length}{' '}
              {language === 'en' ? 'custom overrides active' : 'excepciones activas'}
            </div>
          </div>

          {/* Table / Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-white/40 text-xs">
                {language === 'en' ? 'Loading recovery rules...' : 'Cargando reglas...'}
              </div>
            ) : displayedMappings.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs">
                {language === 'en' ? 'No accounts match the criteria' : 'No hay cuentas'}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedMappings.map((mapItem) => {
                  const existingOverride = overrides.find(
                    (o) => o.account_mapping_id === mapItem.id
                  );
                  const isOverridden = !!existingOverride;

                  return (
                    <div
                      key={mapItem.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isOverridden
                          ? 'bg-[#0E1A2D] border-[#D4AF37]/30 shadow-md'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Account Info */}
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {mapItem.qbo_account_name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.06] text-white/60">
                              {mapItem.platform_category}
                            </span>
                          </div>
                          <div className="text-xs text-white/40">
                            {mapItem.description || 'Chart of Accounts line item'}
                          </div>
                          <div className="text-[11px] text-white/50 flex items-center gap-1 pt-0.5">
                            <span>{language === 'en' ? 'Account Default:' : 'Default Contable:'}</span>
                            <span
                              className={`font-semibold ${
                                mapItem.default_recovery === 'Recoverable'
                                  ? 'text-emerald-400'
                                  : mapItem.default_recovery === 'Lease-Specific'
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {mapItem.default_recovery}
                            </span>
                          </div>
                        </div>

                        {/* Override Status Selector */}
                        <div className="flex items-center gap-1.5 self-start md:self-center">
                          <button
                            onClick={() => handleToggleOverride(mapItem, 'DEFAULT')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              !isOverridden
                                ? 'bg-white/[0.12] text-white border border-white/20'
                                : 'bg-white/[0.03] text-white/40 hover:text-white'
                            }`}
                            title="Follow QBO Account Default"
                          >
                            {language === 'en' ? 'Default' : 'Default'}
                          </button>

                          <button
                            onClick={() => handleToggleOverride(mapItem, 'Included')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              existingOverride?.override_status === 'Included'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                                : 'bg-white/[0.03] text-white/40 hover:text-emerald-300 hover:bg-emerald-500/10'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            {language === 'en' ? 'Include in CAM' : 'Incluir en CAM'}
                          </button>

                          <button
                            onClick={() => handleToggleOverride(mapItem, 'Excluded')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              existingOverride?.override_status === 'Excluded'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                                : 'bg-white/[0.03] text-white/40 hover:text-rose-300 hover:bg-rose-500/10'
                            }`}
                          >
                            <X size={13} />
                            {language === 'en' ? 'Exclude (Landlord Pays)' : 'Excluir (Paga Dueño)'}
                          </button>
                        </div>
                      </div>

                      {/* Notes / Contract clause if overridden */}
                      {isOverridden && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                          <FileText size={13} className="text-[#F3D270] shrink-0" />
                          <input
                            type="text"
                            defaultValue={existingOverride?.notes || ''}
                            onBlur={(e) => handleUpdateNotes(mapItem.id, e.target.value)}
                            placeholder={
                              language === 'en'
                                ? 'Enter lease section reference or rider note (e.g., Lease Clause 14.2)...'
                                : 'Ingresa referencia de cláusula de contrato...'
                            }
                            className="w-full text-xs bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.08] bg-[#070D18] flex items-center justify-between text-xs">
            <span className="text-white/40 text-[11px]">
              {language === 'en'
                ? 'All overrides take immediate effect on CAM pro-rata true-up calculations.'
                : 'Las excepciones surten efecto inmediato en las conciliaciones pro-rata.'}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] font-bold shadow-lg hover:brightness-110 transition-all cursor-pointer"
            >
              {language === 'en' ? 'Done' : 'Listo'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

