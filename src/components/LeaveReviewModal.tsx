import React, { useState } from 'react';
import { 
  X, Star, ShieldCheck, CheckCircle2, Package, 
  AlertCircle, ThumbsUp, ShoppingBag 
} from 'lucide-react';
import { User, SellerReview } from '../types';
import { store } from '../services/marketplaceStore';

interface LeaveReviewModalProps {
  currentUser: User;
  sellerId: string;
  defaultListingId?: string;
  defaultListingTitle?: string;
  defaultTransactionId?: string;
  onClose: () => void;
  onReviewSubmitted: (review: SellerReview) => void;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  currentUser,
  sellerId,
  defaultListingId,
  defaultListingTitle,
  defaultTransactionId,
  onClose,
  onReviewSubmitted
}) => {
  const seller = store.getUserById(sellerId);
  const eligibleDeals = store.getEligibleTransactionsForReview(currentUser.id, sellerId);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedListingId, setSelectedListingId] = useState<string>(
    defaultListingId || (eligibleDeals.length > 0 ? eligibleDeals[0].listingId || '' : '')
  );
  const [selectedListingTitle, setSelectedListingTitle] = useState<string>(
    defaultListingTitle || (eligibleDeals.length > 0 ? eligibleDeals[0].listingTitle : '')
  );
  const [transactionId, setTransactionId] = useState<string>(
    defaultTransactionId || (eligibleDeals.length > 0 ? eligibleDeals[0].transactionId || '' : '')
  );
  const [isVerifiedDeal, setIsVerifiedDeal] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const starLabels: Record<number, string> = {
    1: '1 Star · Poor Experience',
    2: '2 Stars · Below Expectations',
    3: '3 Stars · Average / Acceptable',
    4: '4 Stars · Good & Reliable Service',
    5: '5 Stars · Exceptional & Trustworthy'
  };

  const handleSelectDeal = (deal: typeof eligibleDeals[0]) => {
    setSelectedListingId(deal.listingId || '');
    setSelectedListingTitle(deal.listingTitle);
    setTransactionId(deal.transactionId || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (currentUser.id === sellerId) {
      setErrorMessage('You cannot leave a review for your own profile.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setErrorMessage('Please provide a genuine review of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const review = store.addSellerReview({
        sellerId,
        rating,
        comment: comment.trim(),
        listingId: selectedListingId || undefined,
        listingTitle: selectedListingTitle || undefined,
        transactionId: transactionId || undefined,
        verifiedTransaction: isVerifiedDeal
      });

      onReviewSubmitted(review);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit review');
      setIsSubmitting(false);
    }
  };

  const activeStarCount = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 my-auto"
        role="dialog"
        aria-labelledby="review-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <img
              src={seller?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80'}
              alt={seller?.name || 'Seller'}
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h2 id="review-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Rate & Review Seller</span>
                {(seller?.verified || seller?.isVerifiedSeller) && (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Feedback for <strong className="text-slate-700 dark:text-slate-200">{seller?.name || 'Seller'}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Selector */}
          <div className="space-y-2 text-center py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
              Overall Transaction Rating
            </span>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = starVal <= activeStarCount;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:scale-115 active:scale-95 transition-all focus:outline-hidden"
                    aria-label={`Give ${starVal} stars`}
                  >
                    <Star 
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                        isFilled 
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs' 
                          : 'text-slate-300 dark:text-slate-700'
                      }`} 
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {starLabels[activeStarCount] || 'Select Rating'}
            </p>
          </div>

          {/* Associated Product / Deal */}
          {eligibleDeals.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-600" />
                <span>Associated Transaction / Item:</span>
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {eligibleDeals.map((deal, idx) => {
                  const isSelected = selectedListingTitle === deal.listingTitle;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDeal(deal)}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 text-slate-900 dark:text-white font-medium'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold">{deal.listingTitle}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {deal.status} · {new Date(deal.date).toLocaleDateString()}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {eligibleDeals.length === 0 && defaultListingTitle && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">Reviewed for: <strong>{defaultListingTitle}</strong></span>
            </div>
          )}

          {/* Review Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="review-comment" className="font-bold text-slate-700 dark:text-slate-300">
                Your Feedback & Experience:
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {comment.length} characters (min 10)
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the product quality, communication, price honesty, and delivery speed? Was inspection smooth?"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20"
              required
            />
          </div>

          {/* Verified Transaction Check */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50 flex items-start gap-3">
            <input
              type="checkbox"
              id="verified-deal-checkbox"
              checked={isVerifiedDeal}
              onChange={(e) => setIsVerifiedDeal(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="verified-deal-checkbox" className="text-xs text-emerald-900 dark:text-emerald-300 leading-snug cursor-pointer">
              <span className="font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Verified Transaction
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 block mt-0.5">
                Confirms you completed a genuine purchase, exchange, or meeting with this seller in Uganda.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || comment.trim().length < 10}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
