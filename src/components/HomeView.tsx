import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, X, PlusCircle, ArrowUpDown, 
  Sparkles, ShieldCheck, MapPin, ChevronRight, Check,
  Wallet, RotateCcw, BellRing, Bell, BookmarkCheck,
  HardDrive, WifiOff, Clock, Mic, MicOff, Volume2,
  Smartphone, Download, Car, Wheat, Shirt, ArrowRight,
  Zap, CheckCircle2, History, Bot
} from 'lucide-react';
import { ProductListing, Category, SavedSearchCriteria, User } from '../types';
import { CATEGORIES, UGANDAN_DISTRICTS } from '../data/categoriesAndDistricts';
import { ProductCard } from './ProductCard';
import { store } from '../services/marketplaceStore';
import { offlineSyncService } from '../services/offlineSyncService';
import { SaveSearchModal } from './SaveSearchModal';
import { SavedAlertsDrawerModal } from './SavedAlertsDrawerModal';
import { VoiceSearchModal } from './VoiceSearchModal';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { ParsedVoiceCommand } from '../utils/speechRecognition';

interface HomeViewProps {
  listings: ProductListing[];
  savedListingIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectListing: (listing: ProductListing) => void;
  onOpenSellModal: () => void;
  selectedDistrict: string;
  onSelectCategory: (categoryId: string) => void;
  activeCategoryId?: string;
  onSelectDistrict?: (district: string) => void;
  currentUser?: User;
  onOpenInstall?: () => void;
  onOpenAiAgent?: () => void;
}

const MAX_BUDGET_LIMIT = 10000000; // 10 Million UGX max slider ceiling

