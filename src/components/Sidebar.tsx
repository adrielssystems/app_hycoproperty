'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Building2,
  Users,
  DollarSign,
  Wrench,
  Settings,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenLogout: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
    avatar_url: string;
    allowed_sections?: string[];
  } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenLogout,
  user,
}) => {
  const { t, language } = useLanguage();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const allowedSections = user?.allowed_sections || ['overview', 'properties', 'tenants', 'billing', 'maintenance'];

  const baseNavItems = [
    { id: 'overview', label: t('navOverview'), icon: LayoutGrid },
    { id: 'properties', label: t('navProperties'), icon: Building2 },
    { id: 'tenants', label: t('navTenants'), icon: Users },
    { id: 'billing', label: t('navBilling'), icon: DollarSign },
    { id: 'maintenance', label: t('navMaintenance'), icon: Wrench },
  ];

  // Filter sections based on permissions
  const filteredNavItems = baseNavItems.filter((item) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    return allowedSections.includes(item.id);
  });

  // Add settings tab for Admins / Super Admins
  const navItems = isAdmin
    ? [...filteredNavItems, { id: 'settings', label: language === 'en' ? 'Settings' : 'Ajustes', icon: Settings }]
    : filteredNavItems;

  return (
    <>
      {/* DESKTOP FLOATING PILL SIDEBAR */}
      <aside className="absolute left-4 top-5 bottom-5 z-40 hidden md:flex flex-col items-center justify-between w-16 py-4 px-2 rounded-2xl bg-[#091322]/90 backdrop-blur-2xl border border-white/[0.09] shadow-2xl">
        {/* Main Nav Items Stack */}
        <nav className="flex flex-col items-center gap-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(item.id)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-[#D4AF37] to-[#B89222] text-[#080F1D] shadow-lg shadow-[#D4AF37]/25 font-bold'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                }`}
                title={item.label}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />

                {/* Active subtle pill dot indicator */}
                {isActive && (
                  <motion.span
                    layoutId="activePillDesktop"
                    className="absolute -left-2 w-1 h-5 rounded-r-full bg-[#F3D270]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Tooltip on hover */}
                <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#070D18] border border-white/10 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom Actions: Logout */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenLogout}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer group relative"
            title={t('logoutConfirmTitle')}
          >
            <LogOut size={18} />
            <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-[#070D18] border border-white/10 text-rose-300 text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              {t('logoutConfirmTitle')}
            </span>
          </button>
        </div>
      </aside>

      {/* MOBILE RESPONSIVE FLOATING DOCK BAR */}
      <nav className="flex md:hidden fixed bottom-3 inset-x-3 z-50 py-2 px-3 rounded-2xl bg-[#091322]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-[#F3D270] font-bold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-sm shadow-[#D4AF37]/30 text-[#F3D270]'
                    : 'bg-transparent text-white/50'
                }`}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight font-medium max-w-[50px] truncate">
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="activePillMobile"
                  className="absolute -bottom-1 w-4 h-1 rounded-full bg-[#F3D270]"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          );
        })}

        {/* Mobile Logout Quick Trigger */}
        <button
          onClick={onOpenLogout}
          className="flex flex-col items-center justify-center py-1 px-1 text-rose-400/60 hover:text-rose-400 transition-colors"
          title={t('logoutConfirmTitle')}
        >
          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <LogOut size={15} />
          </div>
          <span className="text-[9px] mt-0.5 font-medium text-rose-400/80">Salir</span>
        </button>
      </nav>
    </>
  );
};
