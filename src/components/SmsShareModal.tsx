import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquareText, Smartphone, Send, 
  Copy, Check, Share2, Info, ArrowRight, PhoneCall
} from 'lucide-react';
import { ProductListing } from '../types';
import { 
  buildSmsUri, 
  generateProductSmsText, 
  calculateSmsSegments, 
  shareProductViaSms,
  normalizeUgandanPhoneNumber 
} from '../utils/smsShare';

interface SmsShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ProductListing;
  formattedPrice: string;
}

export const SmsShareModal: React.FC<SmsShareModalProps> = ({
  isOpen,
  onClose,
  listing,
  formattedPrice
}) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const initialText = generateProductSmsText(listing, currentUrl);

  const [recipientPhone, setRecipientPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [hasWebShare, setHasWebShare] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setHasWebShare(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSmsMessage(generateProductSmsText(listing, window.location.href));
      setStatusFeedback(null);
    }
  }, [isOpen, listing]);

  if (!isOpen) return null;

  const smsStats = calculateSmsSegments(smsMessage);

  const handleOpenSmsApp = async () => {
    const uri = buildSmsUri({
      phoneNumber: recipientPhone,
      message: smsMessage
    });

    try {
      window.location.href = uri;
      setStatusFeedback('Opening your device messaging app...');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      // Fallback to clipboard
      await handleCopy();
      setStatusFeedback('Could not launch SMS app directly. Copied SMS text to clipboard!');
    }
  };

  const handleNativeShare = async () => {
    const res = await shareProductViaSms({
      title: `${listing.title} on ANATECH MARKET`,
      message: smsMessage,
      url: currentUrl,
      phoneNumber: recipientPhone,
      forceSmsUri: false
    });

    if (res.method === 'web-share' && res.success) {
      setStatusFeedback('Shared successfully via device share sheet!');
      setTimeout(() => onClose(), 1200);
    } else if (res.method === 'sms-uri') {
      setStatusFeedback('Triggered SMS application.');
      setTimeout(() => onClose(), 1200);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(smsMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleQuickPresetPrefix = (prefix: string) => {
    setRecipientPhone(prefix);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Share via SMS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Non-Smartphone Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Share this product link with contacts using basic phones or low mobile data.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Feedback notification */}
          {statusFeedback && (
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-800 dark:text-cyan-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Product Summary Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            {listing.images && listing.images.length > 0 ? (
              <img 
                src={listing.images[0]} 
                alt={listing.title} 
                className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {listing.title}
              </div>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="font-extrabold text-cyan-600 dark:text-cyan-400">{formattedPrice}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400 truncate">{listing.district}</span>
              </div>
            </div>
          </div>

          {/* Recipient Phone Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-cyan-600" />
                <span>Recipient Phone Number</span>
                <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">Uganda format</span>
            </div>

            <div className="relative">
              <input
                type="tel"
                placeholder="e.g. 0772 123 456 or +256 701..."
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Quick Ugandan Carrier Prefixes */}
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="text-[10px] text-slate-400">Quick prefix:</span>
              <button 
                type="button" 
                onClick={() => handleQuickPresetPrefix('+25677')} 
                className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium transition-colors"
              >
                MTN +25677
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickPresetPrefix('+25678')} 
                className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium transition-colors"
              >
                MTN +25678
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickPresetPrefix('+25670')} 
                className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium transition-colors"
              >
                Airtel +25670
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickPresetPrefix('+25675')} 
                className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium transition-colors"
              >
                Airtel +25675
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Leave blank to pick recipient directly inside your phone's default messaging app.
            </p>
          </div>

          {/* SMS Message Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                SMS Text Preview
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                  {smsStats.charCount} chars
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className={`font-semibold ${smsStats.segmentCount > 1 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {smsStats.segmentCount} standard SMS ({smsStats.charsRemainingInCurrentSegment} left)
                </span>
              </div>
            </div>

            <textarea
              rows={3}
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans resize-none"
            />
          </div>

          {/* Offline / Feature phone reassurance notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-slate-800 dark:text-slate-200">Zero Internet Required for Recipient:</strong>
              <p>
                The recipient receives plain text on any 2G/3G/4G handset (Nokia, Itel, Tecno, Samsung, etc.) with the listing price and link ready for whenever they access the internet.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy SMS</span>
              </>
            )}
          </button>

          {/* Web Share (if supported) */}
          {hasWebShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Share using native Android/iOS system share sheet"
            >
              <Share2 className="w-4 h-4" />
              <span>Native Share</span>
            </button>
          )}

          {/* Primary SMS URI Launch Button */}
          <button
            type="button"
            onClick={handleOpenSmsApp}
            className="w-full sm:flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Open SMS App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
