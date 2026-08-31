import { POI } from '../types';
import { DEFAULT_SCRIPT_URL, INITIAL_POIS_SAMPLE } from '../constants';

const STORAGE_KEYS = {
  SCRIPT_URL: 'pois_app_script_url',
  POIS_CACHE: 'pois_app_cached_data',
  CATEGORIES: 'pois_app_categories',
  DELETED_CATEGORIES: 'pois_app_deleted_categories',
  LAST_SYNC: 'pois_app_last_sync_timestamp',
  LOCAL_EXTENSIONS: 'pois_app_local_extensions',
  LOCAL_CUSTOM: 'pois_app_local_custom_records',
  DELETED_IDS: 'pois_app_deleted_ids',
  PENDING_SYNC: 'pois_app_pending_sync_queue',
};

export interface PendingSyncItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

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
    console.error('Failed to save local extensions', e);
  }
}

export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingSyncQueue(queue: PendingSyncItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save pending sync queue', e);
  }
}

export function getPendingSyncCount(): number {
  return getPendingSyncQueue().length;
}

export function getLocalCustomRecords(): Record<string, POI> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_CUSTOM);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalCustomRecords(records: Record<string, POI>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_CUSTOM, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save local custom records', e);
  }
}

export function getDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeletedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save deleted ids', e);
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

/**
 * Universal Multi-Transport dispatcher for Google Apps Script
 * Priority 1: Full-stack Express server proxy (/api/sheets/*) - completely avoids CORS and mobile redirect issues
 * Priority 2: Direct browser POST (text/plain)
 * Priority 3: Direct browser GET with query params
 */
async function sendPayloadToScript(url: string, payload: any): Promise<{ success: boolean; data?: any; error?: string }> {
  // Method 1: Try Full-stack Server-side Proxy
  try {
    let endpoint = '/api/sheets/save-poi';
    let bodyData: any = { targetUrl: url, poi: payload, isEdit: payload.action === 'update' };

    if (payload.action === 'delete') {
      endpoint = '/api/sheets/delete-poi';
      bodyData = { targetUrl: url, id: payload.id };
    } else if (payload.action === 'batch_sync') {
      endpoint = '/api/sheets/batch-sync';
      bodyData = { targetUrl: url, pois: payload.pois };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const proxyRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return { success: true, data };
    }
  } catch (proxyErr) {
    console.warn('Server proxy unavailable, falling back to direct browser transport:', proxyErr);
  }

  // Method 2: Direct POST with text/plain (avoids CORS preflight)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const postRes = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (postRes.ok) {
      try {
        const json = await postRes.json();
        return { success: true, data: json };
      } catch {
        return { success: true };
      }
    }
  } catch (postErr) {
    console.warn('Direct POST failed, trying GET fallback parameter method...', postErr);
  }

  // Method 3: GET with encoded parameters
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const separator = url.includes('?') ? '&' : '?';
    const jsonString = JSON.stringify(payload);
    const getUrl = `${url}${separator}action=${encodeURIComponent(payload.action || 'update')}&data=${encodeURIComponent(jsonString)}&_ts=${Date.now()}`;

    const getRes = await fetch(getUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (getRes.ok) {
      try {
        const json = await getRes.json();
        return { success: true, data: json };
      } catch {
        return { success: true };
      }
    }
    return { success: false, error: `HTTP ${getRes.status}` };
  } catch (getErr: any) {
    console.warn('GET parameter fallback also failed:', getErr);
    return { success: false, error: getErr?.message || 'Error de conexión' };
  }
}

/**
 * Flushes all pending changes from the local queue to Google Sheets
 */
export async function syncPendingQueue(customUrl?: string): Promise<{ syncedCount: number; remainingCount: number }> {
  const url = customUrl || getStoredScriptUrl();
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return { syncedCount: 0, remainingCount: 0 };

  const remainingQueue: PendingSyncItem[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    const res = await sendPayloadToScript(url, item.payload);
    if (res.success) {
      syncedCount++;
    } else {
      remainingQueue.push(item);
    }
  }

  savePendingSyncQueue(remainingQueue);
  return { syncedCount, remainingCount: remainingQueue.length };
}

