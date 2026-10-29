/**
 * Browser Geolocation API District Detection Utility for ANATECH MARKET (Uganda)
 * 
 * Auto-detects the user's geographical coordinates using navigator.geolocation,
 * determines the closest Ugandan district using centroid geodesics (Haversine formula),
 * and supports reverse-geocoding lookups for district/county identification.
 */

export interface DistrictCoordinate {
  id: string;
  name: string;
  region: 'Central' | 'Eastern' | 'Northern' | 'Western';
  lat: number;
  lng: number;
  hubs: string[];
}

export interface GeolocationDetectionResult {
  success: boolean;
  district: string;
  districtId: string;
  region: string;
  nearestHub?: string;
  distanceKm: number;
  coords?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  isWithinUganda: boolean;
  reverseGeocodedAddress?: string;
  error?: string;
  errorCode?: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'UNKNOWN';
}

// Centroid coordinates for Ugandan districts
export const UGANDA_DISTRICT_COORDINATES: DistrictCoordinate[] = [
  {
    id: 'kampala',
    name: 'Kampala',
    region: 'Central',
    lat: 0.3476,
    lng: 32.5825,
    hubs: ['Nakawa', 'Central Division', 'Kawempe', 'Makindye', 'Rubaga', 'Ntinda', 'Kisaasi', 'Kololo', 'Bwaise', 'Kalerwe']
  },
  {
    id: 'wakiso',
    name: 'Wakiso',
    region: 'Central',
    lat: 0.4044,
    lng: 32.4594,
    hubs: ['Kira', 'Nansana', 'Entebbe Town', 'Kasangati', 'Kyengera', 'Gayaza', 'Namugongo']
  },
  {
    id: 'mukono',
    name: 'Mukono',
    region: 'Central',
    lat: 0.3533,
    lng: 32.7553,
    hubs: ['Mukono Town', 'Seeta', 'Goma', 'Mbalala', 'Katosi']
  },
  {
    id: 'jinja',
    name: 'Jinja',
    region: 'Eastern',
    lat: 0.4244,
    lng: 33.2042,
    hubs: ['Jinja City', 'Bugembe', 'Walukuba', 'Mafubira', 'Kakira']
  },
  {
    id: 'mbarara',
    name: 'Mbarara',
    region: 'Western',
    lat: -0.6072,
    lng: 30.6545,
    hubs: ['Mbarara City', 'Kamukuzi', 'Kakoba', 'Nyamitanga', 'Biharwe']
  },
  {
    id: 'gulu',
    name: 'Gulu',
    region: 'Northern',
    lat: 2.7747,
    lng: 32.2990,
    hubs: ['Gulu City', 'Layibi', 'Pece', 'Laroo', 'Bardege']
  },
  {
    id: 'masaka',
    name: 'Masaka',
    region: 'Central',
    lat: -0.3411,
    lng: 31.7361,
    hubs: ['Masaka City', 'Nyendo', 'Kimanya', 'Katwe', 'Kimaanya']
  },
  {
    id: 'mbale',
    name: 'Mbale',
    region: 'Eastern',
    lat: 1.0784,
    lng: 34.1754,
    hubs: ['Mbale City', 'Industrial Area', 'Namakwekwe', 'Nkoma', 'Malukhu']
  },
  {
    id: 'arua',
    name: 'Arua',
    region: 'Northern',
    lat: 3.0303,
    lng: 30.9110,
    hubs: ['Arua City', 'Ova', 'Awindiri', 'Dadamu', 'Pajulu']
  },
  {
    id: 'lira',
    name: 'Lira',
    region: 'Northern',
    lat: 2.2472,
    lng: 32.8998,
    hubs: ['Lira City', 'Ojwina', 'Central Division', 'Adyel', 'Railway']
  },
  {
    id: 'fort-portal',
    name: 'Fort Portal',
    region: 'Western',
    lat: 0.6552,
    lng: 30.2744,
    hubs: ['Tourism City', 'Kabarole', 'Kicwamba', 'Bazaar']
  },
  {
    id: 'kabale',
    name: 'Kabale',
    region: 'Western',
    lat: -1.2486,
    lng: 29.9892,
    hubs: ['Kabale Municipality', 'Kigongi', 'Central', 'Bugongi']
  },
  {
    id: 'soroti',
    name: 'Soroti',
    region: 'Eastern',
    lat: 1.7146,
    lng: 33.6111,
    hubs: ['Soroti City', 'Pioneer', 'Camp Swahili', 'Madera']
  },
  {
    id: 'tororo',
    name: 'Tororo',
    region: 'Eastern',
    lat: 0.6928,
    lng: 34.1810,
    hubs: ['Tororo Town', 'Malaba Border', 'Osukuru']
  },
  {
    id: 'kasese',
    name: 'Kasese',
    region: 'Western',
    lat: 0.1786,
    lng: 30.0805,
    hubs: ['Kasese Municipality', 'Hima', 'Bwera']
  },
  {
    id: 'hoima',
    name: 'Hoima',
    region: 'Western',
    lat: 1.4331,
    lng: 31.3524,
    hubs: ['Oil City', 'Kahoora', 'Busiisi', 'Bujumbura']
  },
  {
    id: 'mityana',
    name: 'Mityana',
    region: 'Central',
    lat: 0.4019,
    lng: 32.0428,
    hubs: ['Mityana Town', 'Busimbi', 'Ttamu']
  },
  {
    id: 'luweero',
    name: 'Luweero',
    region: 'Central',
    lat: 0.8492,
    lng: 32.4731,
    hubs: ['Luweero Town', 'Wobulenzi', 'Bombo']
  }
];

