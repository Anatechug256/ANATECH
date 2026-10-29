import { 
  User, ProductListing, Conversation, ChatMessage, Report, 
  NotificationItem, PaymentTransaction, AuditLog, ListingStatus,
  SavedSearchCriteria, SellerReview, AggregateSellerRating
} from '../types';
import { INITIAL_USERS, INITIAL_LISTINGS, INITIAL_REVIEWS } from '../data/initialData';
import { showSearchAlertPushNotification } from '../utils/pushNotifications';

const STORAGE_KEYS = {
  USERS: 'anatech_market_users',
  CURRENT_USER_ID: 'anatech_market_current_user_id',
  LISTINGS: 'anatech_market_listings',
  CONVERSATIONS: 'anatech_market_conversations',
  MESSAGES: 'anatech_market_messages',
  REPORTS: 'anatech_market_reports',
  NOTIFICATIONS: 'anatech_market_notifications',
  TRANSACTIONS: 'anatech_market_transactions',
  AUDIT_LOGS: 'anatech_market_audit_logs',
  LOW_DATA_MODE: 'anatech_market_low_data_mode',
  CURRENCY: 'anatech_market_currency',
  LANGUAGE: 'anatech_market_language',
  THEME: 'anatech_market_theme',
  SAVED_SEARCHES: 'anatech_market_saved_searches',
  AUTO_DETECT_LOCATION: 'anatech_market_auto_detect_location',
  LOCATION_CHECKED_USERS: 'anatech_market_location_checked_users',
  LAST_DETECTED_LOCATION: 'anatech_market_last_detected_location',
  RECENTLY_VIEWED: 'anatech_market_recently_viewed',
  SELLER_REVIEWS: 'anatech_market_seller_reviews',
  SEARCH_HISTORY: 'anatech_market_search_history'
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

// Initial Sample Conversations
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    productId: 'item_1',
    productTitle: 'Samsung Galaxy S24 & Pixel 8 Pro (Genuine Flagships)',
    productPrice: 2450000,
    productImage: '/src/assets/images/phones_smartphones_uganda_1792117850235.jpg',
    productDistrict: 'Kampala',
    sellerId: 'user_seller_1',
    sellerName: 'Muwonge Tech Hub',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    buyerId: 'user_customer_1',
    buyerName: 'Sarah Namubiru',
    buyerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    lastMessage: 'Is the Pixel 8 Pro still available? Can we meet at Ntinda Shopping Mall today?',
    lastMessageTimestamp: '2026-10-15T16:45:00Z',
    unreadCountBuyer: 0,
    unreadCountSeller: 1,
    isBlocked: false
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'user_customer_1',
    senderName: 'Sarah Namubiru',
    text: 'Hello Mr. Muwonge, does the phone come with the original UK 3-pin fast adapter?',
    timestamp: '2026-10-15T15:30:00Z',
    isRead: true
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'user_seller_1',
    senderName: 'Muwonge Tech Hub',
    text: 'Yes Sarah, genuine 25W adapter and braided Type-C cable included with 6 months shop warranty.',
    timestamp: '2026-10-15T15:42:00Z',
    isRead: true
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    senderId: 'user_customer_1',
    senderName: 'Sarah Namubiru',
    text: 'Is the Pixel 8 Pro still available? Can we meet at Ntinda Shopping Mall today?',
    timestamp: '2026-10-15T16:45:00Z',
    isRead: false,
    offerAmount: 2300000,
    offerStatus: 'pending'
  }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'user_customer_1',
    title: 'New Response on Samsung Galaxy S24',
    message: 'Muwonge Tech Hub confirmed your warranty inquiry.',
    type: 'message',
    isRead: false,
    timestamp: '2026-10-15T15:42:00Z',
    linkTab: 'messages',
    targetId: 'conv_1'
  },
  {
    id: 'notif_2',
    userId: 'user_seller_1',
    title: 'New Price Offer: UGX 2,300,000',
    message: 'Sarah Namubiru sent an offer for Samsung Galaxy S24.',
    type: 'offer',
    isRead: false,
    timestamp: '2026-10-15T16:45:00Z',
    linkTab: 'messages',
    targetId: 'conv_1'
  },
  {
    id: 'notif_3',
    userId: 'user_customer_1',
    title: 'ANATECH Safe Trading Alert',
    message: 'Always inspect goods in person in public spaces before completing payment.',
    type: 'system',
    isRead: true,
    timestamp: '2026-10-14T09:00:00Z'
  }
];

const INITIAL_SAVED_SEARCHES: SavedSearchCriteria[] = [
  {
    id: 'search_alert_1',
    userId: 'user_customer_1',
    name: 'Flagship Smartphones in Kampala (≤ UGX 3M)',
    query: 'Pixel',
    categoryId: 'electronics-phones',
    categoryName: 'Phones, Tablets & Gadgets',
    district: 'Kampala',
    condition: 'all',
    maxPrice: 3000000,
    notifyPush: true,
    createdAt: '2026-10-14T10:00:00Z',
    lastMatchedCount: 2
  },
  {
    id: 'search_alert_2',
    userId: 'user_customer_1',
    name: 'Boda Bodas & Motorbikes in Wakiso',
    categoryId: 'vehicles-motorbikes',
    categoryName: 'Vehicles, Boda Bodas & Spare Parts',
    district: 'Wakiso',
    condition: 'all',
    notifyPush: true,
    createdAt: '2026-10-15T08:30:00Z',
    lastMatchedCount: 1
  }
];

class MarketplaceStore {
  private users: User[];
  private currentUserId: string;
  private listings: ProductListing[];
  private conversations: Conversation[];
  private messages: ChatMessage[];
  private reports: Report[];
  private notifications: NotificationItem[];
  private transactions: PaymentTransaction[];
  private auditLogs: AuditLog[];
  private savedSearches: SavedSearchCriteria[];
  private reviews: SellerReview[];
  private lowDataMode: boolean;
  private currency: string;
  private language: string;
  private theme: 'light' | 'dark' | 'system';

