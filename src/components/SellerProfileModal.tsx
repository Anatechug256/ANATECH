import React, { useState } from 'react';
import { 
  X, Star, ShieldCheck, MapPin, Phone, MessageSquare, 
  ExternalLink, CheckCircle2, Clock, ThumbsUp, ShoppingBag, 
  Calendar, Award, Filter, Building, Check, Store
} from 'lucide-react';
import { User, ProductListing, SellerReview } from '../types';
import { store } from '../services/marketplaceStore';

interface SellerProfileModalProps {
  sellerId: string;
  currentUser: User;
  onClose: () => void;
  onSelectListing: (listing: ProductListing) => void;
  onStartChat: (listing: ProductListing, initialMessage?: string) => void;
  onOpenLeaveReview: (sellerId: string, listingId?: string, listingTitle?: string) => void;
}

export const SellerProfileModal: React.FC<SellerProfileModalProps> = ({
  sellerId,
  currentUser,
  onClose,
  onSelectListing,
  onStartChat,
  onOpenLeaveReview
}) => {
  const seller = store.getUserById(sellerId);
  const reviews = store.getSellerReviews(sellerId);
  const aggregate = store.getSellerAggregateRating(sellerId);
  const sellerListings = store.getListings({ sellerId, status: 'active' });

  const [activeTab, setActiveTab] = useState<'reviews' | 'listings'>('reviews');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  if (!seller) return null;

  const isSellerVerified = Boolean(seller.verified ?? seller.isVerifiedSeller);
  const canShowVerifiedPhone = isSellerVerified && seller.showPhonePublicly && Boolean(seller.phone);
  const cleanedPhone = (seller.phone || '').replace(/[^\d+]/g, '');

  const filteredReviews = reviews.filter(r => {
    if (starFilter !== 'all' && r.rating !== starFilter) return false;
    if (verifiedOnly && !r.verifiedTransaction) return false;
    return true;
  });

  const handleCall = () => {
    if (cleanedPhone) {
      window.location.href = `tel:${cleanedPhone}`;
    }
  };

  const handleWhatsApp = () => {
    if (cleanedPhone) {
      const waNumber = cleanedPhone.replace('+', '');
      window.open(`https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(seller.name)},%20I%20saw%20your%20profile%20on%20ANATECH%20MARKET.`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto"
        role="dialog"
        aria-labelledby="seller-profile-name"
      >
        {/* Top Header Card */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close seller profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                />
                {isSellerVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs" title="Verified Trusted Seller">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 id="seller-profile-name" className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {seller.name}
                  </h1>
                  {isSellerVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Verified Seller
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {seller.activePlan} Merchant
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    {seller.district} {seller.subCounty ? `· ${seller.subCounty}` : ''}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Joined {new Date(seller.joinedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    {seller.completedDealsCount || aggregate.verifiedCount || 42} Completed Deals
                  </span>
                  {seller.isNinVerified && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold">
                        <Check className="w-3 h-3" /> NIN Verified
                      </span>
                    </>
                  )}
                </div>

                {/* Physical Storefront & Walk-in Address */}
                {seller.physicalShopLocation && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 mt-1">
                    <Building className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">Shop:</span>
                    <span className="truncate">{seller.physicalShopLocation}</span>
                    {seller.shopWorkingHours && (
                      <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">({seller.shopWorkingHours})</span>
                    )}
                  </div>
                )}

                {seller.warrantyOffered && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Buyer Protection: {seller.warrantyOffered}</span>
                  </div>
                )}

                {seller.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1 line-clamp-2 leading-relaxed">
                    {seller.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto sm:flex-col sm:items-end">
              {currentUser.id !== seller.id && (
                <button
                  onClick={() => onOpenLeaveReview(seller.id)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Leave Review</span>
                </button>
              )}

              {canShowVerifiedPhone && (
                <button
                  onClick={handleCall}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  title="Call Verified Seller"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Seller</span>
                </button>
              )}

              {seller.showWhatsAppPublicly && seller.phone && (
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  title="Chat on WhatsApp"
                >
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Aggregate Ratings & Reviews Summary Card */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Score Big Display */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {aggregate.average.toFixed(1)}
              </span>
              <div className="flex items-center gap-1 my-1.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(aggregate.average) 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                Based on {aggregate.totalReviews} verified {aggregate.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                <ThumbsUp className="w-3 h-3 text-emerald-600" />
                <span className="tabular-nums">{aggregate.percentRecommended}% Recommended</span>
              </div>
            </div>

            {/* Star Distribution Progress Bars */}
            <div className="md:col-span-8 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = aggregate.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
                const pct = aggregate.totalReviews > 0 ? Math.round((count / aggregate.totalReviews) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setStarFilter(starFilter === stars ? 'all' : stars)}
                      className={`w-14 text-left font-medium flex items-center gap-1 hover:text-cyan-600 ${
                        starFilter === stars ? 'text-cyan-600 font-bold' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{stars}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </button>

                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span className="w-12 text-right text-slate-400 tabular-nums text-[11px]">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 text-xs sm:text-sm font-semibold transition-colors relative ${
                activeTab === 'reviews'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Buyer Reviews ({reviews.length})
              {activeTab === 'reviews' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('listings')}
              className={`py-3 text-xs sm:text-sm font-semibold transition-colors relative ${
                activeTab === 'listings'
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active Listings ({sellerListings.length})
              {activeTab === 'listings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
              )}
            </button>
          </div>

          {activeTab === 'reviews' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  verifiedOnly 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Deals Only</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'reviews' && (
            <div className="space-y-3.5">
              {starFilter !== 'all' && (
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  <span>Filtered to show <strong>{starFilter}-Star</strong> reviews</span>
                  <button
                    onClick={() => setStarFilter('all')}
                    className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {filteredReviews.length > 0 ? (
                filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.buyerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
                          alt={rev.buyerName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {rev.buyerName}
                            </span>
                            {rev.verifiedTransaction && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified Deal
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {rev.buyerDistrict ? `${rev.buyerDistrict} · ` : ''}{new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Associated Product if available */}
                    {rev.listingTitle && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-slate-400" />
                        <span>Item: <strong className="text-slate-700 dark:text-slate-300">{rev.listingTitle}</strong></span>
                      </div>
                    )}

                    {/* Comment text */}
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <Star className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    No matching reviews found.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Buyers leave feedback after agreed deals and completed transactions.
                  </p>
                  {currentUser.id !== seller.id && (
                    <button
                      onClick={() => onOpenLeaveReview(seller.id)}
                      className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
                    >
                      Be the first to leave a review
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {sellerListings.length > 0 ? (
                sellerListings.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectListing(item)}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs group"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600">
                          {item.title}
                        </h3>
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                          {store.formatPrice(item.price)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.district} · {item.viewsCount} views
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-slate-400 text-xs">
                  No active listings currently published by this seller.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
