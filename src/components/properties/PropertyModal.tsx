'use client';

import React, { useState, useEffect } from 'react';
import { Building2, X, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MediaUploadProcessor } from './MediaUploadProcessor';
import { useLanguage } from '@/context/LanguageContext';

export interface PropertyData {
  id?: number;
  name: string;
  type: string;
  address: string;
  total_units: number;
  available_units: number;
  image_url?: string | null;
  video_url?: string | null;
}

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyToEdit?: PropertyData | null;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  propertyToEdit = null,
}) => {
  const { language } = useLanguage();
  const isEditing = !!propertyToEdit?.id;

  const [name, setName] = useState('');
  const [type, setType] = useState('Commercial');
  const [address, setAddress] = useState('');
  const [totalUnits, setTotalUnits] = useState(10);
  const [availableUnits, setAvailableUnits] = useState(2);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (propertyToEdit) {
      setName(propertyToEdit.name || '');
      setType(propertyToEdit.type || 'Commercial');
      setAddress(propertyToEdit.address || '');
      setTotalUnits(propertyToEdit.total_units || 0);
      setAvailableUnits(propertyToEdit.available_units || 0);
      setImageUrl(propertyToEdit.image_url || null);
      setVideoUrl(propertyToEdit.video_url || null);
    } else {
      setName('');
      setType('Commercial');
      setAddress('');
      setTotalUnits(10);
      setAvailableUnits(2);
      setImageUrl(null);
      setVideoUrl(null);
    }
    setErrorMessage('');
  }, [propertyToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const url = '/api/properties';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = {
        id: propertyToEdit?.id,
        name,
        type,
        address,
        total_units: totalUnits,
        available_units: availableUnits,
        image_url: imageUrl,
        video_url: videoUrl,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(data.message || 'Error guardando propiedad');
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
      title={
        isEditing
          ? (language === 'en' ? 'Edit Property & Media' : 'Editar Propiedad y Multimedia')
          : (language === 'en' ? 'Register New Property' : 'Registrar Nueva Propiedad')
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Basic Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={language === 'en' ? 'Property Name' : 'Nombre de la Propiedad'}
            placeholder="e.g. HYCO Tower Plaza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="w-full">
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              {language === 'en' ? 'Portfolio Category' : 'Categoría del Portafolio'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
            >
              <option value="Commercial" className="bg-[#0B1526] text-white">Commercial (Oficinas & Retail)</option>
              <option value="Industrial" className="bg-[#0B1526] text-white">Industrial (Logística & Bodegas)</option>
              <option value="Residential" className="bg-[#0B1526] text-white">Residential (Residencial & Suites)</option>
            </select>
          </div>
        </div>

        <Input
          label={language === 'en' ? 'Street Address & City' : 'Dirección y Ubicación'}
          placeholder="e.g. 8200 NW 41st St, Doral, FL 33166"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        {/* Units Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={language === 'en' ? 'Total Suites' : 'Total de Suites'}
            type="number"
            min="1"
            value={String(totalUnits)}
            onChange={(e) => setTotalUnits(parseInt(e.target.value, 10) || 0)}
            required
          />

          <Input
            label={language === 'en' ? 'Available for Lease' : 'Suites Disponibles'}
            type="number"
            min="0"
            max={String(totalUnits)}
            value={String(availableUnits)}
            onChange={(e) => setAvailableUnits(parseInt(e.target.value, 10) || 0)}
            required
          />
        </div>

        {/* INTEGRATED IMAGE & VIDEO PROCESSOR */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-[#F3D270] mb-2 flex items-center gap-1.5">
            <Building2 size={14} />
            <span>{language === 'en' ? 'Property Media' : 'Multimedia de la Propiedad'}</span>
          </label>

          <MediaUploadProcessor
            initialImageUrl={imageUrl}
            initialVideoUrl={videoUrl}
            onImageChange={setImageUrl}
            onVideoChange={setVideoUrl}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="px-6 py-2.5 text-xs font-bold"
          >
            <Save size={14} className="mr-1.5" />
            <span>
              {isEditing
                ? (language === 'en' ? 'Update Property' : 'Guardar Cambios')
                : (language === 'en' ? 'Create Property' : 'Crear Propiedad')}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
