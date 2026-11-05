'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  showIcon = true,
}) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full bg-[#0B1526]/80 backdrop-blur-md border border-white/10 shadow-md ${className}`}
    >
      {showIcon && (
        <span className="pl-2 pr-1 text-white/40">
          <Globe size={13} />
        </span>
      )}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
          language === 'en'
            ? 'bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] text-[#070D18] shadow-sm'
            : 'text-white/50 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setLanguage('es')}
        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
          language === 'es'
            ? 'bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] text-[#070D18] shadow-sm'
            : 'text-white/50 hover:text-white'
        }`}
      >
        ES
      </button>
    </div>
  );
};
