'use client';

import React, { useState } from 'react';
import { Receipt, Building2, Calendar, DollarSign, Link2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export interface InvoiceFormRecord {
  id?: number;
  invoice_number?: string;
  qbo_invoice_id?: string | null;
  tenant_name: string;
  suite_reference: string;
  base_rent?: number | string;
  cam_amount?: number | string;
  amount: number | string;
  due_date: string;
  notes?: string | null;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceToEdit?: InvoiceFormRecord | null;
}

const QUICK_TENANT_PRESETS = [
  {
    tenant: 'Circle City Tech Labs',
    suite: 'Suite 200 (7898 Zionsville Rd)',
    baseRent: '3280',
    cam: '320',
  },
  {
    tenant: 'Midwest Logistics Partners',
    suite: 'Warehouse Bay 4-A (Park 100)',
    baseRent: '7650',
    cam: '850',
  },
  {
    tenant: 'Hoosier Supply Chain Corp',
    suite: 'Flex Bay 12-B (Morris St)',
    baseRent: '3960',
    cam: '440',
  },
  {
    tenant: 'Meridian Wellness Center',
    suite: 'Suite 310 (Meridian North)',
    baseRent: '2565',
    cam: '285',
  },
];

function getDefaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceToEdit,
}) => {
  const { language } = useLanguage();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const isEditing = Boolean(invoiceToEdit?.id);

  const initialBaseRent = invoiceToEdit
    ? String(
        Number(invoiceToEdit.base_rent) > 0
          ? Number(invoiceToEdit.base_rent)
          : Number(invoiceToEdit.amount) || 0
      )
    : '';
  const initialCam = invoiceToEdit ? String(Number(invoiceToEdit.cam_amount) || 0) : '0';
  const initialDue = invoiceToEdit?.due_date
    ? String(invoiceToEdit.due_date).split('T')[0].slice(0, 10)
    : getDefaultDueDate();
  const [invoiceNumber, setInvoiceNumber] = useState(
    () =>
      invoiceToEdit?.invoice_number ||
      `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [tenantName, setTenantName] = useState(invoiceToEdit?.tenant_name || '');
  const [suiteReference, setSuiteReference] = useState(invoiceToEdit?.suite_reference || '');
  const [baseRent, setBaseRent] = useState(initialBaseRent);
  const [camAmount, setCamAmount] = useState(initialCam);
  const [dueDate, setDueDate] = useState(initialDue);
  const [notes, setNotes] = useState(invoiceToEdit?.notes || '');
  const [syncToQbo, setSyncToQbo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = (Number(baseRent) || 0) + (Number(camAmount) || 0);

  const handleSelectPreset = (presetIndex: string) => {
    if (!presetIndex) return;
    const preset = QUICK_TENANT_PRESETS[Number(presetIndex)];
    if (!preset) return;
    setTenantName(preset.tenant);
    setSuiteReference(preset.suite);
    setBaseRent(preset.baseRent);
    setCamAmount(preset.cam);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      toastError(
        language === 'en'
          ? 'Enter a valid Base Rent or CAM amount.'
          : 'Ingrese un monto válido de Renta Base o CAM.',
        language === 'en' ? 'Invalid Amount' : 'Monto Inválido'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? { id: invoiceToEdit?.id, action: 'update' } : {}),
          invoice_number: invoiceNumber.trim(),
          tenant_name: tenantName.trim(),
          suite_reference: suiteReference.trim(),
          base_rent: Number(baseRent) || 0,
          cam_amount: Number(camAmount) || 0,
          due_date: dueDate,
          notes: notes.trim(),
          sync_to_qbo: syncToQbo,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save invoice');
      }

      if (data.qbo_synced) {
        toastSuccess(
          isEditing
            ? language === 'en'
              ? `Invoice ${data.invoice.invoice_number} updated in HYCO & QuickBooks Online (#${data.invoice.qbo_invoice_id}).`
              : `Factura ${data.invoice.invoice_number} actualizada en HYCO y QuickBooks Online (#${data.invoice.qbo_invoice_id}).`
            : language === 'en'
            ? `Invoice ${data.invoice.invoice_number} created & synced to QuickBooks Online (#${data.invoice.qbo_invoice_id}).`
            : `Factura ${data.invoice.invoice_number} creada y sincronizada en QuickBooks Online (#${data.invoice.qbo_invoice_id}).`,
          'QuickBooks Sync'
        );
      } else {
        toastInfo(
          data.notice ||
            (language === 'en'
              ? `Invoice ${data.invoice.invoice_number} saved locally.`
              : `Factura ${data.invoice.invoice_number} guardada localmente.`),
          language === 'en' ? 'Invoice Saved' : 'Factura Guardada'
        );
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving invoice';
      toastError(message, language === 'en' ? 'Invoice Error' : 'Error de Factura');
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
          ? language === 'en'
            ? 'Edit Invoice & Sync QBO'
            : 'Editar Factura y Sincronizar QBO'
          : language === 'en'
          ? 'Create Invoice (QuickBooks Online)'
          : 'Crear Factura (QuickBooks Online)'
      }
      subtitle={
        language === 'en'
          ? 'Base Rent + CAM charges synced bidirectionally with QuickBooks Online.'
          : 'Renta Base + cargos CAM sincronizados en vivo con QuickBooks Online.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEditing && (
          <div>
            <label className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">
              {language === 'en' ? 'Quick Fill Tenant Lease (Optional)' : 'Autocompletar Inquilino (Opcional)'}
            </label>
            <select
              defaultValue=""
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1526] border border-white/10 text-xs text-white focus:border-[#D4AF37] outline-none cursor-pointer"
            >
              <option value="">
                {language === 'en' ? '-- Select active tenant lease --' : '-- Seleccionar contrato activo --'}
              </option>
              {QUICK_TENANT_PRESETS.map((preset, idx) => (
                <option key={preset.tenant} value={String(idx)}>
                  {preset.tenant} — {preset.suite} (${Number(preset.baseRent) + Number(preset.cam)}/mo)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={language === 'en' ? 'Invoice Number' : 'Número de Factura'}
            leftIcon={<Receipt size={14} />}
            required
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-2026-1001"
          />
          <Input
            label={language === 'en' ? 'Due Date' : 'Fecha de Vencimiento'}
            type="date"
            leftIcon={<Calendar size={14} />}
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={language === 'en' ? 'Tenant / Customer Name' : 'Inquilino / Cliente'}
            required
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="Circle City Tech Labs"
          />
          <Input
            label={language === 'en' ? 'Suite / Property' : 'Suite / Propiedad'}
            leftIcon={<Building2 size={14} />}
            required
            value={suiteReference}
            onChange={(e) => setSuiteReference(e.target.value)}
            placeholder="Suite 200 (7898 Zionsville Rd)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={language === 'en' ? 'Base Commercial Rent (USD)' : 'Renta Base Comercial (USD)'}
            type="number"
            step="0.01"
            min="0"
            leftIcon={<DollarSign size={14} />}
            required
            value={baseRent}
            onChange={(e) => setBaseRent(e.target.value)}
            placeholder="3280.00"
          />
          <Input
            label={language === 'en' ? 'CAM Recovery Charge (USD)' : 'Cuota CAM Operativa (USD)'}
            type="number"
            step="0.01"
            min="0"
            leftIcon={<DollarSign size={14} />}
            value={camAmount}
            onChange={(e) => setCamAmount(e.target.value)}
            placeholder="320.00"
          />
        </div>

        {/* Live Total Summary */}
        <div className="p-3.5 rounded-xl bg-[#0B1526]/90 border border-[#D4AF37]/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              {language === 'en' ? 'Total Invoice Amount' : 'Monto Total de Factura'}
            </span>
            <span className="text-[11px] text-white/60">
              Base ${(Number(baseRent) || 0).toFixed(2)} + CAM ${(Number(camAmount) || 0).toFixed(2)}
            </span>
          </div>
          <span className="text-lg font-extrabold font-mono text-[#F3D270]">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            {language === 'en' ? 'Notes / Memo (Optional)' : 'Notas / Referencia (Opcional)'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Monthly commercial lease billing & CAM recovery...'
                : 'Facturación mensual de arrendamiento comercial y cuota CAM...'
            }
            className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-[#D4AF37] outline-none resize-none"
          />
        </div>

        {!isEditing && (
          <label className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Link2 size={15} className="text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {language === 'en'
                    ? 'Sync live to QuickBooks Online'
                    : 'Sincronizar en vivo con QuickBooks Online'}
                </span>
                <span className="text-[11px] text-white/55">
                  {language === 'en'
                    ? 'Creates Customer (if new) and Invoice automatically in QBO.'
                    : 'Crea el Cliente (si no existe) y la Factura automáticamente en QBO.'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={syncToQbo}
              onChange={(e) => setSyncToQbo(e.target.checked)}
              className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
            />
          </label>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button type="button" variant="ghost" onClick={onClose}>
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing
              ? language === 'en'
                ? 'Save & Sync QBO'
                : 'Guardar y Sincronizar QBO'
              : language === 'en'
              ? 'Create Invoice'
              : 'Crear Factura'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
