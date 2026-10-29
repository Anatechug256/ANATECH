import React from 'react';
import { Heart, MapPin, ShieldCheck, Check, Star } from 'lucide-react';
import { ProductListing } from '../types';
import { store } from '../services/marketplaceStore';

export interface ProductCardProps {
  listing: ProductListing;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  verified?: boolean; // Direct override for verified badge
  showVerifiedBadge?: boolean; // Controls whether to show verified badge (defaults to true)
}

export const ProductCard: React.FC<ProductCardProps> = ({
  listing,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  verified,
  showVerifiedBadge = true
}) => {
  const lowDataMode = store.getLowDataMode();
  const formattedPrice = store.formatPrice(listing.price);
  
  // A seller is verified if explicitly marked via prop or on the listing/seller
  const isVerified = verified !== undefined 
    ? verified 
    : Boolean(listing.verified ?? listing.sellerVerified);

  const getConditionLabel = (c: string) => {
    switch (c) {
      case 'new': return 'Brand New';
      case 'like_new': return 'Like New';
      case 'used_good': return 'Used (Good)';
      case 'used_fair': return 'Used (Fair)';
      default: return c;
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/50 dark:hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 dark:hover:shadow-cyan-950/40 transition-all duration-200 flex flex-col justify-between market-card-glow"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {listing.images && listing.images.length > 0 && !lowDataMode ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-4 text-center">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 line-clamp-2">
              {listing.title}
            </span>
            {lowDataMode && (
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1 font-mono font-medium">Data Saver Preview</span>
            )}
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 backdrop-blur-md shadow-xs hover:scale-115 active:scale-90 transition-all z-10 cursor-pointer"
            aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-300'}`} />
          </button>
        )}

        {/* Top Badges (Verified Seller & Featured) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {isVerified && showVerifiedBadge && (
            <div 
              className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-lg shadow-xs border border-emerald-400/40"
              title="Verified Trusted Seller on ANATECH MARKET"
              data-testid="verified-badge"
            >
              <ShieldCheck className="w-3 h-3 text-white shrink-0" />
              <span>Verified</span>
            </div>
          )}
          {listing.isFeatured && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[9px] sm:text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded-lg shadow-xs">
              Featured
            </div>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1 truncate">
            <span className="font-medium text-slate-600 dark:text-slate-300">{listing.district}</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>{getConditionLabel(listing.condition)}</span>
            {listing.isNegotiable && (
              <>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Negotiable</span>
              </>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {listing.title}
          </h3>
        </div>

        <div>
          {/* Price & Location Bottom Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between gap-1">
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-cyan-300 tabular-nums">
                {formattedPrice}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[100px] sm:max-w-[130px]">
              <MapPin className="w-3 h-3 text-cyan-500 shrink-0" />
              <span className="truncate">{listing.locationArea || listing.district}</span>
            </div>
          </div>

          {/* Seller Trust Bar with Verified Badge & Star Rating */}
          <div className="mt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-50 dark:border-slate-800/40">
            <div className="flex items-center gap-1 truncate max-w-[110px] sm:max-w-[140px]">
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {listing.sellerName}
              </span>
              {isVerified && showVerifiedBadge && (
                <span title="Verified Seller">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
              {listing.sellerRating ? (
                <span className="flex items-center gap-0.5 text-amber-500 font-bold" title={`Seller Rating: ${listing.sellerRating.toFixed(1)}/5.0`}>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{listing.sellerRating.toFixed(1)}</span>
                </span>
              ) : null}
              <span className="text-slate-400 text-[9px] sm:text-[10px]">
                {new Date(listing.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Also export as ProductListing for component interoperability
export { ProductCard as ProductListing };
export default ProductCard;