/**
 * Force uploads an entire list of POIs to Google Sheets in one batch operation
 */
export async function forceBatchSyncAllToSheet(pois: POI[], customUrl?: string): Promise<{ success: boolean; count: number; error?: string }> {
  const url = customUrl || getStoredScriptUrl();
  if (!pois || pois.length === 0) {
    return { success: false, count: 0, error: 'No hay POIs para sincronizar' };
  }

  // 1. Try batch sync first
  const batchRes = await sendPayloadToScript(url, {
    action: 'batch_sync',
    pois: pois,
  });

  if (batchRes.success) {
    // Clear pending queue and save local cache
    savePendingSyncQueue([]);
    saveCachedPOIs(pois);
    return { success: true, count: pois.length };
  }

  // 2. If batch failed, fallback to sequential sync
  let synced = 0;
  for (const poi of pois) {
    const itemRes = await sendPayloadToScript(url, {
      action: 'update',
      ...poi,
    });
    if (itemRes.success) synced++;
  }

  if (synced > 0) {
    savePendingSyncQueue([]);
    saveCachedPOIs(pois);
    return { success: true, count: synced };
  }

  return { success: false, count: 0, error: batchRes.error || 'Error al conectar con Google Sheets' };
}

/**
 * Test full connection (reading from Sheets and testing endpoint availability)
 */
export async function testSheetsConnection(customUrl?: string): Promise<{ success: boolean; poisCount: number; message: string; error?: string }> {
  const url = customUrl || getStoredScriptUrl();

  // Try server proxy test first
  try {
    const res = await fetch('/api/sheets/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl: url }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success,
        poisCount: data.poisCount || 0,
        message: data.message || `Conexión verificada. ${data.poisCount || 0} POIs encontrados.`,
      };
    }
  } catch {}

  // Fallback to direct read
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const directRes = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);

    if (directRes.ok) {
      const data = await directRes.json();
      const count = Array.isArray(data) ? data.length : 0;
      return {
        success: true,
        poisCount: count,
        message: `Conectado a Google Sheets. Se han recuperado ${count} POIs correctamente.`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      poisCount: 0,
      message: 'No se pudo contactar con Google Apps Script.',
      error: err?.message || 'Error de red',
    };
  }

  return {
    success: false,
    poisCount: 0,
    message: 'Error al contactar con la hoja de cálculo.',
  };
}

/**
 * Fetch all POIs from Google Apps Script with smart merge and zero data loss
 */
