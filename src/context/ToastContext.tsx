'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: {
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number;
  }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 4500,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback((message: string, title?: string) => {
    showToast({ type: 'success', title: title || 'Success', message });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ type: 'error', title: title || 'Error', message });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ type: 'warning', title: title || 'Warning', message });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ type: 'info', title: title || 'Notification', message });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        dismissToast,
      }}
    >
      {children}

      {/* FIXED TOAST CONTAINER IN TOP-CENTER */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2.5 max-w-md w-[calc(100%-2rem)] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={`w-full pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-2xl backdrop-blur-2xl border transition-all ${
                  isSuccess
                    ? 'bg-[#0B1526]/95 border-[#D4AF37]/40 shadow-[#D4AF37]/10'
                    : isError
                    ? 'bg-[#0B1526]/95 border-rose-500/40 shadow-rose-500/10'
                    : isWarning
                    ? 'bg-[#0B1526]/95 border-amber-500/40 shadow-amber-500/10'
                    : 'bg-[#0B1526]/95 border-white/15 shadow-black/40'
                }`}
              >
                {/* Top Subtle Glow Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5 ${
                    isSuccess
                      ? 'bg-gradient-to-r from-transparent via-[#F3D270] to-transparent'
                      : isError
                      ? 'bg-gradient-to-r from-transparent via-rose-500 to-transparent'
                      : isWarning
                      ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-sky-400 to-transparent'
                  }`}
                />

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border mt-0.5 ${
                      isSuccess
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37]/30 text-[#F3D270]'
                        : isError
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : isWarning
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                    }`}
                  >
                    {isSuccess && <CheckCircle2 size={16} />}
                    {isError && <AlertCircle size={16} />}
                    {isWarning && <AlertTriangle size={16} />}
                    {toast.type === 'info' && <Info size={16} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    {toast.title && (
                      <h4 className="font-bold text-xs text-white tracking-tight mb-0.5">
                        {toast.title}
                      </h4>
                    )}
                    <p className="text-xs text-white/80 leading-relaxed break-words">
                      {toast.message}
                    </p>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
