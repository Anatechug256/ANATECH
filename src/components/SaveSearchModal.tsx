import React, { useState, useEffect } from 'react';
import { 
  X, BellRing, Bell, Check, ShieldCheck, 
  MapPin, Tag, DollarSign, Sparkles, AlertCircle, Smartphone
} from 'lucide-react';
import { SavedSearchCriteria } from '../types';
import { store } from '../services/marketplaceStore';
import { 
  getPushNotificationStatus, 
  requestPushNotificationPermission 
} from '../utils/pushNotifications';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCriteria: {
    query: string;
    categoryId: string;
    categoryName?: string;
    district: string;
    condition: string;
    minPrice: string;
    maxPrice: string;
    budgetSliderValue: number;
    maxBudgetLimit: number;
  };
  onSaved: (savedSearch: SavedSearchCriteria) => void;
}

export const SaveSearchModal: React.FC<SaveSearchModalProps> = ({
  isOpen,
  onClose,
  currentCriteria,
  onSaved
}) => {
  const {
    query,
    categoryId,
    categoryName,
    district,
    condition,
    minPrice,
    maxPrice,
    budgetSliderValue,
    maxBudgetLimit
  } = currentCriteria;

  // Generate a smart, human-readable default title based on criteria
  const generateDefaultTitle = () => {
    const parts: string[] = [];
    if (query.trim()) {
      parts.push(`"${query.trim()}"`);
    } else if (categoryName && categoryId !== 'all') {
      parts.push(categoryName);
    } else {
      parts.push('Market Listings');
    }

    if (district && district !== 'all') {
      parts.push(`in ${district}`);
    }

    const effectiveMax = maxPrice ? Number(maxPrice) : (budgetSliderValue < maxBudgetLimit ? budgetSliderValue : 0);
    if (effectiveMax > 0) {
      if (effectiveMax >= 1000000) {
        parts.push(`≤ ${(effectiveMax / 1000000).toFixed(1)}M UGX`);
      } else {
        parts.push(`≤ ${(effectiveMax / 1000).toFixed(0)}k UGX`);
      }
    }

    return parts.join(' ');
  };

  const [alertName, setAlertName] = useState('');
  const [notifyPush, setNotifyPush] = useState(true);
  const [pushStatus, setPushStatus] = useState(getPushNotificationStatus());
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAlertName(generateDefaultTitle());
      setPushStatus(getPushNotificationStatus());
      setSavedSuccessMsg(false);
    }
  }, [isOpen, currentCriteria]);

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    setIsRequestingPermission(true);
    const result = await requestPushNotificationPermission();
    setPushStatus(getPushNotificationStatus());
    setIsRequestingPermission(false);
    if (result === 'granted') {
      setNotifyPush(true);
    }
  };

  const handleSave = () => {
    if (!alertName.trim()) return;

    const effectiveMin = minPrice ? Number(minPrice) : undefined;
    const effectiveMax = maxPrice ? Number(maxPrice) : (budgetSliderValue < maxBudgetLimit ? budgetSliderValue : undefined);

    const currentUser = store.getCurrentUser();
    const newSearch = store.saveSearchCriteria({
      userId: currentUser.id,
      name: alertName.trim(),
      query: query.trim() || undefined,
      categoryId: categoryId !== 'all' ? categoryId : undefined,
      categoryName: categoryId !== 'all' ? categoryName : undefined,
      district: district !== 'all' ? district : undefined,
      condition: condition !== 'all' ? condition : undefined,
      minPrice: effectiveMin,
      maxPrice: effectiveMax,
      notifyPush: notifyPush && pushStatus.permission === 'granted'
    });

    setSavedSuccessMsg(true);
    setTimeout(() => {
      onSaved(newSearch);
      onClose();
    }, 1200);
  };

  const effectiveMaxPrice = maxPrice ? Number(maxPrice) : (budgetSliderValue < maxBudgetLimit ? budgetSliderValue : undefined);

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Save Search & Push Alerts</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get notified the instant matching items are posted.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {savedSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Search criteria saved! You will receive push notifications when new matching products are posted.</span>
            </div>
          )}

          {/* Active Criteria Chips Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Active Criteria to Monitor:
            </label>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
              {query && (
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-cyan-600" />
                  <span>Keyword: <strong>"{query}"</strong></span>
                </span>
              )}

              {categoryId && categoryId !== 'all' && (
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span>Category: <strong>{categoryName || categoryId}</strong></span>
                </span>
              )}

              {district && district !== 'all' && (
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-600" />
                  <span>District: <strong>{district}</strong></span>
                </span>
              )}

              {condition && condition !== 'all' && (
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 capitalize">
                  Condition: <strong>{condition}</strong>
                </span>
              )}

              {effectiveMaxPrice && (
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono">
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  <span>Max Budget: <strong>UGX {effectiveMaxPrice.toLocaleString()}</strong></span>
                </span>
              )}

              {minPrice && (
                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono">
                  <span>Min Price: <strong>UGX {Number(minPrice).toLocaleString()}</strong></span>
                </span>
              )}

              {!query && categoryId === 'all' && district === 'all' && condition === 'all' && !effectiveMaxPrice && !minPrice && (
                <span className="text-xs text-slate-500 italic">
                  Monitoring all new market listings across Uganda.
                </span>
              )}
            </div>
          </div>

          {/* Alert Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Alert Name
            </label>
            <input
              type="text"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g. Pixel Phones in Kampala under 3M"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Push Notification Switch & Browser Permission */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Receive Push Notifications</span>
                    {pushStatus.permission === 'granted' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Trigger real-time browser push notifications on desktop or phone when matching items are uploaded.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={notifyPush}
                onChange={(e) => setNotifyPush(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Browser Permission Prompt Status */}
            {pushStatus.permission !== 'granted' && pushStatus.supported && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Browser notification permission required
                </span>
                <button
                  type="button"
                  onClick={handleRequestPush}
                  disabled={isRequestingPermission}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isRequestingPermission ? 'Requesting...' : 'Grant Permission'}
                </button>
              </div>
            )}

            {pushStatus.permission === 'denied' && (
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Notifications are blocked in your browser settings. You will still receive in-app alerts!</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!alertName.trim() || savedSuccessMsg}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
          >
            <BellRing className="w-4 h-4" />
            <span>Save Filter Criteria & Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};