  constructor() {
    this.users = safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS).map(u => ({
      ...u,
      verified: u.verified !== undefined ? u.verified : Boolean(u.isVerifiedSeller),
      isVerifiedSeller: u.isVerifiedSeller !== undefined ? u.isVerifiedSeller : Boolean(u.verified),
      recentlyViewedListingIds: u.recentlyViewedListingIds || u.recentlyViewedIds || (u.id === 'user_customer_1' ? ['item_1', 'item_2'] : ['item_1']),
      recentlyViewedIds: u.recentlyViewedListingIds || u.recentlyViewedIds || (u.id === 'user_customer_1' ? ['item_1', 'item_2'] : ['item_1'])
    }));
    this.currentUserId = safeGet(STORAGE_KEYS.CURRENT_USER_ID, 'user_customer_1');
    this.listings = safeGet<ProductListing[]>(STORAGE_KEYS.LISTINGS, INITIAL_LISTINGS).map(l => ({
      ...l,
      verified: l.verified !== undefined ? l.verified : Boolean(l.sellerVerified),
      sellerVerified: l.sellerVerified !== undefined ? l.sellerVerified : Boolean(l.verified)
    }));
    this.conversations = safeGet(STORAGE_KEYS.CONVERSATIONS, INITIAL_CONVERSATIONS);
    this.messages = safeGet(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    this.reports = safeGet(STORAGE_KEYS.REPORTS, []);
    this.notifications = safeGet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.transactions = safeGet(STORAGE_KEYS.TRANSACTIONS, []);
    this.savedSearches = safeGet(STORAGE_KEYS.SAVED_SEARCHES, INITIAL_SAVED_SEARCHES);
    this.reviews = safeGet<SellerReview[]>(STORAGE_KEYS.SELLER_REVIEWS, INITIAL_REVIEWS);
    this.auditLogs = safeGet(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'log_1',
        actorId: 'user_admin',
        actorName: 'ANATECH UG Admin',
        action: 'PLATFORM_INITIALIZED',
        targetType: 'listing',
        targetId: 'system',
        details: 'ANATECH MARKET Uganda node online and verified.',
        timestamp: '2026-10-10T08:00:00Z'
      }
    ]);
    this.lowDataMode = safeGet(STORAGE_KEYS.LOW_DATA_MODE, false);
    this.currency = safeGet(STORAGE_KEYS.CURRENCY, 'UGX');
    this.language = safeGet(STORAGE_KEYS.LANGUAGE, 'en');
    this.theme = safeGet(STORAGE_KEYS.THEME, 'light');
    if (typeof window !== 'undefined') {
      this.applyTheme(this.theme);
    }
  }

  // Theme Management
  public getTheme(): 'light' | 'dark' | 'system' {
    return this.theme;
  }

  public setTheme(theme: 'light' | 'dark' | 'system') {
    this.theme = theme;
    safeSet(STORAGE_KEYS.THEME, theme);
    this.applyTheme(theme);
  }

  public applyTheme(theme?: 'light' | 'dark' | 'system') {
    if (typeof window === 'undefined') return;
    const t = theme || this.theme;
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Currency & Formatting
  public getCurrency(): string {
    return this.currency;
  }

  public setCurrency(c: string) {
    this.currency = c;
    safeSet(STORAGE_KEYS.CURRENCY, c);
  }

  public formatPrice(amount: number): string {
    if (this.currency === 'UGX') {
      return `UGX ${amount.toLocaleString()}`;
    }
    if (this.currency === 'KES') {
      const kes = Math.round(amount / 28);
      return `KES ${kes.toLocaleString()}`;
    }
    if (this.currency === 'USD') {
      const usd = (amount / 3750).toFixed(2);
      return `$${usd}`;
    }
    return `UGX ${amount.toLocaleString()}`;
  }

  public getLowDataMode(): boolean {
    return this.lowDataMode;
  }

  public setLowDataMode(val: boolean) {
    this.lowDataMode = val;
    safeSet(STORAGE_KEYS.LOW_DATA_MODE, val);
  }

  public getLanguage(): string {
    return this.language;
  }

  public setLanguage(lang: string) {
    this.language = lang;
    safeSet(STORAGE_KEYS.LANGUAGE, lang);
  }

  // User & Authentication
  public getCurrentUser(): User {
    const user = this.users.find(u => u.id === this.currentUserId);
    if (user) return user;
    return this.users[0] || INITIAL_USERS[0];
  }

  public setCurrentUserId(id: string) {
    this.currentUserId = id;
    safeSet(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  public switchRole(role: User['role']) {
    const found = this.users.find(u => u.role === role);
    if (found) {
      this.setCurrentUserId(found.id);
    }
  }

  public getAllUsers(): User[] {
    return [...this.users];
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public registerUser(data: { name: string; email: string; phone: string; district: string; role?: User['role'] }): User {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      isPhoneVerified: false,
      role: data.role || 'customer',
      district: data.district || 'Kampala',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80`,
      preferredContact: 'in_app',
      showPhonePublicly: false,
      showWhatsAppPublicly: false,
      joinedDate: new Date().toISOString().split('T')[0],
      isVerifiedSeller: false,
      verified: false,
      rating: 5.0,
      reviewCount: 0,
      activePlan: 'standard',
      isSuspended: false,
      savedListingIds: []
    };
    this.users.unshift(newUser);
    safeSet(STORAGE_KEYS.USERS, this.users);
    this.setCurrentUserId(newUser.id);
    this.addAuditLog('USER_REGISTERED', `User registered: ${newUser.name} (${newUser.email})`, 'user', newUser.id);
    return newUser;
  }

  public verifyUserPhone(userId: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    user.isPhoneVerified = true;
    safeSet(STORAGE_KEYS.USERS, this.users);
    return true;
  }

  public toggleSellerVerification(userId: string): User {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');
    const currentStatus = Boolean(this.users[index].isVerifiedSeller || this.users[index].verified);
    const newStatus = !currentStatus;
    
    this.users[index].isVerifiedSeller = newStatus;
    this.users[index].verified = newStatus;
    
    // Sync all listings created by this seller
    this.listings.forEach(listing => {
      if (listing.sellerId === userId) {
        listing.sellerVerified = newStatus;
        listing.verified = newStatus;
      }
    });
    
    safeSet(STORAGE_KEYS.USERS, this.users);
    safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    this.addAuditLog(
      newStatus ? 'SELLER_VERIFIED' : 'SELLER_UNVERIFIED', 
      `Seller ${this.users[index].name} verification changed to ${newStatus ? 'VERIFIED' : 'UNVERIFIED'}`, 
      'user', 
      userId
    );
    return this.users[index];
  }

  public updateUser(userId: string, updates: Partial<User>): User {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const consolidatedUpdates = { ...updates };
    if (consolidatedUpdates.verified !== undefined && consolidatedUpdates.isVerifiedSeller === undefined) {
      consolidatedUpdates.isVerifiedSeller = consolidatedUpdates.verified;
    } else if (consolidatedUpdates.isVerifiedSeller !== undefined && consolidatedUpdates.verified === undefined) {
      consolidatedUpdates.verified = consolidatedUpdates.isVerifiedSeller;
    }

    this.users[index] = { ...this.users[index], ...consolidatedUpdates };

    // If verification status changed, sync all listings by this seller
    if (consolidatedUpdates.verified !== undefined || consolidatedUpdates.isVerifiedSeller !== undefined) {
      const v = Boolean(this.users[index].verified ?? this.users[index].isVerifiedSeller);
      this.listings.forEach(listing => {
        if (listing.sellerId === userId) {
          listing.sellerVerified = v;
          listing.verified = v;
        }
      });
      safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    }

    safeSet(STORAGE_KEYS.USERS, this.users);
    return this.users[index];
  }

  public registerSellerProfile(userId: string, sellerData: Partial<User>): User {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const updatedUser: User = {
      ...this.users[index],
      ...sellerData,
      role: 'seller',
      isRegisteredSeller: true,
      isVerifiedSeller: true,
      verified: true,
      sellerRegistrationStatus: 'verified',
      sellerRegistrationDate: this.users[index].sellerRegistrationDate || new Date().toISOString().split('T')[0]
    };

    this.users[index] = updatedUser;

    // Sync all listings created by this seller
    this.listings.forEach(listing => {
      if (listing.sellerId === userId) {
        listing.sellerVerified = true;
        listing.verified = true;
        if (sellerData.businessName) {
          listing.sellerName = sellerData.businessName;
        }
      }
    });

    safeSet(STORAGE_KEYS.USERS, this.users);
    safeSet(STORAGE_KEYS.LISTINGS, this.listings);

    this.addAuditLog(
      'SELLER_PROFILE_REGISTERED',
      `Seller profile registered: ${updatedUser.businessName || updatedUser.name} (${updatedUser.district}) - NIN: ${updatedUser.ninNumber || 'N/A'}`,
      'user',
      userId
    );

    return updatedUser;
  }

  public deleteUserAccount(userId: string): boolean {
    this.users = this.users.filter(u => u.id !== userId);
    safeSet(STORAGE_KEYS.USERS, this.users);
    this.listings = this.listings.filter(l => l.sellerId !== userId);
    safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    if (this.currentUserId === userId) {
      this.currentUserId = this.users[0]?.id || '';
      safeSet(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
    }
    this.addAuditLog('ACCOUNT_DELETED', `Account ${userId} deleted by user`, 'user', userId);
    return true;
  }

  // Location & Geolocation Detection
  public setUserDefaultDistrict(userId: string, district: string): User {
    const user = this.updateUser(userId, { district });
    this.addAuditLog('LOCATION_UPDATED', `Default district updated to ${district}`, 'user', userId);
    return user;
  }

  public getAutoDetectLocation(): boolean {
    return safeGet(STORAGE_KEYS.AUTO_DETECT_LOCATION, true);
  }

  public setAutoDetectLocation(enabled: boolean): void {
    safeSet(STORAGE_KEYS.AUTO_DETECT_LOCATION, enabled);
  }

  public hasUserCheckedLocation(userId: string): boolean {
    const checkedList = safeGet<string[]>(STORAGE_KEYS.LOCATION_CHECKED_USERS, []);
    return checkedList.includes(userId);
  }

  public markUserLocationChecked(userId: string): void {
    const checkedList = safeGet<string[]>(STORAGE_KEYS.LOCATION_CHECKED_USERS, []);
    if (!checkedList.includes(userId)) {
      checkedList.push(userId);
      safeSet(STORAGE_KEYS.LOCATION_CHECKED_USERS, checkedList);
    }
  }

  public resetUserLocationChecked(userId: string): void {
    const checkedList = safeGet<string[]>(STORAGE_KEYS.LOCATION_CHECKED_USERS, []);
    const filtered = checkedList.filter(id => id !== userId);
    safeSet(STORAGE_KEYS.LOCATION_CHECKED_USERS, filtered);
  }

  public getLastDetectedLocation(): any {
    return safeGet(STORAGE_KEYS.LAST_DETECTED_LOCATION, null);
  }

  public setLastDetectedLocation(data: any): void {
    safeSet(STORAGE_KEYS.LAST_DETECTED_LOCATION, data);
  }

  // Listings
  public getListings(params: {
    query?: string;
    categoryId?: string;
    district?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
    status?: ListingStatus | 'all';
    onlyFeatured?: boolean;
    sellerId?: string;
  } = {}): ProductListing[] {
    let result = [...this.listings];

    if (params.status && params.status !== 'all') {
      result = result.filter(item => item.status === params.status);
    } else if (!params.status) {
      // Default to active listings only for buyers
      result = result.filter(item => item.status === 'active');
    }

    if (params.sellerId) {
      result = result.filter(item => item.sellerId === params.sellerId);
    }

    if (params.onlyFeatured) {
      result = result.filter(item => item.isFeatured);
    }

    if (params.categoryId && params.categoryId !== 'all') {
      result = result.filter(item => item.categoryId === params.categoryId);
    }

    if (params.district && params.district !== 'all') {
      result = result.filter(item => item.district.toLowerCase() === params.district!.toLowerCase());
    }

    if (params.condition && params.condition !== 'all') {
      result = result.filter(item => item.condition === params.condition);
    }

    if (typeof params.minPrice === 'number' && params.minPrice > 0) {
      result = result.filter(item => item.price >= params.minPrice!);
    }

    if (typeof params.maxPrice === 'number' && params.maxPrice > 0) {
      result = result.filter(item => item.price <= params.maxPrice!);
    }

    if (params.query && params.query.trim()) {
      const q = params.query.trim().toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.subcategory.toLowerCase().includes(q) ||
        item.locationArea.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q)
      );
    }

    // Sorting
    switch (params.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        result.sort((a, b) => (b.viewsCount + b.favoritesCount * 3) - (a.viewsCount + a.favoritesCount * 3));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }

  public getListingById(id: string): ProductListing | undefined {
    return this.listings.find(l => l.id === id);
  }

  public incrementListingViews(id: string): void {
    const item = this.listings.find(l => l.id === id);
    if (item) {
      item.viewsCount += 1;
      safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    }
    this.trackRecentlyViewed(id);
  }

  // Recently Viewed Tracking (Tracks the last 5 products clicked)
  public trackRecentlyViewed(listingId: string, userId?: string): void {
    if (!listingId) return;
    const targetUserId = userId || this.currentUserId;
    
    // Retrieve current list, filter out existing ID, prepend to front, keep max 5
    const existing = this.getRecentlyViewedIds(targetUserId);
    const updated = [listingId, ...existing.filter(id => id !== listingId)].slice(0, 5);
    
    // Persist per-user and global storage
    safeSet(`${STORAGE_KEYS.RECENTLY_VIEWED}_${targetUserId}`, updated);
    safeSet(STORAGE_KEYS.RECENTLY_VIEWED, updated);
    
    // Update user in users list
    const userIndex = this.users.findIndex(u => u.id === targetUserId);
    if (userIndex !== -1) {
      this.users[userIndex].recentlyViewedListingIds = updated;
      this.users[userIndex].recentlyViewedIds = updated;
      safeSet(STORAGE_KEYS.USERS, this.users);
    }
  }

  public recordRecentlyViewed(listingId: string, userId?: string): void {
    this.trackRecentlyViewed(listingId, userId);
  }

  public getRecentlyViewedIds(userId?: string): string[] {
    const targetUserId = userId || this.currentUserId;
    const user = this.users.find(u => u.id === targetUserId);
    if (user?.recentlyViewedListingIds && user.recentlyViewedListingIds.length > 0) {
      return user.recentlyViewedListingIds.slice(0, 5);
    }
    const userSpecific = safeGet<string[]>(`${STORAGE_KEYS.RECENTLY_VIEWED}_${targetUserId}`, []);
    if (userSpecific && userSpecific.length > 0) {
      return userSpecific.slice(0, 5);
    }
    const globalRecent = safeGet<string[]>(STORAGE_KEYS.RECENTLY_VIEWED, []);
    if (globalRecent && globalRecent.length > 0) {
      return globalRecent.slice(0, 5);
    }
    return ['item_1', 'item_2'];
  }

  public getRecentlyViewedListings(userId?: string): ProductListing[] {
    const ids = this.getRecentlyViewedIds(userId);
    if (!ids || ids.length === 0) return [];
    
    const listingsMap = new Map(this.listings.map(l => [l.id, l]));
    const result: ProductListing[] = [];
    for (const id of ids) {
      const item = listingsMap.get(id);
      if (item && item.status !== 'rejected') {
        result.push(item);
      }
    }
    return result.slice(0, 5);
  }

  public getRecentlyViewed(userId?: string): ProductListing[] {
    return this.getRecentlyViewedListings(userId);
  }

  public clearRecentlyViewed(userId?: string): void {
    const targetUserId = userId || this.currentUserId;
    safeSet(`${STORAGE_KEYS.RECENTLY_VIEWED}_${targetUserId}`, []);
    safeSet(STORAGE_KEYS.RECENTLY_VIEWED, []);
    const userIndex = this.users.findIndex(u => u.id === targetUserId);
    if (userIndex !== -1) {
      this.users[userIndex].recentlyViewedListingIds = [];
      this.users[userIndex].recentlyViewedIds = [];
      safeSet(STORAGE_KEYS.USERS, this.users);
    }
  }

  // Search History Management
  public getSearchHistory(): string[] {
    const history = safeGet<string[] | null>(STORAGE_KEYS.SEARCH_HISTORY, null);
    if (history === null) {
      // Initial helpful local Ugandan marketplace search tags
      const initialSeed = ['Samsung Galaxy', 'Toyota Premio', 'Fresh Matooke', 'Boda Boda'];
      safeSet(STORAGE_KEYS.SEARCH_HISTORY, initialSeed);
      return initialSeed;
    }
    return Array.isArray(history) ? history.slice(0, 10) : [];
  }

  public addSearchQuery(query: string): string[] {
    const trimmed = (query || '').trim();
    if (!trimmed || trimmed.length < 2) return this.getSearchHistory();

    const existing = this.getSearchHistory();
    // Case-insensitive deduplication, putting latest query at the beginning
    const filtered = existing.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 10);
    safeSet(STORAGE_KEYS.SEARCH_HISTORY, updated);
    return updated;
  }

  public removeSearchQuery(query: string): string[] {
    const existing = this.getSearchHistory();
    const updated = existing.filter(q => q.toLowerCase() !== (query || '').trim().toLowerCase());
    safeSet(STORAGE_KEYS.SEARCH_HISTORY, updated);
    return updated;
  }

  public clearSearchHistory(): void {
    safeSet(STORAGE_KEYS.SEARCH_HISTORY, []);
  }

  public createListing(data: Omit<ProductListing, 'id' | 'viewsCount' | 'favoritesCount' | 'createdAt' | 'updatedAt'>): ProductListing {
    const currentUser = this.getCurrentUser();
    
    // Check moderation rules (e.g. sensitive categories go to 'pending')
    const initialStatus: ListingStatus = data.categoryId === 'property-rentals' || data.categoryId === 'vehicles-motorbikes' 
      ? 'pending' 
      : (data.status || 'active');

    const isSellerVerified = Boolean(currentUser.isVerifiedSeller || currentUser.verified);

    const newListing: ProductListing = {
      ...data,
      id: `item_${Date.now()}`,
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerAvatar: currentUser.avatar,
      sellerRating: currentUser.rating,
      sellerVerified: isSellerVerified,
      verified: isSellerVerified,
      sellerPlan: currentUser.activePlan,
      status: initialStatus,
      viewsCount: 1,
      favoritesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.listings.unshift(newListing);
    safeSet(STORAGE_KEYS.LISTINGS, this.listings);

    this.addAuditLog('LISTING_CREATED', `Listing created: ${newListing.title} (${newListing.id})`, 'listing', newListing.id);

    // Notify user if pending review
    if (initialStatus === 'pending') {
      this.sendNotification(currentUser.id, {
        title: 'Listing Pending Review',
        message: `Your listing "${newListing.title}" is in the trust & safety queue. An ANATECH moderator will review it shortly.`,
        type: 'listing_status',
        linkTab: 'profile',
        targetId: newListing.id
      });
    } else if (initialStatus === 'active') {
      // Trigger search criteria alerts and push notifications to subscribers
      this.checkSavedSearchAlerts(newListing);
    }

    return newListing;
  }

  public updateListing(id: string, updates: Partial<ProductListing>): ProductListing {
    const index = this.listings.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Listing not found');

    this.listings[index] = {
      ...this.listings[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    this.addAuditLog('LISTING_UPDATED', `Listing updated: ${this.listings[index].title}`, 'listing', id);
    return this.listings[index];
  }

  public deleteListing(id: string): boolean {
    const item = this.listings.find(l => l.id === id);
    if (!item) return false;
    this.listings = this.listings.filter(l => l.id !== id);
    safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    this.addAuditLog('LISTING_DELETED', `Listing removed: ${item.title}`, 'listing', id);
    return true;
  }

  public toggleFavorite(userId: string, listingId: string): boolean {
    const user = this.users.find(u => u.id === userId);
    const listing = this.listings.find(l => l.id === listingId);
    if (!user || !listing) return false;

    const exists = user.savedListingIds.includes(listingId);
    if (exists) {
      user.savedListingIds = user.savedListingIds.filter(id => id !== listingId);
      listing.favoritesCount = Math.max(0, listing.favoritesCount - 1);
    } else {
      user.savedListingIds.push(listingId);
      listing.favoritesCount += 1;
    }

    safeSet(STORAGE_KEYS.USERS, this.users);
    safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    return !exists;
  }

  // Messaging & Negotiations
  public getAllConversations(): Conversation[] {
    return [...this.conversations];
  }

  public getConversations(userId: string): Conversation[] {
    return this.conversations.filter(c => c.buyerId === userId || c.sellerId === userId);
  }

  public getConversationById(id: string): Conversation | undefined {
    return this.conversations.find(c => c.id === id);
  }

  public getMessages(conversationId: string): ChatMessage[] {
    return this.messages.filter(m => m.conversationId === conversationId);
  }

  public createConversation(productId: string, buyerId: string, initialText?: string): Conversation {
    const product = this.getListingById(productId);
    const buyer = this.getUserById(buyerId);
    if (!product || !buyer) throw new Error('Product or buyer not found');

    const existing = this.conversations.find(c => c.productId === productId && c.buyerId === buyerId);
    if (existing) {
      if (initialText) {
        this.sendMessage(existing.id, initialText);
      }
      return existing;
    }

    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      productId: product.id,
      productTitle: product.title,
      productPrice: product.price,
      productImage: product.images[0] || '',
      productDistrict: product.district,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      sellerAvatar: product.sellerAvatar,
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerAvatar: buyer.avatar,
      lastMessage: initialText || 'Inquiry initiated',
      lastMessageTimestamp: new Date().toISOString(),
      unreadCountBuyer: 0,
      unreadCountSeller: 1,
      isBlocked: false,
      isOfflineCached: true
    };

    this.conversations.unshift(newConv);
    safeSet(STORAGE_KEYS.CONVERSATIONS, this.conversations);

    if (initialText) {
      this.sendMessage(newConv.id, initialText);
    }

    return newConv;
  }

  public sendMessage(conversationId: string, text: string, offerAmount?: number): ChatMessage {
    const conv = this.conversations.find(c => c.id === conversationId);
    const sender = this.getCurrentUser();
    if (!conv || !sender) throw new Error('Conversation or sender not found');

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: sender.id,
      senderName: sender.name,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      offerAmount,
      offerStatus: offerAmount ? 'pending' : undefined,
      isPendingSync: isOffline,
      isOfflineSaved: true
    };

    this.messages.push(newMsg);
    safeSet(STORAGE_KEYS.MESSAGES, this.messages);

    conv.lastMessage = offerAmount ? `Sent an offer: UGX ${offerAmount.toLocaleString()}` : text.trim();
    conv.lastMessageTimestamp = new Date().toISOString();
    conv.isOfflineCached = true;

    // If offline, queue for sync once connectivity is restored
    if (isOffline) {
      try {
        const queueKey = 'anatech_market_offline_sync_queue';
        const raw = localStorage.getItem(queueKey);
        const queue = raw ? JSON.parse(raw) : [];
        queue.push({
          type: 'SEND_MESSAGE',
          payload: { messageId: newMsg.id, conversationId },
          timestamp: new Date().toISOString()
        });
        localStorage.setItem(queueKey, JSON.stringify(queue));
      } catch (err) {
        console.warn('Could not queue offline message:', err);
      }
    }

    if (sender.id === conv.buyerId) {
      conv.unreadCountSeller += 1;
      this.sendNotification(conv.sellerId, {
        title: offerAmount ? `Offer received: UGX ${offerAmount.toLocaleString()}` : `New message from ${sender.name}`,
        message: text.slice(0, 80),
        type: offerAmount ? 'offer' : 'message',
        linkTab: 'messages',
        targetId: conv.id
      });
    } else {
      conv.unreadCountBuyer += 1;
      this.sendNotification(conv.buyerId, {
        title: `Reply from ${conv.sellerName}`,
        message: text.slice(0, 80),
        type: 'message',
        linkTab: 'messages',
        targetId: conv.id
      });
    }

    safeSet(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    return newMsg;
  }

  public markMessageSynced(messageId: string): void {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg) {
      msg.isPendingSync = false;
      safeSet(STORAGE_KEYS.MESSAGES, this.messages);
    }
  }

  public syncLocalStorage(): { listingsCount: number; conversationsCount: number; timestamp: string } {
    this.listings.forEach(l => {
      l.isOfflineCached = true;
      l.lastSyncedAt = new Date().toISOString();
    });
    this.conversations.forEach(c => {
      c.isOfflineCached = true;
    });

    safeSet(STORAGE_KEYS.LISTINGS, this.listings);
    safeSet(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    safeSet(STORAGE_KEYS.MESSAGES, this.messages);
    safeSet(STORAGE_KEYS.USERS, this.users);

    const ts = new Date().toISOString();
    try {
      localStorage.setItem('anatech_market_last_synced_at', ts);
    } catch {}

    return {
      listingsCount: this.listings.length,
      conversationsCount: this.conversations.length,
      timestamp: ts
    };
  }

  public respondToOffer(messageId: string, conversationId: string, decision: 'accepted' | 'declined' | 'countered'): void {
    const msg = this.messages.find(m => m.id === messageId);
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!msg || !conv) return;

    msg.offerStatus = decision;
    safeSet(STORAGE_KEYS.MESSAGES, this.messages);

    const currentUser = this.getCurrentUser();
    const systemText = decision === 'accepted' 
      ? `Offer of UGX ${msg.offerAmount?.toLocaleString()} was ACCEPTED. Arrange inspection and payment.`
      : `Offer of UGX ${msg.offerAmount?.toLocaleString()} was DECLINED.`;

    const sysMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      conversationId,
      senderId: 'system',
      senderName: 'ANATECH System',
      text: systemText,
      timestamp: new Date().toISOString(),
      isRead: true,
      isSystemMessage: true
    };

    this.messages.push(sysMsg);
    safeSet(STORAGE_KEYS.MESSAGES, this.messages);

    const targetUserId = currentUser.id === conv.sellerId ? conv.buyerId : conv.sellerId;
    this.sendNotification(targetUserId, {
      title: decision === 'accepted' ? 'Your offer was accepted!' : 'Offer update',
      message: systemText,
      type: 'offer',
      linkTab: 'messages',
      targetId: conv.id
    });
  }

  public blockConversation(conversationId: string, blockerUserId: string): void {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.isBlocked = true;
      conv.blockedBy = blockerUserId;
      safeSet(STORAGE_KEYS.CONVERSATIONS, this.conversations);
      this.addAuditLog('USER_BLOCKED', `Conversation ${conversationId} blocked by ${blockerUserId}`, 'user', conversationId);
    }
  }

  // Reports & Moderation
  public getReports(): Report[] {
    return [...this.reports];
  }

  public submitReport(data: {
    targetType: 'listing' | 'user';
    targetId: string;
    targetTitle: string;
    reason: Report['reason'];
    details: string;
  }): Report {
    const reporter = this.getCurrentUser();
    const newReport: Report = {
      id: `rep_${Date.now()}`,
      ...data,
      reporterId: reporter.id,
      reporterName: reporter.name,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.reports.unshift(newReport);
    safeSet(STORAGE_KEYS.REPORTS, this.reports);
    this.addAuditLog('REPORT_FILED', `Report against ${data.targetType}: ${data.targetTitle} (${data.reason})`, data.targetType, data.targetId);
    return newReport;
  }

  public resolveReport(reportId: string, action: Report['resolutionAction'], adminNotes: string): void {
    const rep = this.reports.find(r => r.id === reportId);
    const admin = this.getCurrentUser();
    if (!rep) return;

    rep.status = 'resolved';
    rep.resolutionAction = action;
    rep.resolvedAt = new Date().toISOString();
    rep.resolvedBy = admin.name;

    if (action === 'listing_removed' && rep.targetType === 'listing') {
      const listing = this.listings.find(l => l.id === rep.targetId);
      if (listing) {
        listing.status = 'rejected';
        listing.rejectionReason = `Removed by Trust & Safety: ${adminNotes}`;
        safeSet(STORAGE_KEYS.LISTINGS, this.listings);
      }
    } else if (action === 'seller_suspended') {
      const user = this.users.find(u => u.id === rep.targetId || (rep.targetType === 'listing' && u.id === this.getListingById(rep.targetId)?.sellerId));
      if (user) {
        user.isSuspended = true;
        user.suspensionReason = adminNotes;
        safeSet(STORAGE_KEYS.USERS, this.users);
      }
    }

    safeSet(STORAGE_KEYS.REPORTS, this.reports);
    this.addAuditLog('REPORT_RESOLVED', `Report ${reportId} resolved with action ${action}: ${adminNotes}`, 'listing', rep.targetId);
  }

  // Notifications
  public getNotifications(userId: string): NotificationItem[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  public sendNotification(userId: string, data: Omit<NotificationItem, 'id' | 'userId' | 'isRead' | 'timestamp'>): void {
    const notif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      ...data,
      isRead: false,
      timestamp: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      safeSet(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    }
  }

  // Saved Searches & Push Notification Criteria Alerts
  public getSavedSearches(userId?: string): SavedSearchCriteria[] {
    const targetUserId = userId || this.currentUserId;
    return this.savedSearches.filter(s => s.userId === targetUserId);
  }

  public saveSearchCriteria(data: Omit<SavedSearchCriteria, 'id' | 'createdAt'>): SavedSearchCriteria {
    const newSearch: SavedSearchCriteria = {
      ...data,
      id: `search_alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
      lastMatchedCount: 0
    };
    this.savedSearches.unshift(newSearch);
    safeSet(STORAGE_KEYS.SAVED_SEARCHES, this.savedSearches);
    this.addAuditLog('SAVED_SEARCH_CREATED', `Saved search criteria alert: "${newSearch.name}"`, 'user', newSearch.userId);
    return newSearch;
  }

  public updateSavedSearch(id: string, updates: Partial<SavedSearchCriteria>): SavedSearchCriteria {
    const index = this.savedSearches.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Saved search alert not found');
    this.savedSearches[index] = { ...this.savedSearches[index], ...updates };
    safeSet(STORAGE_KEYS.SAVED_SEARCHES, this.savedSearches);
    return this.savedSearches[index];
  }

  public deleteSavedSearch(id: string): boolean {
    const initialLen = this.savedSearches.length;
    this.savedSearches = this.savedSearches.filter(s => s.id !== id);
    safeSet(STORAGE_KEYS.SAVED_SEARCHES, this.savedSearches);
    return this.savedSearches.length < initialLen;
  }

  public doesListingMatchSearch(listing: ProductListing, search: SavedSearchCriteria): boolean {
    if (listing.status !== 'active') return false;

    // 1. Category match
    if (search.categoryId && search.categoryId !== 'all' && listing.categoryId !== search.categoryId) {
      return false;
    }

    // 2. District match
    if (search.district && search.district !== 'all' && listing.district.toLowerCase() !== search.district.toLowerCase()) {
      return false;
    }

    // 3. Condition match
    if (search.condition && search.condition !== 'all') {
      if (search.condition === 'new' && listing.condition !== 'new') return false;
      if (search.condition === 'used' && listing.condition === 'new') return false;
    }

    // 4. Price range match
    if (typeof search.minPrice === 'number' && search.minPrice > 0 && listing.price < search.minPrice) {
      return false;
    }
    if (typeof search.maxPrice === 'number' && search.maxPrice > 0 && listing.price > search.maxPrice) {
      return false;
    }

    // 5. Query keywords match
    if (search.query && search.query.trim()) {
      const q = search.query.trim().toLowerCase();
      const titleMatch = listing.title.toLowerCase().includes(q);
      const descMatch = listing.description.toLowerCase().includes(q);
      const subMatch = listing.subcategory.toLowerCase().includes(q);
      const locMatch = listing.locationArea.toLowerCase().includes(q) || listing.district.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !subMatch && !locMatch) return false;
    }

    return true;
  }

  public checkSavedSearchAlerts(newListing: ProductListing): number {
    if (newListing.status !== 'active') return 0;
    let matchCount = 0;

    for (const search of this.savedSearches) {
      // Don't notify the author about their own listing
      if (search.userId === newListing.sellerId) continue;

      if (this.doesListingMatchSearch(newListing, search)) {
        matchCount++;
        search.lastMatchedCount = (search.lastMatchedCount || 0) + 1;
        search.lastNotifiedAt = new Date().toISOString();

        // Send in-app notification
        this.sendNotification(search.userId, {
          title: `Alert Match: ${newListing.title}`,
          message: `A new product matching "${search.name}" was just posted in ${newListing.district} for ${this.formatPrice(newListing.price)}!`,
          type: 'search_alert',
          linkTab: 'home',
          targetId: newListing.id
        });

        // Trigger native push notification if enabled
        if (search.notifyPush) {
          showSearchAlertPushNotification({
            title: `ANATECH Alert: ${newListing.title}`,
            body: `Matches "${search.name}" · ${this.formatPrice(newListing.price)} in ${newListing.district}`,
            listingId: newListing.id,
            searchName: search.name
          });
        }
      }
    }

    if (matchCount > 0) {
      safeSet(STORAGE_KEYS.SAVED_SEARCHES, this.savedSearches);
    }

    return matchCount;
  }

  // Monetization & Payments (Mobile Money MTN MoMo & Airtel)
  public getTransactions(userId?: string): PaymentTransaction[] {
    if (userId) {
      return this.transactions.filter(t => t.userId === userId);
    }
    return [...this.transactions];
  }

  public initiatePayment(data: {
    amount: number;
    provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';
    phoneNumber: string;
    purpose: PaymentTransaction['purpose'];
    listingId?: string;
    listingTitle?: string;
  }): PaymentTransaction {
    const user = this.getCurrentUser();
    const reference = `ANATECH-${Date.now().toString().slice(-6)}`;
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      reference,
      amount: data.amount,
      currency: this.currency,
      provider: data.provider,
      phoneNumber: data.phoneNumber,
      purpose: data.purpose,
      listingId: data.listingId,
      listingTitle: data.listingTitle,
      status: 'pending',
      idempotencyKey,
      createdAt: new Date().toISOString()
    };

    this.transactions.unshift(newTx);
    safeSet(STORAGE_KEYS.TRANSACTIONS, this.transactions);
    return newTx;
  }

  public completePayment(txId: string, status: 'successful' | 'failed'): PaymentTransaction {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) throw new Error('Transaction not found');

    tx.status = status;
    tx.completedAt = new Date().toISOString();

    if (status === 'successful') {
      const user = this.users.find(u => u.id === tx.userId);
      if (tx.purpose === 'featured_listing' && tx.listingId) {
        const item = this.listings.find(l => l.id === tx.listingId);
        if (item) {
          item.isFeatured = true;
          item.featuredUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
          safeSet(STORAGE_KEYS.LISTINGS, this.listings);
        }
      } else if (tx.purpose === 'subscription_pro' && user) {
        user.activePlan = 'pro';
        user.isVerifiedSeller = true;
        user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        safeSet(STORAGE_KEYS.USERS, this.users);
      } else if (tx.purpose === 'subscription_business' && user) {
        user.activePlan = 'business';
        user.isVerifiedSeller = true;
        user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        safeSet(STORAGE_KEYS.USERS, this.users);
      }

      this.sendNotification(tx.userId, {
        title: 'Payment Successful',
        message: `Your payment of ${this.formatPrice(tx.amount)} via ${tx.provider.replace('_', ' ')} (Ref: ${tx.reference}) was confirmed.`,
        type: 'promotion',
        linkTab: 'profile'
      });

      this.addAuditLog('PAYMENT_CONFIRMED', `Payment of ${tx.amount} UGX confirmed for ${tx.purpose}`, 'payment', tx.id);
    }

    safeSet(STORAGE_KEYS.TRANSACTIONS, this.transactions);
    return tx;
  }

  // Seller Ratings & Reviews System
  public getSellerReviews(sellerId: string): SellerReview[] {
    return this.reviews
      .filter(r => r.sellerId === sellerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSellerAggregateRating(sellerId: string): AggregateSellerRating {
    const reviews = this.getSellerReviews(sellerId);
    const seller = this.getUserById(sellerId);

    if (reviews.length === 0) {
      const fallbackRating = seller?.rating ?? 5.0;
      const fallbackCount = seller?.reviewCount ?? 0;
      return {
        average: fallbackRating,
        totalReviews: fallbackCount,
        distribution: { 5: fallbackCount, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentRecommended: 100,
        verifiedCount: fallbackCount
      };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let verifiedCount = 0;
    let positiveCount = 0;

    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[star] = (distribution[star] || 0) + 1;
      totalScore += r.rating;
      if (r.verifiedTransaction) verifiedCount++;
      if (r.rating >= 4) positiveCount++;
    }

    const average = Number((totalScore / reviews.length).toFixed(1));
    const percentRecommended = Math.round((positiveCount / reviews.length) * 100);

    return {
      average,
      totalReviews: reviews.length,
      distribution,
      percentRecommended,
      verifiedCount
    };
  }

  public addSellerReview(data: {
    sellerId: string;
    rating: number;
    comment: string;
    listingId?: string;
    listingTitle?: string;
    transactionId?: string;
    verifiedTransaction?: boolean;
  }): SellerReview {
    const buyer = this.getCurrentUser();
    const clampedRating = Math.min(5, Math.max(1, Math.round(data.rating)));

    const newReview: SellerReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      sellerId: data.sellerId,
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerAvatar: buyer.avatar,
      buyerDistrict: buyer.district,
      rating: clampedRating,
      comment: data.comment.trim(),
      createdAt: new Date().toISOString(),
      listingId: data.listingId,
      listingTitle: data.listingTitle,
      transactionId: data.transactionId || `deal_${Date.now().toString().slice(-6)}`,
      verifiedTransaction: data.verifiedTransaction !== undefined ? data.verifiedTransaction : true
    };

    this.reviews.unshift(newReview);
    safeSet(STORAGE_KEYS.SELLER_REVIEWS, this.reviews);

    // Recalculate seller aggregate rating and update seller in users list
    const aggregate = this.getSellerAggregateRating(data.sellerId);
    const seller = this.users.find(u => u.id === data.sellerId);
    if (seller) {
      seller.rating = aggregate.average;
      seller.reviewCount = aggregate.totalReviews;
      safeSet(STORAGE_KEYS.USERS, this.users);
    }

    // Update sellerRating on all listings belonging to this seller
    this.listings.forEach(l => {
      if (l.sellerId === data.sellerId) {
        l.sellerRating = aggregate.average;
      }
    });
    safeSet(STORAGE_KEYS.LISTINGS, this.listings);

    // Send in-app notification to the seller
    this.sendNotification(data.sellerId, {
      title: `New ${clampedRating}★ Review from ${buyer.name}`,
      message: `Buyer feedback for ${data.listingTitle || 'your store'}: "${data.comment.slice(0, 75)}${data.comment.length > 75 ? '...' : ''}"`,
      type: 'message',
      linkTab: 'profile',
      targetId: newReview.id
    });

    this.addAuditLog(
      'SELLER_REVIEW_SUBMITTED',
      `${buyer.name} gave ${clampedRating} stars to seller ${seller?.name || data.sellerId} (${newReview.verifiedTransaction ? 'Verified Deal' : 'Unverified'})`,
      'user',
      data.sellerId
    );

    return newReview;
  }

  public getEligibleTransactionsForReview(buyerId: string, sellerId: string): Array<{
    listingId?: string;
    listingTitle: string;
    transactionId?: string;
    date: string;
    status: string;
  }> {
    const results: Array<{
      listingId?: string;
      listingTitle: string;
      transactionId?: string;
      date: string;
      status: string;
    }> = [];

    // 1. Check conversations between buyer & seller for accepted offers
    const convs = this.conversations.filter(
      c => (c.buyerId === buyerId && c.sellerId === sellerId) || (c.sellerId === buyerId && c.buyerId === sellerId)
    );

    for (const c of convs) {
      const msgs = this.getMessages(c.id);
      const acceptedOffer = msgs.find(m => m.offerStatus === 'accepted');
      if (acceptedOffer) {
        results.push({
          listingId: c.productId,
          listingTitle: c.productTitle,
          transactionId: `offer_${acceptedOffer.id}`,
          date: acceptedOffer.timestamp,
          status: 'Offer Accepted Deal'
        });
      } else if (msgs.length > 0) {
        // Also allow reviewing from active chat inquiry
        results.push({
          listingId: c.productId,
          listingTitle: c.productTitle,
          transactionId: `inquiry_${c.id}`,
          date: c.lastMessageTimestamp,
          status: 'Chat Transaction'
        });
      }
    }

    // 2. Check payment transactions if any
    const txs = this.transactions.filter(
      t => t.userId === buyerId && t.status === 'successful' && t.listingId
    );
    for (const t of txs) {
      const listing = this.getListingById(t.listingId || '');
      if (listing && listing.sellerId === sellerId) {
        results.push({
          listingId: t.listingId,
          listingTitle: t.listingTitle || listing.title,
          transactionId: t.id,
          date: t.completedAt || t.createdAt,
          status: 'Mobile Money Payment'
        });
      }
    }

    return results;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public addAuditLog(action: string, details: string, targetType: AuditLog['targetType'], targetId: string): void {
    const current = this.getCurrentUser();
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      actorId: current ? current.id : 'system',
      actorName: current ? current.name : 'System',
      action,
      details,
      targetType,
      targetId,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    safeSet(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs.slice(0, 100));
  }
}

export const store = new MarketplaceStore();