export const HomeView: React.FC<HomeViewProps> = ({
  listings,
  savedListingIds,
  onToggleFavorite,
  onSelectListing,
  onOpenSellModal,
  selectedDistrict,
  onSelectCategory,
  activeCategoryId = 'all',
  onSelectDistrict,
  currentUser,
  onOpenInstall,
  onOpenAiAgent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [budgetSliderValue, setBudgetSliderValue] = useState<number>(MAX_BUDGET_LIMIT);
  const [showBudgetSlider, setShowBudgetSlider] = useState<boolean>(false);
  const [onlyVerifiedSellers, setOnlyVerifiedSellers] = useState<boolean>(false);

  // Saved Search & Push Notifications State
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [showSavedAlertsModal, setShowSavedAlertsModal] = useState(false);
  const [savedAlertsCount, setSavedAlertsCount] = useState<number>(0);
  const [appliedAlertToast, setAppliedAlertToast] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Search History State (recent search tags stored in localStorage)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    return store.getSearchHistory();
  });

  const handleExecuteSearch = (query: string) => {
    const trimmed = query.trim();
    setSearchQuery(trimmed);
    if (trimmed.length >= 2) {
      const updated = store.addSearchQuery(trimmed);
      setSearchHistory(updated);
    }
  };

  const handleRemoveSearchQuery = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const updated = store.removeSearchQuery(query);
    setSearchHistory(updated);
  };

  const handleClearSearchHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.clearSearchHistory();
    setSearchHistory([]);
  };

  // Recently Viewed State (tracks the last 5 products clicked for navigation efficiency)
  const [recentlyViewedListings, setRecentlyViewedListings] = useState<ProductListing[]>(() => {
    return store.getRecentlyViewedListings(currentUser?.id);
  });

  const refreshRecentlyViewed = () => {
    setRecentlyViewedListings(store.getRecentlyViewedListings(currentUser?.id));
  };

  const refreshSavedAlertsCount = () => {
    const list = store.getSavedSearches();
    setSavedAlertsCount(list.length);
  };

  useEffect(() => {
    refreshRecentlyViewed();
  }, [currentUser?.id, listings]);

  const handleProductClick = (listing: ProductListing) => {
    if (searchQuery.trim().length >= 2) {
      const updated = store.addSearchQuery(searchQuery.trim());
      setSearchHistory(updated);
    }
    store.trackRecentlyViewed(listing.id, currentUser?.id);
    refreshRecentlyViewed();
    onSelectListing(listing);
  };

  const handleClearRecentlyViewed = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.clearRecentlyViewed(currentUser?.id);
    setRecentlyViewedListings([]);
  };

  // Web Speech API Voice Search State & Integration
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceToast, setVoiceToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleVoiceCommand = (cmd: ParsedVoiceCommand) => {
    if (cmd.intent === 'search') {
      handleExecuteSearch(cmd.cleanedQuery);
      setVoiceToast({ message: `Voice search: "${cmd.cleanedQuery}"`, type: 'success' });
      setTimeout(() => setVoiceToast(null), 3500);
    } else if (cmd.intent === 'clear') {
      setSearchQuery('');
      setSelectedCondition('all');
      setMinPrice('');
      setMaxPrice('');
      setBudgetSliderValue(MAX_BUDGET_LIMIT);
      setVoiceToast({ message: 'Cleared search & filters by voice command', type: 'info' });
      setTimeout(() => setVoiceToast(null), 3500);
    } else if (cmd.intent === 'category' && cmd.targetCategory) {
      onSelectCategory(cmd.targetCategory);
      const cat = CATEGORIES.find(c => c.id === cmd.targetCategory);
      setVoiceToast({ message: `Voice command: Opened "${cat?.name || 'Category'}"`, type: 'success' });
      setTimeout(() => setVoiceToast(null), 3500);
    } else if (cmd.intent === 'verified_only') {
      setOnlyVerifiedSellers(true);
      setVoiceToast({ message: 'Voice command: Showing verified sellers only', type: 'success' });
      setTimeout(() => setVoiceToast(null), 3500);
    }
  };

  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    interimTranscript: voiceInterim,
    error: voiceError,
    language: voiceLang,
    setLanguage: setVoiceLang,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    lastParsedCommand
  } = useVoiceSearch({
    onCommand: handleVoiceCommand,
    defaultLang: 'en-UG'
  });

  useEffect(() => {
    refreshSavedAlertsCount();
    const unsub = offlineSyncService.subscribe((state) => {
      setIsOnline(state.isOnline);
    });
    return () => unsub();
  }, []);

  const handleApplySavedSearch = (search: SavedSearchCriteria) => {
    if (search.query) setSearchQuery(search.query);
    else setSearchQuery('');

    if (search.condition) setSelectedCondition(search.condition);
    else setSelectedCondition('all');

    if (search.minPrice) setMinPrice(String(search.minPrice));
    else setMinPrice('');

    if (search.maxPrice) {
      setMaxPrice(String(search.maxPrice));
      setBudgetSliderValue(search.maxPrice);
    } else {
      setMaxPrice('');
      setBudgetSliderValue(MAX_BUDGET_LIMIT);
    }

    if (search.categoryId) {
      onSelectCategory(search.categoryId);
    } else {
      onSelectCategory('all');
    }

    if (search.district && onSelectDistrict) {
      onSelectDistrict(search.district);
    }

    setAppliedAlertToast(`Applied saved criteria: "${search.name}"`);
    setTimeout(() => setAppliedAlertToast(null), 3000);
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // Must be active
      if (item.status !== 'active') return false;

      // Category filter
      if (activeCategoryId && activeCategoryId !== 'all' && item.categoryId !== activeCategoryId) {
        return false;
      }

      // District filter
      if (selectedDistrict && selectedDistrict !== 'all' && item.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }

      // Condition filter
      if (selectedCondition !== 'all') {
        if (selectedCondition === 'new' && item.condition !== 'new') return false;
        if (selectedCondition === 'used' && !item.condition.startsWith('used') && item.condition !== 'like_new') return false;
      }

      // Price filter
      if (minPrice && item.price < Number(minPrice)) return false;
      if (maxPrice && item.price > Number(maxPrice)) return false;
      if (budgetSliderValue < MAX_BUDGET_LIMIT && item.price > budgetSliderValue) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesLoc = item.locationArea.toLowerCase().includes(q) || item.district.toLowerCase().includes(q);
        const matchesSub = item.subcategory.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesSub) return false;
      }

      // Verified sellers filter
      if (onlyVerifiedSellers && !item.verified && !item.sellerVerified) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'popular') return (b.viewsCount + b.favoritesCount * 3) - (a.viewsCount + a.favoritesCount * 3);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [listings, activeCategoryId, selectedDistrict, selectedCondition, minPrice, maxPrice, budgetSliderValue, searchQuery, sortBy, onlyVerifiedSellers]);

  // Featured listings for banner
  const featuredListings = useMemo(() => {
    return listings.filter(l => l.status === 'active' && l.isFeatured);
  }, [listings]);

  const activeCategory = CATEGORIES.find(c => c.id === activeCategoryId);

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Search & Filter Header Strip */}
      <section className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 py-3 sm:py-3.5 px-2.5 sm:px-4 sticky top-[50px] sm:top-[56px] z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2">
          {/* Main Search Input with Web Speech API Voice Search Button */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExecuteSearch(searchQuery);
                }
              }}
              placeholder="Search phones, boda, matooke, laptops..."
              className="w-full pl-8.5 pr-16 sm:pr-18 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
            />
            
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Web Speech API Microphone Trigger */}
              <button
                type="button"
                onClick={() => {
                  if (isVoiceListening) {
                    stopVoiceListening();
                  } else {
                    setShowVoiceModal(true);
                  }
                }}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  isVoiceListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-xs shadow-rose-500/50 scale-105'
                    : 'text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
                title={
                  !isVoiceSupported
                    ? 'Voice search (requires Web Speech API browser)'
                    : isVoiceListening
                    ? 'Listening... Click to stop voice search'
                    : 'Search with voice command (Web Speech API)'
                }
                aria-label="Voice search with microphone"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Budget Slider Trigger Button */}
          <button
            onClick={() => setShowBudgetSlider(!showBudgetSlider)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              budgetSliderValue < MAX_BUDGET_LIMIT || showBudgetSlider
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            aria-label="Filter by UGX budget"
            title="Filter by UGX budget range slider"
          >
            <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">
              {budgetSliderValue < MAX_BUDGET_LIMIT ? `≤ ${(budgetSliderValue / 1000000).toFixed(1)}M UGX` : 'Budget'}
            </span>
            {budgetSliderValue < MAX_BUDGET_LIMIT && (
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
            )}
          </button>

          {/* Filter Modal Trigger */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer"
            aria-label="Filter listings"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {(selectedCondition !== 'all' || minPrice || maxPrice || budgetSliderValue < MAX_BUDGET_LIMIT) && (
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
            )}
          </button>

          {/* Ask AI Agent Button - High Visibility on Mobile & Desktop */}
          {onOpenAiAgent && (
            <button
              type="button"
              onClick={onOpenAiAgent}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md shadow-cyan-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Ask ANATECH AI Agent (Uganda Market Assistant)"
              aria-label="Ask ANATECH AI Agent"
            >
              <Bot className="w-4 h-4 stroke-[2.3]" />
              <span className="font-black">Ask AI</span>
            </button>
          )}

          {/* Save Search Criteria & Enable Push Alerts Trigger */}
          <button
            onClick={() => setShowSaveSearchModal(true)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 shadow-xs cursor-pointer"
            title="Save current filter criteria and get push notifications when new matching items are posted"
          >
            <BellRing className="w-4 h-4" />
            <span className="hidden md:inline">Save Alert</span>
          </button>

          {/* Saved Search Alerts Drawer Trigger */}
          <button
            onClick={() => setShowSavedAlertsModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 relative cursor-pointer"
            title="View and manage saved search criteria & push alerts"
          >
            <BookmarkCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden lg:inline">Saved Alerts</span>
            {savedAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-600 text-white text-[10px] font-black">
                {savedAlertsCount}
              </span>
            )}
          </button>

          {/* Quick Sell Button on Desktop / Tablet */}
          <button
            onClick={onOpenSellModal}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Post Listing</span>
          </button>
        </div>

        {/* Live Web Speech Recognition Listening Bar */}
        {isVoiceListening && (
          <div className="max-w-7xl mx-auto mt-2.5 p-2.5 px-3.5 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/80 rounded-xl flex items-center justify-between gap-3 text-xs text-cyan-950 dark:text-cyan-100 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="font-bold shrink-0 text-cyan-800 dark:text-cyan-300">Listening by Voice:</span>
              <span className="truncate italic font-semibold text-slate-800 dark:text-slate-100">
                {voiceInterim || voiceTranscript || 'Speak your search (e.g. "Toyota Premio" or "Clear search")...'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="text-[11px] underline font-semibold text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-white"
              >
                Panel
              </button>
              <button
                type="button"
                onClick={stopVoiceListening}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Voice Command Confirmation Toast */}
        {voiceToast && (
          <div className="max-w-7xl mx-auto mt-2 p-2.5 px-3.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold shadow-md animate-in fade-in duration-150">
            <div className="flex items-center gap-2 truncate">
              <Mic className="w-3.5 h-3.5 text-cyan-400 dark:text-cyan-600 shrink-0" />
              <span className="truncate">{voiceToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceToast(null)}
              className="text-slate-400 hover:text-white dark:hover:text-slate-900 p-0.5 shrink-0"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Recent Search Queries / Search History Tags */}
        {searchHistory.length > 0 && (
          <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 select-none pr-0.5">
              <History className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="hidden xs:inline">Recent:</span>
            </div>
            
            <div className="flex items-center gap-1.5 min-w-0">
              {searchHistory.map((query) => {
                const isActive = searchQuery.toLowerCase().trim() === query.toLowerCase().trim();
                return (
                  <div
                    key={query}
                    className={`group flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/50 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/90 dark:hover:bg-slate-700/90'
                    }`}
                    onClick={() => handleExecuteSearch(query)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleExecuteSearch(query);
                      }
                    }}
                  >
                    <span>{query}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSearchQuery(e, query)}
                      className="p-0.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={`Remove "${query}" from search history`}
                      aria-label={`Remove "${query}" from search history`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleClearSearchHistory}
              className="text-[11px] font-bold text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0 ml-auto whitespace-nowrap cursor-pointer"
              title="Clear all recent search queries"
            >
              Clear
            </button>
          </div>
        )}

        {/* Horizontal Category Chips Bar */}
        <div className="max-w-7xl mx-auto mt-2.5 sm:mt-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              activeCategoryId === 'all'
                ? 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 text-white shadow-xs shadow-cyan-500/25'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Products
          </button>

          {/* Verified Sellers Quick Filter Chip */}
          <button
            type="button"
            onClick={() => setOnlyVerifiedSellers(!onlyVerifiedSellers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              onlyVerifiedSellers
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs shadow-emerald-500/25'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
            title="Show only listings from verified trusted sellers"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Verified Sellers</span>
            {onlyVerifiedSellers && <Check className="w-3 h-3 ml-0.5" />}
          </button>

          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeCategoryId === cat.id
                  ? 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 text-white shadow-xs shadow-cyan-500/25'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Interactive UGX Price Range Slider Filter Panel */}
        {showBudgetSlider && (
          <div className="max-w-7xl mx-auto mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl space-y-3 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Filter by UGX Budget:
                </span>
                <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800">
                  {budgetSliderValue < MAX_BUDGET_LIMIT 
                    ? `Up to UGX ${budgetSliderValue.toLocaleString()}` 
                    : 'Any Budget (Up to 10M+ UGX)'}
                </span>
              </div>

              {budgetSliderValue < MAX_BUDGET_LIMIT && (
                <button
                  type="button"
                  onClick={() => setBudgetSliderValue(MAX_BUDGET_LIMIT)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 self-start sm:self-auto font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Budget</span>
                </button>
              )}
            </div>

            {/* Price Slider Input */}
            <div className="space-y-1">
              <input
                type="range"
                min={50000}
                max={MAX_BUDGET_LIMIT}
                step={50000}
                value={budgetSliderValue}
                onChange={(e) => setBudgetSliderValue(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>UGX 50k</span>
                <span>UGX 2.5M</span>
                <span>UGX 5M</span>
                <span>UGX 7.5M</span>
                <span>UGX 10M+</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
              {[
                { label: '≤ 50k', val: 50000 },
                { label: '≤ 200k', val: 200000 },
                { label: '≤ 1M', val: 1000000 },
                { label: '≤ 3M', val: 3000000 },
                { label: '≤ 5M', val: 5000000 },
                { label: 'Any Budget', val: MAX_BUDGET_LIMIT },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setBudgetSliderValue(p.val)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                    budgetSliderValue === p.val
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Applied Alert Notification Toast */}
        {appliedAlertToast && (
          <div className="max-w-7xl mx-auto mt-2.5 p-2.5 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 rounded-xl text-xs font-semibold text-cyan-800 dark:text-cyan-200 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{appliedAlertToast}</span>
            </div>
            <button onClick={() => setAppliedAlertToast(null)} className="text-cyan-700 hover:text-cyan-950">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-4 space-y-4 sm:space-y-6">
        {/* Unmissable ANATECH AI Agent Interactive Banner */}
        {onOpenAiAgent && (
          <div 
            onClick={onOpenAiAgent}
            className="p-3 sm:p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 hover:from-slate-900 hover:to-cyan-900 border-2 border-cyan-400/50 hover:border-cyan-400 rounded-2xl flex items-center justify-between gap-3 text-white shadow-lg shadow-cyan-950/30 cursor-pointer transition-all group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenAiAgent(); }}}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-400 p-0.5 shadow-md shrink-0 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-white">ANATECH AI Agent Assistant</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">Online</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                  Ask about Ugandan prices, safe police station meetups, or NIN seller rules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 text-slate-950 text-xs sm:text-sm font-black rounded-xl shrink-0 shadow-md group-hover:shadow-cyan-400/30 transition-all">
              <span>Open AI</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        )}

        {/* Vibrant Ugandan Tech Marketplace Hero Showcase */}
        {activeCategoryId === 'all' && !searchQuery && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 border border-cyan-500/30 p-4 sm:p-6 text-white shadow-xl">
            {/* Ambient decorative glowing blobs */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Top kicker badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>UGANDA'S VERIFIED TRADE NETWORK</span>
                </span>
                <span className="text-xs text-amber-400 font-bold hidden sm:inline">
                  · 146 Districts Connected
                </span>
              </div>

              {/* Main Hero Headline */}
              <div className="space-y-1.5 max-w-2xl">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                  Gula n’Okutunda mu Mirembe.{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                    Buy & Sell Locally.
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  East Africa’s trusted direct marketplace by ANATECH UG. Verified local sellers, direct Mobile Money simulation, live camera verification, and zero middleman markup.
                </p>
              </div>

              {/* 4 Trust Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-200 text-[11px] sm:text-xs">100% ID Verified</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-slate-200 text-[11px] sm:text-xs">MTN & Airtel MoMo</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-slate-200 text-[11px] sm:text-xs">Local Pickup Only</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="font-semibold text-slate-200 text-[11px] sm:text-xs">No Advance Scams</span>
                </div>
              </div>

              {/* Quick Category Action Cards (1-Tap jumps to top categories) */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-semibold block mb-2">Explore Popular Markets:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => onSelectCategory('phones-electronics')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Smartphone className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="text-xs font-bold text-white truncate">Phones & Tech</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => onSelectCategory('vehicles-motorbikes')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Car className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="text-xs font-bold text-white truncate">Boda & Cars</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => onSelectCategory('farm-produce-agriculture')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Wheat className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="text-xs font-bold text-white truncate">Produce & Farm</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>

                  <button
                    onClick={() => onSelectCategory('clothing-shoes')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Shirt className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="text-xs font-bold text-white truncate">Fashion & Wear</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Android App & Direct APK Download Callout Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/40 rounded-2xl p-3.5 sm:p-4 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/25">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-white">ANATECH MARKET for Android</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40">
                  Signed APK v1.2.0 · Live Camera & Offline
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install direct on your Android device — live camera viewfinder for item photos, offline sync, and voice search.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {onOpenInstall && (
              <button
                type="button"
                onClick={onOpenInstall}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download APK</span>
              </button>
            )}
            <a
              href="/anatech-market.apk"
              download="anatech-market.apk"
              className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Direct File Download"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Direct File</span>
            </a>
          </div>
        </div>

        {/* Criteria Alert Prompt Bar */}
        {(searchQuery || activeCategoryId !== 'all' || selectedCondition !== 'all' || budgetSliderValue < MAX_BUDGET_LIMIT || minPrice || maxPrice) && (
          <div className="bg-gradient-to-r from-cyan-50/80 via-sky-50/60 to-slate-50 dark:from-cyan-950/30 dark:via-sky-950/20 dark:to-slate-800/60 border border-cyan-200/80 dark:border-cyan-800/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-600 text-white shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block sm:inline">
                  Receive Push Notifications for this Search:
                </span>{' '}
                <span className="text-slate-600 dark:text-slate-300">
                  Save your current filters to get alerted on your device the moment a seller posts a matching item.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSaveSearchModal(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Save Search Alert</span>
            </button>
          </div>
        )}
        {/* District Active Notice if filtered */}
        {selectedDistrict !== 'all' && (
          <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 rounded-xl p-3 flex items-center justify-between text-xs text-cyan-900 dark:text-cyan-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Showing listings available in <strong>{selectedDistrict} District</strong></span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-cyan-700 dark:text-cyan-400 hover:underline font-medium"
            >
              Show All Uganda
            </button>
          </div>
        )}

        {/* Featured / Sponsored Spotlights */}
        {featuredListings.length > 0 && activeCategoryId === 'all' && !searchQuery && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Featured & Sponsored Deals</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Promoted verified goods and merchant specials across Uganda
                </p>
              </div>
              <span className="text-xs text-amber-500 font-bold hidden sm:inline">ANATECH Verified Boost</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {featuredListings.slice(0, 4).map(listing => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={savedListingIds.includes(listing.id)}
                  onToggleFavorite={() => onToggleFavorite(listing.id)}
                  onClick={() => handleProductClick(listing)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed Section (Tracks last 5 clicked products for navigation efficiency) */}
        {recentlyViewedListings.length > 0 && !searchQuery && (
          <section className="space-y-3.5 bg-gradient-to-r from-cyan-50/70 via-sky-50/40 to-slate-50 dark:from-cyan-950/25 dark:via-sky-950/15 dark:to-slate-800/40 p-3.5 sm:p-5 rounded-2xl border border-cyan-200/70 dark:border-cyan-800/40 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-600/10 text-cyan-600 dark:text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Recently Explored
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 tabular-nums">
                    {recentlyViewedListings.length} / 5
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your last 5 explored marketplace items for quick navigation and comparison
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearRecentlyViewed}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                title="Clear recently viewed products history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>

            {/* Grid of recently viewed listings */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {recentlyViewedListings.map(listing => (
                <ProductCard
                  key={`recent-${listing.id}`}
                  listing={listing}
                  isFavorite={savedListingIds.includes(listing.id)}
                  onToggleFavorite={() => onToggleFavorite(listing.id)}
                  onClick={() => handleProductClick(listing)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Safe Trading Uganda Advisory Banner */}
        <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                ANATECH Safe Trading Guide
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Meet buyers and sellers in daylight in public places (e.g. shopping centres, police station grounds). Never send Mobile Money advances without inspecting goods in person.
            </p>
          </div>

          <button
            onClick={onOpenSellModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all shrink-0 text-center cursor-pointer active:scale-95"
          >
            Sell on ANATECH Free
          </button>
        </section>

        {/* Product Feed Grid */}
        <section className="space-y-4">
          {/* Feed Header with Sort & Count */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {activeCategory ? activeCategory.name : 'Latest Market Listings'}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} available
                </p>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/80">
                    <HardDrive className="w-2.5 h-2.5" />
                    <span>Offline Synced</span>
                  </span>
                )}
              </div>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 border-none focus:ring-0 cursor-pointer pr-1"
              >
                <option value="newest" className="bg-white dark:bg-slate-900">Newest First</option>
                <option value="popular" className="bg-white dark:bg-slate-900">Most Popular</option>
                <option value="price_asc" className="bg-white dark:bg-slate-900">Price: Low to High</option>
                <option value="price_desc" className="bg-white dark:bg-slate-900">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Grid of Listings */}
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredListings.map(listing => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={savedListingIds.includes(listing.id)}
                  onToggleFavorite={() => onToggleFavorite(listing.id)}
                  onClick={() => handleProductClick(listing)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
                <BellRing className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                No matching products found
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No seller has listed an item matching your exact criteria yet. Save this search alert now, and we will send you an instant push notification the moment someone posts it!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setShowSaveSearchModal(true)}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Notify Me via Push When Listed</span>
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCondition('all');
                    setMinPrice('');
                    setMaxPrice('');
                    setBudgetSliderValue(MAX_BUDGET_LIMIT);
                    onSelectCategory('all');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Filter Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Filter Listings</h3>
              <button onClick={() => setShowFiltersModal(false)}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Condition Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Item Condition</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Any Condition' },
                  { id: 'new', label: 'Brand New' },
                  { id: 'used', label: 'Used / Pre-owned' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCondition(c.id)}
                    className={`py-2 px-2 text-xs rounded-lg border text-center transition-colors ${
                      selectedCondition === c.id
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider & Inputs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  UGX Budget Range Slider
                </label>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {budgetSliderValue < MAX_BUDGET_LIMIT 
                    ? `≤ UGX ${budgetSliderValue.toLocaleString()}` 
                    : 'Any Budget'}
                </span>
              </div>

              {/* Slider Input */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={50000}
                  max={MAX_BUDGET_LIMIT}
                  step={50000}
                  value={budgetSliderValue}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBudgetSliderValue(val);
                    setMaxPrice(val >= MAX_BUDGET_LIMIT ? '' : String(val));
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>50k</span>
                  <span>2.5M</span>
                  <span>5M</span>
                  <span>7.5M</span>
                  <span>10M+</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '≤ 50k', val: 50000 },
                  { label: '≤ 200k', val: 200000 },
                  { label: '≤ 1M', val: 1000000 },
                  { label: '≤ 3M', val: 3000000 },
                  { label: '≤ 5M', val: 5000000 },
                  { label: 'Any', val: MAX_BUDGET_LIMIT },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setBudgetSliderValue(p.val);
                      setMaxPrice(p.val >= MAX_BUDGET_LIMIT ? '' : String(p.val));
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                      budgetSliderValue === p.val
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Min / Max Text Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Min UGX</span>
                  <input
                    type="number"
                    placeholder="Min (e.g. 10000)"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Max UGX</span>
                  <input
                    type="number"
                    placeholder="Max (e.g. 5000000)"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      if (e.target.value) setBudgetSliderValue(Number(e.target.value));
                    }}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Save Filter Criteria Action in Modal */}
            <div className="p-3 bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/40 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Save filters as push alert?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFiltersModal(false);
                  setShowSaveSearchModal(true);
                }}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Save Alert
              </button>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCondition('all');
                  setMinPrice('');
                  setMaxPrice('');
                  setBudgetSliderValue(MAX_BUDGET_LIMIT);
                  setShowFiltersModal(false);
                }}
                className="flex-1 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Search Criteria & Push Notifications Modal */}
      <SaveSearchModal
        isOpen={showSaveSearchModal}
        onClose={() => setShowSaveSearchModal(false)}
        currentCriteria={{
          query: searchQuery,
          categoryId: activeCategoryId,
          categoryName: activeCategory?.name,
          district: selectedDistrict,
          condition: selectedCondition,
          minPrice,
          maxPrice,
          budgetSliderValue,
          maxBudgetLimit: MAX_BUDGET_LIMIT
        }}
        onSaved={() => {
          refreshSavedAlertsCount();
        }}
      />

      {/* Saved Alerts Drawer / Management Modal */}
      <SavedAlertsDrawerModal
        isOpen={showSavedAlertsModal}
        onClose={() => {
          setShowSavedAlertsModal(false);
          refreshSavedAlertsCount();
        }}
        onApplySearch={handleApplySavedSearch}
        onOpenSaveNew={() => setShowSaveSearchModal(true)}
      />

      {/* Browser Web Speech API Voice Search Modal */}
      <VoiceSearchModal
        isOpen={showVoiceModal}
        onClose={() => {
          setShowVoiceModal(false);
          stopVoiceListening();
        }}
        isListening={isVoiceListening}
        transcript={voiceTranscript}
        interimTranscript={voiceInterim}
        error={voiceError}
        onStartListening={startVoiceListening}
        onStopListening={stopVoiceListening}
        selectedLanguage={voiceLang}
        onSelectLanguage={setVoiceLang}
        isSupported={isVoiceSupported}
        onApplyQuery={(query) => {
          setSearchQuery(query);
          setVoiceToast({ message: `Voice search: "${query}"`, type: 'success' });
          setTimeout(() => setVoiceToast(null), 3500);
        }}
        lastParsedCommand={lastParsedCommand}
      />
    </div>
  );
};
