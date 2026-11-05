'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Share2,
  MapPin,
  CheckCircle,
  Pencil,
  Trash2,
  Video,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PropertyCardProps {
  id: number;
  name: string;
  type: string;
  address: string;
  totalUnits: number;
  availableUnits: number;
  occupancyRate: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddSuite?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  name,
  type,
  address,
  totalUnits,
  availableUnits,
  occupancyRate,
  imageUrl,
  videoUrl,
  onShare,
  onEdit,
  onDelete,
  onAddSuite,
}) => {
  const { t, language } = useLanguage();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Color palette badge based on property type
  const typeStyles = {
    Commercial: {
      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      gradient: 'from-cyan-500/20 via-sky-500/5 to-transparent',
      avatarBg: 'bg-gradient-to-tr from-cyan-600 to-sky-400',
    },
    Industrial: {
      badge: 'bg-amber-500/10 text-[#F3D270] border-amber-500/20',
      gradient: 'from-[#D4AF37]/25 via-amber-500/5 to-transparent',
      avatarBg: 'bg-gradient-to-tr from-[#D4AF37] to-amber-600',
    },
    Residential: {
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      gradient: 'from-emerald-500/20 via-teal-500/5 to-transparent',
      avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-400',
    },
  }[type] || {
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    gradient: 'from-purple-500/20 via-violet-500/5 to-transparent',
    avatarBg: 'bg-gradient-to-tr from-purple-600 to-indigo-500',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between border border-white/[0.08] hover:border-white/20 transition-all shadow-xl"
    >
      {/* Top Header Row with Type Pill and Action Icons */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`px-3 py-0.5 rounded-full text-[11px] font-bold border ${typeStyles.badge} uppercase tracking-wider`}
        >
          {type}
        </span>

        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {videoUrl && (
            <button
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
              className="p-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#F3D270] transition-colors cursor-pointer"
              title={language === 'en' ? 'Watch Video Tour' : 'Ver Recorrido de Video'}
            >
              <Video size={13} />
            </button>
          )}

          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors cursor-pointer"
              title={language === 'en' ? 'Edit Property & Media' : 'Editar Propiedad y Multimedia'}
            >
              <Pencil size={13} />
            </button>
          )}

          {onShare && (
            <button
              onClick={onShare}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors cursor-pointer"
              title={language === 'en' ? 'Share Suite Deep Link' : 'Compartir enlace directo'}
            >
              <Share2 size={13} />
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              title={language === 'en' ? 'Delete Property' : 'Eliminar Propiedad'}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Center Visual Element (WebP Photo or Video Tour Player) */}
      <div className="relative w-full h-36 rounded-xl mb-3 overflow-hidden flex items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06]">
        {isVideoPlaying && videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#091322] via-[#091322]/40 to-transparent" />
          </>
        ) : (
          <div
            className={`w-14 h-14 rounded-2xl ${typeStyles.avatarBg} flex items-center justify-center text-white shadow-lg`}
          >
            <Building2 size={24} />
          </div>
        )}

        {/* WebP Tag */}
        {imageUrl && !isVideoPlaying && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#070D18]/80 backdrop-blur-md text-[9px] font-bold text-[#F3D270] border border-[#D4AF37]/30 flex items-center gap-1">
            <Sparkles size={9} />
            WebP Optimized
          </div>
        )}

        {/* Occupancy Rate badge pinned */}
        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-[#080F1D]/85 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
          <CheckCircle size={12} className="text-emerald-400" />
          <span>{occupancyRate}% {t('occupancyLabel')}</span>
        </div>
      </div>

      {/* Property Details */}
      <div>
        <h3 className="text-base font-bold text-white group-hover:text-[#F3D270] transition-colors truncate mb-1">
          {name}
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-white/50 mb-3 truncate">
          <MapPin size={12} className="shrink-0 text-white/40" />
          <span>{address}</span>
        </p>

        {/* Units Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/[0.06] text-xs">
          <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
            <span className="text-white/40 block text-[10px]">{t('totalSuites')}</span>
            <span className="font-bold text-white text-sm">{totalUnits}</span>
          </div>
          <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
            <span className="text-white/40 block text-[10px]">{t('filterProperties')}</span>
            <span
              className={`font-bold text-sm ${
                availableUnits > 0 ? 'text-[#F3D270]' : 'text-white/40'
              }`}
            >
              {availableUnits} {availableUnits > 0 ? t('availableForRent') : t('fullyOccupied')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
