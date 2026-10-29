import React, { useState } from 'react';
import { 
  X, Heart, Share2, ShieldCheck, MapPin, 
  MessageSquare, Phone, Flag, ShieldAlert, 
  CheckCircle2, Clock, Truck, Store, ExternalLink,
  TrendingUp, Info, BarChart2, Zap, PackageCheck, Activity,
  MessageSquareText, Smartphone, Send, Star
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine,
  CartesianGrid 
} from 'recharts';
import { ProductListing, User } from '../types';
import { store } from '../services/marketplaceStore';
import { getPriceTrendForListing } from '../data/priceTrends';
import { SmsShareModal } from './SmsShareModal';
import { shareProductViaSms, generateProductSmsText } from '../utils/smsShare';

interface ProductDetailModalProps {
  listing: ProductListing;
  currentUser: User;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onStartChat: (listing: ProductListing, initialMessage?: string) => void;
  onOpenReport: (listing: ProductListing) => void;
  onOpenSellerProfile?: (sellerId: string) => void;
  onOpenLeaveReview?: (sellerId: string, listingId?: string, listingTitle?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  listing,
  currentUser,
  isFavorite,
  onToggleFavorite,
  onClose,
  onStartChat,
  onOpenReport,
  onOpenSellerProfile,
  onOpenLeaveReview
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [offerAmount, setOfferAmount] = useState<string>('');
  const [showOfferBox, setShowOfferBox] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [trendTimeframe, setTrendTimeframe] = useState<'3M' | '6M'>('6M');
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);

