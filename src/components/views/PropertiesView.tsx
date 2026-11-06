'use client';

import React, { useState, useMemo } from 'react';
import { Globe, CheckCircle2, Share2, Pencil, Trash2, Plus, Building2 } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';
import { EditSuiteModal, UnitData } from '@/components/properties/EditSuiteModal';
import { useLanguage } from '@/context/LanguageContext';

interface PropertiesViewProps {
  properties: any[];
  units: any[];
  currentFilter?: string;
  searchQuery?: string;
  onOpenNewSuite: () => void;
  onOpenNewProperty?: () => void;
  onEditProperty?: (property: any) => void;
  onShareProperty: (property: any) => void;
  onRefreshData?: () => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  units,
  currentFilter = 'ALL',
  searchQuery = '',
  onOpenNewSuite,
  onOpenNewProperty,
  onEditProperty,
  onShareProperty,
  onRefreshData,
}) => {
  const { t, language } = useLanguage();

  // Suite edit modal state
  const [unitToEdit, setUnitToEdit] = useState<UnitData | null>(null);
  const [isEditSuiteModalOpen, setIsEditSuiteModalOpen] = useState(false);

  // Filter properties
  const filteredProps = useMemo(() => {
    return properties.filter((p) => {
      const matchType =
        !currentFilter ||
        currentFilter === 'ALL' ||
        currentFilter === 'all' ||
        currentFilter === 'properties' ||
        p.type.toLowerCase() === currentFilter.toLowerCase();

      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase());

      return matchType && matchSearch;
    });
  }, [properties, currentFilter, searchQuery]);

  // Filter units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (!searchQuery) return true;
      return (
        u.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.property_name && u.property_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.unit_type && u.unit_type.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [units, searchQuery]);

  // Delete Property Handler
  const handleDeleteProperty = async (property: any) => {
    const confirmMsg =
      language === 'en'
        ? `Are you sure you want to delete ${property.name}? All associated suites will also be removed.`
        : `¿Estás seguro de eliminar ${property.name}? Todas las suites asociadas también serán eliminadas.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/properties?id=${property.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.message || 'Error deleting property');
      }
    } catch (err) {
      console.error('Delete property error:', err);
      alert('Error de conexión al eliminar propiedad');
    }
  };

  // Delete Unit Handler
  const handleDeleteUnit = async (unit: any) => {
    const confirmMsg =
      language === 'en'
        ? `Delete suite ${unit.unit_number}?`
        : `¿Eliminar suite ${unit.unit_number}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/units?id=${unit.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.message || 'Error deleting suite');
      }
    } catch (err) {
      console.error('Delete unit error:', err);
      alert('Error de conexión al eliminar suite');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Full-Width Grid of Properties with Edit/Delete/Media Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {filteredProps.map((prop) => (
          <PropertyCard
            key={prop.id}
            id={prop.id}
            name={prop.name}
            type={prop.type}
            address={prop.address}
            totalUnits={prop.total_units}
            availableUnits={prop.available_units}
            occupancyRate={prop.occupancy_rate}
            imageUrl={prop.image_url}
            videoUrl={prop.video_url}
            onShare={() => onShareProperty(prop)}
            onEdit={() => {
              if (onEditProperty) onEditProperty(prop);
            }}
            onDelete={() => handleDeleteProperty(prop)}
          />
        ))}
      </div>

      {/* Detailed Units / Suites Directory Table with CRUD Actions */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {language === 'en' ? 'Live Suites Directory & Lease Status' : 'Directorio de Suites y Disponibilidad'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
              {filteredUnits.length} {language === 'en' ? 'Suites' : 'Suites'}
            </span>
            <button
              onClick={onOpenNewSuite}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs text-[#F3D270] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>{language === 'en' ? 'Add Suite' : 'Agregar Suite'}</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">{language === 'en' ? 'Suite / Unit' : 'Suite / Unidad'}</th>
                <th className="py-3 px-3">{language === 'en' ? 'Building Complex' : 'Complejo / Edificio'}</th>
                <th className="py-3 px-3">{language === 'en' ? 'Space Type' : 'Tipo de Espacio'}</th>
                <th className="py-3 px-3">{language === 'en' ? 'Area (sqft)' : 'Área (sqft)'}</th>
                <th className="py-3 px-3">{language === 'en' ? 'Monthly Rent' : 'Renta Mensual'}</th>
                <th className="py-3 px-3">{language === 'en' ? 'Floor' : 'Piso'}</th>
                <th className="py-3 px-3">{language === 'en' ? 'Availability & Web Sync' : 'Disponibilidad Web'}</th>
                <th className="py-3 px-3 text-right">{language === 'en' ? 'CRUD Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-3 px-3 font-bold text-white">{unit.unit_number}</td>
                  <td className="py-3 px-3 text-white/80">{unit.property_name}</td>
                  <td className="py-3 px-3 text-white/60">{unit.unit_type}</td>
                  <td className="py-3 px-3 text-white/80 font-medium">{unit.area_sqft} sqft</td>
                  <td className="py-3 px-3 font-bold text-[#F3D270]">
                    ${parseFloat(unit.rent_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
                  </td>
                  <td className="py-3 px-3 text-white/60">Floor {unit.floor}</td>
                  <td className="py-3 px-3">
                    {unit.status === 'AVAILABLE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30">
                        <Globe size={12} />
                        For Lease (Public Web)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        Occupied (Recurring Billing)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setUnitToEdit(unit);
                          setIsEditSuiteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors cursor-pointer"
                        title={language === 'en' ? 'Edit Suite' : 'Editar Suite'}
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        onClick={() =>
                          onShareProperty({
                            id: unit.property_id,
                            name: `${unit.property_name} - ${unit.unit_number}`,
                            address: unit.unit_type,
                          })
                        }
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#D4AF37]/20 hover:text-[#F3D270] text-white/40 transition-colors cursor-pointer"
                        title={language === 'en' ? 'Share direct link' : 'Compartir enlace directo'}
                      >
                        <Share2 size={13} />
                      </button>

                      <button
                        onClick={() => handleDeleteUnit(unit)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title={language === 'en' ? 'Delete Suite' : 'Eliminar Suite'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="block md:hidden space-y-3">
          {filteredUnits.map((unit) => (
            <div key={unit.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm">{unit.unit_number}</span>
                  <p className="text-[11px] text-white/50">{unit.property_name}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-[#F3D270] text-sm block">
                    ${parseFloat(unit.rent_price).toLocaleString('en-US', { minimumFractionDigits: 0 })}/mo
                  </span>
                  <span className="text-[10px] text-white/40">{unit.area_sqft} sqft • Floor {unit.floor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                {unit.status === 'AVAILABLE' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F3D270]">
                    <Globe size={11} /> For Lease
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 size={11} /> Occupied
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setUnitToEdit(unit);
                      setIsEditSuiteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-white/[0.06] text-white/80 hover:text-white"
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() =>
                      onShareProperty({
                        id: unit.property_id,
                        name: `${unit.property_name} - ${unit.unit_number}`,
                        address: unit.unit_type,
                      })
                    }
                    className="p-1.5 rounded-lg bg-white/[0.06] text-white/60 hover:text-[#F3D270]"
                    title="Share"
                  >
                    <Share2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteUnit(unit)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suite Edit Modal */}
      <EditSuiteModal
        isOpen={isEditSuiteModalOpen}
        onClose={() => setIsEditSuiteModalOpen(false)}
        onSuccess={() => {
          if (onRefreshData) onRefreshData();
        }}
        unit={unitToEdit}
      />
    </div>
  );
};
