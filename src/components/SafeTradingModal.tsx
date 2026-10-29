import React from 'react';
import { X, ShieldCheck, AlertTriangle, FileText, CheckCircle2, Lock } from 'lucide-react';
import { PROHIBITED_ITEMS } from '../data/categoriesAndDistricts';

interface SafeTradingModalProps {
  onClose: () => void;
}

export const SafeTradingModal: React.FC<SafeTradingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold">
                ANATECH MARKET Safety & Compliance
              </h2>
              <span className="text-[10px] text-slate-400">
                Uganda Safe Trading Rules, Privacy, and Google Play Standards
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1: Golden Rules for Uganda Traders */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center text-xs font-bold">1</span>
              Local Safe Trading Rules in Uganda
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Meet in Public Spaces</span>
                <p className="text-xs text-slate-500">
                  Always choose populated venues such as shopping malls (e.g. Acacia Mall, Ntinda Complex, Garden City), bank halls, or police station premises.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Inspect Before Payment</span>
                <p className="text-xs text-slate-500">
                  Thoroughly test electronics, power on smartphones, check IMEI numbers (*#06#), and inspect mechanical parts before releasing cash or sending Mobile Money.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Never Pay Remote Advances</span>
                <p className="text-xs text-slate-500">
                  Do not send "fuel money", "transport deposit", or "commitment fee" via MTN MoMo or Airtel Money prior to seeing the seller and product.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Vehicles & Land Verification</span>
                <p className="text-xs text-slate-500">
                  Verify vehicle logbooks with URA e-Tax portal and conduct land searches with the Ministry of Lands, Housing & Urban Development (MLHUD).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Prohibited Listings */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">2</span>
              Zero-Tolerance Prohibited Goods
            </h3>
            <p className="text-xs text-slate-500">
              Users caught listing the following will face immediate permanent suspension and referral to authorities:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-rose-800 dark:text-rose-300">
              {PROHIBITED_ITEMS.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Section 3: Google Play Readiness & Privacy Policy */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold">3</span>
              Privacy Policy & Account Control
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ANATECH MARKET (owned by ANATECH UG) collects only user-provided phone numbers, emails, and district locations strictly for facilitating local transactions. Phone numbers are hidden by default unless the seller opts into public contact. Users can permanently delete their accounts and data anytime under Profile → Settings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
