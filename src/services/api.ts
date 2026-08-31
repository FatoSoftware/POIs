import { POI } from '../types';
import { DEFAULT_SCRIPT_URL, INITIAL_POIS_SAMPLE } from '../constants';

const STORAGE_KEYS = {
  SCRIPT_URL: 'pois_app_script_url',
  POIS_CACHE: 'pois_app_cached_data',
  LAST_SYNC: 'pois_app_last_sync',
  LOCAL_EXTENSIONS: 'pois_app_local_extensions',
};

export function getStoredScriptUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || DEFAULT_SCRIPT_URL;
  } catch {
    return DEFAULT_SCRIPT_URL;
  }
}

export function setStoredScriptUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, url.trim());
  } catch (e) {
    console.error('Failed to save script URL in localStorage', e);
  }
}

export function getLocalExtensionsMap(): Record<string, Partial<POI>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_EXTENSIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalExtensionsMap(map: Record<string, Partial<POI>>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_EXTENSIONS, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save local extensions in localStorage', e);
  }
}

export function getCachedPOIs(): POI[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POIS_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading cached POIs', e);
  }
  return INITIAL_POIS_SAMPLE;
}

export function saveCachedPOIs(pois: POI[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POIS_CACHE, JSON.stringify(pois));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.error('Error saving cached POIs', e);
  }
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch {
    return null;
  }
}

