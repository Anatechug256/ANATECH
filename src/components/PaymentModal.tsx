import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertCircle, ShieldCheck, 
  Smartphone, CreditCard, ArrowRight, Clock, Receipt
} from 'lucide-react';
import { MONETIZATION_PLANS } from '../data/initialData';
import { MonetizationPlan, PaymentTransaction, User } from '../types';
import { store } from '../services/marketplaceStore';

interface PaymentModalProps {
  currentUser: User;
  onClose: () => void;
  targetListingId?: string;
  defaultPlanId?: 'pro' | 'business' | 'featured';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  currentUser,
  onClose,
  targetListingId,
  defaultPlanId = 'pro'
}) => {
  const [selectedPurpose, setSelectedPurpose] = useState<'featured' | 'pro' | 'business'>(defaultPlanId);
  const [provider, setProvider] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'>('MTN_MOMO');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone || '+256772000000');
  const [step, setStep] = useState<'select' | 'processing' | 'confirmed'>('select');
  const [currentTransaction, setCurrentTransaction] = useState<PaymentTransaction | null>(null);

  const getAmount = () => {
    if (selectedPurpose === 'featured') return 2000;
    if (selectedPurpose === 'pro') return 10000;
    if (selectedPurpose === 'business') return 30000;
    return 10000;
  };

  const handleInitiate = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');

    const tx = store.initiatePayment({
      amount: getAmount(),
      provider,
      phoneNumber,
      purpose: selectedPurpose === 'featured' 
        ? 'featured_listing' 
        : selectedPurpose === 'pro' 
        ? 'subscription_pro' 
        : 'subscription_business',
      listingId: targetListingId
    });

    setCurrentTransaction(tx);

    // Simulate real Mobile Money USSD network response after 2.5 seconds
    setTimeout(() => {
      const completed = store.completePayment(tx.id, 'successful');
      setCurrentTransaction(completed);
      setStep('confirmed');
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {step === 'confirmed' ? 'Payment Receipt' : 'Marketplace Monetization'}
            </h2>
            <p className="text-xs text-slate-500">
              MTN MoMo, Airtel Money & Card Payments for Uganda
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'select' && (
          <form onSubmit={handleInitiate} className="space-y-4">
            {/* Purpose Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Option:
              </label>
              
              <div className="space-y-2">
                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedPurpose === 'featured' 
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="purpose"
                      checked={selectedPurpose === 'featured'}
                      onChange={() => setSelectedPurpose('featured')}
                      className="text-cyan-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Featured Listing Boost
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Top of search & home feed placement for 14 days
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    UGX 2,000
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedPurpose === 'pro' 
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="purpose"
                      checked={selectedPurpose === 'pro'}
                      onChange={() => setSelectedPurpose('pro')}
                      className="text-cyan-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Seller Pro Monthly
                      </span>
                      <span className="text-[11px] text-slate-500">
                        30 active listings + Verified Badge + WhatsApp contact
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    UGX 10,000/mo
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedPurpose === 'business' 
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="purpose"
                      checked={selectedPurpose === 'business'}
                      onChange={() => setSelectedPurpose('business')}
                      className="text-cyan-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Business Enterprise Monthly
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Unlimited listings + Storefront profile + Priority support
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    UGX 30,000/mo
                  </span>
                </label>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Payment Method (Uganda Gateways):
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('MTN_MOMO')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                    provider === 'MTN_MOMO'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-bold">MTN MoMo</span>
                  <span className="text-[9px] text-slate-400">*165# USSD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('AIRTEL_MONEY')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                    provider === 'AIRTEL_MONEY'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-bold">Airtel Money</span>
                  <span className="text-[9px] text-slate-400">*185# USSD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('CARD')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 ${
                    provider === 'CARD'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-bold">Visa / Master</span>
                  <span className="text-[9px] text-slate-400">Debit / Credit</span>
                </button>
              </div>
            </div>

            {/* Mobile Money Phone Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {provider === 'CARD' ? 'Contact Phone' : `${provider.replace('_', ' ')} Number`} *
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+256 7XX XXX XXX"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white"
                required
              />
              <span className="text-[10px] text-slate-400">
                A prompt will be sent to this phone to enter your PIN. Never share your PIN with anyone.
              </span>
            </div>

            {/* Summary & Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Pay UGX {getAmount().toLocaleString()} Securely</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Initiating {provider.replace('_', ' ')} Prompt
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Pushing USSD prompt to <strong>{phoneNumber}</strong> for <strong>UGX {getAmount().toLocaleString()}</strong>...
              </p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500 max-w-sm mx-auto">
              Please check your phone screen to approve the transaction.
            </div>
          </div>
        )}

        {step === 'confirmed' && currentTransaction && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Confirmed
              </h3>
              <p className="text-xs text-slate-500">
                Your benefits have been activated on ANATECH MARKET.
              </p>
            </div>

            {/* Digital Receipt Card */}
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5 font-semibold">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">{currentTransaction.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold tabular-nums">UGX {currentTransaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Provider:</span>
                <span>{currentTransaction.provider.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payer Phone:</span>
                <span className="font-mono">{currentTransaction.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span>{new Date(currentTransaction.completedAt || '').toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="w-full py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold"
            >
              Done & Return to Market
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
