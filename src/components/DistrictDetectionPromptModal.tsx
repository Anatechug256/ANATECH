import React, { useState } from 'react';
import { 
  MapPin, Check, X, Navigation, Compass, 
  ChevronRight, Sparkles, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { UGANDAN_DISTRICTS } from '../data/categoriesAndDistricts';
import { GeolocationDetectionResult, simulateDistrictDetection } from '../utils/districtGeolocation';

interface DistrictDetectionPromptModalProps {
  isOpen: boolean;
  detectedResult: GeolocationDetectionResult | null;
  currentDistrict: string;
  onAccept: (district: string) => void;
  onDismiss: () => void;
  onSelectAlternative: (district: string) => void;
  onReDetect: () => void;
  isDetecting?: boolean;
}

export const DistrictDetectionPromptModal: React.FC<DistrictDetectionPromptModalProps> = ({
  isOpen,
  detectedResult,
  currentDistrict,
  onAccept,
  onDismiss,
  onSelectAlternative,
  onReDetect,
  isDetecting = false
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCustomDistrict, setSelectedCustomDistrict] = useState(
    detectedResult?.district || currentDistrict || 'Kampala'
  );
  const [dontAskAgain, setDontAskAgain] = useState(true);

  if (!isOpen) return null;

  const targetDistrict = detectedResult?.district || 'Kampala';
  const isMatch = targetDistrict.toLowerCase() === currentDistrict.toLowerCase();

  const handleConfirm = () => {
    onAccept(targetDistrict);
  };

  const handleCustomConfirm = () => {
    onSelectAlternative(selectedCustomDistrict);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
      >
        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 p-5 text-white">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 bg-white/20 backdrop-blur-xs rounded-xl flex items-center justify-center shadow-xs">
              <Navigation className="w-5 h-5 text-white animate-pulse" />
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-white/20 text-[11px] font-semibold text-cyan-100">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>Browser Geolocation Auto-Detected</span>
            </div>
          </div>

          <h2 id="location-modal-title" className="text-lg font-bold tracking-tight">
            Welcome to ANATECH MARKET!
          </h2>
          <p className="text-xs text-cyan-100/90 mt-1 leading-relaxed">
            We detected your district to help connect you with nearby buyers, verified sellers, and local deliveries in Uganda.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Detection result box */}
          <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                    Auto-Detected District
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{targetDistrict}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {detectedResult?.region || 'Uganda'} Region
                    </span>
                  </div>
                  {detectedResult?.nearestHub && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Hub / Division: <strong className="text-slate-700 dark:text-slate-300">{detectedResult.nearestHub}</strong>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onReDetect}
                disabled={isDetecting}
                title="Re-run Geolocation"
                className="p-2 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin text-cyan-600' : ''}`} />
              </button>
            </div>

            {/* Coordinates / Accuracy metadata */}
            {detectedResult?.coords && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  GPS: {detectedResult.coords.latitude.toFixed(3)}°N, {detectedResult.coords.longitude.toFixed(3)}°E
                </span>
                <span>Accuracy: ±{detectedResult.coords.accuracy}m</span>
              </div>
            )}

            {!detectedResult?.isWithinUganda && (
              <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Device is currently outside Uganda; suggested closest district centroid ({targetDistrict}).</span>
              </div>
            )}
          </div>

          {/* Current profile comparison */}
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {isMatch ? (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300">
                <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Your profile is already configured with <strong>{currentDistrict}</strong> as your default location.
                </span>
              </div>
            ) : (
              <p>
                Your profile is currently set to <strong>{currentDistrict}</strong>. Would you like to set <strong>{targetDistrict}</strong> as your default location in App Settings?
              </p>
            )}
          </div>

          {/* Alternative District Selector (collapsible) */}
          {showPicker ? (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-150">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Choose another Ugandan District:
              </label>
              <select
                value={selectedCustomDistrict}
                onChange={(e) => setSelectedCustomDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
              >
                {UGANDAN_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.region} Region)
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomConfirm}
                  className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold"
                >
                  Set {selectedCustomDistrict}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Not in {targetDistrict}? Select another district</span>
            </button>
          )}

          {/* Quick Demo Simulator for Testing */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              Quick Test Locations (Demo & Verification):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Kampala', id: 'kampala' },
                { name: 'Wakiso', id: 'wakiso' },
                { name: 'Jinja', id: 'jinja' },
                { name: 'Mbarara', id: 'mbarara' },
                { name: 'Gulu', id: 'gulu' },
                { name: 'Mbale', id: 'mbale' }
              ].map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    const sim = simulateDistrictDetection(city.id);
                    onAccept(sim.district);
                  }}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-600 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-center"
          >
            Keep Current ({currentDistrict})
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Set {targetDistrict} as Default</span>
          </button>
        </div>
      </div>
    </div>
  );
};
