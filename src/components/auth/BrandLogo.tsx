'use client';

import React from 'react';

export const BrandLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center w-full">
      {/* High-Resolution Reconstructed Logo */}
      <div className="relative w-full flex items-center justify-center py-2 px-1">
        {/* Soft subtle gold glow ambient behind logo */}
        <div className="absolute inset-0 bg-[#D4AF37]/15 blur-3xl rounded-full scale-110 pointer-events-none" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hyco_brand_logo.png?v=3"
          alt="HYCO Property Management"
          className="relative z-10 w-full max-w-[320px] sm:max-w-[360px] h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all duration-300"
        />
      </div>
    </div>
  );
};
