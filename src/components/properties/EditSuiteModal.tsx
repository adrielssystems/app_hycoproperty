'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Trash2, Globe, CheckCircle2 } from 'lucide-react';
import { MediaUploadProcessor } from './MediaUploadProcessor';
import { useLanguage } from '@/context/LanguageContext';

export interface UnitData {
  id?: number;
  property_id?: number;
  property_name?: string;
  unit_number: string;
  unit_type: string;
  area_sqft: number | string;
  rent_price: number | string;
  floor: number | string;
  status: string;
  image_url?: string | null;
  video_url?: string | null;
}

interface EditSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit: UnitData | null;
}

export const EditSuiteModal: React.FC<EditSuiteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  unit,
}) => {
  const { language } = useLanguage();

  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('Oficina Ejecutiva');
  const [areaSqft, setAreaSqft] = useState('500');
  const [rentPrice, setRentPrice] = useState('1500');
  const [floor, setFloor] = useState('1');
  const [status, setStatus] = useState('AVAILABLE');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (unit) {
      setUnitNumber(unit.unit_number || '');
      setUnitType(unit.unit_type || 'Oficina Ejecutiva');
      setAreaSqft(String(unit.area_sqft || 500));
      setRentPrice(String(unit.rent_price || 1500));
      setFloor(String(unit.floor || 1));
      setStatus(unit.status || 'AVAILABLE');
      setImageUrl(unit.image_url || null);
      setVideoUrl(unit.video_url || null);
    }
    setErrorMessage('');
  }, [unit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit?.id) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/units', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: unit.id,
          unit_number: unitNumber,
          unit_type: unitType,
          area_sqft: parseFloat(areaSqft) || 500,
          rent_price: parseFloat(rentPrice) || 1500,
          floor: parseInt(floor, 10) || 1,
          status,
          image_url: imageUrl,
          video_url: videoUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(data.message || 'Error actualizando suite');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!unit?.id) return;
    if (!confirm(language === 'en' ? `Delete suite ${unit.unit_number}?` : `¿Eliminar suite ${unit.unit_number}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/units?id=${unit.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(data.message || 'Error eliminando suite');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'en' ? `Edit Suite ${unit?.unit_number || ''}` : `Editar Suite ${unit?.unit_number || ''}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={language === 'en' ? 'Suite / Unit #' : 'Número de Suite'}
            placeholder="e.g. Suite 310"
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            required
          />

          <Input
            label={language === 'en' ? 'Floor' : 'Piso / Nivel'}
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            required
          />
        </div>

        <Input
          label={language === 'en' ? 'Space Type' : 'Tipo de Espacio'}
          placeholder="e.g. Oficina Corporativa / Warehouse"
          value={unitType}
          onChange={(e) => setUnitType(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={language === 'en' ? 'Area (sqft)' : 'Superficie (sqft)'}
            type="number"
            value={areaSqft}
            onChange={(e) => setAreaSqft(e.target.value)}
            required
          />

          <Input
            label={language === 'en' ? 'Monthly Rent (USD)' : 'Renta Mensual (USD)'}
            type="number"
            value={rentPrice}
            onChange={(e) => setRentPrice(e.target.value)}
            required
          />
        </div>

        {/* Status Toggle */}
        <div className="w-full pt-1">
          <label className="block text-xs font-medium text-white/70 mb-1.5">
            {language === 'en' ? 'Availability Status' : 'Estado de Disponibilidad'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('AVAILABLE')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                status === 'AVAILABLE'
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F3D270] shadow-md shadow-[#D4AF37]/10'
                  : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.05]'
              }`}
            >
              <Globe size={14} />
              <span>{language === 'en' ? 'Available for Lease' : 'Disponible para Renta'}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('OCCUPIED')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                status === 'OCCUPIED'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.05]'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>{language === 'en' ? 'Occupied (Leased)' : 'Ocupada (Arrendada)'}</span>
            </button>
          </div>
        </div>

        {/* PHOTO AND VIDEO PROCESSOR */}
        <div className="pt-1">
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            {language === 'en' ? 'Suite Media' : 'Multimedia de la Suite'}
          </label>
          <MediaUploadProcessor
            initialImageUrl={imageUrl}
            initialVideoUrl={videoUrl}
            onImageChange={setImageUrl}
            onVideoChange={setVideoUrl}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>{language === 'en' ? 'Delete Suite' : 'Eliminar'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
            >
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="px-5 py-2 text-xs font-bold"
            >
              <Save size={14} className="mr-1.5" />
              <span>{language === 'en' ? 'Save Changes' : 'Guardar'}</span>
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
