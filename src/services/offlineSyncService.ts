/**
 * Offline Sync & Local Storage Synchronization Service
 * 
 * Manages service worker lifecycle, network connectivity monitoring,
 * and seamless offline local storage syncing for product listings and conversations.
 */

import { OfflineSyncState, ProductListing, Conversation, ChatMessage } from '../types';
import { store } from './marketplaceStore';

const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'anatech_market_offline_sync_queue',
  LAST_SYNC_TIMESTAMP: 'anatech_market_last_synced_at',
};

type SyncListener = (state: OfflineSyncState) => void;

class OfflineSyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: string;
  private listeners: Set<SyncListener> = new Set();
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.lastSyncedAt = this.getStoredLastSync() || new Date().toISOString();
    this.initEventListeners();
  }

  private initEventListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.handleBackOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  /**
   * Registers the Service Worker (/sw.js)
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[OfflineSync] Service Worker not supported in this environment');
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      console.log('[OfflineSync] Service Worker registered with scope:', reg.scope);

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[OfflineSync] New Service Worker available, activating...');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      return reg;
    } catch (err) {
      console.warn('[OfflineSync] Service Worker registration failed:', err);
      return null;
    }
  }

  /**
   * Pre-caches image URLs into the Service Worker cache
   */
  public precacheImages(urls: string[]) {
    if (!urls || urls.length === 0) return;
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_IMAGES',
        urls
      });
    }
  }

  /**
   * Returns current sync state
   */
  public getSyncState(): OfflineSyncState {
    const queue = this.getOfflineQueue();
    const allListings = store.getListings({ status: 'all' });
    const allConversations = store.getAllConversations();

    return {
      isOnline: this.isOnline,
      lastSyncedAt: this.lastSyncedAt,
      pendingSyncCount: queue.length,
      cachedListingsCount: allListings.length,
      cachedConversationsCount: allConversations.length,
      isSyncing: this.isSyncing
    };
  }

  /**
   * Subscribes a React component to sync state updates
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getSyncState());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getSyncState();
    this.listeners.forEach(fn => fn(state));
  }

  /**
   * Queue an item to be synced when internet connectivity returns
   */
  public queueOfflineAction(action: {
    type: 'SEND_MESSAGE' | 'CREATE_LISTING' | 'TOGGLE_FAVORITE';
    payload: any;
    timestamp: string;
  }) {
    const queue = this.getOfflineQueue();
    queue.push(action);
    this.saveOfflineQueue(queue);
    this.notifyListeners();
  }

  /**
   * Automatically executes when connectivity is restored
   */
  public async handleBackOnline(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.notifyListeners();

    try {
      // 1. Process queued offline messages
      const queue = this.getOfflineQueue();
      if (queue.length > 0) {
        console.log(`[OfflineSync] Processing ${queue.length} queued offline actions...`);
        
        for (const item of queue) {
          if (item.type === 'SEND_MESSAGE') {
            const { messageId, conversationId } = item.payload;
            store.markMessageSynced(messageId);
          }
        }

        // Clear queue
        this.saveOfflineQueue([]);
      }

      // 2. Pre-cache all active listings and images into Service Worker
      const activeListings = store.getListings({ status: 'active' });
      const imagesToCache: string[] = [];
      activeListings.forEach(l => {
        if (l.images && l.images.length > 0) {
          imagesToCache.push(...l.images);
        }
      });
      this.precacheImages(imagesToCache);

      // 3. Update last synced timestamp
      this.lastSyncedAt = new Date().toISOString();
      this.saveLastSync(this.lastSyncedAt);

    } catch (err) {
      console.warn('[OfflineSync] Error during background synchronization:', err);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Manually trigger synchronization from UI button
   */
  public async triggerSyncNow(): Promise<boolean> {
    this.isOnline = navigator.onLine;
    await this.handleBackOnline();
    return true;
  }

  // Storage Helpers
  private getOfflineQueue(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveOfflineQueue(queue: any[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.warn('[OfflineSync] Could not save offline queue:', e);
    }
  }

  private getStoredLastSync(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIMESTAMP);
    } catch {
      return null;
    }
  }

  private saveLastSync(val: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIMESTAMP, val);
    } catch {}
  }
}

export const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