  const { trend, priceComparison } = getPriceTrendForListing(listing.categoryId, listing.price);
  const chartData = trendTimeframe === '3M' ? trend.data.slice(-3) : trend.data;

  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return String(val);
  };

  const formattedPrice = store.formatPrice(listing.price);
  const isOwner = currentUser.id === listing.sellerId;

  const sellerUser = store.getUserById(listing.sellerId);
  const sellerAggregate = store.getSellerAggregateRating(listing.sellerId);
  const sellerReviews = store.getSellerReviews(listing.sellerId);
  const sellerCompletedDeals = listing.sellerCompletedDeals ?? sellerUser?.completedDealsCount ?? (listing.sellerVerified ? 86 : 14);
  const sellerResponseTime = listing.sellerAvgResponseTime ?? sellerUser?.avgResponseTime ?? 'Under 30 mins';

  // Seller verification status
  const isSellerVerified = Boolean(
    listing.verified || 
    listing.sellerVerified || 
    sellerUser?.verified || 
    sellerUser?.isVerifiedSeller
  );

  // Seller phone number: prefer seller profile, then listing sellerPhone, then contactPreferences
  const sellerPhoneNumber = sellerUser?.phone || listing.sellerPhone || listing.contactPreferences?.publicPhone;
  
  // Explicit opt-in verification: ONLY if seller has explicitly opted to share phone in profile settings
  const hasOptedInPhoneSharing = Boolean(sellerUser?.showPhonePublicly);
  const canShowVerifiedPhoneButton = isSellerVerified && hasOptedInPhoneSharing && Boolean(sellerPhoneNumber);
  const cleanedSellerPhone = sellerPhoneNumber ? sellerPhoneNumber.replace(/[^\d+]/g, '') : '';

  const handleCallVerifiedSeller = (e?: React.MouseEvent) => {
    if (cleanedSellerPhone) {
      window.location.href = `tel:${cleanedSellerPhone}`;
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${listing.title} on ANATECH MARKET`,
      text: `Check out this listing: ${listing.title} for ${formattedPrice} in ${listing.district}`,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Ignored or cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleQuickSmsShare = async () => {
    const smsMessage = generateProductSmsText(listing, window.location.href);
    const result = await shareProductViaSms({
      title: `${listing.title} on ANATECH MARKET`,
      message: smsMessage,
      url: window.location.href
    });
    if (result.method === 'clipboard') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSendOffer = () => {
    const amt = Number(offerAmount);
    if (!amt || amt <= 0) return;
    onStartChat(listing, `I would like to offer ${store.formatPrice(amt)} for "${listing.title}". Is this acceptable?`);
  };

  const handleWhatsApp = () => {
    if (!listing.contactPreferences.publicPhone && !listing.sellerPhone) return;
    const phone = (listing.contactPreferences.publicPhone || listing.sellerPhone || '').replace(/\D/g, '');
    const message = encodeURIComponent(`Hello! I saw your listing "${listing.title}" on ANATECH MARKET for ${formattedPrice}. Is it still available?`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    const phone = cleanedSellerPhone || (listing.contactPreferences.publicPhone || listing.sellerPhone || '').replace(/[^\d+]/g, '');
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200/90 dark:border-slate-800 rounded-none sm:rounded-3xl w-full max-w-3xl h-full sm:h-auto sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              {listing.subcategory || 'Marketplace Item'}
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {listing.condition.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Share via SMS button */}
            <button
              onClick={() => setIsSmsModalOpen(true)}
              className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60"
              title="Share via SMS (Features phone & non-smartphone friendly)"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Share SMS</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Share Listing"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleFavorite}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {copiedLink && (
            <div className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Listing link copied to clipboard!
            </div>
          )}

          {/* Image Showcase */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[activeImageIndex] || listing.images[0]}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain sm:object-cover bg-slate-950"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No photos available
                </div>
              )}

              {listing.isFeatured && (
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm text-amber-300 text-xs font-bold tracking-wide uppercase px-2.5 py-1 rounded">
                  Featured
                </div>
              )}
            </div>

            {/* Thumbnail switcher if multiple images */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === i ? 'border-cyan-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Title Header */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {formattedPrice}
                </span>
                {listing.isNegotiable ? (
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    Negotiable Price
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Fixed Price
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {listing.title}
            </h1>

            {/* Location & Delivery */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-1 font-medium">
                <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>{listing.district}</span>
                {listing.locationArea && <span>({listing.locationArea})</span>}
              </div>

              <span aria-hidden="true" className="text-slate-400">·</span>

              <div className="flex items-center gap-1 text-slate-500">
                <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="capitalize">{listing.deliveryOption.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Description
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Visual 'Price Trends' Section using Recharts */}
          <section className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4">
            {/* Header & Interactive Range Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Price Trends</span>
                    <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-200/60 dark:border-cyan-800/40">
                      {trend.categoryName}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {trend.trendDescription}
                  </p>
                </div>
              </div>

              {/* Timeframe Selector (3M vs 6M) */}
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-700/80 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTrendTimeframe('3M')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    trendTimeframe === '3M'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  3 Months
                </button>
                <button
                  type="button"
                  onClick={() => setTrendTimeframe('6M')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    trendTimeframe === '6M'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  6 Months
                </button>
              </div>
            </div>

            {/* Valuation Verdict Banner */}
            <div className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs ${
              priceComparison.verdict === 'great_deal'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'
                : priceComparison.verdict === 'above_average'
                ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-200'
                : 'bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-800/50 text-cyan-800 dark:text-cyan-200'
            }`}>
              <div className="flex items-center gap-2">
                {priceComparison.verdict === 'great_deal' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 shrink-0" />
                )}
                <span className="font-bold">{priceComparison.label}</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums opacity-90 hidden sm:inline">
                Market Benchmark: {store.formatPrice(priceComparison.avgCurrent)}
              </span>
            </div>

            {/* Recharts AreaChart Canvas */}
            <div className="h-48 sm:h-52 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: -14, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="anatechModalPriceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />

                  <XAxis 
                    dataKey="month" 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={formatYAxis}
                    domain={['auto', 'auto']}
                  />

                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                            <div className="font-bold text-slate-300 pb-0.5 border-b border-slate-800">
                              {label} 2026 Price Index
                            </div>
                            <div className="flex items-center justify-between gap-3 text-cyan-400 font-mono font-semibold">
                              <span>Market Average:</span>
                              <span>UGX {pt.avgPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px] tabular-nums">
                              <span>Local Range:</span>
                              <span>UGX {pt.lowPrice.toLocaleString()} - {pt.highPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Reference line for the current listing's price */}
                  <ReferenceLine 
                    y={listing.price} 
                    stroke="#F59E0B" 
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ 
                      value: `This Item: ${formatYAxis(listing.price)}`, 
                      fill: '#F59E0B', 
                      fontSize: 10, 
                      position: 'insideTopRight' 
                    }}
                  />

                  <Area 
                    type="monotone" 
                    dataKey="avgPrice" 
                    stroke="#06B6D4" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#anatechModalPriceGradient)" 
                    dot={{ r: 3, fill: '#06B6D4', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#0891B2' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Data-Driven Buyer & Seller Insights */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <p className="leading-snug flex-1">
                <strong className="text-slate-700 dark:text-slate-300">Data-Driven Market Guidance:</strong> {trend.marketInsight}
              </p>
              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                <span>Avg Price: <strong className="text-slate-700 dark:text-slate-300">{store.formatPrice(priceComparison.avgCurrent)}</strong></span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span>Market Volatility: <strong className="capitalize text-slate-700 dark:text-slate-300">{trend.volatility}</strong></span>
              </div>
            </div>
          </section>

          {/* Seller Profile Card with Activity Badge */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={listing.sellerAvatar}
                  alt={listing.sellerName}
                  onClick={() => onOpenSellerProfile?.(listing.sellerId)}
                  className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
                  title="View full seller profile"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenSellerProfile?.(listing.sellerId)}
                      className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-left"
                    >
                      {listing.sellerName}
                    </button>
                    {isSellerVerified && (
                      <span title="Verified Trusted Seller">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <button
                      type="button"
                      onClick={() => onOpenSellerProfile?.(listing.sellerId)}
                      className="font-medium text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                    >
                      ★ {sellerAggregate.average.toFixed(1)} Rating ({sellerAggregate.totalReviews} reviews)
                    </button>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize font-medium text-slate-600 dark:text-slate-300">{listing.sellerPlan} Merchant</span>
                    <span aria-hidden="true">·</span>
                    <span>{listing.district}</span>
                  </div>
                </div>
              </div>

              {/* Verified Seller Trust Tag & View Profile CTA */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {isSellerVerified && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onOpenSellerProfile?.(listing.sellerId)}
                  className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 rounded-lg text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline transition-colors"
                >
                  View Profile & Reviews
                </button>
              </div>
            </div>

            {/* Verified Seller Direct Phone Contact Button (ONLY if verified AND seller explicitly opted to share phone in profile settings) */}
            {canShowVerifiedPhoneButton && (
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-2xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Verified Seller Phone Contact
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                        Profile Opted-In
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 block font-mono font-medium mt-0.5">
                      {sellerPhoneNumber}
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${cleanedSellerPhone}`}
                  onClick={handleCallVerifiedSeller}
                  role="button"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-600/20 shrink-0 cursor-pointer active:scale-95"
                  title={`Call Verified Seller (${sellerPhoneNumber}) via device native dialer`}
                  aria-label="Verified Seller phone contact button"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Verified Seller Phone</span>
                </a>
              </div>
            )}

            {/* Activity Badge Container */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Seller Activity Badge
                </span>
              </div>

              {/* Activity Metrics Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Average Response Time Badge */}
                <div 
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs"
                  title="Average response time to buyer inquiries on ANATECH MARKET"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Response: <strong className="text-slate-900 dark:text-white font-semibold">{sellerResponseTime}</strong></span>
                </div>

                {/* Completed Transactions Badge */}
                <div 
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs"
                  title="Number of successfully verified and completed transactions on the platform"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Completed: <strong className="text-slate-900 dark:text-white font-semibold tabular-nums">{sellerCompletedDeals} Transactions</strong></span>
                </div>
              </div>
            </div>

            {/* Seller Ratings & Recent Customer Reviews Preview */}
            <div className="pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Buyer Ratings & Reviews ({sellerAggregate.totalReviews})
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    · {sellerAggregate.percentRecommended}% Recommended
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {currentUser.id !== listing.sellerId && (
                    <button
                      type="button"
                      onClick={() => onOpenLeaveReview?.(listing.sellerId, listing.id, listing.title)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      + Rate Seller
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenSellerProfile?.(listing.sellerId)}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    View All ({sellerReviews.length})
                  </button>
                </div>
              </div>

              {sellerReviews.length > 0 ? (
                <div className="space-y-2">
                  {sellerReviews.slice(0, 2).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 rounded-xl space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{rev.buyerName}</span>
                          {rev.verifiedTransaction && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Verified Deal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No written reviews yet for this merchant.
                </p>
              )}
            </div>
          </div>

          {/* Share via SMS Section (for Non-Smartphone & Feature Phone Users) */}
          <div className="bg-gradient-to-r from-cyan-50/70 via-sky-50/50 to-slate-50 dark:from-cyan-950/20 dark:via-sky-950/10 dark:to-slate-800/60 border border-cyan-200/70 dark:border-cyan-800/40 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-600 text-white shrink-0 shadow-xs">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Share via SMS
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Non-Smartphone Friendly
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Have friends, relatives, or buyers using basic phones or low mobile data? Send this listing's price and link directly to their phone's SMS inbox.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-center">
                <button
                  type="button"
                  onClick={handleQuickSmsShare}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  title="Quickly send SMS using device share sheet or custom SMS URI"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Quick SMS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSmsModalOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-600/20 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Customize SMS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Safe Trading Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">ANATECH Safety Warning:</span>
              <p className="text-[11px] leading-relaxed">
                Meet the seller in an open public location in {listing.district}. Check the item thoroughly before paying. Do not make wire transfers or Mobile Money advance deposits to unverified contacts.
              </p>
            </div>
          </div>

          {/* Report Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onOpenReport(listing)}
              className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this listing</span>
            </button>
          </div>
        </div>

        {/* Modal Bottom Sticky Action Bar */}
        <div className="p-3 sm:p-4 pb-safe border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky bottom-0 z-20 space-y-2">
          {showOfferBox ? (
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Enter Your Price Offer (UGX)</span>
                <button onClick={() => setShowOfferBox(false)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">Cancel</button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 2100000"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleSendOffer}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Send Offer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isOwner ? (
                <div className="w-full flex items-center justify-between gap-3 py-1">
                  <span className="text-xs font-semibold text-slate-500">
                    This is your own listing
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSmsModalOpen(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <MessageSquareText className="w-4 h-4" />
                    <span>Share via SMS</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Make Offer button */}
                  {listing.isNegotiable && (
                    <button
                      onClick={() => setShowOfferBox(true)}
                      className="px-2.5 sm:px-4 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer"
                    >
                      Offer
                    </button>
                  )}

                  {/* In-App Chat button */}
                  <button
                    onClick={() => onStartChat(listing)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>In-App Message</span>
                  </button>

                  {/* WhatsApp button if allowed */}
                  {listing.contactPreferences.allowWhatsApp && (
                    <button
                      onClick={handleWhatsApp}
                      className="p-2.5 sm:px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Chat on WhatsApp"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  )}

                  {/* Phone call button if allowed or if verified seller opted-in */}
                  {(listing.contactPreferences.allowPhone || canShowVerifiedPhoneButton) && (
                    <button
                      onClick={handleCall}
                      className={`p-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 transition-colors ${
                        canShowVerifiedPhoneButton 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                      title={canShowVerifiedPhoneButton ? `Call Verified Seller (${sellerPhoneNumber})` : "Call Seller"}
                    >
                      <Phone className={`w-4 h-4 ${canShowVerifiedPhoneButton ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600'}`} />
                      <span className="hidden sm:inline">{canShowVerifiedPhoneButton ? 'Call (Verified)' : 'Call'}</span>
                    </button>
                  )}

                  {/* SMS Share button */}
                  <button
                    type="button"
                    onClick={() => setIsSmsModalOpen(true)}
                    className="p-2.5 sm:px-3 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="Share via SMS (Features phone friendly)"
                  >
                    <MessageSquareText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="hidden sm:inline">SMS</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share via SMS Modal */}
      <SmsShareModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        listing={listing}
        formattedPrice={formattedPrice}
      />
    </div>
  );
};
