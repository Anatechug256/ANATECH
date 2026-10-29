import React, { useEffect } from 'react';
import { 
  Mic, MicOff, X, AlertCircle, Sparkles, 
  Check, Globe, Volume2, Search, ArrowRight, RotateCcw
} from 'lucide-react';
import { ParsedVoiceCommand, SUPPORTED_VOICE_LANGUAGES } from '../utils/speechRecognition';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  onStartListening: () => void;
  onStopListening: () => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  isSupported: boolean;
  onApplyQuery: (query: string) => void;
  lastParsedCommand: ParsedVoiceCommand | null;
}

const EXAMPLE_VOICE_QUERIES = [
  'iPhone 13 Pro Max',
  'Toyota Harrier Kampala',
  'Solar inverter 3kVA',
  'Boda Boda Boxer 150',
  'Fresh Matooke Mbarara',
  'Show Electronics',
  'Clear search'
];

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  isListening,
  transcript,
  interimTranscript,
  error,
  onStartListening,
  onStopListening,
  selectedLanguage,
  onSelectLanguage,
  isSupported,
  onApplyQuery,
  lastParsedCommand
}) => {
  // Auto-start listening when modal opens if supported and not already listening
  useEffect(() => {
    if (isOpen && isSupported && !isListening && !error && !transcript) {
      onStartListening();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentText = interimTranscript || transcript;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-search-heading"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isListening 
            ? 'bg-cyan-500/20 dark:bg-cyan-500/15' 
            : 'bg-slate-200/50 dark:bg-slate-800/20'
        }`} />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 id="voice-search-heading" className="text-sm font-bold text-slate-900 dark:text-white">
                Voice Search
              </h2>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Browser Web Speech API · Speak naturally
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close voice search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Support Warning */}
        {!isSupported && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Web Speech API Not Available</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              Your browser does not currently expose the Web Speech API (SpeechRecognition). 
              For the best voice search experience, please use Google Chrome, Microsoft Edge, or Safari on desktop or Android/iOS.
            </p>
          </div>
        )}

        {/* Main Microphone & Audio Waveform Visualizer */}
        {isSupported && (
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 relative z-10">
            {/* Mic Pulse Button */}
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-cyan-400/25 animate-ping duration-1000" />
                  <div className="absolute -inset-2 rounded-full border-2 border-cyan-500/40 animate-pulse duration-700" />
                  <div className="absolute -inset-4 rounded-full border border-cyan-400/20" />
                </>
              )}

              <button
                type="button"
                onClick={isListening ? onStopListening : onStartListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative z-10 cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-cyan-500/30 scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
                aria-label={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? (
                  <Mic className="w-9 h-9 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Audio Waveform Bars (simulated live acoustic activity) */}
            <div className="flex items-center justify-center gap-1 h-6">
              {[4, 8, 14, 20, 16, 24, 12, 18, 10, 5].map((defaultHeight, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isListening
                      ? 'bg-cyan-500 dark:bg-cyan-400'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  style={{
                    height: isListening 
                      ? `${Math.max(4, Math.sin((i + Date.now() / 150)) * 14 + defaultHeight)}px` 
                      : '4px'
                  }}
                />
              ))}
            </div>

            {/* Status Heading */}
            <div className="space-y-1">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isListening ? 'Listening for products...' : currentText ? 'Speech Captured' : 'Tap Microphone to Speak'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {isListening 
                  ? 'Speak clearly in your chosen language. The market will automatically filter listings.' 
                  : 'Say an item name, location, or voice command like "Clear search".'}
              </p>
            </div>

            {/* Live Speech Transcript Box */}
            <div className="w-full min-h-[72px] p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col items-center justify-center text-center">
              {currentText ? (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Heard Speech:</span>
                  <p className="text-base sm:text-lg font-extrabold text-cyan-700 dark:text-cyan-300">
                    "{currentText}"
                  </p>
                  {lastParsedCommand && lastParsedCommand.intent !== 'search' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      Command: {lastParsedCommand.intent.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
              ) : isListening ? (
                <span className="text-xs text-slate-400 italic flex items-center gap-1.5 animate-pulse">
                  <Volume2 className="w-3.5 h-3.5" />
                  Say something like "Toyota Premio Kampala"...
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Your spoken query will appear here in real time.
                </span>
              )}
            </div>

            {/* Error Notification */}
            {error && (
              <div className="w-full p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={onStartListening}
                  className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] font-bold shrink-0 hover:bg-rose-500"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Language Selection & Voice Command Shortcuts */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-600" />
              <span>Voice Recognition Language:</span>
            </span>

            <select
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage(e.target.value)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-cyan-500"
            >
              {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Voice Prompt Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium block">
              Try saying or click to search:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_VOICE_QUERIES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    onApplyQuery(example);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs transition-colors flex items-center gap-1 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800 cursor-pointer"
                >
                  <Search className="w-3 h-3 opacity-60" />
                  <span>{example}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            Cancel
          </button>

          {currentText && (
            <button
              type="button"
              onClick={() => {
                onApplyQuery(currentText);
                onClose();
              }}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>Search "{currentText.slice(0, 20)}{currentText.length > 20 ? '...' : ''}"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
