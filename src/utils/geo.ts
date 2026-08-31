import { NavigationInfo } from '../types';

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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
 * Formats distance nicely (e.g. "350 m" or "4.2 km")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Calculates compass bearing from origin to destination
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { degrees: number; cardinal: string } {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const degrees = ((θ * 180) / Math.PI + 360) % 360;

  const cardinals = [
    'Norte ↑',
    'Noreste ↗',
    'Este →',
    'Sureste ↘',
    'Sur ↓',
    'Suroeste ↙',
    'Oeste ←',
    'Noroeste ↖',
  ];
  const index = Math.round(degrees / 45) % 8;
  const cardinal = cardinals[index];

  return { degrees: Math.round(degrees), cardinal };
}

/**
 * Computes full navigation summary with ETAs and bearing
 */
export function computeNavigationInfo(
  userLat: number,
  userLng: number,
  poiLat: number,
  poiLng: number
): NavigationInfo {
  const distanceKm = calculateHaversineDistance(userLat, userLng, poiLat, poiLng);
  const { degrees, cardinal } = calculateBearing(userLat, userLng, poiLat, poiLng);

  // Estimations:
  // Walking: ~4.5 km/h -> 1 km takes ~13.3 min
  const etaWalkingMin = Math.max(1, Math.round(distanceKm * 13.3));
  // Cycling: ~15 km/h -> 1 km takes ~4 min
  const etaCyclingMin = Math.max(1, Math.round(distanceKm * 4));
  // Driving (Urban + roads): rough average with stops ~30-40 km/h -> 1 km ~ 2 min + 2 min buffer
  const etaDrivingMin = Math.max(1, Math.round(distanceKm * 2 + (distanceKm > 0.5 ? 2 : 0)));

  return {
    distanceKm,
    distanceFormatted: formatDistance(distanceKm),
    bearingDeg: degrees,
    bearingCardinal: cardinal,
    etaWalkingMin,
    etaDrivingMin,
    etaCyclingMin,
  };
}

/**
 * Generates navigation URLs for mobile apps
 */
export function getNavigationAppUrls(
  originLat: number | null,
  originLng: number | null,
  destLat: number,
  destLng: number,
  destName: string
) {
  const originParam =
    originLat && originLng ? `&origin=${originLat},${originLng}` : '';
  const appleOriginParam =
    originLat && originLng ? `&saddr=${originLat},${originLng}` : '';

  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destLat},${destLng}&travelmode=driving`,
    googleMapsWalking: `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destLat},${destLng}&travelmode=walking`,
    appleMaps: `https://maps.apple.com/?${appleOriginParam}&daddr=${destLat},${destLng}&dirflg=d`,
    waze: `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`,
    openStreetMap: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${
      originLat ? `${originLat}%2C${originLng}%3B` : ''
    }${destLat}%2C${destLng}`,
  };
}
