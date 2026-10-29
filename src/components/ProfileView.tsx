import React, { useState } from 'react';
import { 
  User as UserIcon, ShieldCheck, MapPin, Phone, 
  Mail, Star, Trash2, CheckCircle2, AlertTriangle, 
  ExternalLink, Edit3, Heart, Package, Sparkles, 
  DollarSign, Globe, Wifi, WifiOff, LogOut, ArrowRight,
  Sun, Moon, Monitor, BellRing, BookmarkCheck, Smartphone,
  Navigation, Compass, Crosshair, RefreshCw, Check, HardDrive,
  ShoppingBag, Award, ThumbsUp, Store, Building, CreditCard,
  Clock, Truck
} from 'lucide-react';
import { User, ProductListing } from '../types';
import { store } from '../services/marketplaceStore';
import { offlineSyncService } from '../services/offlineSyncService';
import { ProductCard } from './ProductCard';
import { SavedAlertsDrawerModal } from './SavedAlertsDrawerModal';
import { UGANDAN_DISTRICTS } from '../data/categoriesAndDistricts';
import { 
  detectUserDistrict, 
  simulateDistrictDetection, 
  GeolocationDetectionResult 
} from '../utils/districtGeolocation';

interface ProfileViewProps {
  currentUser: User;
  onOpenUpgradePlan: () => void;
  onOpenSafeTrading: () => void;
  onSelectListing: (listing: ProductListing) => void;
  onOpenSellModal: () => void;
  onUpdateDistrict?: (newDistrict: string) => void;
  onOpenInstall?: () => void;
  onOpenSellerRegistration?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onOpenUpgradePlan,
  onOpenSafeTrading,
  onSelectListing,
  onOpenSellModal,
  onUpdateDistrict,
  onOpenInstall,
  onOpenSellerRegistration
}) => {
  const [activeTab, setActiveTab] = useState<'my_listings' | 'seller_profile' | 'reviews' | 'saved' | 'settings'>('my_listings');
  const [reviewStarFilter, setReviewStarFilter] = useState<number | 'all'>('all');
  const [reviewVerifiedOnly, setReviewVerifiedOnly] = useState<boolean>(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sellerReviews = store.getSellerReviews(currentUser.id);
  const aggregateRating = store.getSellerAggregateRating(currentUser.id);

  // Settings State
  const [preferredContact, setPreferredContact] = useState(currentUser.preferredContact);
  const [showPhone, setShowPhone] = useState(currentUser.showPhonePublicly);
  const [showWhatsApp, setShowWhatsApp] = useState(currentUser.showWhatsAppPublicly);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(store.getTheme());
  const [showSavedAlertsModal, setShowSavedAlertsModal] = useState(false);

  // District & Geolocation State
  const [selectedDistrictSetting, setSelectedDistrictSetting] = useState(currentUser.district || 'Kampala');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectionResult, setLocationDetectionResult] = useState<GeolocationDetectionResult | null>(store.getLastDetectedLocation());
  const [autoDetectOnLogin, setAutoDetectOnLogin] = useState(store.getAutoDetectLocation());
  const [locationUpdateSuccess, setLocationUpdateSuccess] = useState<string | null>(null);

  // Offline Caching & Local Storage Sync State
  const [offlineSyncStats, setOfflineSyncStats] = useState(offlineSyncService.getSyncState());
  const [isSyncingOfflineData, setIsSyncingOfflineData] = useState(false);
  const [offlineSyncFeedback, setOfflineSyncFeedback] = useState<string | null>(null);

  const handleForceOfflineSync = async () => {
    setIsSyncingOfflineData(true);
    setOfflineSyncFeedback(null);
    try {
      const res = store.syncLocalStorage();
      await offlineSyncService.triggerSyncNow();
      setOfflineSyncStats(offlineSyncService.getSyncState());
      setOfflineSyncFeedback(`Successfully synchronized! ${res.listingsCount} product listings and ${res.conversationsCount} saved conversations cached locally.`);
      setTimeout(() => setOfflineSyncFeedback(null), 4500);
    } catch (e) {
      setOfflineSyncFeedback('Sync completed using device storage.');
      setTimeout(() => setOfflineSyncFeedback(null), 3000);
    } finally {
      setIsSyncingOfflineData(false);
    }
  };

  const handlePrecacheAllImages = () => {
    const allListings = store.getListings({ status: 'active' });
    const urls: string[] = [];
    allListings.forEach(l => {
      if (l.images && l.images.length > 0) urls.push(...l.images);
    });
    offlineSyncService.precacheImages(urls);
    setOfflineSyncFeedback(`Dispatched caching request to Service Worker for ${urls.length} product images.`);
    setTimeout(() => setOfflineSyncFeedback(null), 4000);
  };

  const handleAutoDetectDistrict = async () => {
    setIsDetectingLocation(true);
    setLocationUpdateSuccess(null);
    try {
      const result = await detectUserDistrict();
      setLocationDetectionResult(result);
      store.setLastDetectedLocation(result);
      if (result.success && result.district) {
        setSelectedDistrictSetting(result.district);
      }
    } catch (e) {
      console.warn('Geolocation detection error:', e);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleApplyDistrictSetting = (districtToApply?: string) => {
    const target = districtToApply || selectedDistrictSetting;
    store.setUserDefaultDistrict(currentUser.id, target);
    setSelectedDistrictSetting(target);
    onUpdateDistrict?.(target);
    setLocationUpdateSuccess(`Default district successfully saved to ${target}!`);
    setTimeout(() => setLocationUpdateSuccess(null), 3500);
  };

  const handleToggleAutoDetectOnLogin = (enabled: boolean) => {
    setAutoDetectOnLogin(enabled);
    store.setAutoDetectLocation(enabled);
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 2000);
  };

  const handleSimulateDistrict = (districtId: string) => {
    const sim = simulateDistrictDetection(districtId);
    setLocationDetectionResult(sim);
    setSelectedDistrictSetting(sim.district);
    store.setLastDetectedLocation(sim);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(newTheme);
    store.setTheme(newTheme);
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 2000);
  };

  const lowDataMode = store.getLowDataMode();
  const currency = store.getCurrency();

  // Listings for this seller
  const myListings = store.getListings({ sellerId: currentUser.id, status: 'all' });
  
  // Saved listings for this user
  const savedListings = store.getListings({ status: 'all' })
    .filter(l => currentUser.savedListingIds.includes(l.id));

  const handleMarkSold = (listingId: string) => {
    store.updateListing(listingId, { status: 'sold' });
    window.location.reload();
  };

  const handleDeleteListing = (listingId: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      store.deleteListing(listingId);
      window.location.reload();
    }
  };

  const handleVerifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length >= 4) {
      store.verifyUserPhone(currentUser.id);
      setOtpSuccess(true);
      setTimeout(() => {
        setShowOtpModal(false);
        window.location.reload();
      }, 1500);
    }
  };

  const handleSavePreferences = () => {
    store.updateUser(currentUser.id, {
      preferredContact,
      showPhonePublicly: showPhone,
      showWhatsAppPublicly: showWhatsApp
    });
    setSavedSettingsMsg(true);
    setTimeout(() => setSavedSettingsMsg(false), 2500);
  };

  const handleDeleteAccount = () => {
    if (confirm('Google Play & ANATECH Compliance: Deleting your account will immediately remove your listings, profile data, and conversation records. Continue?')) {
      store.deleteUserAccount(currentUser.id);
      alert('Your account and associated data have been permanently removed.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-500/30"
            />
            {(currentUser.verified || currentUser.isVerifiedSeller) && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-sm" title="Verified Trusted Seller">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              {(currentUser.verified || currentUser.isVerifiedSeller) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Verified Seller
                </span>
              )}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentUser.role}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                {currentUser.district} {currentUser.subCounty ? `· ${currentUser.subCounty}` : ''}
              </span>
              <span aria-hidden="true">·</span>
              <span>Joined {new Date(currentUser.joinedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-0.5 font-medium text-amber-500">
                ★ {currentUser.rating.toFixed(1)} ({currentUser.reviewCount} reviews)
              </span>
            </div>

            {/* Verification Status */}
            <div className="pt-1 flex items-center gap-2">
              {currentUser.isPhoneVerified ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Phone Verified ({currentUser.phone})
                </span>
              ) : (
                <button
                  onClick={() => setShowOtpModal(true)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Verify Phone Number (SMS OTP)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Cards: Subscription Plan & Aggregate Rating */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Aggregate Rating Card */}
          <button
            onClick={() => setActiveTab('reviews')}
            className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3.5 space-y-1 text-left hover:border-amber-400 dark:hover:border-amber-600 transition-colors shadow-2xs group"
            title="View full buyer ratings & reviews breakdown"
          >
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider font-semibold block">Seller Rating</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {aggregateRating.average.toFixed(1)}
                  </span>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.round(aggregateRating.average) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                {aggregateRating.totalReviews} reviews
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {aggregateRating.percentRecommended}% positive feedback
            </p>
          </button>

          {/* Subscription Plan Badge & Upgrade */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Seller Tier</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                  {currentUser.activePlan} Plan
                </span>
              </div>
              <button
                onClick={onOpenUpgradePlan}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
              >
                Upgrade
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {myListings.length} / {currentUser.activePlan === 'standard' ? 5 : currentUser.activePlan === 'pro' ? 30 : 'Unlimited'} active listings used
            </p>
          </div>
        </div>
      </div>

      {/* Seller Registration Status / CTA Card */}
      {currentUser.isRegisteredSeller || currentUser.role === 'seller' ? (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-white">
                  {currentUser.businessName || currentUser.name}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Ugandan Merchant
                </span>
                {currentUser.isNinVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Check className="w-3 h-3" />
                    NIN Verified
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {currentUser.physicalShopLocation && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Building className="w-3.5 h-3.5 text-cyan-400" />
                    {currentUser.physicalShopLocation}
                  </span>
                )}
                {currentUser.momoNumber && (
                  <span>· MoMo: {currentUser.momoNumber} ({currentUser.momoProvider || 'MTN'})</span>
                )}
                {currentUser.warrantyOffered && (
                  <span>· Warranty: {currentUser.warrantyOffered}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('seller_profile')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              View Storefront
            </button>
            {onOpenSellerRegistration && (
              <button
                onClick={onOpenSellerRegistration}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Seller Profile</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
              <Store className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Register Your Seller Profile on ANATECH MARKET
                </h2>
                <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Free & Instant
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Open your verified storefront in Uganda: Add your physical shop address, verify your Uganda National ID (NIN), configure MTN Mobile Money / Airtel Money payouts, and earn the official green Verified Seller checkmark.
              </p>
            </div>
          </div>

          {onOpenSellerRegistration && (
            <button
              onClick={onOpenSellerRegistration}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-98"
            >
              <Store className="w-4 h-4" />
              <span>Register Seller Profile</span>
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('my_listings')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 ${
            activeTab === 'my_listings'
              ? 'text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          My Listings ({myListings.length})
          {activeTab === 'my_listings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('seller_profile')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'seller_profile'
              ? 'text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Seller Profile</span>
          {(currentUser.isRegisteredSeller || currentUser.role === 'seller') && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          )}
          {activeTab === 'seller_profile' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 ${
            activeTab === 'reviews'
              ? 'text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Reviews & Ratings ({aggregateRating.totalReviews})
          {activeTab === 'reviews' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 ${
            activeTab === 'saved'
              ? 'text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Favorites ({savedListings.length})
          {activeTab === 'saved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap shrink-0 ${
            activeTab === 'settings'
              ? 'text-cyan-600 dark:text-cyan-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Settings & Compliance
          {activeTab === 'settings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400" />
          )}
        </button>
      </div>

      {/* Tab 1: My Listings */}
      {activeTab === 'my_listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Manage status, view counts, and mark items as sold
            </span>
            <button
              onClick={onOpenSellModal}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              + Post New Item
            </button>
          </div>

          {myListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myListings.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3 shadow-xs"
                >
                  <img
                    src={item.images[0]}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          item.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          item.status === 'sold' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {store.formatPrice(item.price)}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.viewsCount} views · {item.district}
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 pt-2 text-xs">
                      <button
                        onClick={() => onSelectListing(item)}
                        className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
                      >
                        View
                      </button>
                      {item.status === 'active' && (
                        <button
                          onClick={() => handleMarkSold(item.id)}
                          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 font-medium"
                        >
                          Mark as Sold
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteListing(item.id)}
                        className="text-rose-500 hover:text-rose-700 font-medium ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">You haven’t posted any listings yet.</p>
              <button
                onClick={onOpenSellModal}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold"
              >
                Create First Listing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Seller Profile & Registered Storefront */}
      {activeTab === 'seller_profile' && (
        <div className="space-y-6">
          {/* Main Storefront Identity Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.businessName || currentUser.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500/30"
                  />
                  {(currentUser.verified || currentUser.isVerifiedSeller) && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs" title="Verified Merchant">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                      {currentUser.businessName || `${currentUser.name}'s Storefront`}
                    </h2>
                    {(currentUser.verified || currentUser.isVerifiedSeller) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Verified Ugandan Merchant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80">
                        Registration Pending Verification
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Operated by {currentUser.name} · {currentUser.district} {currentUser.subCounty ? `· ${currentUser.subCounty}` : ''}
                  </p>
                </div>
              </div>

              {onOpenSellerRegistration && (
                <button
                  onClick={onOpenSellerRegistration}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{currentUser.isRegisteredSeller ? 'Edit Store Credentials' : 'Complete Registration'}</span>
                </button>
              )}
            </div>

            {/* Verification & Trust Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Uganda NIN</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {currentUser.ninNumber ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      {currentUser.ninNumber.slice(0, 4)}••••{currentUser.ninNumber.slice(-3)} (Verified)
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Not Submitted</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">National ID verification badge</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Mobile Money Payout</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {currentUser.momoNumber ? (
                    <span>{currentUser.momoProvider || 'MTN MoMo'}: {currentUser.momoNumber}</span>
                  ) : (
                    <span className="text-slate-400">Not Configured</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Direct buyer settlements</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Working Hours</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.shopWorkingHours || 'Mon - Sat: 8:30 AM - 7:00 PM'}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Physical store availability</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
                  <Award className="w-4 h-4" />
                  <span>Buyer Warranty</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.warrantyOffered || 'Standard Return Policy'}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Protects customer purchases</p>
              </div>
            </div>
          </div>

          {/* Details Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Physical Shop Location & Hours */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-600" />
                  <span>Physical Storefront & Location</span>
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Walk-in Ready
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Shop / Building Address</span>
                  <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <div>{currentUser.physicalShopLocation || 'Walk-in shop location not provided yet.'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {currentUser.district}, {currentUser.subCounty || 'Central Division'}, Uganda
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Operating Schedule</span>
                  <div className="mt-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser.shopWorkingHours || 'Monday - Saturday: 8:30 AM - 7:00 PM'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Supported Delivery & Pickup Methods</span>
                  <div className="flex flex-wrap gap-2">
                    {(currentUser.deliveryModes && currentUser.deliveryModes.length > 0 ? currentUser.deliveryModes : ['buyer_pickup', 'seller_delivers', 'public_meetup']).map(mode => (
                      <span key={mode} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] font-semibold">
                        <Truck className="w-3 h-3" />
                        {mode === 'buyer_pickup' ? 'Store Walk-in Pickup' : mode === 'seller_delivers' ? 'Boda Boda / Courier' : 'Public Safe Meetup'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Credentials & Compliance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Uganda Business Compliance</span>
                </h3>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                  NIRA & URA Ready
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">National Identification Number (NIN)</span>
                  <div className="mt-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span className="font-mono">
                      {currentUser.ninNumber || 'CM92018472938X'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" /> Verified with NIRA
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">URA TIN (Tax Identification Number)</span>
                  <div className="mt-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span className="font-mono">
                      {currentUser.tinNumber || '1019283746 (Uganda Revenue Authority)'}
                    </span>
                    <span className="text-[11px] text-cyan-600 font-bold">Active Taxpayer</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Store Bio & Buyer Guarantee</span>
                  <p className="mt-1 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {currentUser.bio || 'Direct importer and distributor providing genuine electronics with manufacturer warranties and instant local pickup in Kampala.'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block mb-1">Primary Categories Handled</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(currentUser.categoriesHandled && currentUser.categoriesHandled.length > 0 ? currentUser.categoriesHandled : ['electronics', 'phones', 'computers']).map(cat => (
                      <span key={cat} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] capitalize font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Reviews & Ratings */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Aggregate Rating Hero Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Seller Ratings & Buyer Reviews
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transaction feedback and verified ratings left by buyers on ANATECH MARKET
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{aggregateRating.verifiedCount} Verified Deals</span>
                </span>
              </div>
            </div>

            {/* Score & Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Score Left Column */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {aggregateRating.average.toFixed(1)}
                </span>
                <div className="flex items-center gap-1 my-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(aggregateRating.average) 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  Based on {aggregateRating.totalReviews} buyer {aggregateRating.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
                <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                  <ThumbsUp className="w-3 h-3 text-emerald-600" />
                  <span className="tabular-nums">{aggregateRating.percentRecommended}% Recommended</span>
                </div>
              </div>

              {/* Star Breakdown Bars Right Column */}
              <div className="md:col-span-8 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = aggregateRating.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
                  const pct = aggregateRating.totalReviews > 0 ? Math.round((count / aggregateRating.totalReviews) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => setReviewStarFilter(reviewStarFilter === stars ? 'all' : stars)}
                        className={`w-14 text-left font-medium flex items-center gap-1 hover:text-cyan-600 ${
                          reviewStarFilter === stars ? 'text-cyan-600 font-bold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{stars}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </button>

                      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="w-14 text-right text-slate-400 tabular-nums text-[11px]">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
              <button
                onClick={() => setReviewStarFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  reviewStarFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({sellerReviews.length})
              </button>
              {[5, 4, 3].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewStarFilter(star)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                    reviewStarFilter === star
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>{star}★</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setReviewVerifiedOnly(!reviewVerifiedOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                reviewVerifiedOnly
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Deals Only</span>
            </button>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {sellerReviews
              .filter(r => (reviewStarFilter === 'all' || r.rating === reviewStarFilter) && (!reviewVerifiedOnly || r.verifiedTransaction))
              .map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.buyerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
                        alt={rev.buyerName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
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

                  {rev.listingTitle && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-slate-400" />
                      <span>Item: <strong className="text-slate-700 dark:text-slate-300">{rev.listingTitle}</strong></span>
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              ))}

            {sellerReviews.length === 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
                <Star className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No Buyer Reviews Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When buyers agree on offers or complete purchases with you in your district, they are prompted to leave feedback.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Saved Favorites */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedListings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedListings.map(listing => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={true}
                  onToggleFavorite={() => store.toggleFavorite(currentUser.id, listing.id)}
                  onClick={() => onSelectListing(listing)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-2">
              <Heart className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">No saved favorites yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings & Compliance */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
          {savedSettingsMsg && (
            <div className="bg-emerald-50 text-emerald-800 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings successfully saved!
            </div>
          )}

          {/* Appearance & Theme Toggle (Persistent across sessions) */}
          <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Display Theme</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    Persisted
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between light and dark modes. Your preference is remembered across visits and reloads.
                </p>
              </div>

              <span className="text-xs font-mono font-bold capitalize text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                {currentTheme}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  currentTheme === 'light'
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${currentTheme === 'light' ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Sun className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</span>
                    {currentTheme === 'light' && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Crisp daytime view
                  </span>
                </div>
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  currentTheme === 'dark'
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${currentTheme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Moon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</span>
                    {currentTheme === 'dark' && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Deep navy & cyan
                  </span>
                </div>
              </button>

              {/* System Option */}
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  currentTheme === 'system'
                    ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${currentTheme === 'system' ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">System</span>
                    {currentTheme === 'system' && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Follow OS theme
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Default Location & Browser Geolocation Auto-Detection Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="p-1.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-lg">
                    <Navigation className="w-4 h-4" />
                  </span>
                  <span>Default Location & District Auto-Detection</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Use your browser's Geolocation API to detect your Ugandan district and personalize local marketplace listings and seller inquiries.
                </p>
              </div>

              {/* Current Default Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 text-cyan-900 dark:text-cyan-300 text-xs font-semibold self-start sm:self-auto">
                <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Default: <strong>{currentUser.district || 'Kampala'}</strong></span>
              </div>
            </div>

            {/* Success toast / notification inside settings */}
            {locationUpdateSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{locationUpdateSuccess}</span>
              </div>
            )}

            {/* Geolocation Detection Action Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Auto-Detect with Browser Geolocation API</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Calculates your nearest Ugandan district using GPS coordinate geodesics.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoDetectDistrict}
                  disabled={isDetectingLocation}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs self-start sm:self-auto shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Detecting Location...' : 'Auto-Detect District'}</span>
                </button>
              </div>

              {/* Live Detection Result Card */}
              {locationDetectionResult && (
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Detected: {locationDetectionResult.district}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {locationDetectionResult.region} Region
                          </span>
                        </div>
                        {locationDetectionResult.nearestHub && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Nearest Market Hub: <strong>{locationDetectionResult.nearestHub}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {locationDetectionResult.coords && (
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                        {locationDetectionResult.coords.latitude}°N, {locationDetectionResult.coords.longitude}°E (±{locationDetectionResult.coords.accuracy}m)
                      </span>
                    )}
                  </div>

                  {/* Suggestion & Action to set as default */}
                  {locationDetectionResult.district.toLowerCase() !== (currentUser.district || '').toLowerCase() ? (
                    <div className="p-2.5 bg-cyan-50/80 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-cyan-900 dark:text-cyan-200">
                        <span>Suggested Default: Set <strong>{locationDetectionResult.district}</strong> as your primary location?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyDistrictSetting(locationDetectionResult.district)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs self-start sm:self-auto shrink-0 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply as Default Location</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{locationDetectionResult.district} is already set as your current default location.</span>
                    </div>
                  )}

                  {locationDetectionResult.error && (
                    <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{locationDetectionResult.error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Manual District Selection Fallback */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Or select your default Ugandan district manually:
                  </label>
                  <select
                    value={selectedDistrictSetting}
                    onChange={(e) => setSelectedDistrictSetting(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                  >
                    {UGANDAN_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.region} Region)
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyDistrictSetting()}
                  className="sm:self-end px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors"
                >
                  Save Default Location
                </button>
              </div>

              {/* Auto-detect on login preference toggle */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Auto-detect district on initial login
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prompt with suggested district when opening the app or logging in on a new device.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoDetectOnLogin}
                    onChange={(e) => handleToggleAutoDetectOnLogin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              {/* Quick simulation chips for testing & demo */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  Test Geolocation Districts (Quick Simulation):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Kampala', id: 'kampala' },
                    { name: 'Wakiso', id: 'wakiso' },
                    { name: 'Jinja', id: 'jinja' },
                    { name: 'Mbarara', id: 'mbarara' },
                    { name: 'Gulu', id: 'gulu' },
                    { name: 'Mbale', id: 'mbale' },
                    { name: 'Fort Portal', id: 'fort-portal' }
                  ].map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSimulateDistrict(city.id)}
                      className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-600 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Contact Preferences */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Privacy & Contact Preferences
            </h3>
            <p className="text-xs text-slate-500">
              Control which contact details are shown to prospective buyers.
            </p>

            <div className="space-y-2 pt-1 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWhatsApp}
                  onChange={(e) => setShowWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
                <span>Allow buyers to initiate WhatsApp chat</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
                <span>Allow buyers to place direct phone calls</span>
              </label>
            </div>

            <button
              onClick={handleSavePreferences}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold"
            >
              Save Preferences
            </button>
          </div>

          {/* Saved Search Criteria & Push Alerts Management */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Saved Search Alerts & Push Notifications</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your saved filter criteria and instant notification preferences for new marketplace listings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSavedAlertsModal(true)}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Manage Search Alerts ({store.getSavedSearches().length})</span>
              </button>
            </div>
          </div>

          {/* Policies & Google Play Readiness */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Legal Policies & Play Store Compliance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={onOpenSafeTrading}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">Safe Trading & Fraud Policy</span>
                  <span className="text-[11px] text-slate-400">Uganda local buyer & seller protection</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onOpenSafeTrading}
                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">Terms & Privacy Policy</span>
                  <span className="text-[11px] text-slate-400">Data protection & prohibited items</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Offline Caching & Local Storage Syncing Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Offline Caching & Local Storage Syncing
                    </h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      offlineSyncStats.isOnline
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80'
                    }`}>
                      {offlineSyncStats.isOnline ? (
                        <>
                          <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Online Node Connected</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Offline Mode Active</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Service Worker and browser Local Storage preserve listings, photos, and chat threads so you can view them anytime without internet.
                  </p>
                </div>
              </div>
            </div>

            {/* Sync Feedback Toast */}
            {offlineSyncFeedback && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{offlineSyncFeedback}</span>
              </div>
            )}

            {/* Offline Storage Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Cached Listings</div>
                <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {offlineSyncStats.cachedListingsCount} products
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Available offline</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Saved Conversations</div>
                <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {offlineSyncStats.cachedConversationsCount} threads
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Local storage synced</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Last Synchronized</div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-1">
                  {new Date(offlineSyncStats.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(offlineSyncStats.lastSyncedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Auto-syncs on reload</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleForceOfflineSync}
                disabled={isSyncingOfflineData}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOfflineData ? 'animate-spin' : ''}`} />
                <span>{isSyncingOfflineData ? 'Synchronizing...' : 'Synchronize Local Storage Now'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrecacheAllImages}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-200/80 dark:border-slate-700/80"
                title="Requests Service Worker to precache photos of all currently available items"
              >
                <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Pre-cache All Product Photos</span>
              </button>
            </div>
          </div>

          {/* Mobile App & Android APK Installation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Install on Android Phone (WebAPK & Standalone APK)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Install ANATECH MARKET directly on your Android device with standalone full-screen display, offline mode, and push alerts.
                </p>
              </div>

              {onOpenInstall && (
                <button
                  type="button"
                  onClick={onOpenInstall}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open Android Install Hub</span>
                </button>
              )}
            </div>
          </div>

          {/* Account Deletion (Play Store Requirement) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Account Deletion
            </h3>
            <p className="text-xs text-slate-500">
              Per Google Play and GDPR/consumer protection guidelines, you can request immediate, permanent deletion of your account, active listings, and chat history.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
            >
              Permanently Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Phone OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Verify Ugandan Phone Number
              </h3>
              <p className="text-xs text-slate-500">
                A 6-digit SMS verification code has been sent to <strong>{currentUser.phone}</strong>.
              </p>
            </div>

            {otpSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <span className="text-xs font-bold block">Phone Number Verified!</span>
                <span className="text-[11px]">Your Verified Trader Trust Badge is now active.</span>
              </div>
            ) : (
              <form onSubmit={handleVerifyPhone} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code (e.g. 582194)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={otpCode.length < 4}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs"
                >
                  Confirm & Verify
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 py-1"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Saved Alerts Management Modal */}
      <SavedAlertsDrawerModal
        isOpen={showSavedAlertsModal}
        onClose={() => setShowSavedAlertsModal(false)}
        onApplySearch={() => {
          setShowSavedAlertsModal(false);
          window.location.hash = '#home';
        }}
        onOpenSaveNew={() => {
          setShowSavedAlertsModal(false);
        }}
      />
    </div>
  );
};
