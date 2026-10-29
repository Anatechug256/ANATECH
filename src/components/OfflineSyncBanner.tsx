import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, HardDrive, AlertCircle } from 'lucide-react';
import { offlineSyncService } from '../services/offlineSyncService';
import { OfflineSyncState } from '../types';

export const OfflineSyncBanner: React.FC = () => {
  const [syncState, setSyncState] = useState<OfflineSyncState>(offlineSyncService.getSyncState());
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [lastOnlineState, setLastOnlineState] = useState(syncState.isOnline);

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((newState) => {
      // Check transition from offline to online
      if (!lastOnlineState && newState.isOnline) {
        setShowOnlineToast(true);
        const timer = setTimeout(() => setShowOnlineToast(false), 4500);
        return () => clearTimeout(timer);
      }
      setLastOnlineState(newState.isOnline);
      setSyncState(newState);
    });

    return () => unsubscribe();
  }, [lastOnlineState]);

  const handleManualSync = async () => {
    await offlineSyncService.triggerSyncNow();
  };

  // Back online flash notification
  if (showOnlineToast) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 z-40 relative">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Back Online: Local storage synchronized with ANATECH Uganda marketplace node.</span>
          </div>
          <button
            onClick={() => setShowOnlineToast(false)}
            className="text-emerald-200 hover:text-white text-xs underline font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Persistent banner when device is offline
  if (!syncState.isOnline) {
    return (
      <div 
        className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 text-xs shadow-md border-b border-amber-500/50 z-40 relative"
        data-testid="offline-sync-banner"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-amber-700/80 dark:bg-amber-800/80 shrink-0">
              <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
            </div>
            <div>
              <span className="font-bold tracking-wide">
                Offline Mode Active:
              </span>{' '}
              <span className="text-amber-100">
                Viewing previously loaded listings and saved conversations from device local storage.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] bg-amber-700/60 px-2 py-1 rounded-md text-amber-100">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{syncState.cachedListingsCount} listings · {syncState.cachedConversationsCount} chats saved</span>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncState.isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-amber-900 font-bold hover:bg-amber-100 active:scale-95 transition-all text-[11px]"
              title="Test connection and sync data"
            >
              <RefreshCw className={`w-3 h-3 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Syncing...' : 'Retry Connection'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineSyncBanner;
