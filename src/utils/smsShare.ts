/**
 * SMS Sharing Utility for ANATECH MARKET
 * Provides Native Web Share API integration with automatic fallback to custom SMS URI builders
 * specifically designed for sharing product links and deals with non-smartphone & feature phone users.
 */

export interface SmsShareOptions {
  phoneNumber?: string;
  message: string;
}

export interface SmsCalculation {
  charCount: number;
  segmentCount: number;
  charsRemainingInCurrentSegment: number;
  isUnicode: boolean;
}

/**
 * Cleans and formats phone numbers, handling East African / Ugandan prefixes (+256 or 07xx)
 */
export function normalizeUgandanPhoneNumber(input: string): string {
  if (!input) return '';
  // Remove spaces, dashes, brackets
  let cleaned = input.replace(/[\s\-\(\)]/g, '');
  // If starts with 07..., convert to international format for standard SMS routing
  if (/^0[73][0-9]{8}$/.test(cleaned)) {
    cleaned = `+256${cleaned.slice(1)}`;
  }
  return cleaned;
}

/**
 * Builds an RFC 5724 compliant SMS URI with iOS compatibility
 * iOS requires &body= separator while Android / standard requires ?body=
 */
export function buildSmsUri(options: SmsShareOptions): string {
  const { phoneNumber = '', message } = options;
  const cleanPhone = normalizeUgandanPhoneNumber(phoneNumber);
  const encodedBody = encodeURIComponent(message);

  // Detect iOS (iPhone/iPad/iPod)
  const isIOS = typeof navigator !== 'undefined' && 
    (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  if (isIOS) {
    if (cleanPhone) {
      return `sms:${cleanPhone}&body=${encodedBody}`;
    }
    return `sms:&body=${encodedBody}`;
  }

  // Android & standard URI syntax
  if (cleanPhone) {
    return `sms:${cleanPhone}?body=${encodedBody}`;
  }
  return `sms:?body=${encodedBody}`;
}

/**
 * Generates an optimized, concise SMS text format for product listings
 * specifically readable on both feature phones (dumbphones) and smartphones.
 */
export function generateProductSmsText(listing: {
  title: string;
  price: number;
  district: string;
  id: string;
}, shareUrl?: string): string {
  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const formattedPrice = `UGX ${listing.price.toLocaleString()}`;
  return `ANATECH MARKET: ${listing.title} for ${formattedPrice} in ${listing.district}. View item: ${url}`;
}

/**
 * Calculates SMS character counts and segments based on GSM 03.38 vs Unicode standards.
 * Non-smartphone carriers bill per 160 GSM chars (or 70 Unicode chars).
 */
export function calculateSmsSegments(text: string): SmsCalculation {
  // Check if text has non-GSM-7 characters (like non-ASCII emojis)
  // Basic GSM 7-bit charset regex
  const gsmRegex = /^[\u000A\u000D\u0020-\u007E\u00A1\u00A3\u00A4\u00A5\u00A7\u00BF\u00C4\u00C5\u00C6\u00C7\u00C9\u00D1\u00D6\u00D8\u00DC\u00DF\u00E0\u00E4\u00E5\u00E6\u00E7\u00E8\u00E9\u00EC\u00F1\u00F2\u00F6\u00F8\u00F9\u00FC\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9\u20AC]*$/;
  const isUnicode = !gsmRegex.test(text);

  const charCount = text.length;
  const singleLimit = isUnicode ? 70 : 160;
  const multiLimit = isUnicode ? 67 : 153;

  if (charCount <= singleLimit) {
    return {
      charCount,
      segmentCount: charCount === 0 ? 0 : 1,
      charsRemainingInCurrentSegment: singleLimit - charCount,
      isUnicode
    };
  }

  const segmentCount = Math.ceil(charCount / multiLimit);
  const charsRemainingInCurrentSegment = (segmentCount * multiLimit) - charCount;

  return {
    charCount,
    segmentCount,
    charsRemainingInCurrentSegment,
    isUnicode
  };
}

/**
 * Triggers the Native Web Share API if supported, or cleanly falls back
 * to opening the SMS application using the custom SMS URI builder.
 */
export async function shareProductViaSms(params: {
  title: string;
  message: string;
  url: string;
  phoneNumber?: string;
  forceSmsUri?: boolean;
}): Promise<{ method: 'web-share' | 'sms-uri' | 'clipboard'; success: boolean }> {
  const { title, message, url, phoneNumber, forceSmsUri } = params;

  // 1. If Web Share API is available and not forced to SMS URI
  if (!forceSmsUri && typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text: message,
        url
      });
      return { method: 'web-share', success: true };
    } catch (err: any) {
      // User aborted share sheet or cancelled
      if (err.name === 'AbortError') {
        return { method: 'web-share', success: false };
      }
      // Otherwise proceed to fallback
    }
  }

  // 2. Fallback: Custom SMS URI Builder
  const smsUri = buildSmsUri({
    phoneNumber,
    message
  });

  try {
    window.location.href = smsUri;
    return { method: 'sms-uri', success: true };
  } catch (err) {
    // 3. Fallback: Copy to clipboard if SMS URI protocol handler fails
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      return { method: 'clipboard', success: true };
    }
    return { method: 'sms-uri', success: false };
  }
}
