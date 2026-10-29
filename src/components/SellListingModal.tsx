import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Image as ImageIcon, CheckCircle2, 
  MapPin, AlertCircle, Eye, ShieldCheck, DollarSign,
  Sparkles, Loader2, Zap, ArrowRight, Check,
  Camera, CameraOff, RefreshCw, RotateCcw, Store
} from 'lucide-react';
import { ProductListing, ListingCondition, DeliveryOption, User } from '../types';
import { CATEGORIES, UGANDAN_DISTRICTS } from '../data/categoriesAndDistricts';
import { store } from '../services/marketplaceStore';

interface SellListingModalProps {
  currentUser: User;
  onClose: () => void;
  onListingCreated: (listing: ProductListing) => void;
  onOpenUpgradePlan: () => void;
  onOpenSellerRegistration?: () => void;
}

export const SellListingModal: React.FC<SellListingModalProps> = ({
  currentUser,
  onClose,
  onListingCreated,
  onOpenUpgradePlan,
  onOpenSellerRegistration
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [subcategory, setSubcategory] = useState(CATEGORIES[0].subcategories[0]);
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState<ListingCondition>('used_good');
  const [images, setImages] = useState<string[]>([]);
  const [district, setDistrict] = useState(currentUser.district || 'Kampala');
  const [locationArea, setLocationArea] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('public_meetup');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [allowInApp, setAllowInApp] = useState(true);
  const [allowWhatsApp, setAllowWhatsApp] = useState(currentUser.showWhatsAppPublicly);
  const [allowPhone, setAllowPhone] = useState(currentUser.showPhonePublicly);
  const [publicPhone, setPublicPhone] = useState(currentUser.phone || '');

  // Validation & Preview state
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gemini AI Pricing Suggestion State
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<{
    suggestedPrice: number;
    minPrice: number;
    maxPrice: number;
    fastSalePrice: number;
    premiumPrice: number;
    confidence: string;
    reasoning: string;
    factors: string[];
  } | null>(null);
  const [priceSuggestionNote, setPriceSuggestionNote] = useState<string | null>(null);

  const handleFetchPriceSuggestion = async () => {
    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('Please enter a descriptive product title above before requesting an AI pricing estimate.');
      return;
    }
    setErrorMsg('');
    setIsSuggestingPrice(true);
    setPriceSuggestionNote(null);

    try {
      const response = await fetch('/api/gemini/suggest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          categoryId,
          subcategory,
          condition,
          district
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setPriceSuggestion(resData.data);
        setPriceSuggestionNote(resData.source === 'gemini-3.8-flash' 
          ? 'Powered by Gemini AI (Ugandan Market Valuation Model)' 
          : 'Based on ANATECH Ugandan Market Intelligence Index');
      } else {
        setErrorMsg('Unable to retrieve price suggestions at this moment.');
      }
    } catch (err: any) {
      console.warn('Price suggestion error:', err);
      setErrorMsg('Network error while analyzing prices. Please enter your price manually.');
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const applySuggestedPrice = (amount: number) => {
    setPrice(String(amount));
  };

  // Check seller listing quota based on plan
  const userListings = store.getListings({ sellerId: currentUser.id, status: 'all' });
  const maxListings = currentUser.activePlan === 'standard' ? 5 : currentUser.activePlan === 'pro' ? 30 : 9999;
  const isQuotaReached = userListings.length >= maxListings;

  const currentCategoryObj = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat && cat.subcategories.length > 0) {
      setSubcategory(cat.subcategories[0]);
    }
  };

  // Camera & File Input References
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live Camera API State
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  // Stop camera tracks cleanly
  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
    setCapturedFrame(null);
    setCameraError(null);
    setIsCameraStarting(false);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Attach video stream whenever stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [cameraStream, isLiveCameraOpen]);

  // Start Live Camera using navigator.mediaDevices.getUserMedia with multi-tier fallback
  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    if (images.length >= 5) {
      setErrorMsg('You have reached the limit of 5 photos per listing.');
      return;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }

    setIsLiveCameraOpen(true);
    setCapturedFrame(null);
    setCameraError(null);
    setIsCameraStarting(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraStarting(false);
      setCameraError('Direct live camera streaming is not supported on this browser context. You can use your phone camera app to take photos directly.');
      return;
    }

    try {
      let stream: MediaStream | null = null;
      // Tier 1: Try with ideal facing mode and resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 960 }
          },
          audio: false
        });
      } catch (e1) {
        // Tier 2: Try with simple facingMode constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false
          });
        } catch (e2) {
          // Tier 3: Basic unconstrained video (compatible with every Android device)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (stream) {
        setCameraStream(stream);
        setCameraFacingMode(facing);
        setIsCameraStarting(false);
        setCameraError(null);
      } else {
        throw new Error('No video stream returned');
      }
    } catch (err: any) {
      console.warn('getUserMedia complete error:', err);
      setIsCameraStarting(false);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Camera permission was denied. Please allow camera access in your device settings, or tap below to snap with your camera app.'
        : `Could not start camera (${err.name || 'Unavailable'}). Tap below to snap photos directly using your device camera app.`;
      setCameraError(msg);
    }
  };

  // Take snapshot from video stream
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (cameraFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedFrame(dataUrl);
    }
  };

  // Keep and save the captured photo
  const acceptCapturedPhoto = () => {
    if (capturedFrame) {
      setImages(prev => [...prev, capturedFrame].slice(0, 5));
      stopLiveCamera();
    }
  };

  // Toggle front/back camera
  const toggleCameraFacing = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextMode);
  };

  // Helper to compress and downscale photos taken from camera or gallery (supports any phone camera resolution)
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = String(e.target?.result || '');
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1600;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.85));
              return;
            }
          } catch (err) {
            console.warn('Canvas compression error, using raw image:', err);
          }
          resolve(rawResult);
        };
        img.onerror = () => resolve(rawResult);
        img.src = rawResult;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Image upload handler (supports camera capture file input & gallery picker)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 5 - images.length;
    if (availableSlots <= 0) {
      setErrorMsg('You have already reached the limit of 5 photos.');
      return;
    }

    const fileList = Array.from(files).slice(0, availableSlots);

    try {
      const processed: string[] = [];
      for (const file of fileList) {
        const dataUrl = await compressImageFile(file);
        if (dataUrl) {
          processed.push(dataUrl);
        }
      }
      if (processed.length > 0) {
        setImages(prev => [...prev, ...processed].slice(0, 5));
        setErrorMsg('');
      }
    } catch (err) {
      console.error('Error processing photos:', err);
      setErrorMsg('Failed to process image. Please try another photo.');
    } finally {
      // Reset input value so user can snap or choose photos again
      e.target.value = '';
    }
  };

  const handleAddPresetPhoto = (sampleUrl: string) => {
    setImages(prev => [...prev, sampleUrl].slice(0, 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!title.trim() || title.length < 5) {
      setErrorMsg('Please enter a descriptive product title (at least 5 characters).');
      return;
    }

    if (!description.trim() || description.length < 15) {
      setErrorMsg('Please provide details in the description (at least 15 characters).');
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid price in Ugandan Shillings (UGX).');
      return;
    }

    if (images.length === 0) {
      setErrorMsg('Please provide at least one photo of the item.');
      return;
    }

    if (!locationArea.trim()) {
      setErrorMsg('Please specify the local area/suburb (e.g. Ntinda, Kisaasi, Jinja City).');
      return;
    }

    setIsSubmitting(true);

    try {
      const newListing = store.createListing({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        subcategory,
        price: priceNum,
        currency: 'UGX',
        isNegotiable,
        condition,
        images,
        district,
        locationArea: locationArea.trim(),
        deliveryOption,
        deliveryNotes: deliveryNotes.trim(),
        contactPreferences: {
          allowInApp,
          allowWhatsApp,
          allowPhone,
          publicPhone: (allowWhatsApp || allowPhone) ? publicPhone : undefined
        },
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerAvatar: currentUser.avatar,
        sellerPhone: currentUser.phone,
        sellerRating: currentUser.rating,
        sellerVerified: currentUser.isVerifiedSeller,
        sellerPlan: currentUser.activePlan,
        status: (categoryId === 'property-rentals' || categoryId === 'vehicles-motorbikes') ? 'pending' : 'active',
        isFeatured: false
      });

      setIsSubmitting(false);
      onListingCreated(newListing);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create listing. Please try again.');
      setIsSubmitting(false);
    }
  };

  // STRICT REQUIREMENT: No selling without registration
  if (!currentUser.isRegisteredSeller && currentUser.role !== 'seller') {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        role="dialog"
        aria-labelledby="no-selling-title"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto p-6 sm:p-8 space-y-6 text-center animate-fade-in">
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
            <Store className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Registration Required Before Uploading
            </span>
            <h2 id="no-selling-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              No Selling Without Registration
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              To protect buyers across Uganda and prevent fraud, <strong className="text-slate-900 dark:text-white">all merchants and sellers must register their business profile</strong> before uploading items for sale.
            </p>
          </div>

          <div className="space-y-2.5 text-left text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Verify with Uganda National ID (NIN)</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Provide physical shop or walk-in pickup location</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Configure MTN MoMo / Airtel Money payout account</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSellerRegistration?.();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-extrabold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Register Seller Profile (Fast & Free)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium cursor-pointer"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200/90 dark:border-slate-800 rounded-none sm:rounded-3xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {showPreview ? 'Preview Listing' : 'Sell an Item on ANATECH MARKET'}
            </h2>
            <p className="text-xs text-slate-500">
              Reach thousands of buyers in Uganda
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!showPreview && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!title || !price}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1 disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan Quota Reached Warning */}
        {isQuotaReached && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 p-3 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div>
              <strong>Listing limit reached:</strong> You have {userListings.length} of {maxListings} allowed on the {currentUser.activePlan} plan.
            </div>
            <button
              onClick={onOpenUpgradePlan}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs"
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Body Form or Preview */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showPreview ? (
            /* Live Preview Mode */
            <div className="space-y-4">
              <div className="p-4 border border-cyan-500/40 bg-cyan-50/20 dark:bg-cyan-950/20 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  This is how buyers will see your listing:
                </span>
                <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  {images[0] ? (
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Photo Added
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    UGX {Number(price || 0).toLocaleString()} {isNegotiable && '(Negotiable)'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {title || 'Listing Title'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {district} ({locationArea || 'Local Area'}) · Condition: {condition}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 whitespace-pre-line">
                    {description || 'Product description will appear here.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                ← Back to Edit Form
              </button>
            </div>
          ) : (
            /* Form Fields */
            <form id="sell-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload Section with Device Camera API & File Inputs */}
              <div className="space-y-3">
                {/* Hidden File Inputs */}
                {/* 1. Device Camera capture file input (HTML5 Media Capture API) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Take photo with device camera"
                />

                {/* 2. Gallery / File System multi-file input */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Upload photos from gallery"
                />

                {/* 3. Offscreen canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Item Photos (Max 5, up to 5MB each) *
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Take photos with your device camera or upload from gallery
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {images.length}/5 photos
                  </span>
                </div>

                {/* Action Buttons: Live Viewfinder, Phone Camera App, and Gallery */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Live Viewfinder Camera */}
                  <button
                    type="button"
                    onClick={() => startLiveCamera('environment')}
                    disabled={images.length >= 5}
                    className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-50/60 hover:bg-cyan-50 dark:bg-cyan-950/40 dark:hover:bg-cyan-950/70 text-cyan-900 dark:text-cyan-200 text-xs font-semibold flex items-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer shadow-2xs group"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-600 text-white group-hover:scale-105 transition-transform shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block font-bold text-xs truncate">Live Viewfinder</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block truncate">Real-time preview</span>
                    </div>
                  </button>

                  {/* Option 2: Snap with Phone Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={images.length >= 5}
                    className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer shadow-2xs group"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-600 text-white group-hover:scale-105 transition-transform shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block font-bold text-xs truncate">Phone Camera</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block truncate">Snap with device app</span>
                    </div>
                  </button>

                  {/* Option 3: Upload from Gallery / Storage */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={images.length >= 5}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer shadow-2xs group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-700 dark:bg-slate-700 text-white group-hover:scale-105 transition-transform shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block font-bold text-xs truncate">Photo Gallery</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Select files</span>
                    </div>
                  </button>
                </div>

                {/* Image Thumbnails & Direct Add Slots */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800 shadow-2xs">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                        {i === 0 ? 'Cover' : `#${i + 1}`}
                      </span>
                    </div>
                  ))}

                  {/* Add More Slots if space available */}
                  {images.length < 5 && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 flex flex-col items-center justify-center transition-colors p-2 text-center bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <Camera className="w-4 h-4 text-cyan-500" />
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col gap-1 w-full px-1">
                        <button
                          type="button"
                          onClick={() => startLiveCamera('environment')}
                          className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                        >
                          + Camera
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        >
                          + File
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Sample Photos for Testing */}
                {images.length === 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] text-slate-400">Testing presets:</span>
                    <button
                      type="button"
                      onClick={() => handleAddPresetPhoto('/src/assets/images/phones_smartphones_uganda_1792117850235.jpg')}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                    >
                      + Smartphone
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => handleAddPresetPhoto('/src/assets/images/boda_boda_motorbike_1792117851901.jpg')}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                    >
                      + Boda Boda
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => handleAddPresetPhoto('/src/assets/images/farm_produce_matooke_1792117851055.jpg')}
                      className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                    >
                      + Farm Produce
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Product Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 13 Pro 128GB Sierra Blue (Clean)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subcategory *</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    {currentCategoryObj.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & AI Pricing Suggestions */}
              <div className="space-y-2.5 bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Price in UGX *</span>
                  </label>

                  {/* AI Suggestion Trigger Button */}
                  <button
                    type="button"
                    onClick={handleFetchPriceSuggestion}
                    disabled={isSuggestingPrice || !title.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    title="Ask Gemini AI for fair market price suggestions based on category and title"
                  >
                    {isSuggestingPrice ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Uganda Market...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                        <span>AI Price Suggestion</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Gemini AI Pricing Suggestion Card */}
                {priceSuggestion && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-cyan-500/40 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Gemini Market Valuation
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                              UGX Index
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {priceSuggestionNote || 'Powered by Gemini AI'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPriceSuggestion(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Dismiss suggestion"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price Range & Quick Apply Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Suggested Fair Market Price:
                        </div>
                        <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-400 font-mono tabular-nums">
                          UGX {priceSuggestion.suggestedPrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums">
                          Typical Range: UGX {priceSuggestion.minPrice.toLocaleString()} – UGX {priceSuggestion.maxPrice.toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => applySuggestedPrice(priceSuggestion.suggestedPrice)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply UGX {priceSuggestion.suggestedPrice.toLocaleString()}</span>
                      </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Choose Strategy Preset:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => applySuggestedPrice(priceSuggestion.fastSalePrice)}
                          className={`p-2 rounded-lg border text-left transition-colors ${
                            price === String(priceSuggestion.fastSalePrice)
                              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-[10px] text-slate-400 block font-medium">Quick Sale</span>
                          <span className="text-xs font-bold tabular-nums block">
                            UGX {priceSuggestion.fastSalePrice.toLocaleString()}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => applySuggestedPrice(priceSuggestion.suggestedPrice)}
                          className={`p-2 rounded-lg border text-left transition-colors ${
                            price === String(priceSuggestion.suggestedPrice)
                              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block font-semibold">Fair Market</span>
                          <span className="text-xs font-bold tabular-nums block">
                            UGX {priceSuggestion.suggestedPrice.toLocaleString()}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => applySuggestedPrice(priceSuggestion.premiumPrice)}
                          className={`p-2 rounded-lg border text-left transition-colors ${
                            price === String(priceSuggestion.premiumPrice)
                              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-[10px] text-slate-400 block font-medium">Negotiable Ceiling</span>
                          <span className="text-xs font-bold tabular-nums block">
                            UGX {priceSuggestion.premiumPrice.toLocaleString()}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Rationale & Factors */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                      <p>
                        <strong className="text-slate-800 dark:text-slate-200">Ugandan Market Analysis:</strong> {priceSuggestion.reasoning}
                      </p>
                      {priceSuggestion.factors && priceSuggestion.factors.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {priceSuggestion.factors.map((f, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              • {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Input & Negotiable Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end pt-1">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">UGX</span>
                      <input
                        type="number"
                        placeholder="e.g. 450000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-12 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pb-2">
                    <input
                      type="checkbox"
                      id="negotiable"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <label htmlFor="negotiable" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Price is Negotiable (Ono bw’osobola okuteesa)
                    </label>
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Condition *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'new', label: 'Brand New' },
                    { id: 'like_new', label: 'Like New' },
                    { id: 'used_good', label: 'Used (Good)' },
                    { id: 'used_fair', label: 'Used (Fair)' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCondition(c.id as ListingCondition)}
                      className={`py-2 px-2 text-xs rounded-lg border text-center transition-colors ${
                        condition === c.id
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location (District & Area) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">District *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    {UGANDAN_DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.region})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Local Area / Landmark *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ntinda, Acacia Mall, Kalerwe Market"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe specifications, warranty, what accessories are included, reason for selling..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* Delivery and Contact Preferences */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Delivery & Contact Preferences
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'public_meetup', label: 'Public Meetup' },
                    { id: 'buyer_pickup', label: 'Buyer Pick-up' },
                    { id: 'seller_delivers', label: 'Seller Delivers' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDeliveryOption(opt.id as DeliveryOption)}
                      className={`p-2 text-xs rounded-lg border text-center transition-colors ${
                        deliveryOption === opt.id
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-medium'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowInApp}
                      onChange={(e) => setAllowInApp(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <span>Allow in-app chat & price offers</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowWhatsApp}
                      onChange={(e) => setAllowWhatsApp(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <span>Show WhatsApp chat button to interested buyers</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPhone}
                      onChange={(e) => setAllowPhone(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <span>Show phone call button</span>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3.5 sm:p-4 pb-safe border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky bottom-0 z-10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="sell-form"
            disabled={isSubmitting || isQuotaReached}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Listing'}</span>
          </button>
        </div>
      </div>

      {/* Live Device Camera Viewfinder Modal */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Viewfinder Header */}
            <div className="p-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Device Camera Viewfinder</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-medium">
                  {cameraFacingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
                </span>
              </div>

              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder Video / Freeze Frame */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              {capturedFrame ? (
                <img
                  src={capturedFrame}
                  alt="Captured photo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />

                  {/* Framing corner guides for realistic camera viewfinder */}
                  <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm" />
                    </div>
                  </div>

                  {isCameraStarting && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                      <span className="text-xs font-medium">Starting camera stream...</span>
                    </div>
                  )}
                </>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full mb-3 border border-rose-500/20">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">Live Camera Notice</h4>
                  <p className="text-xs text-slate-300 max-w-sm mb-5 leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
                    <button
                      type="button"
                      onClick={() => startLiveCamera(cameraFacingMode)}
                      className="flex-1 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Live Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopLiveCamera();
                        cameraInputRef.current?.click();
                      }}
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use Phone Camera</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="mt-3 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Cancel and close viewfinder
                  </button>
                </div>
              )}
            </div>

            {/* Viewfinder Bottom Controls */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
              {capturedFrame ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCapturedFrame(null)}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={acceptCapturedPhoto}
                    className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use This Photo</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Switch Camera facing mode */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
                    title="Flip Camera (Front/Rear)"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  {/* Circular Shutter Button */}
                  <button
                    type="button"
                    onClick={takeSnapshot}
                    className="w-16 h-16 rounded-full border-4 border-white/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all bg-white/10 cursor-pointer"
                    title="Capture photo"
                  >
                    <div className="w-full h-full rounded-full bg-cyan-500 active:bg-cyan-400" />
                  </button>

                  {/* Fallback to Native Camera File Input */}
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      cameraInputRef.current?.click();
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
                    title="Use Native Device App"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
