'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, Plus } from 'lucide-react';
import { MediaUploadProcessor } from './MediaUploadProcessor';
import { useLanguage } from '@/context/LanguageContext';

interface NewSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (suite: any) => void;
}

export const NewSuiteModal: React.FC<NewSuiteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [propertyId, setPropertyId] = useState('1');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('Corporate Office');
  const [areaSqft, setAreaSqft] = useState('1200');
  const [rentPrice, setRentPrice] = useState('3200');
  const [floor, setFloor] = useState('1');
  const [status, setStatus] = useState('AVAILABLE');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: parseInt(propertyId, 10),
          unit_number: unitNumber,
          unit_type: unitType,
          area_sqft: parseFloat(areaSqft) || 1200,
          rent_price: parseFloat(rentPrice) || 3200,
          floor: parseInt(floor, 10) || 1,
          status,
          image_url: imageUrl,
          video_url: videoUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.unit);
        onClose();
        // Reset fields
        setUnitNumber('');
        setImageUrl(null);
        setVideoUrl(null);
      } else {
        setErrorMessage(data.message || 'Error guardando suite');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modalNewSuiteTitle')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Building & Unit Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5">
              {language === 'en' ? 'Property / Building' : 'Propiedad / Edificio'}
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full py-3 px-3 rounded-xl glass-input text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="1" className="bg-[#0B1526]">HYCO Tower Plaza (Commercial)</option>
              <option value="2" className="bg-[#0B1526]">HYCO Logistics Hub (Industrial)</option>
              <option value="3" className="bg-[#0B1526]">HYCO Residential Enclave (Residential)</option>
              <option value="4" className="bg-[#0B1526]">Biscayne Executive Suites (Commercial)</option>
            </select>
          </div>

          <Input
            label={language === 'en' ? 'Suite / Unit Number' : 'Número de Suite'}
            required
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            placeholder="e.g. Suite 504"
          />
        </div>

        {/* Space Type, Sqft, Rent, Floor */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              label={language === 'en' ? 'Unit Type' : 'Tipo de Espacio'}
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              placeholder="e.g. Corporate Office"
            />
          </div>

          <Input
            label={language === 'en' ? 'Floor' : 'Piso'}
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            required
          />

          <Input
            label={language === 'en' ? 'Area (sqft)' : 'Superficie (sqft)'}
            type="number"
            required
            value={areaSqft}
            onChange={(e) => setAreaSqft(e.target.value)}
            placeholder="1500"
          />
        </div>

        <Input
          label={language === 'en' ? 'Monthly Rent ($ USD)' : 'Renta Mensual ($ USD)'}
          type="number"
          required
          value={rentPrice}
          onChange={(e) => setRentPrice(e.target.value)}
          placeholder="3500.00"
        />

        {/* Availability Status */}
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            {language === 'en' ? 'Availability Status' : 'Estado de Disponibilidad'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('AVAILABLE')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                status === 'AVAILABLE'
                  ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F3D270] shadow-md shadow-[#D4AF37]/10'
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <span>{language === 'en' ? 'Available for Lease' : 'Disponible para Renta'}</span>
              {status === 'AVAILABLE' && <CheckCircle2 size={15} />}
            </button>

            <button
              type="button"
              onClick={() => setStatus('OCCUPIED')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                status === 'OCCUPIED'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              <span>{language === 'en' ? 'Occupied (Leased)' : 'Ocupada (Arrendada)'}</span>
              {status === 'OCCUPIED' && <CheckCircle2 size={15} />}
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
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('modalCancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Plus size={16} />}
          >
            {language === 'en' ? 'Save Suite' : 'Guardar Suite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