export async function fetchPOIsFromSheet(customUrl?: string): Promise<{ pois: POI[]; source: 'live' | 'cache'; error?: string; pendingCount: number }> {
  const url = customUrl || getStoredScriptUrl();
  const extensionsMap = getLocalExtensionsMap();
  const localCustom = getLocalCustomRecords();
  const deletedIds = new Set(getDeletedIds());

  // Attempt background sync of any pending queue items first
  try {
    await syncPendingQueue(url);
  } catch (e) {
    console.warn('Queue flush attempt skipped:', e);
  }

  // 1. Try fetching via server proxy first for 100% reliable cross-origin fetch
  let rawData: any = null;
  try {
    const proxyUrl = `/api/sheets/pois?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const proxyRes = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (proxyRes.ok) {
      rawData = await proxyRes.json();
    }
  } catch (proxyErr) {
    console.warn('Server proxy fetch failed, attempting direct fetch:', proxyErr);
  }

  // 2. Fallback to direct client fetch if proxy didn't return an array
  if (!Array.isArray(rawData)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        rawData = await response.json();
      }
    } catch (directErr: any) {
      console.warn('Direct fetch also failed:', directErr);
    }
  }

  // Process data if successfully retrieved
  if (Array.isArray(rawData)) {
    try {
      const remotePOIs: POI[] = rawData
        .filter((item: any) => {
          const id = (item.id || item.ID || '').toString().trim();
          return !deletedIds.has(id);
        })
        .map((item: any) => {
          const id = (item.id || item.ID || '').toString().trim();
          const localExt = extensionsMap[id] || {};
          const localRec = localCustom[id];

          const lat = typeof item.lat === 'number' ? item.lat : parseFloat((item.lat || '0').toString().replace(',', '.'));
          const lng = typeof item.lng === 'number' ? item.lng : parseFloat((item.lng || '0').toString().replace(',', '.'));

          let tags: string[] = [];
          if (Array.isArray(item.tags)) {
            tags = item.tags;
          } else if (typeof item.tags === 'string' && item.tags.trim()) {
            tags = item.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
          } else if (Array.isArray(localExt.tags)) {
            tags = localExt.tags;
          } else if (localRec && Array.isArray(localRec.tags)) {
            tags = localRec.tags;
          }

          return {
            id: id || `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            lat: isNaN(lat) ? 0 : lat,
            lng: isNaN(lng) ? 0 : lng,
            nombre: (item.nombre || item.Nombre || localRec?.nombre || '').toString(),
            descripcion: (item.descripcion || item.Descripcion || localRec?.descripcion || '').toString(),
            categoria: (item.categoria || item.Categoria || localRec?.categoria || 'Otro').toString(),
            ciudad: (item.ciudad || item.Ciudad || localRec?.ciudad || '').toString(),
            rating: item.rating !== undefined && item.rating !== '' ? Number(item.rating) : (localExt.rating ?? localRec?.rating),
            direccion: (item.direccion || localExt.direccion || localRec?.direccion || '').toString(),
            telefono: (item.telefono || localExt.telefono || localRec?.telefono || '').toString(),
            web: (item.web || localExt.web || localRec?.web || '').toString(),
            horario: (item.horario || localExt.horario || localRec?.horario || '').toString(),
            precio: (item.precio || localExt.precio || localRec?.precio || '').toString(),
            tags: tags,
            foto_url: (item.foto_url || localExt.foto_url || localRec?.foto_url || '').toString(),
            favorito: item.favorito === true || item.favorito === 'TRUE' || localExt.favorito === true || localRec?.favorito === true,
            notas_privadas: (item.notas_privadas || localExt.notas_privadas || localRec?.notas_privadas || '').toString(),
            estado: (item.estado || localExt.estado || localRec?.estado || 'Pendiente').toString(),
          };
        });

      // Zero data loss: check if there are local POIs not yet present in the remote sheet
      const remoteIdSet = new Set(remotePOIs.map((p) => p.id));
      const unmergedLocalPois: POI[] = Object.values(localCustom).filter((p) => !remoteIdSet.has(p.id) && !deletedIds.has(p.id));

      const finalMergedPOIs = [...unmergedLocalPois, ...remotePOIs];
      saveCachedPOIs(finalMergedPOIs);

      return {
        pois: finalMergedPOIs,
        source: 'live',
        pendingCount: getPendingSyncCount(),
      };
    } catch (parseErr: any) {
      console.error('Error processing remote POIs:', parseErr);
    }
  }

  // Fallback to local cache
  const cached = getCachedPOIs();
  return {
    pois: cached,
    source: 'cache',
    error: 'No se pudo conectar con Google Sheets en este momento. Mostrando copia local.',
    pendingCount: getPendingSyncCount(),
  };
}

/**
 * Save POI (Create or Update) with guaranteed persistence & dual-sync transport
 */
