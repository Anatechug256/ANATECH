/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import { store } from './services/marketplaceStore';
import { User, ProductListing, UserRole, NotificationItem } from './types';
import { Navbar } from './components/Navbar';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { CategoriesView } from './components/CategoriesView';
import { MessagesView } from './components/MessagesView';
import { ProfileView } from './components/ProfileView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SellListingModal } from './components/SellListingModal';
import { PaymentModal } from './components/PaymentModal';
import { ReportModal } from './components/ReportModal';
import { SafeTradingModal } from './components/SafeTradingModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { NotificationsModal } from './components/NotificationsModal';
import { DistrictDetectionPromptModal } from './components/DistrictDetectionPromptModal';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { SellerProfileModal } from './components/SellerProfileModal';
import { LeaveReviewModal } from './components/LeaveReviewModal';
import { InstallAppModal } from './components/InstallAppModal';
import { SellerRegistrationModal } from './components/SellerRegistrationModal';
import { SellerRegistrationPromptModal } from './components/SellerRegistrationPromptModal';
import { AnatechAgentModal } from './components/AnatechAgentModal';
import { detectUserDistrict, GeolocationDetectionResult } from './utils/districtGeolocation';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  
  // Modals state
  const [selectedListing, setSelectedListing] = useState<ProductListing | null>(null);
  const [showSellModal, setShowSellModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentTargetListingId, setPaymentTargetListingId] = useState<string | undefined>(undefined);
  const [paymentDefaultPlan, setPaymentDefaultPlan] = useState<'featured' | 'pro' | 'business'>('pro');
  const [showSafeTradingModal, setShowSafeTradingModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showSellerRegistrationModal, setShowSellerRegistrationModal] = useState<boolean>(false);
  const [showSellerPromptModal, setShowSellerPromptModal] = useState<boolean>(false);
  const [pendingOpenSellAfterRegistration, setPendingOpenSellAfterRegistration] = useState<boolean>(false);
  const [showAiAgentModal, setShowAiAgentModal] = useState<boolean>(false);

  // Seller Profile & Reviews Modals State
  const [sellerProfileId, setSellerProfileId] = useState<string | null>(null);
  const [leaveReviewData, setLeaveReviewData] = useState<{
    sellerId: string;
    listingId?: string;
    listingTitle?: string;
    transactionId?: string;
  } | null>(null);

  // Geolocation Initial Login Suggestion State
  const [showGeoModal, setShowGeoModal] = useState<boolean>(false);
  const [geoDetectionResult, setGeoDetectionResult] = useState<GeolocationDetectionResult | null>(null);
  const [isDetectingGeo, setIsDetectingGeo] = useState<boolean>(false);

  // Reporting State
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'listing' | 'user';
    targetId: string;
    targetTitle: string;
  } | null>(null);

  // Android App / PWA WebAPK Installation State
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  // Data from store
  const [listings, setListings] = useState<ProductListing[]>(store.getListings({ status: 'all' }));
  const [conversations, setConversations] = useState(store.getConversations(currentUser.id));
  const [notifications, setNotifications] = useState(store.getNotifications(currentUser.id));

  // Sync state when current user or store updates
  const refreshData = () => {
    const updatedUser = store.getCurrentUser();
    setCurrentUser(updatedUser);
    setListings(store.getListings({ status: 'all' }));
    setConversations(store.getConversations(updatedUser.id));
    setNotifications(store.getNotifications(updatedUser.id));
  };

  const triggerAutoDistrictDetection = async (targetUser: User) => {
    if (!store.getAutoDetectLocation()) return;
    if (store.hasUserCheckedLocation(targetUser.id)) return;

    setIsDetectingGeo(true);
    try {
      const result = await detectUserDistrict();
      store.setLastDetectedLocation(result);
      if (result.success && result.district) {
        setGeoDetectionResult(result);
        setShowGeoModal(true);
      }
      store.markUserLocationChecked(targetUser.id);
    } catch (e) {
      console.warn('Geolocation auto-detection failed:', e);
      store.markUserLocationChecked(targetUser.id);
    } finally {
      setIsDetectingGeo(false);
    }
  };

  useEffect(() => {
    store.applyTheme();
    refreshData();
    triggerAutoDistrictDetection(currentUser);

    // Check if running in native standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) {
        setIsAppInstalled(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredInstallPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsAppInstalled(true);
        setDeferredInstallPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    store.switchRole(role);
    const updated = store.getCurrentUser();
    refreshData();
    if (!store.hasUserCheckedLocation(updated.id)) {
      triggerAutoDistrictDetection(updated);
    }
  };

  const handleAcceptGeoDistrict = (newDistrict: string) => {
    store.setUserDefaultDistrict(currentUser.id, newDistrict);
    setSelectedDistrict(newDistrict);
    setShowGeoModal(false);
    refreshData();
  };

  const handleSelectAlternativeGeoDistrict = (newDistrict: string) => {
    store.setUserDefaultDistrict(currentUser.id, newDistrict);
    setSelectedDistrict(newDistrict);
    setShowGeoModal(false);
    refreshData();
  };

  const handleDismissGeoModal = () => {
    store.markUserLocationChecked(currentUser.id);
    setShowGeoModal(false);
  };

  const handleReDetectGeo = async () => {
    setIsDetectingGeo(true);
    try {
      const result = await detectUserDistrict();
      setGeoDetectionResult(result);
      store.setLastDetectedLocation(result);
    } catch (e) {
      console.warn('Re-detect failed:', e);
    } finally {
      setIsDetectingGeo(false);
    }
  };

  const handleToggleFavorite = (listingId: string) => {
    store.toggleFavorite(currentUser.id, listingId);
    refreshData();
  };

  const handleListingSelect = (listing: ProductListing) => {
    store.incrementListingViews(listing.id);
    store.trackRecentlyViewed(listing.id, currentUser.id);
    setSelectedListing(listing);
    refreshData();
  };

  const handleStartChat = (listing: ProductListing, initialMessage?: string) => {
    if (currentUser.id === listing.sellerId) {
      alert('You cannot message yourself as the seller.');
      return;
    }
    const conv = store.createConversation(listing.id, currentUser.id, initialMessage || `Hello, is "${listing.title}" still available?`);
    setSelectedListing(null);
    setActiveTab('messages');
    refreshData();
  };

  const handleOpenReportListing = (listing: ProductListing) => {
    setReportTarget({
      targetType: 'listing',
      targetId: listing.id,
      targetTitle: listing.title
    });
  };

  const handleOpenReportFromChat = (targetId: string, title: string) => {
    setReportTarget({
      targetType: 'user',
      targetId,
      targetTitle: title
    });
  };

  const handleListingCreated = (newListing: ProductListing) => {
    setShowSellModal(false);
    refreshData();
    if (newListing.status === 'pending') {
      alert(`Listing submitted! As an item in "${newListing.categoryId}", it is in the trust & safety queue and will be published once reviewed by ANATECH moderators.`);
    } else {
      setSelectedListing(newListing);
    }
  };

  const handleOpenUpgradePlan = (planId?: 'pro' | 'business' | 'featured', listingId?: string) => {
    setPaymentDefaultPlan(planId || 'pro');
    setPaymentTargetListingId(listingId);
    setShowPaymentModal(true);
  };

  // Enforce mandatory seller registration before uploading items
  const handleOpenSellModal = () => {
    if (!currentUser.isRegisteredSeller && currentUser.role !== 'seller') {
      setPendingOpenSellAfterRegistration(true);
      setShowSellerPromptModal(true);
    } else {
      setShowSellModal(true);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const unreadMessagesCount = conversations.reduce((sum, c) => {
    return sum + (currentUser.id === c.sellerId ? c.unreadCountSeller : c.unreadCountBuyer);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-white">
      {/* Network Connectivity & Offline Local Storage Sync Banner */}
      <OfflineSyncBanner />

      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(dist) => setSelectedDistrict(dist)}
        onOpenSafeTrading={() => setShowSafeTradingModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenInstall={() => setShowInstallModal(true)}
        onOpenSellerRegistration={() => setShowSellerRegistrationModal(true)}
        onOpenAiAgent={() => setShowAiAgentModal(true)}
      />

      {/* Main View Area */}
      <div className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            listings={listings}
            savedListingIds={currentUser.savedListingIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectListing={handleListingSelect}
            onOpenSellModal={handleOpenSellModal}
            selectedDistrict={selectedDistrict}
            onSelectCategory={(catId) => setActiveCategoryId(catId)}
            activeCategoryId={activeCategoryId}
            onSelectDistrict={(dist) => setSelectedDistrict(dist)}
            currentUser={currentUser}
            onOpenInstall={() => setShowInstallModal(true)}
            onOpenAiAgent={() => setShowAiAgentModal(true)}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            onSelectCategory={(catId) => {
              setActiveCategoryId(catId);
              setActiveTab('home');
            }}
            onOpenSafeTrading={() => setShowSafeTradingModal(true)}
          />
        )}

        {activeTab === 'sell' && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-6 pb-24 md:pb-12">
            {/* Header Showcase Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 border border-cyan-500/30 p-5 sm:p-8 text-white shadow-xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
                <Store className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  ANATECH UGANDA SELLER CENTER
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  Start Selling on ANATECH MARKET
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Connect directly with verified buyers in your Ugandan district. Free standard listings, live camera photo capture, and verified Mobile Money payouts.
                </p>
              </div>

              {/* Status & CTA */}
              <div className="pt-2">
                {currentUser.isRegisteredSeller || currentUser.role === 'seller' ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Verified Active Seller Profile ({currentUser.businessName || currentUser.name})</span>
                    </div>
                    <div>
                      <button
                        onClick={handleOpenSellModal}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
                      >
                        + Create New Listing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Uganda Anti-Scam Policy: Registration Required Before Selling</span>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setPendingOpenSellAfterRegistration(true);
                          setShowSellerRegistrationModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                      >
                        Register as Seller (NIN & MoMo)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3 Trust Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-center">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">NIN & MoMo Verification</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Every seller verifies national identity and phone number to build buyer trust.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-center">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Local District Trades</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sell to buyers in your district who can meet in daylight and pay instantly.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-center">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">0% Standard Fees</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Free listings on phones, farm goods, clothing, and household items.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <MessagesView
            currentUser={currentUser}
            conversations={conversations}
            onOpenReport={handleOpenReportFromChat}
            onSelectListingId={(id) => {
              const item = store.getListingById(id);
              if (item) setSelectedListing(item);
            }}
            onOpenLeaveReview={(sellerId, listingId, listingTitle, transactionId) => {
              setLeaveReviewData({ sellerId, listingId, listingTitle, transactionId });
            }}
            onOpenSellerProfile={(sellerId) => setSellerProfileId(sellerId)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenUpgradePlan={() => handleOpenUpgradePlan('pro')}
            onOpenSafeTrading={() => setShowSafeTradingModal(true)}
            onSelectListing={handleListingSelect}
            onOpenSellModal={handleOpenSellModal}
            onUpdateDistrict={(newDist) => {
              setSelectedDistrict(newDist);
              refreshData();
            }}
            onOpenInstall={() => setShowInstallModal(true)}
            onOpenSellerRegistration={() => setShowSellerRegistrationModal(true)}
          />
        )}
      </div>

      {/* Fixed Bottom Navigation for Mobile / Tablet */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'sell') {
            handleOpenSellModal();
          } else {
            setActiveTab(tab);
          }
        }}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Product Detail Modal */}
      {selectedListing && (
        <ProductDetailModal
          listing={selectedListing}
          currentUser={currentUser}
          isFavorite={currentUser.savedListingIds.includes(selectedListing.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedListing.id)}
          onClose={() => setSelectedListing(null)}
          onStartChat={handleStartChat}
          onOpenReport={handleOpenReportListing}
          onOpenSellerProfile={(sellerId) => setSellerProfileId(sellerId)}
          onOpenLeaveReview={(sellerId, listingId, listingTitle) => {
            setLeaveReviewData({ sellerId, listingId, listingTitle });
          }}
        />
      )}

      {/* Sell Listing Modal */}
      {showSellModal && (
        <SellListingModal
          currentUser={currentUser}
          onClose={() => setShowSellModal(false)}
          onListingCreated={handleListingCreated}
          onOpenUpgradePlan={() => {
            setShowSellModal(false);
            handleOpenUpgradePlan('pro');
          }}
          onOpenSellerRegistration={() => {
            setShowSellModal(false);
            setPendingOpenSellAfterRegistration(true);
            setShowSellerRegistrationModal(true);
          }}
        />
      )}

      {/* Payment / Monetization Modal (MTN MoMo, Airtel Money, Subscriptions) */}
      {showPaymentModal && (
        <PaymentModal
          currentUser={currentUser}
          onClose={() => {
            setShowPaymentModal(false);
            refreshData();
          }}
          targetListingId={paymentTargetListingId}
          defaultPlanId={paymentDefaultPlan}
        />
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetTitle={reportTarget.targetTitle}
          onClose={() => setReportTarget(null)}
        />
      )}

      {/* Safe Trading & Policies Modal */}
      {showSafeTradingModal && (
        <SafeTradingModal
          onClose={() => setShowSafeTradingModal(false)}
        />
      )}

      {/* Admin & Moderator Console Modal */}
      {showAdminModal && (
        <AdminDashboardModal
          currentUser={currentUser}
          onClose={() => {
            setShowAdminModal(false);
            refreshData();
          }}
        />
      )}

      {/* In-App Notifications Modal */}
      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onSelectNotification={(notif) => {
            setShowNotificationsModal(false);
            if (notif.type === 'search_alert' && notif.targetId) {
              const matchedItem = store.getListingById(notif.targetId);
              if (matchedItem) {
                setSelectedListing(matchedItem);
                return;
              }
            }
            if (notif.linkTab) {
              setActiveTab(notif.linkTab as ActiveTab);
            }
          }}
        />
      )}

      {/* Browser Geolocation District Auto-Detection Modal */}
      <DistrictDetectionPromptModal
        isOpen={showGeoModal}
        detectedResult={geoDetectionResult}
        currentDistrict={currentUser.district || 'Kampala'}
        onAccept={handleAcceptGeoDistrict}
        onSelectAlternative={handleSelectAlternativeGeoDistrict}
        onDismiss={handleDismissGeoModal}
        onReDetect={handleReDetectGeo}
        isDetecting={isDetectingGeo}
      />

      {/* Public Seller Profile Modal with Aggregate Rating & Reviews */}
      {sellerProfileId && (
        <SellerProfileModal
          sellerId={sellerProfileId}
          currentUser={currentUser}
          onClose={() => setSellerProfileId(null)}
          onSelectListing={(item) => {
            setSellerProfileId(null);
            handleListingSelect(item);
          }}
          onStartChat={(item, msg) => {
            setSellerProfileId(null);
            handleStartChat(item, msg);
          }}
          onOpenLeaveReview={(sellerId, listingId, listingTitle) => {
            setLeaveReviewData({ sellerId, listingId, listingTitle });
          }}
        />
      )}

      {/* Post-Transaction Feedback & Review Modal */}
      {leaveReviewData && (
        <LeaveReviewModal
          currentUser={currentUser}
          sellerId={leaveReviewData.sellerId}
          defaultListingId={leaveReviewData.listingId}
          defaultListingTitle={leaveReviewData.listingTitle}
          defaultTransactionId={leaveReviewData.transactionId}
          onClose={() => setLeaveReviewData(null)}
          onReviewSubmitted={() => {
            setLeaveReviewData(null);
            refreshData();
          }}
        />
      )}
      {/* Android Device & PWA WebAPK Installation Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredInstallPrompt}
        isInstallable={Boolean(deferredInstallPrompt)}
        isAppInstalled={isAppInstalled}
        onTriggerInstall={handleTriggerInstall}
      />

      {/* Seller Business Profile Registration Wizard */}
      {showSellerRegistrationModal && (
        <SellerRegistrationModal
          currentUser={currentUser}
          onClose={() => {
            setShowSellerRegistrationModal(false);
            setPendingOpenSellAfterRegistration(false);
          }}
          onSuccess={(updatedUser) => {
            setShowSellerRegistrationModal(false);
            refreshData();
            if (pendingOpenSellAfterRegistration) {
              setPendingOpenSellAfterRegistration(false);
              setShowSellModal(true);
            }
          }}
        />
      )}

      {/* Mandatory Seller Registration Prompt Barrier Modal */}
      <SellerRegistrationPromptModal
        isOpen={showSellerPromptModal}
        onClose={() => {
          setShowSellerPromptModal(false);
          setPendingOpenSellAfterRegistration(false);
        }}
        onStartRegistration={() => {
          setShowSellerPromptModal(false);
          setShowSellerRegistrationModal(true);
        }}
        onOpenSafeTrading={() => setShowSafeTradingModal(true)}
        currentUser={currentUser}
      />

      {/* ANATECH Market AI Virtual Assistant Dialog */}
      <AnatechAgentModal
        isOpen={showAiAgentModal}
        onClose={() => setShowAiAgentModal(false)}
        currentUser={currentUser}
        onOpenSellerRegistration={() => setShowSellerRegistrationModal(true)}
        onOpenSafeTrading={() => setShowSafeTradingModal(true)}
        onOpenInstall={() => setShowInstallModal(true)}
        onExecuteSearch={(query) => {
          setActiveTab('home');
          // Update search history and refresh home
          store.addSearchQuery(query);
        }}
      />
    </div>
  );
}