// Fetch all POIs from Google Apps Script with fallback & smart merge
export async function fetchPOIsFromSheet(customUrl?: string): Promise<{ pois: POI[]; source: 'live' | 'cache'; error?: string }> {
  const url = customUrl || getStoredScriptUrl();
  const extensionsMap = getLocalExtensionsMap();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('La respuesta de Google Sheets no es una lista válida');
    }

    // Map each item and preserve backwards compatibility
    const parsedPOIs: POI[] = data.map((item: any) => {
      const id = (item.id || item.ID || '').toString().trim();
      const localExt = extensionsMap[id] || {};

      const lat = typeof item.lat === 'number' ? item.lat : parseFloat((item.lat || '0').toString().replace(',', '.'));
      const lng = typeof item.lng === 'number' ? item.lng : parseFloat((item.lng || '0').toString().replace(',', '.'));

      let tags: string[] = [];
      if (Array.isArray(item.tags)) {
        tags = item.tags;
      } else if (typeof item.tags === 'string' && item.tags.trim()) {
        tags = item.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      } else if (Array.isArray(localExt.tags)) {
        tags = localExt.tags;
      }

      return {
        id: id || `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        lat: isNaN(lat) ? 0 : lat,
        lng: isNaN(lng) ? 0 : lng,
        nombre: (item.nombre || item.Nombre || '').toString(),
        descripcion: (item.descripcion || item.Descripcion || '').toString(),
        categoria: (item.categoria || item.Categoria || 'Otro').toString(),
        ciudad: (item.ciudad || item.Ciudad || '').toString(),
        // Extended attributes: prioritize sheet values if present, else merge local extension
        rating: item.rating !== undefined && item.rating !== '' ? Number(item.rating) : localExt.rating,
        direccion: (item.direccion || localExt.direccion || '').toString(),
        telefono: (item.telefono || localExt.telefono || '').toString(),
        web: (item.web || localExt.web || '').toString(),
        horario: (item.horario || localExt.horario || '').toString(),
        precio: (item.precio || localExt.precio || '').toString(),
        tags: tags,
        foto_url: (item.foto_url || localExt.foto_url || '').toString(),
        favorito: item.favorito === true || item.favorito === 'TRUE' || localExt.favorito === true,
        notas_privadas: (item.notas_privadas || localExt.notas_privadas || '').toString(),
        estado: (item.estado || localExt.estado || 'Pendiente').toString(),
      };
    });

    saveCachedPOIs(parsedPOIs);
    return { pois: parsedPOIs, source: 'live' };
  } catch (error: any) {
    console.warn('Could not fetch from live Google Sheet, using cache:', error);
    const cached = getCachedPOIs();
    return {
      pois: cached,
      source: 'cache',
      error: error?.message || 'No se pudo conectar con Google Sheets en este momento.',
    };
  }
}

// Helper to save POI (Create or Update)
export async function savePOIToSheet(poi: POI, isEdit: boolean, customUrl?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const url = customUrl || getStoredScriptUrl();
  const currentList = getCachedPOIs();
  const extensionsMap = getLocalExtensionsMap();

  // Save extended properties in local storage map to ensure zero data loss
  const poiId = poi.id || `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const completePoi: POI = { ...poi, id: poiId };

  extensionsMap[poiId] = {
    rating: poi.rating,
    direccion: poi.direccion,
    telefono: poi.telefono,
    web: poi.web,
    horario: poi.horario,
    precio: poi.precio,
    tags: poi.tags,
    foto_url: poi.foto_url,
    favorito: poi.favorito,
    notas_privadas: poi.notas_privadas,
    estado: poi.estado,
  };
  saveLocalExtensionsMap(extensionsMap);

  // Optimistically update local list
  let updatedList: POI[];
  if (isEdit) {
    updatedList = currentList.map((p) => (p.id === poiId ? completePoi : p));
  } else {
    updatedList = [completePoi, ...currentList.filter((p) => p.id !== poiId)];
  }
  saveCachedPOIs(updatedList);

  // Prepare payload for Apps Script (supports both classic and extended schema)
  const payload = {
    action: isEdit ? 'update' : 'create',
    id: poiId,
    lat: poi.lat,
    lng: poi.lng,
    nombre: poi.nombre,
    descripcion: poi.descripcion,
    categoria: poi.categoria,
    ciudad: poi.ciudad,
    rating: poi.rating ?? '',
    direccion: poi.direccion ?? '',
    telefono: poi.telefono ?? '',
    web: poi.web ?? '',
    horario: poi.horario ?? '',
    precio: poi.precio ?? '',
    tags: poi.tags ?? [],
    foto_url: poi.foto_url ?? '',
    favorito: poi.favorito ?? false,
    notas_privadas: poi.notas_privadas ?? '',
    estado: poi.estado ?? 'Pendiente',
  };

  try {
    // Send to Apps Script
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      console.warn('Apps Script responded with non-200 status', response.status);
    }

    return { success: true, id: poiId };
  } catch (error: any) {
    console.warn('Network error posting to Apps Script (optimistic update saved locally):', error);
    // Even if fetch throws (e.g. CORS preflight redirect on some browser setups), the local update succeeded
    return { success: true, id: poiId, error: 'Guardado localmente. Se sincronizará con Google Sheets.' };
  }
}

// Helper to delete POI
export async function deletePOIFromSheet(poiId: string, customUrl?: string): Promise<{ success: boolean; error?: string }> {
  const url = customUrl || getStoredScriptUrl();
  const currentList = getCachedPOIs();
  const extensionsMap = getLocalExtensionsMap();

  delete extensionsMap[poiId];
  saveLocalExtensionsMap(extensionsMap);

  const updatedList = currentList.filter((p) => p.id !== poiId);
  saveCachedPOIs(updatedList);

  const payload = {
    action: 'delete',
    id: poiId,
  };

  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
    return { success: true };
  } catch (error: any) {
    console.warn('Delete request error, optimistic delete applied locally', error);
    return { success: true, error: 'Eliminado en la aplicación local.' };
  }
}

// Free reverse geocoding using OpenStreetMap Nominatim for user convenience
export async function reverseGeocode(lat: number, lng: number): Promise<{ ciudad?: string; direccion?: string }> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'es',
      },
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (!data || !data.address) return {};

    const addr = data.address;
    const ciudad = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    
    // Format a readable address
    const road = addr.road || addr.pedestrian || addr.street || '';
    const houseNumber = addr.house_number ? `, ${addr.house_number}` : '';
    const suburb = addr.suburb || addr.neighbourhood ? ` (${addr.suburb || addr.neighbourhood})` : '';
    const direccion = road ? `${road}${houseNumber}${suburb}` : data.display_name?.split(',').slice(0, 2).join(',') || '';

    return {
      ciudad: ciudad.trim(),
      direccion: direccion.trim(),
    };
  } catch {
    return {};
  }
}