export async function savePOIToSheet(poi: POI, isEdit: boolean, customUrl?: string): Promise<{ success: boolean; id: string; error?: string; isOffline?: boolean }> {
  const url = customUrl || getStoredScriptUrl();
  const currentList = getCachedPOIs();
  const extensionsMap = getLocalExtensionsMap();
  const localCustom = getLocalCustomRecords();

  const poiId = poi.id && poi.id.trim() !== '' ? poi.id.trim() : `ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const completePoi: POI = { ...poi, id: poiId };

  // 1. Save extended properties
  extensionsMap[poiId] = {
    rating: completePoi.rating,
    direccion: completePoi.direccion,
    telefono: completePoi.telefono,
    web: completePoi.web,
    horario: completePoi.horario,
    precio: completePoi.precio,
    tags: completePoi.tags,
    foto_url: completePoi.foto_url,
    favorito: completePoi.favorito,
    notas_privadas: completePoi.notas_privadas,
    estado: completePoi.estado,
  };
  saveLocalExtensionsMap(extensionsMap);

  // 2. Save full local custom record to guarantee zero data loss
  localCustom[poiId] = completePoi;
  saveLocalCustomRecords(localCustom);

  // 3. Update cached master list immediately
  let updatedList: POI[];
  if (isEdit) {
    updatedList = currentList.map((p) => (p.id === poiId ? completePoi : p));
  } else {
    updatedList = [completePoi, ...currentList.filter((p) => p.id !== poiId)];
  }
  saveCachedPOIs(updatedList);

  // 4. Build payload
  const payload = {
    action: isEdit ? 'update' : 'create',
    id: poiId,
    lat: completePoi.lat,
    lng: completePoi.lng,
    nombre: completePoi.nombre,
    descripcion: completePoi.descripcion,
    categoria: completePoi.categoria,
    ciudad: completePoi.ciudad,
    rating: completePoi.rating ?? '',
    direccion: completePoi.direccion ?? '',
    telefono: completePoi.telefono ?? '',
    web: completePoi.web ?? '',
    horario: completePoi.horario ?? '',
    precio: completePoi.precio ?? '',
    tags: completePoi.tags ?? [],
    foto_url: completePoi.foto_url ?? '',
    favorito: completePoi.favorito ?? false,
    notas_privadas: completePoi.notas_privadas ?? '',
    estado: completePoi.estado ?? 'Pendiente',
  };

  // 5. Enqueue in pending queue
  const queue = getPendingSyncQueue().filter((item) => item.id !== poiId);
  queue.push({
    id: poiId,
    action: isEdit ? 'update' : 'create',
    payload,
    timestamp: Date.now(),
  });
  savePendingSyncQueue(queue);

  // 6. Attempt dual-transport dispatch
  const dispatchRes = await sendPayloadToScript(url, payload);

  if (dispatchRes.success) {
    // Remove from pending queue on confirmation
    const updatedQueue = getPendingSyncQueue().filter((item) => item.id !== poiId);
    savePendingSyncQueue(updatedQueue);
    return { success: true, id: poiId };
  } else {
    return {
      success: true,
      id: poiId,
      isOffline: true,
      error: 'Guardado en tu dispositivo. Se sincronizará automáticamente con Google Sheets.',
    };
  }
}

/**
 * Delete POI with local cleanup and remote sync
 */
export async function deletePOIFromSheet(poiId: string, customUrl?: string): Promise<{ success: boolean; error?: string }> {
  const url = customUrl || getStoredScriptUrl();
  const currentList = getCachedPOIs();
  const extensionsMap = getLocalExtensionsMap();
  const localCustom = getLocalCustomRecords();
  const deletedIds = getDeletedIds();

  // 1. Clean local maps
  delete extensionsMap[poiId];
  saveLocalExtensionsMap(extensionsMap);

  delete localCustom[poiId];
  saveLocalCustomRecords(localCustom);

  if (!deletedIds.includes(poiId)) {
    deletedIds.push(poiId);
    saveDeletedIds(deletedIds);
  }

  // 2. Clean cache
  const updatedList = currentList.filter((p) => p.id !== poiId);
  saveCachedPOIs(updatedList);

  // 3. Enqueue delete
  const payload = {
    action: 'delete',
    id: poiId,
  };

  const queue = getPendingSyncQueue().filter((item) => item.id !== poiId);
  queue.push({
    id: poiId,
    action: 'delete',
    payload,
    timestamp: Date.now(),
  });
  savePendingSyncQueue(queue);

  // 4. Dispatch delete
  const res = await sendPayloadToScript(url, payload);
  if (res.success) {
    const updatedQueue = getPendingSyncQueue().filter((item) => item.id !== poiId);
    savePendingSyncQueue(updatedQueue);
    return { success: true };
  }

  return { success: true, error: 'Eliminado del dispositivo. Pendiente de sincronizar con Google Sheets.' };
}

// Free reverse geocoding using OpenStreetMap Nominatim
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
