export type UserRole = 'customer' | 'seller' | 'moderator' | 'admin';

export type ContactPreference = 'in_app' | 'whatsapp' | 'phone';

export type ListingCondition = 'new' | 'like_new' | 'used_good' | 'used_fair';

export type ListingStatus = 'active' | 'pending' | 'sold' | 'draft' | 'rejected' | 'expired';

export type DeliveryOption = 'buyer_pickup' | 'seller_delivers' | 'public_meetup';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  role: UserRole;
  district: string;
  subCounty?: string;
  avatar: string;
  bio?: string;
  preferredContact: ContactPreference;
  showPhonePublicly: boolean;
  showWhatsAppPublicly: boolean;
  joinedDate: string;
  isVerifiedSeller: boolean;
  verified?: boolean; // Trusted seller verified status
  rating: number;
  reviewCount: number;
  completedDealsCount?: number;
  avgResponseTime?: string;
  activePlan: 'standard' | 'pro' | 'business';
  planExpiresAt?: string;
  isSuspended: boolean;
  suspensionReason?: string;
  savedListingIds: string[];
  recentlyViewedListingIds?: string[]; // Last 5 clicked listing IDs for quick navigation
  recentlyViewedIds?: string[];
  // Seller Registration Profile Fields
  isRegisteredSeller?: boolean;
  businessName?: string;
  businessAddress?: string;
  physicalShopLocation?: string;
  categoriesHandled?: string[];
  shopWorkingHours?: string;
  warrantyOffered?: string;
  ninNumber?: string; // Uganda National Identification Number (NIN)
  isNinVerified?: boolean;
  tinNumber?: string; // Uganda Revenue Authority (URA) TIN
  momoNumber?: string; // MTN Mobile Money / Airtel Money number
  momoProvider?: 'MTN Mobile Money' | 'Airtel Money';
  deliveryModes?: DeliveryOption[];
  sellerRegistrationDate?: string;
  sellerRegistrationStatus?: 'unregistered' | 'pending' | 'verified' | 'rejected';
}

export interface Category {
  id: string;
  name: string;
  lugandaName?: string;
  iconName: string;
  description: string;
  subcategories: string[];
  isRestricted?: boolean;
  popular?: boolean;
  listingCount?: number;
}

export interface ProductListing {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  subcategory: string;
  price: number; // in UGX
  currency: string; // 'UGX', 'KES', 'USD'
  isNegotiable: boolean;
  condition: ListingCondition;
  images: string[];
  district: string;
  locationArea: string; // e.g. "Ntinda Shopping Centre", "Kalerwe Market", "Entebbe Rd"
  deliveryOption: DeliveryOption;
  deliveryNotes?: string;
  contactPreferences: {
    allowInApp: boolean;
    allowWhatsApp: boolean;
    allowPhone: boolean;
    publicPhone?: string;
  };
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerPhone?: string;
  sellerRating: number;
  sellerVerified: boolean;
  verified?: boolean; // Trusted seller verified status
  sellerPlan: 'standard' | 'pro' | 'business';
  sellerCompletedDeals?: number;
  sellerAvgResponseTime?: string;
  status: ListingStatus;
  isFeatured: boolean;
  featuredUntil?: string;
  viewsCount: number;
  favoritesCount: number;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  moderationNotes?: string;
  isOfflineCached?: boolean;
  lastSyncedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  offerAmount?: number;
  offerStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
  isSystemMessage?: boolean;
  isPendingSync?: boolean;
  isOfflineSaved?: boolean;
}

export interface Conversation {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  productDistrict: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCountBuyer: number;
  unreadCountSeller: number;
  isBlocked: boolean;
  blockedBy?: string;
  isOfflineCached?: boolean;
}

export interface OfflineSyncState {
  isOnline: boolean;
  lastSyncedAt: string;
  pendingSyncCount: number;
  cachedListingsCount: number;
  cachedConversationsCount: number;
  isSyncing: boolean;
}

export interface Report {
  id: string;
  targetType: 'listing' | 'user';
  targetId: string;
  targetTitle: string;
  reporterId: string;
  reporterName: string;
  reason: 'counterfeit' | 'fraud_scam' | 'prohibited_item' | 'offensive' | 'duplicate' | 'wrong_category' | 'other';
  details: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionAction?: 'listing_removed' | 'seller_suspended' | 'warning_issued' | 'dismissed';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'offer' | 'listing_status' | 'promotion' | 'system' | 'search_alert';
  isRead: boolean;
  timestamp: string;
  linkTab?: 'home' | 'categories' | 'sell' | 'messages' | 'profile' | 'admin';
  targetId?: string;
}

export interface SavedSearchCriteria {
  id: string;
  userId: string;
  name: string;
  query?: string;
  categoryId?: string;
  categoryName?: string;
  subcategory?: string;
  district?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  notifyPush: boolean;
  createdAt: string;
  lastMatchedCount?: number;
  lastNotifiedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  reference: string;
  amount: number;
  currency: string;
  provider: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';
  phoneNumber: string;
  purpose: 'featured_listing' | 'subscription_pro' | 'subscription_business' | 'item_purchase';
  listingId?: string;
  listingTitle?: string;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  idempotencyKey: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: 'listing' | 'user' | 'category' | 'payment';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface MonetizationPlan {
  id: 'standard' | 'pro' | 'business';
  name: string;
  priceUGX: number;
  period: string;
  listingLimit: number;
  features: string[];
  recommended?: boolean;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  buyerDistrict?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
  listingId?: string;
  listingTitle?: string;
  transactionId?: string;
  verifiedTransaction: boolean;
}

export interface AggregateSellerRating {
  average: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  percentRecommended: number;
  verifiedCount: number;
}
