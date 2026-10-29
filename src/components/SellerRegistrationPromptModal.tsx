import React from 'react';
import { 
  X, Store, ShieldCheck, MapPin, CreditCard, 
  CheckCircle2, ArrowRight, Lock, AlertTriangle
} from 'lucide-react';
import { User } from '../types';

interface SellerRegistrationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRegistration: () => void;
  onOpenSafeTrading?: () => void;
  currentUser: User;
}

export const SellerRegistrationPromptModal: React.FC<SellerRegistrationPromptModalProps> = ({
  isOpen,
  onClose,
  onStartRegistration,
  onOpenSafeTrading,
  currentUser
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-labelledby="seller-prompt-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10 cursor-pointer"
          aria-label="Close prompt"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Decorative Header */}
        <div className="bg-gradient-to-br from-cyan-600 via-cyan-700 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-cyan-300 shadow-inner">
              <Store className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Lock className="w-3 h-3" />
                Trust & Verification Rule
              </span>
              <h2 id="seller-prompt-title" className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Seller Registration Required
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed relative z-10">
            To ensure genuine trade, protect Ugandan buyers, and eliminate scams, <strong className="text-white font-bold">all sellers must complete their registration profile</strong> before listing items for sale on ANATECH MARKET.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Why registration is mandatory before selling:
          </div>

          {/* Feature Checklist */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-500 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  Uganda National ID (NIN) Verification
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Verifies your merchant identity with NIRA credentials to unlock the official green Verified Seller checkmark.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-500 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  Physical Storefront & Pickup Address
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Buyers prefer visiting walk-in shops (e.g., Pioneer Mall, Nakasero, regional hubs) for in-person inspection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  MTN Mobile Money & Airtel Money Payouts
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Ensures direct, instant settlements and safe payments without cash handling risks.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="flex items-center gap-2 p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Registration takes under 2 minutes and is 100% free with zero initial fees.</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onClose();
                onStartRegistration();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register Seller Profile Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between gap-3 pt-1">
              {onOpenSafeTrading && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSafeTrading();
                  }}
                  className="text-xs text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Read Safe Trading Rules
                </button>
              )}
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors ml-auto cursor-pointer"
              >
                Cancel / Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