// Uganda bounding box (Latitude: -1.5° to 4.3°, Longitude: 29.5° to 35.1°)
export const UGANDA_BOUNDS = {
  minLat: -1.8,
  maxLat: 4.5,
  minLng: 29.0,
  maxLng: 35.5
};

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks whether coordinate point is geographically located in Uganda
 */
export function isCoordinateInUganda(lat: number, lng: number): boolean {
  return (
    lat >= UGANDA_BOUNDS.minLat &&
    lat <= UGANDA_BOUNDS.maxLat &&
    lng >= UGANDA_BOUNDS.minLng &&
    lng <= UGANDA_BOUNDS.maxLng
  );
}

/**
 * Finds the nearest Ugandan district for given coordinates
 */
export function findNearestUgandanDistrict(lat: number, lng: number): {
  district: DistrictCoordinate;
  distanceKm: number;
} {
  let closest = UGANDA_DISTRICT_COORDINATES[0];
  let minDistance = Infinity;

  for (const d of UGANDA_DISTRICT_COORDINATES) {
    const dist = calculateHaversineDistanceKm(lat, lng, d.lat, d.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  }

  return { district: closest, distanceKm: Math.round(minDistance * 10) / 10 };
}

/**
 * Optional reverse geocoding via OpenStreetMap Nominatim with fast timeout
 */
async function reverseGeocodeUgandaDistrict(lat: number, lng: number, timeoutMs = 2500): Promise<{ districtName?: string; fullAddress?: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    
    // Check county, city, state, district
    const candidates = [
      addr.county,
      addr.city,
      addr.state,
      addr.state_district,
      addr.municipality,
      addr.town
    ].filter(Boolean).map(c => String(c).toLowerCase());

    for (const d of UGANDA_DISTRICT_COORDINATES) {
      const match = candidates.some(c => c.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(c));
      if (match) {
        return {
          districtName: d.name,
          fullAddress: data.display_name
        };
      }
    }

    return { fullAddress: data.display_name };
  } catch (e) {
    return null;
  }
}

/**
 * Auto-detect user's district using the browser Geolocation API
 */
export async function detectUserDistrict(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<GeolocationDetectionResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      district: 'Kampala',
      districtId: 'kampala',
      region: 'Central',
      distanceKm: 0,
      isWithinUganda: false,
      error: 'Browser Geolocation API is not supported on this device or environment.',
      errorCode: 'NOT_SUPPORTED'
    };
  }

  return new Promise((resolve) => {
    const geoOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 8000,
      maximumAge: options?.maximumAge ?? 60000
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const inUganda = isCoordinateInUganda(latitude, longitude);
        const { district, distanceKm } = findNearestUgandanDistrict(latitude, longitude);

        // Attempt reverse geocoding if within Uganda
        let reverseAddr: string | undefined = undefined;
        let matchedDistrictName = district.name;
        let matchedDistrictId = district.id;
        let matchedRegion = district.region;

        if (inUganda) {
          try {
            const reverse = await reverseGeocodeUgandaDistrict(latitude, longitude, 2500);
            if (reverse?.districtName) {
              const matched = UGANDA_DISTRICT_COORDINATES.find(
                d => d.name.toLowerCase() === reverse.districtName?.toLowerCase()
              );
              if (matched) {
                matchedDistrictName = matched.name;
                matchedDistrictId = matched.id;
                matchedRegion = matched.region;
              }
            }
            if (reverse?.fullAddress) {
              reverseAddr = reverse.fullAddress;
            }
          } catch (e) {
            // fallback to centroid matching
          }
        }

        resolve({
          success: true,
          district: matchedDistrictName,
          districtId: matchedDistrictId,
          region: matchedRegion,
          nearestHub: district.hubs[0],
          distanceKm,
          isWithinUganda: inUganda,
          coords: {
            latitude: Math.round(latitude * 10000) / 10000,
            longitude: Math.round(longitude * 10000) / 10000,
            accuracy: Math.round(accuracy)
          },
          reverseGeocodedAddress: reverseAddr
        });
      },
      (err) => {
        let code: GeolocationDetectionResult['errorCode'] = 'UNKNOWN';
        let msg = 'Failed to retrieve location.';

        switch (err.code) {
          case err.PERMISSION_DENIED:
            code = 'PERMISSION_DENIED';
            msg = 'Location access was denied. Please allow location access in your browser settings to auto-detect your district.';
            break;
          case err.POSITION_UNAVAILABLE:
            code = 'POSITION_UNAVAILABLE';
            msg = 'Location position is currently unavailable from your device network or GPS.';
            break;
          case err.TIMEOUT:
            code = 'TIMEOUT';
            msg = 'Location request timed out. Please try again or select your district manually.';
            break;
        }

        resolve({
          success: false,
          district: 'Kampala',
          districtId: 'kampala',
          region: 'Central',
          distanceKm: 0,
          isWithinUganda: false,
          error: msg,
          errorCode: code
        });
      },
      geoOptions
    );
  });
}

/**
 * Helper to simulate district detection for testing or fast demo verification
 */
export function simulateDistrictDetection(districtId: string): GeolocationDetectionResult {
  const d = UGANDA_DISTRICT_COORDINATES.find(c => c.id === districtId) || UGANDA_DISTRICT_COORDINATES[0];
  return {
    success: true,
    district: d.name,
    districtId: d.id,
    region: d.region,
    nearestHub: d.hubs[0],
    distanceKm: 0.5,
    isWithinUganda: true,
    coords: {
      latitude: d.lat,
      longitude: d.lng,
      accuracy: 15
    },
    reverseGeocodedAddress: `${d.hubs[0]}, ${d.name} District, ${d.region} Region, Uganda`
  };
}
