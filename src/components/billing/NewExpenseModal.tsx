'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Building2, Calendar, Receipt, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { OFFICIAL_QBO_ACCOUNT_MAPPINGS } from '@/lib/qboData';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState('1');
  const [selectedAccount, setSelectedAccount] = useState('Utilities');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('ACH');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const currentMapping = OFFICIAL_QBO_ACCOUNT_MAPPINGS.find(
    (m) => m.qbo_account_name === selectedAccount
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !amount || parseFloat(amount) <= 0) {
      alert(language === 'en' ? 'Please enter a valid vendor and amount' : 'Por favor ingresa un proveedor y monto válido');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: parseInt(propertyId),
          qbo_account_name: selectedAccount,
          vendor_name: vendorName,
          amount: parseFloat(amount),
          expense_date: expenseDate,
          fiscal_year: new Date(expenseDate).getFullYear(),
          payment_method: paymentMethod,
          description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to record expense');
      }
    } catch (err) {
      console.error('Error recording expense:', err);
      alert('Error recording expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#0A1220] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#070D18]/90">
            <div className="flex items-center gap-2">
              <Receipt className="text-[#F3D270]" size={18} />
              <h3 className="text-base font-bold text-white tracking-wide">
                {language === 'en' ? 'Record Property Expense' : 'Registrar Gasto de Propiedad'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Property */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {language === 'en' ? 'Property / Complex' : 'Propiedad / Complejo'}
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="1">7898 Zionsville Rd Commercial Center</option>
                <option value="2">Park 100 Industrial Center</option>
                <option value="3">Morris Street Flex & Service Hub</option>
                <option value="4">Meridian North Executive Suites</option>
              </select>
            </div>

            {/* QBO Account */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {language === 'en' ? 'QuickBooks Online (QBO) Account' : 'Cuenta QuickBooks Online'}
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {OFFICIAL_QBO_ACCOUNT_MAPPINGS.map((m) => (
                  <option key={m.qbo_account_name} value={m.qbo_account_name}>
                    {m.qbo_account_name} &bull; [{m.platform_category}] &bull; ({m.default_recovery})
                  </option>
                ))}
              </select>
              {currentMapping && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] px-2 py-1 rounded bg-white/[0.03]">
                  <span className="text-white/40">{currentMapping.description}</span>
                  <span
                    className={`font-semibold ${
                      currentMapping.default_recovery === 'Recoverable'
                        ? 'text-emerald-400'
                        : currentMapping.default_recovery === 'Lease-Specific'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {currentMapping.default_recovery}
                  </span>
                </div>
              )}
            </div>

            {/* Vendor & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  {language === 'en' ? 'Vendor / Payee' : 'Proveedor'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AES Indiana, Republic Services"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  {language === 'en' ? 'Amount (USD)' : 'Monto (USD)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-white/40 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl pl-7 pr-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Date & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  {language === 'en' ? 'Expense Date' : 'Fecha de Gasto'}
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">
                  {language === 'en' ? 'Payment Method' : 'Método de Pago'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="ACH">ACH Direct Debit</option>
                  <option value="Check">Business Check</option>
                  <option value="Wire">Bank Wire</option>
                  <option value="Credit Card">Corporate Card</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {language === 'en' ? 'Description / Invoice Memo' : 'Descripción / Memo'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of repair, service period, or work order #..."
                className="w-full text-xs bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89222] text-[#070D18] text-xs font-bold shadow-lg hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                {submitting
                  ? language === 'en'
                    ? 'Saving...'
                    : 'Guardando...'
                  : language === 'en'
                  ? 'Record Expense'
                  : 'Registrar Gasto'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

