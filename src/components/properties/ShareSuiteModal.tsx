'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Check, Copy, MessageCircle, Send, Mail } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ShareSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: number;
    name: string;
    address: string;
  } | null;
}

export const ShareSuiteModal: React.FC<ShareSuiteModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const shareUrl = `https://portal.hycopropertymanagement.com/lease/${property.id}`;
  const shareText = `Explore available commercial, industrial and residential suites at ${property.name} (${property.address}) managed by HYCO Property Management: ${shareUrl}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent('Available Suites at ' + property.name)}&body=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modalShareTitle')}
      subtitle={t('modalShareSub')}
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <h4 className="text-sm font-bold text-white mb-0.5">{property.name}</h4>
          <p className="text-xs text-white/50">{property.address}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">
            {t('directLink')}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 py-2.5 px-3 rounded-xl glass-input text-xs text-white/80 select-all"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            >
              {copied ? t('copied') : t('copy')}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-2">
            {t('shareVia')}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
            >
              <MessageCircle size={20} />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleTelegram}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-400 text-xs font-semibold transition-all cursor-pointer"
            >
              <Send size={20} />
              <span>Telegram</span>
            </button>

            <button
              onClick={handleEmail}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/25 text-[#F3D270] text-xs font-semibold transition-all cursor-pointer"
            >
              <Mail size={20} />
              <span>Email</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
