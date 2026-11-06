'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrandLogo, LoginForm } from '@/components';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function LoginPage() {
  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-[#070D18]"
      suppressHydrationWarning
    >
      {/* Top Right Language Switcher Pill */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      {/* Dynamic Background Light Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#1A365D]/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#D4AF37]/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#0F223D]/40 blur-[160px] pointer-events-none" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[430px]"
      >
        {/* Main Card with V18 Glassmorphism */}
        <div className="glass-card rounded-[2rem] p-8 sm:p-10 border border-white/[0.09] shadow-2xl bg-[#0B1526]/90 backdrop-blur-3xl relative overflow-hidden">
          {/* Top subtle golden sheen line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

          {/* Large prominent logo without extra box */}
          <div className="mb-6">
            <BrandLogo />
          </div>

          {/* Clean Executive Login Form */}
          <LoginForm />
        </div>

        {/* Minimal Footer */}
        <div className="text-center mt-6 text-xs text-white/40">
          <p>© 2027 HYCO Property Management</p>
        </div>
      </motion.div>
    </div>
  );
}
