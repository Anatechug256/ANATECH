import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Report } from '../types';
import { store } from '../services/marketplaceStore';

interface ReportModalProps {
  targetType: 'listing' | 'user';
  targetId: string;
  targetTitle: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  targetTitle,
  onClose
}) => {
  const [reason, setReason] = useState<Report['reason']>('fraud_scam');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.submitReport({
      targetType,
      targetId,
      targetTitle,
      reason,
      details: details.trim()
    });
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <Flag className="w-4 h-4" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Report {targetType === 'listing' ? 'Listing' : 'User'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Report Received</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thank you for keeping ANATECH MARKET safe. Our moderation team in Kampala will review this report immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs text-slate-500">
              Reporting: <strong className="text-slate-900 dark:text-white">{targetTitle}</strong>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for report:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as Report['reason'])}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="fraud_scam">Fraud / Advance-fee scam attempt</option>
                <option value="counterfeit">Counterfeit / Fake product</option>
                <option value="prohibited_item">Prohibited item (weapons, drugs, illegal)</option>
                <option value="duplicate">Spam or duplicate listing</option>
                <option value="wrong_category">Misleading category or price</option>
                <option value="offensive">Offensive content or harassment</option>
                <option value="other">Other policy violation</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Provide specifics or evidence:
              </label>
              <textarea
                rows={3}
                placeholder="Describe what occurred, e.g. seller requested upfront deposit, counterfeit branding, etc."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Submit Report to ANATECH Trust Team
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
