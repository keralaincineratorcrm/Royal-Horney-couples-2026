import React, { useState } from 'react';
import { X, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { FollowUp } from '../../types';

interface WhatsAppModalProps {
  followUp: FollowUp | null;
  executiveName: string;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  followUp,
  executiveName,
  onClose,
}) => {
  if (!followUp) return null;

  const defaultMessage = `Hello ${followUp.customerName}, this is ${executiveName || followUp.assignedToName || 'Sales Team'} from Kerala Incinerator. We are following up regarding your enquiry for the ${followUp.productName}. Please let us know a convenient time to discuss.`;

  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  const cleanPhone = followUp.customerPhone.replace(/[^0-9]/g, '');

  const handleSend = () => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="whatsapp-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="whatsapp-modal-content"
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight">
                WhatsApp Follow-up
              </h3>
              <p className="text-xs text-slate-500">
                To {followUp.customerName} ({followUp.customerPhone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">Customizable Message</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-slate-500 hover:text-[#2563EB] flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              id="whatsapp-message-textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Quick details:</div>
            <div>• Target Product: <strong className="text-slate-900">{followUp.productName}</strong></div>
            <div>• Location: <strong className="text-slate-900">{followUp.customerPlace}</strong></div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="open-whatsapp-send-btn"
              type="button"
              onClick={handleSend}
              className="px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

