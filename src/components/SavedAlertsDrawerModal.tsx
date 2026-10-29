import React, { useState, useEffect } from 'react';
import { 
  X, BellRing, Bell, Trash2, Check, ArrowRight, 
  MapPin, Tag, Smartphone, PlusCircle, RotateCcw
} from 'lucide-react';
import { SavedSearchCriteria } from '../types';
import { store } from '../services/marketplaceStore';
import { 
  getPushNotificationStatus, 
  requestPushNotificationPermission 
} from '../utils/pushNotifications';

interface SavedAlertsDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySearch: (criteria: SavedSearchCriteria) => void;
  onOpenSaveNew: () => void;
}

export const SavedAlertsDrawerModal: React.FC<SavedAlertsDrawerModalProps> = ({
  isOpen,
  onClose,
  onApplySearch,
  onOpenSaveNew
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearchCriteria[]>([]);
  const [pushStatus, setPushStatus] = useState(getPushNotificationStatus());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadSearches = () => {
    const list = store.getSavedSearches();
    setSavedSearches(list);
    setPushStatus(getPushNotificationStatus());
  };

  useEffect(() => {
    if (isOpen) {
      loadSearches();
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePush = async (search: SavedSearchCriteria) => {
    const newNotifyPush = !search.notifyPush;

    if (newNotifyPush && pushStatus.permission !== 'granted') {
      const result = await requestPushNotificationPermission();
      setPushStatus(getPushNotificationStatus());
      if (result !== 'granted') {
        alert('Please allow browser notification permissions to receive push alerts on your device.');
        return;
      }
    }

    store.updateSavedSearch(search.id, { notifyPush: newNotifyPush });
    loadSearches();
  };

  const handleDelete = (id: string) => {
    store.deleteSavedSearch(id);
    setDeleteConfirmId(null);
    loadSearches();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Saved Search Alerts</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                  {savedSearches.length} Active
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive instant push notifications when matching listings are posted.
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

        {/* List of Saved Searches */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {savedSearches.length > 0 ? (
            savedSearches.map((search) => (
              <div
                key={search.id}
                className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-cyan-500/50 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {search.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Saved {new Date(search.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Push Notification Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePush(search)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      search.notifyPush
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`}
                    title={search.notifyPush ? 'Push notifications active' : 'Click to enable push notifications'}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{search.notifyPush ? 'Push ON' : 'Push OFF'}</span>
                  </button>
                </div>

                {/* Criteria Chips */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {search.query && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      "{search.query}"
                    </span>
                  )}
                  {search.categoryName && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {search.categoryName}
                    </span>
                  )}
                  {search.district && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {search.district}
                    </span>
                  )}
                  {search.maxPrice && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 font-mono font-medium">
                      ≤ UGX {search.maxPrice.toLocaleString()}
                    </span>
                  )}
                  {search.condition && search.condition !== 'all' && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                      {search.condition}
                    </span>
                  )}
                </div>

                {/* Actions: Apply or Delete */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    {search.lastMatchedCount ? (
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                        ★ {search.lastMatchedCount} new items matched
                      </span>
                    ) : (
                      <span>Waiting for new matches...</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {deleteConfirmId === search.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(search.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(search.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete this saved search alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onApplySearch(search);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Apply Search</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No saved search criteria alerts yet
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Filter by any keyword, budget, or district, then click "Save Search Alert" to receive instant push notifications when matching products are posted.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSaveNew();
            }}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Save Current Filters</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
