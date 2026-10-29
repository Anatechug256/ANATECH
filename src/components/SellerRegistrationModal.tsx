import React, { useState, useRef } from 'react';
import { 
  X, Store, ShieldCheck, MapPin, Phone, MessageSquare, 
  Camera, Upload, Check, AlertCircle, Sparkles, Clock, 
  Award, Building, CreditCard, Truck, CheckCircle2, ChevronRight,
  HelpCircle, User as UserIcon, RefreshCw, CheckCheck
} from 'lucide-react';
import { User, DeliveryOption } from '../types';
import { UGANDAN_DISTRICTS, CATEGORIES } from '../data/categoriesAndDistricts';
import { store } from '../services/marketplaceStore';

interface SellerRegistrationModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const SellerRegistrationModal: React.FC<SellerRegistrationModalProps> = ({
  currentUser,
  onClose,
  onSuccess
}) => {
  const isEditing = Boolean(currentUser.isRegisteredSeller || currentUser.role === 'seller');

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [businessName, setBusinessName] = useState(currentUser.businessName || currentUser.name || '');
  const [contactPerson, setContactPerson] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser.phone || '');
  const [preferredContact, setPreferredContact] = useState<'whatsapp' | 'phone' | 'in_app'>(currentUser.preferredContact || 'whatsapp');
  const [district, setDistrict] = useState(currentUser.district || 'Kampala');
  const [subCounty, setSubCounty] = useState(currentUser.subCounty || '');
  const [physicalShopLocation, setPhysicalShopLocation] = useState(currentUser.physicalShopLocation || '');
  const [shopWorkingHours, setShopWorkingHours] = useState(currentUser.shopWorkingHours || 'Mon - Sat: 8:30 AM - 7:00 PM');
  const [bio, setBio] = useState(currentUser.bio || 'Trusted seller providing quality goods with reliable delivery in Uganda.');
  
  // Categories multi-select
  const [categoriesHandled, setCategoriesHandled] = useState<string[]>(
    currentUser.categoriesHandled && currentUser.categoriesHandled.length > 0 
      ? currentUser.categoriesHandled 
      : ['electronics']
  );

  // Trust & Verification
  const [ninNumber, setNinNumber] = useState(currentUser.ninNumber || '');
  const [tinNumber, setTinNumber] = useState(currentUser.tinNumber || '');
  const [momoProvider, setMomoProvider] = useState<'MTN Mobile Money' | 'Airtel Money'>(currentUser.momoProvider || 'MTN Mobile Money');
  const [momoNumber, setMomoNumber] = useState(currentUser.momoNumber || currentUser.phone || '');
  const [warrantyOffered, setWarrantyOffered] = useState(currentUser.warrantyOffered || '7 Days Replacement Warranty');
  
  // Delivery Modes
  const [deliveryModes, setDeliveryModes] = useState<DeliveryOption[]>(
    currentUser.deliveryModes && currentUser.deliveryModes.length > 0
      ? currentUser.deliveryModes
      : ['buyer_pickup', 'seller_delivers', 'public_meetup']
  );

  // Avatar / Logo
  const [avatar, setAvatar] = useState(currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Status & UI State
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Toggle Category
  const toggleCategory = (catId: string) => {
    setCategoriesHandled(prev => 
      prev.includes(catId) 
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    );
  };

  // Toggle Delivery Option
  const toggleDeliveryMode = (mode: DeliveryOption) => {
    setDeliveryModes(prev => 
      prev.includes(mode)
        ? (prev.length > 1 ? prev.filter(m => m !== mode) : prev)
        : [...prev, mode]
    );
  };

  // Photo / Logo upload with canvas compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = String(event.target?.result || '');
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            setAvatar(canvas.toDataURL('image/jpeg', 0.88));
            return;
          }
        } catch (err) {
          console.warn('Canvas resize error:', err);
        }
        setAvatar(raw);
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleNext = () => {
    setErrorMsg('');
    if (activeStep === 1) {
      if (!businessName.trim()) {
        setErrorMsg('Please enter your Business or Store Name.');
        return;
      }
      if (categoriesHandled.length === 0) {
        setErrorMsg('Please select at least one category of goods or services you sell.');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!phone.trim()) {
        setErrorMsg('Please provide a business contact phone number.');
        return;
      }
      if (!district) {
        setErrorMsg('Please select your primary operational Ugandan district.');
        return;
      }
      setActiveStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!businessName.trim()) {
      setErrorMsg('Store or Business Name is required.');
      setActiveStep(1);
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Business Phone number is required.');
      setActiveStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = store.registerSellerProfile(currentUser.id, {
        name: contactPerson.trim() || currentUser.name,
        businessName: businessName.trim(),
        avatar,
        bio: bio.trim(),
        phone: phone.trim(),
        district,
        subCounty: subCounty.trim(),
        physicalShopLocation: physicalShopLocation.trim(),
        shopWorkingHours: shopWorkingHours.trim(),
        categoriesHandled,
        ninNumber: ninNumber.trim().toUpperCase(),
        isNinVerified: Boolean(ninNumber.trim().length >= 10),
        tinNumber: tinNumber.trim(),
        momoNumber: momoNumber.trim() || phone.trim(),
        momoProvider,
        warrantyOffered: warrantyOffered.trim(),
        deliveryModes,
        preferredContact,
        showPhonePublicly: true,
        showWhatsAppPublicly: true
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 1600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to save seller registration profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto transition-all"
        role="dialog"
        aria-labelledby="seller-reg-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-cyan-900/40 via-slate-900 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="seller-reg-title" className="text-lg sm:text-xl font-extrabold text-white">
                  {isEditing ? 'Seller Profile & Registration' : 'Register as a Verified Seller'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Trader
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Unlock the Green Verified Badge, build buyer trust across Uganda, and list items with priority placement.
              </p>
            </div>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-2 text-left cursor-pointer transition-opacity ${activeStep === 1 ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 1 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-white/20 text-white'}`}>
                1
              </div>
              <div className="hidden sm:block">
                <span className="block text-[11px] font-bold text-white">Store Identity</span>
                <span className="block text-[10px] text-slate-400">Branding & Bio</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`flex items-center gap-2 text-left cursor-pointer transition-opacity ${activeStep === 2 ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 2 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-white/20 text-white'}`}>
                2
              </div>
              <div className="hidden sm:block">
                <span className="block text-[11px] font-bold text-white">Location & Reach</span>
                <span className="block text-[10px] text-slate-400">Shop & Contacts</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`flex items-center gap-2 text-left cursor-pointer transition-opacity ${activeStep === 3 ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === 3 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-white/20 text-white'}`}>
                3
              </div>
              <div className="hidden sm:block">
                <span className="block text-[11px] font-bold text-white">Trust & MoMo</span>
                <span className="block text-[10px] text-slate-400">NIN & Payments</span>
              </div>
            </button>
          </div>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg border-2 border-emerald-500/40 animate-bounce">
              <CheckCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Seller Profile Registered!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Congratulations <span className="font-bold text-cyan-600 dark:text-cyan-400">{businessName}</span>! Your profile is now registered with Verified Seller status on ANATECH MARKET. Buyers can see your physical store location and verified credentials.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Seller Badge Activated</span>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[65vh]">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: STORE & IDENTITY */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                {/* Store Avatar / Logo Photo */}
                <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="relative">
                    <img
                      src={avatar}
                      alt="Store logo preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-xs"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-2xs" title="Verified Badge Preview">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Store Logo or Profile Photo
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Snap Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>From Gallery</span>
                      </button>
                    </div>
                    {/* Hidden Inputs */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Business / Store Name */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Business / Store Trading Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g., Muwonge Tech Hub, Kampala Solar Ltd"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    This trading name will appear on all your product listings and store profile.
                  </span>
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Owner / Manager Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={e => setContactPerson(e.target.value)}
                      placeholder="e.g., David Muwonge"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Categories Handled */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Categories You Sell / Supply *
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {CATEGORIES.map(cat => {
                      const selected = categoriesHandled.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            selected 
                              ? 'bg-cyan-600 text-white font-bold shadow-2xs' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bio / Store Description */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Store Bio & Value Proposition
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Describe your goods, warranty policies, years in business, and safe delivery services..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & CONTACT */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                {/* District & Sub-County */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Primary District *
                    </label>
                    <select
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {UGANDAN_DISTRICTS.map(d => (
                        <option key={d.name} value={d.name}>
                          {d.name} ({d.region})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Sub-County / Town / Division
                    </label>
                    <input
                      type="text"
                      value={subCounty}
                      onChange={e => setSubCounty(e.target.value)}
                      placeholder="e.g., Nakawa, Central, Kira, Boma"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Physical Shop Location */}
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Physical Store / Shop Address (Or Delivery Hub)
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={physicalShopLocation}
                      onChange={e => setPhysicalShopLocation(e.target.value)}
                      placeholder="e.g., Pioneer Mall Room 14B, Kampala Road or Kikuubo Arcade Stall 4"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Having a verified physical address gives buyers 4x higher trust to complete purchases.
                  </span>
                </div>

                {/* Phone & WhatsApp Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Direct Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+256 700 000 000"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      WhatsApp Business Number
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-4 h-4 text-emerald-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={e => setWhatsappNumber(e.target.value)}
                        placeholder="+256 700 000 000"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Working Hours & Preferred Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Shop Working Hours
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={shopWorkingHours}
                        onChange={e => setShopWorkingHours(e.target.value)}
                        placeholder="Mon - Sat: 8:00 AM - 7:00 PM"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Preferred Contact Channel
                    </label>
                    <select
                      value={preferredContact}
                      onChange={e => setPreferredContact(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="whatsapp">WhatsApp (Most Popular)</option>
                      <option value="phone">Direct Phone Calls</option>
                      <option value="in_app">ANATECH In-App Messages</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TRUST, VERIFICATION & MOBILE MONEY */}
            {activeStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                {/* NIN & TIN Verification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Uganda National ID (NIN)
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={ninNumber}
                        onChange={e => setNinNumber(e.target.value)}
                        placeholder="e.g., CM89012345ABCD"
                        maxLength={14}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Enables the official National ID Verified Badge.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      URA Tax ID (TIN) (Optional)
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={tinNumber}
                        onChange={e => setTinNumber(e.target.value)}
                        placeholder="e.g., 1002345678"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      For registered companies & certified dealers.
                    </span>
                  </div>
                </div>

                {/* Mobile Money Payout Account */}
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                    <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Mobile Money Settlement Account (MTN / Airtel)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Network Provider
                      </label>
                      <select
                        value={momoProvider}
                        onChange={e => setMomoProvider(e.target.value as any)}
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                      >
                        <option value="MTN Mobile Money">MTN Mobile Money (*165#)</option>
                        <option value="Airtel Money">Airtel Money (*185#)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Registered MoMo Phone Number
                      </label>
                      <input
                        type="tel"
                        value={momoNumber}
                        onChange={e => setMomoNumber(e.target.value)}
                        placeholder="+256 770 000 000"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 block">
                    Escrow payouts and buyer deposits are sent directly to this registered number.
                  </span>
                </div>

                {/* Warranty Offered & Delivery Modes */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Warranty & Return Policy Offered to Customers
                    </label>
                    <input
                      type="text"
                      value={warrantyOffered}
                      onChange={e => setWarrantyOffered(e.target.value)}
                      placeholder="e.g., 7 Days Exchange Warranty, Tested Before Purchase"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Delivery & Fulfillment Options
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDeliveryMode('buyer_pickup')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                          deliveryModes.includes('buyer_pickup')
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-800 dark:text-cyan-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Building className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="truncate">Store Pickup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleDeliveryMode('seller_delivers')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                          deliveryModes.includes('seller_delivers')
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-800 dark:text-cyan-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">Boda Delivery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleDeliveryMode('public_meetup')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                          deliveryModes.includes('public_meetup')
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-800 dark:text-cyan-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate">Public Meetup</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {activeStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((activeStep - 1) as any)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {activeStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registering Seller Profile...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Complete Seller Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
