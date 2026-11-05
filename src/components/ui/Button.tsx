'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-sm sm:text-base rounded-2xl gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#F3D270] via-[#D4AF37] to-[#B89222] text-[#070D18] font-bold shadow-lg shadow-[#D4AF37]/25 hover:opacity-95',
    secondary:
      'bg-white/[0.05] hover:bg-white/[0.09] text-white border border-white/10 font-semibold',
    glass:
      'glass-card text-white hover:border-[#D4AF37]/40 font-semibold',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold shadow-lg shadow-rose-950/40 hover:from-rose-500 hover:to-rose-600',
    ghost:
      'text-white/60 hover:text-white hover:bg-white/[0.05] font-medium',
  }[variant];

  return (
    <motion.button
      suppressHydrationWarning
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
};

