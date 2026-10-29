// Web Speech API Voice Recognition & Audio Synthesis Utilities for ANATECH MARKET

// Type definitions for window.SpeechRecognition
export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
  message: string;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): ISpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): ISpeechRecognition;
    };
  }
}

export interface VoiceLanguage {
  code: string;
  name: string;
  flag: string;
  region: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguage[] = [
  { code: 'en-UG', name: 'English (Uganda)', flag: '🇺🇬', region: 'East Africa' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧', region: 'International' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', region: 'International' },
  { code: 'sw-KE', name: 'Kiswahili', flag: '🇰🇪', region: 'East Africa' },
];

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognition(): ISpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return null;
  return new SpeechRec();
}

// Gentle Web Audio feedback chimes for start and finish
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function playListeningStartTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch (e) {
    // Ignore audio permission/context errors
  }
}

export function playRecognitionSuccessTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.08);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.22);
  } catch (e) {
    // Ignore audio errors
  }
}

// Voice Command parser
export interface ParsedVoiceCommand {
  rawTranscript: string;
  cleanedQuery: string;
  intent: 'search' | 'clear' | 'category' | 'verified_only' | 'filter_district';
  targetCategory?: string;
  targetDistrict?: string;
}

const CATEGORY_VOICE_MAP: Record<string, string> = {
  'phone': 'cat_phones',
  'phones': 'cat_phones',
  'mobile': 'cat_phones',
  'mobiles': 'cat_phones',
  'smartphone': 'cat_phones',
  'smartphones': 'cat_phones',
  'electronics': 'cat_electronics',
  'electronic': 'cat_electronics',
  'tv': 'cat_electronics',
  'television': 'cat_electronics',
  'appliances': 'cat_electronics',
  'vehicle': 'cat_vehicles',
  'vehicles': 'cat_vehicles',
  'car': 'cat_vehicles',
  'cars': 'cat_vehicles',
  'boda': 'cat_vehicles',
  'boda boda': 'cat_vehicles',
  'motorcycle': 'cat_vehicles',
  'bike': 'cat_vehicles',
  'agriculture': 'cat_agriculture',
  'agricultural': 'cat_agriculture',
  'farm': 'cat_agriculture',
  'farming': 'cat_agriculture',
  'produce': 'cat_agriculture',
  'matooke': 'cat_agriculture',
  'coffee': 'cat_agriculture',
  'property': 'cat_property',
  'properties': 'cat_property',
  'house': 'cat_property',
  'houses': 'cat_property',
  'land': 'cat_property',
  'rent': 'cat_property',
  'rental': 'cat_property',
  'fashion': 'cat_fashion',
  'clothes': 'cat_fashion',
  'clothing': 'cat_fashion',
  'shoes': 'cat_fashion',
  'services': 'cat_services',
  'service': 'cat_services',
  'jobs': 'cat_jobs',
  'job': 'cat_jobs'
};

export function parseVoiceCommand(raw: string): ParsedVoiceCommand {
  const text = raw.trim();
  const lower = text.toLowerCase();

  // Command: Clear / Reset search
  if (
    lower === 'clear' || 
    lower === 'reset' || 
    lower === 'clear search' || 
    lower === 'clear filter' || 
    lower === 'reset search' ||
    lower === 'clear all'
  ) {
    return {
      rawTranscript: text,
      cleanedQuery: '',
      intent: 'clear'
    };
  }

  // Command: Verified sellers only
  if (
    lower.includes('only verified') || 
    lower.includes('verified sellers') || 
    lower.includes('show verified') ||
    lower === 'verified only'
  ) {
    return {
      rawTranscript: text,
      cleanedQuery: '',
      intent: 'verified_only'
    };
  }

  // Command: Show category e.g. "show electronics", "category vehicles", "open phones"
  const categoryMatchPatterns = [
    /^(?:show|open|browse|go to|view|filter by)\s+(?:category\s+)?([a-z\s]+)$/i,
    /^(?:category)\s+([a-z\s]+)$/i
  ];

  for (const pattern of categoryMatchPatterns) {
    const match = lower.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const mapped = CATEGORY_VOICE_MAP[candidate];
      if (mapped) {
        return {
          rawTranscript: text,
          cleanedQuery: '',
          intent: 'category',
          targetCategory: mapped
        };
      }
    }
  }

  // Direct category single-word speech e.g. "Electronics", "Phones", "Vehicles"
  if (CATEGORY_VOICE_MAP[lower]) {
    return {
      rawTranscript: text,
      cleanedQuery: text,
      intent: 'category',
      targetCategory: CATEGORY_VOICE_MAP[lower]
    };
  }

  // Standard search command stripping prefixes like "search for", "look for", "find me", "find"
  let cleaned = text
    .replace(/^(?:search for|search|look for|find me|find|get me|show me)\s+/i, '')
    .trim();

  // Remove trailing periods from speech engines
  cleaned = cleaned.replace(/\.+$/, '').trim();

  return {
    rawTranscript: text,
    cleanedQuery: cleaned || text,
    intent: 'search'
  };
}
