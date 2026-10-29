import React, { useState } from 'react';
import { 
  ShieldCheck, MapPin, Bell, Globe, 
  Wifi, WifiOff, Users, ChevronDown, CheckCircle2,
  Sun, Moon, Smartphone, Download, Store, Sparkles, Bot
} from 'lucide-react';
import { store } from '../services/marketplaceStore';
import { User, UserRole } from '../types';
import { UGANDAN_DISTRICTS } from '../data/categoriesAndDistricts';

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onOpenSafeTrading: () => void;
  onOpenAdmin: () => void;
  onOpenInstall?: () => void;
  onOpenSellerRegistration?: () => void;
  onOpenAiAgent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  onOpenNotifications,
  unreadNotificationsCount,
  selectedDistrict,
  onSelectDistrict,
  onOpenSafeTrading,
  onOpenAdmin,
  onOpenInstall,
  onOpenSellerRegistration,
  onOpenAiAgent
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(store.getTheme());
  const lowDataMode = store.getLowDataMode();
  const currency = store.getCurrency();

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    store.setTheme(nextTheme);
    setTheme(nextTheme);
  };

  const toggleLowData = () => {
    store.setLowDataMode(!lowDataMode);
    window.location.reload();
  };

  const handleCurrencyChange = () => {
    const next = currency === 'UGX' ? 'KES' : currency === 'KES' ? 'USD' : 'UGX';
    store.setCurrency(next);
    window.location.reload();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
        {/* Top Safety & Low-Data Strip */}
        <div className="bg-slate-950/90 px-3 sm:px-4 py-1 text-xs border-b border-slate-800/80 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent font-extrabold tracking-wider text-[11px] shrink-0">
              ANATECH UG
            </span>
            <span aria-hidden="true" className="text-slate-600 hidden xs:inline">·</span>
            <button 
              onClick={onOpenSafeTrading}
              className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] truncate text-slate-300"
              title="Uganda Safe Trading Guidelines"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Safe Trading Rules</span>
              <span className="sm:hidden">Safe Trade</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Low data mode switch */}
            <button 
              onClick={toggleLowData}
              title="Toggle Low-Data Mode for 2G/3G connections"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-all ${
                lowDataMode 
                  ? 'bg-cyan-900/80 text-cyan-300 font-bold border border-cyan-700/60' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lowDataMode ? <WifiOff className="w-3 h-3 text-cyan-400" /> : <Wifi className="w-3 h-3" />}
              <span className="hidden xs:inline">{lowDataMode ? 'Saver ON' : 'Data Saver'}</span>
            </button>

            {/* Currency switch */}
            <button 
              onClick={handleCurrencyChange}
              title="Switch Display Currency"
              className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 px-1 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              {currency}
            </button>
          </div>
        </div>

        {/* Main App Bar */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Brand Wordmark & Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-xl font-black tracking-tight text-white">
                  ANATECH
                </span>
                <span className="text-base sm:text-xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                  MARKET
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-cyan-400/80 font-medium -mt-1 hidden xs:inline">
                Uganda & East Africa
              </span>
            </div>
          </div>

          {/* District Location Selector */}
          <button
            onClick={() => setShowDistrictModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-all max-w-[110px] xs:max-w-[140px] sm:max-w-xs truncate shrink"
            title="Filter by Ugandan District"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              {selectedDistrict === 'all' ? 'All Uganda' : selectedDistrict}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Admin Portal Shortcut if Admin or Moderator */}
            {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
              <button
                onClick={onOpenAdmin}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Install Android App / APK Button */}
            {onOpenInstall && (
              <button
                onClick={onOpenInstall}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                title="Download ANATECH MARKET Android APK / Install App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px] font-extrabold">APK</span>
              </button>
            )}

            {/* Seller Registration Profile Button */}
            {onOpenSellerRegistration && (
              <button
                onClick={onOpenSellerRegistration}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentUser.isRegisteredSeller || currentUser.role === 'seller'
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-xs shadow-emerald-500/10'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-xs shadow-amber-500/10'
                }`}
                title={currentUser.isRegisteredSeller ? 'View & Edit Verified Seller Profile' : 'Register Seller Profile on ANATECH MARKET'}
              >
                <Store className={`w-3.5 h-3.5 ${currentUser.isRegisteredSeller ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="hidden md:inline">
                  {currentUser.isRegisteredSeller || currentUser.role === 'seller' ? 'Seller Profile' : 'Register Seller'}
                </span>
                <span className="md:hidden text-[11px]">
                  {currentUser.isRegisteredSeller || currentUser.role === 'seller' ? 'Store' : 'Sell'}
                </span>
              </button>
            )}

            {/* ANATECH Market AI Assistant Trigger */}
            {onOpenAiAgent && (
              <button
                onClick={onOpenAiAgent}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 hover:from-cyan-300 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-cyan-500/25 cursor-pointer active:scale-95 group transition-all"
                title="Ask ANATECH AI Agent (Marketplace Assistant)"
                aria-label="Open ANATECH AI Agent"
              >
                <Bot className="w-3.5 h-3.5 stroke-[2.3] text-slate-950" />
                <span className="font-black text-[11px] sm:text-xs">Ask AI</span>
              </button>
            )}

            {/* Quick Theme Toggle (Light / Dark Mode) */}
            <button
              onClick={handleToggleTheme}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-300" />
              )}
            </button>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full shadow-xs shadow-amber-400/80 animate-pulse" />
              )}
            </button>

            {/* Test Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1 p-1 sm:px-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs transition-colors"
                title="Switch active user profile / role for testing"
              >
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className={`w-6 h-6 rounded-full object-cover border-2 ${
                    currentUser.isRegisteredSeller || currentUser.role === 'seller'
                      ? 'border-emerald-400'
                      : currentUser.role === 'admin'
                      ? 'border-cyan-400'
                      : 'border-slate-500'
                  }`}
                />
                <span className="capitalize font-semibold text-slate-200 hidden lg:inline text-[11px]">{currentUser.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-left"
                  onMouseLeave={() => setShowRoleMenu(false)}
                >
                  {/* Seller Profile Action directly in menu */}
                  {onOpenSellerRegistration && (
                    <div className="px-2 pb-2 mb-1 border-b border-slate-800">
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          onOpenSellerRegistration();
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-xs transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5" />
                          <span>{currentUser.isRegisteredSeller ? 'Manage Seller Profile' : 'Register Seller Profile'}</span>
                        </span>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">NIN & MoMo</span>
                      </button>
                    </div>
                  )}

                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                    Switch Test Account / Role
                  </div>
                  
                  {(['customer', 'seller', 'moderator', 'admin'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        currentUser.role === role ? 'text-cyan-400 font-semibold bg-cyan-950/30' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="capitalize font-semibold">{role}</span>
                        <span className="text-[10px] text-slate-400">
                          {role === 'customer' && 'Sarah Namubiru (Wakiso)'}
                          {role === 'seller' && 'Muwonge Tech Hub (Nakawa)'}
                          {role === 'moderator' && 'Emmanuel Okello (Trust & Safety)'}
                          {role === 'admin' && 'ANATECH UG Admin'}
                        </span>
                      </div>
                      {currentUser.role === role && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </button>
                  ))}

                  <div className="mt-1 pt-1.5 border-t border-slate-800 px-3 py-1 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Logged in as:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[130px]">{currentUser.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* District Selection Modal */}
      {showDistrictModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Select Region or District</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Filter listings by local trade location in Uganda</p>
              </div>
              <button 
                onClick={() => setShowDistrictModal(false)}
                className="text-xs font-semibold px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
              <button
                onClick={() => {
                  onSelectDistrict('all');
                  setShowDistrictModal(false);
                }}
                className={`w-full py-2.5 px-3 rounded-lg text-left text-sm font-medium flex items-center justify-between transition-colors ${
                  selectedDistrict === 'all' 
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Uganda (Countrywide)</span>
                {selectedDistrict === 'all' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
              </button>

              {UGANDAN_DISTRICTS.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectDistrict(d.name);
                    setShowDistrictModal(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg text-left text-sm flex items-center justify-between transition-colors ${
                    selectedDistrict.toLowerCase() === d.name.toLowerCase()
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-[11px] text-slate-400">{d.region} · {d.hubs.slice(0, 3).join(', ')}</span>
                  </div>
                  {selectedDistrict.toLowerCase() === d.name.toLowerCase() && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
