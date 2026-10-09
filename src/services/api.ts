import { POI } from '../types';
import { INITIAL_POIS_SAMPLE } from '../constants';

// ============================================================================
// 1. VARIABLES DE CONFIGURACIÓN AIRTABLE (FETCH NATIVO JAVASCRIPT)
// ============================================================================
// Puedes establecer aquí tus credenciales fijas o modificarlas en cualquier
// momento desde la pantalla de "Ajustes" de la aplicación sin tocar código.
// También son compatibles con variables de entorno de Vite/Cloudflare (VITE_*)
// ============================================================================

export const AIRTABLE_PERSONAL_ACCESS_TOKEN: string =
  (import.meta as any).env?.VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN ||
  ''; // Ejemplo: patxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

export const AIRTABLE_BASE_ID: string =
  (import.meta as any).env?.VITE_AIRTABLE_BASE_ID ||
  ''; // Ejemplo: appxxxxxxxxxxxxxx

export const AIRTABLE_TABLE_NAME: string =
  (import.meta as any).env?.VITE_AIRTABLE_TABLE_NAME ||
  'POIs'; // Nombre exacto de tu tabla en Airtable (por defecto: POIs)

// Claves de almacenamiento local para persistencia y modo offline
const STORAGE_KEYS = {
  AIRTABLE_TOKEN: 'pois_app_airtable_token',
  AIRTABLE_BASE_ID: 'pois_app_airtable_base_id',
  AIRTABLE_TABLE_NAME: 'pois_app_airtable_table_name',
  POIS_CACHE: 'pois_app_cached_data',
  CATEGORIES: 'pois_app_categories',
  LAST_SYNC: 'pois_app_last_sync_timestamp',
  LOCAL_EXTENSIONS: 'pois_app_local_extensions',
  LOCAL_CUSTOM: 'pois_app_local_custom_records',
  DELETED_IDS: 'pois_app_deleted_ids',
  PENDING_SYNC: 'pois_app_pending_sync_queue',
};

export interface AirtableConfig {
  token: string;
  baseId: string;
  tableName: string;
}

export interface PendingSyncItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  poi?: POI;
  airtableRecordId?: string;
  timestamp: number;
}

// ============================================================================
// GESTIÓN DE CREDENCIALES
// ============================================================================

export function getAirtableConfig(): AirtableConfig {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AIRTABLE_TOKEN) || AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const baseId = localStorage.getItem(STORAGE_KEYS.AIRTABLE_BASE_ID) || AIRTABLE_BASE_ID;
    const tableName = localStorage.getItem(STORAGE_KEYS.AIRTABLE_TABLE_NAME) || AIRTABLE_TABLE_NAME;
    return {
      token: token.trim(),
      baseId: baseId.trim(),
      tableName: tableName.trim() || 'POIs',
    };
  } catch {
    return {
      token: AIRTABLE_PERSONAL_ACCESS_TOKEN.trim(),
      baseId: AIRTABLE_BASE_ID.trim(),
      tableName: AIRTABLE_TABLE_NAME.trim() || 'POIs',
    };
  }
}

export function setAirtableConfig(config: Partial<AirtableConfig>): void {
  try {
    if (config.token !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AIRTABLE_TOKEN, config.token.trim());
    }
    if (config.baseId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AIRTABLE_BASE_ID, config.baseId.trim());
    }
    if (config.tableName !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AIRTABLE_TABLE_NAME, config.tableName.trim());
    }
  } catch (e) {
    console.error('Error al guardar credenciales de Airtable:', e);
  }
}

export function isAirtableConfigured(customConfig?: AirtableConfig): boolean {
  const cfg = customConfig || getAirtableConfig();
  return Boolean(cfg.token && cfg.baseId && cfg.tableName);
}

// ============================================================================
// 2. MAPEO DE DATOS A LA ESTRUCTURA QUE PIDE AIRTABLE ({ fields: { ... } })
// ============================================================================

/**
 * Transforma un POI en el formato exacto de campos { fields: { ... } } que requiere Airtable.
 */
export function poiToAirtableFields(poi: POI): Record<string, any> {
  const fields: Record<string, any> = {
    ID: poi.id || `ID-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    Nombre: poi.nombre || 'Lugar sin nombre',
    Lat: typeof poi.lat === 'number' ? poi.lat : parseFloat(String(poi.lat || 0)),
    Lng: typeof poi.lng === 'number' ? poi.lng : parseFloat(String(poi.lng || 0)),
    Descripcion: poi.descripcion || '',
    Categoria: poi.categoria || 'Otro',
    Ciudad: poi.ciudad || '',
    Direccion: poi.direccion || '',
    Telefono: poi.telefono || '',
    Web: poi.web || '',
    Horario: poi.horario || '',
    Precio: poi.precio || '',
    Tags: Array.isArray(poi.tags) ? poi.tags.join(', ') : (poi.tags || ''),
    Foto_URL: poi.foto_url || '',
    Favorito: Boolean(poi.favorito),
    Notas_Privadas: poi.notas_privadas || '',
    Estado: poi.estado || 'Pendiente',
  };

  // En Airtable, campos numéricos vacíos causan error 422 si se envía "", se omite si es nulo
  if (poi.rating !== undefined && poi.rating !== null && !isNaN(Number(poi.rating))) {
    fields.Rating = Number(poi.rating);
  }

  return fields;
}

/**
 * Transforma un registro de Airtable { id: "rec...", fields: { ... } } en un objeto POI
 */
export function airtableRecordToPOI(record: any): POI {
  const f = record.fields || {};
  const customId = (f.ID || f.Id || f.id || record.id || '').toString().trim();

  let tags: string[] = [];
  if (Array.isArray(f.Tags)) {
    tags = f.Tags.map((t: any) => String(t).trim()).filter(Boolean);
  } else if (typeof f.Tags === 'string' && f.Tags.trim()) {
    tags = f.Tags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }

  const lat = typeof f.Lat === 'number' ? f.Lat : parseFloat(String(f.Lat || 0).replace(',', '.'));
  const lng = typeof f.Lng === 'number' ? f.Lng : parseFloat(String(f.Lng || 0).replace(',', '.'));

  return {
    id: customId || `ID-${record.id}`,
    airtableRecordId: record.id,
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    nombre: String(f.Nombre || f.nombre || 'Sin nombre').trim(),
    descripcion: String(f.Descripcion || f.descripcion || '').trim(),
    categoria: String(f.Categoria || f.categoria || 'Otro').trim(),
    ciudad: String(f.Ciudad || f.ciudad || '').trim(),
    rating: f.Rating !== undefined && f.Rating !== null && f.Rating !== '' ? Number(f.Rating) : undefined,
    direccion: String(f.Direccion || f.direccion || '').trim(),
    telefono: String(f.Telefono || f.telefono || '').trim(),
    web: String(f.Web || f.web || '').trim(),
    horario: String(f.Horario || f.horario || '').trim(),
    precio: String(f.Precio || f.precio || '').trim(),
    tags,
    foto_url: String(f.Foto_URL || f.foto_url || f.Foto || '').trim(),
    favorito: Boolean(f.Favorito || f.favorito),
    notas_privadas: String(f.Notas_Privadas || f.notas_privadas || '').trim(),
    estado: String(f.Estado || f.estado || 'Pendiente').trim(),
  };
}

// ============================================================================
// CACHÉ LOCAL Y COLA SINCRONIZACIÓN ("ZERO DATA LOSS")
// ============================================================================

export function getCachedPOIs(): POI[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POIS_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error al leer caché local:', e);
  }
  return INITIAL_POIS_SAMPLE;
}

export function saveCachedPOIs(pois: POI[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.POIS_CACHE, JSON.stringify(pois));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.error('Error al guardar caché local:', e);
  }
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch {
    return null;
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
    console.error('Error al guardar cola pendiente:', e);
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
    console.error('Error guardando registros locales:', e);
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
    console.error('Error al guardar IDs eliminados:', e);
  }
}

// ============================================================================
// 3. COMUNICACIÓN NATIVA CON LA API REST DE AIRTABLE (FETCH CLIENTE / CLOUDFLARE)
// ============================================================================

function getAirtableUrl(baseId: string, tableName: string, recordId?: string): string {
  const encodedTable = encodeURIComponent(tableName);
  if (recordId) {
    return `https://api.airtable.com/v0/${baseId}/${encodedTable}/${recordId}`;
  }
  return `https://api.airtable.com/v0/${baseId}/${encodedTable}`;
}

function getAirtableHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Prueba la conexión con Airtable comprobando si el Token, Base ID y Nombre de Tabla son válidos.
 */
export async function testAirtableConnection(
  customConfig?: AirtableConfig
): Promise<{ success: boolean; recordsCount: number; message: string; error?: string }> {
  const config = customConfig || getAirtableConfig();

  if (!config.token || !config.baseId || !config.tableName) {
    return {
      success: false,
      recordsCount: 0,
      message: 'Faltan credenciales',
      error: 'Debes introducir tu Personal Access Token, Base ID y Nombre de Tabla.',
    };
  }

  try {
    const url = `${getAirtableUrl(config.baseId, config.tableName)}?maxRecords=1`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAirtableHeaders(config.token),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        recordsCount: Array.isArray(data.records) ? data.records.length : 0,
        message: '¡Conexión establecida con Airtable con éxito! La tabla responde correctamente.',
      };
    }

    const errData = await response.json().catch(() => ({}));
    const errorMsg =
      errData?.error?.message ||
      errData?.error?.type ||
      `Error HTTP ${response.status} de Airtable (${response.statusText})`;

    return {
      success: false,
      recordsCount: 0,
      message: 'No se pudo conectar con Airtable',
      error: errorMsg,
    };
  } catch (err: any) {
    return {
      success: false,
      recordsCount: 0,
      message: 'Error de red al conectar con Airtable',
      error: err?.message || 'Verifica tu conexión a Internet o el token ingresado.',
    };
  }
}

/**
 * Lee todos los registros de Airtable de forma nativa con paginación completa (offset)
 */
export async function fetchPOIsFromAirtable(
  customConfig?: AirtableConfig
): Promise<{ pois: POI[]; source: 'live' | 'cache'; error?: string; pendingCount: number }> {
  const config = customConfig || getAirtableConfig();

  // Si no está configurado, trabajar con datos locales/caché
  if (!isAirtableConfigured(config)) {
    return {
      pois: getCachedPOIs(),
      source: 'cache',
      error: 'Airtable no configurado todavía. Mostrando copia local.',
      pendingCount: getPendingSyncCount(),
    };
  }

  const localCustom = getLocalCustomRecords();
  const deletedIds = new Set(getDeletedIds());

  try {
    let allRecords: any[] = [];
    let offset: string | null = null;
    let keepPaging = true;
    let pageSafetyCounter = 0;

    // Paginación de Airtable (100 registros por página)
    while (keepPaging && pageSafetyCounter < 20) {
      pageSafetyCounter++;
      const url = `${getAirtableUrl(config.baseId, config.tableName)}?pageSize=100${
        offset ? `&offset=${encodeURIComponent(offset)}` : ''
      }`;

      const res = await fetch(url, {
        method: 'GET',
        headers: getAirtableHeaders(config.token),
      });

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (Array.isArray(data.records)) {
        allRecords.push(...data.records);
      }

      if (data.offset) {
        offset = data.offset;
      } else {
        keepPaging = false;
      }
    }

    // Convertir registros a modelo POI
    const remotePOIs: POI[] = allRecords
      .map(airtableRecordToPOI)
      .filter((p) => !deletedIds.has(p.id) && !deletedIds.has(p.airtableRecordId || ''));

    // Combinar con registros locales aún no sincronizados
    const remoteIdSet = new Set(remotePOIs.map((p) => p.id));
    const unmergedLocalPois = Object.values(localCustom).filter(
      (p) => !remoteIdSet.has(p.id) && !deletedIds.has(p.id)
    );

    const finalPOIs = [...unmergedLocalPois, ...remotePOIs];
    saveCachedPOIs(finalPOIs);

    // Intentar vaciar cola de cambios pendientes
    syncPendingQueue(config).catch(() => {});

    return {
      pois: finalPOIs,
      source: 'live',
      pendingCount: getPendingSyncCount(),
    };
  } catch (err: any) {
    console.warn('Error al leer de Airtable, usando copia local:', err);
    return {
      pois: getCachedPOIs(),
      source: 'cache',
      error: err?.message || 'Error al conectar con Airtable. Mostrando copia local.',
      pendingCount: getPendingSyncCount(),
    };
  }
}

/**
 * Guarda (crea o edita) un POI en Airtable utilizando la API nativa de JavaScript fetch.
 */
export async function savePOIToAirtable(
  poi: POI,
  isEdit: boolean,
  customConfig?: AirtableConfig
): Promise<{ success: boolean; id: string; airtableRecordId?: string; isOffline?: boolean; error?: string }> {
  const config = customConfig || getAirtableConfig();
  const currentList = getCachedPOIs();
  const localCustom = getLocalCustomRecords();

  const poiId = poi.id && poi.id.trim() !== '' ? poi.id.trim() : `ID-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  const completePoi: POI = { ...poi, id: poiId };

  // 1. Guardar de forma inmediata en local (garantía de no pérdida de datos)
  localCustom[poiId] = completePoi;
  saveLocalCustomRecords(localCustom);

  let updatedList: POI[];
  if (isEdit) {
    updatedList = currentList.map((p) => (p.id === poiId ? completePoi : p));
  } else {
    updatedList = [completePoi, ...currentList.filter((p) => p.id !== poiId)];
  }
  saveCachedPOIs(updatedList);

  // 2. Si Airtable no está configurado, encolar y confirmar local
  if (!isAirtableConfigured(config)) {
    const queue = getPendingSyncQueue().filter((item) => item.id !== poiId);
    queue.push({
      id: poiId,
      action: isEdit ? 'update' : 'create',
      poi: completePoi,
      airtableRecordId: completePoi.airtableRecordId,
      timestamp: Date.now(),
    });
    savePendingSyncQueue(queue);

    return {
      success: true,
      id: poiId,
      isOffline: true,
      error: 'Guardado en el dispositivo. Configura Airtable para sincronizar en la nube.',
    };
  }

  // 3. Preparar petición Airtable
  const fields = poiToAirtableFields(completePoi);

  try {
    let airtableRecordId = completePoi.airtableRecordId;

    // Si es edición pero no tenemos el airtableRecordId, buscarlo por el campo ID
    if (isEdit && !airtableRecordId) {
      try {
        const findUrl = `${getAirtableUrl(config.baseId, config.tableName)}?filterByFormula=${encodeURIComponent(
          `{ID} = '${poiId}'`
        )}&maxRecords=1`;
        const findRes = await fetch(findUrl, {
          method: 'GET',
          headers: getAirtableHeaders(config.token),
        });
        if (findRes.ok) {
          const findData = await findRes.json();
          if (Array.isArray(findData.records) && findData.records.length > 0) {
            airtableRecordId = findData.records[0].id;
          }
        }
      } catch (e) {
        console.warn('Error al buscar registro existente en Airtable:', e);
      }
    }

    let response: Response;

    if (isEdit && airtableRecordId) {
      // PATCH https://api.airtable.com/v0/{baseId}/{tableName}/{recordId}
      response = await fetch(getAirtableUrl(config.baseId, config.tableName, airtableRecordId), {
        method: 'PATCH',
        headers: getAirtableHeaders(config.token),
        body: JSON.stringify({ fields }),
      });
    } else {
      // POST https://api.airtable.com/v0/{baseId}/{tableName}
      response = await fetch(getAirtableUrl(config.baseId, config.tableName), {
        method: 'POST',
        headers: getAirtableHeaders(config.token),
        body: JSON.stringify({ fields }),
      });
    }

    if (response.ok) {
      const data = await response.json();
      const newAirtableId = data.id || airtableRecordId;

      // Actualizar con el ID de Airtable asignado
      completePoi.airtableRecordId = newAirtableId;
      localCustom[poiId] = completePoi;
      saveLocalCustomRecords(localCustom);

      const refreshedList = getCachedPOIs().map((p) =>
        p.id === poiId ? { ...p, airtableRecordId: newAirtableId } : p
      );
      saveCachedPOIs(refreshedList);

      // Quitar de la cola pendiente
      const updatedQueue = getPendingSyncQueue().filter((item) => item.id !== poiId);
      savePendingSyncQueue(updatedQueue);

      return {
        success: true,
        id: poiId,
        airtableRecordId: newAirtableId,
      };
    }

    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Airtable HTTP ${response.status}`);
  } catch (netErr: any) {
    console.warn('Fallo al guardar en Airtable directamente, guardado en cola offline:', netErr);
    const queue = getPendingSyncQueue().filter((item) => item.id !== poiId);
    queue.push({
      id: poiId,
      action: isEdit ? 'update' : 'create',
      poi: completePoi,
      airtableRecordId: completePoi.airtableRecordId,
      timestamp: Date.now(),
    });
    savePendingSyncQueue(queue);

    return {
      success: true,
      id: poiId,
      isOffline: true,
      error: 'Guardado localmente. Se sincronizará automáticamente con Airtable cuando vuelva la conexión.',
    };
  }
}

/**
 * Elimina un POI de Airtable de forma nativa
 */
export async function deletePOIFromAirtable(
  poiId: string,
  customConfig?: AirtableConfig
): Promise<{ success: boolean; error?: string }> {
  const config = customConfig || getAirtableConfig();
  const currentList = getCachedPOIs();
  const localCustom = getLocalCustomRecords();
  const deletedIds = getDeletedIds();

  // 1. Limpieza local inmediata
  const poiToDelete = currentList.find((p) => p.id === poiId) || localCustom[poiId];
  delete localCustom[poiId];
  saveLocalCustomRecords(localCustom);

  if (!deletedIds.includes(poiId)) {
    deletedIds.push(poiId);
    saveDeletedIds(deletedIds);
  }

  saveCachedPOIs(currentList.filter((p) => p.id !== poiId));

  // 2. Si Airtable no está configurado, finalizar
  if (!isAirtableConfigured(config)) {
    return { success: true };
  }

  try {
    let airtableRecordId = poiToDelete?.airtableRecordId;

    // Si no tenemos el airtableRecordId, buscarlo en Airtable por formula
    if (!airtableRecordId) {
      const searchUrl = `${getAirtableUrl(config.baseId, config.tableName)}?filterByFormula=${encodeURIComponent(
        `{ID} = '${poiId}'`
      )}&maxRecords=1`;
      const searchRes = await fetch(searchUrl, {
        headers: getAirtableHeaders(config.token),
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData.records) && searchData.records.length > 0) {
          airtableRecordId = searchData.records[0].id;
        }
      }
    }

    if (airtableRecordId) {
      const delRes = await fetch(getAirtableUrl(config.baseId, config.tableName, airtableRecordId), {
        method: 'DELETE',
        headers: getAirtableHeaders(config.token),
      });

      if (!delRes.ok) {
        throw new Error(`Error HTTP ${delRes.status}`);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Error al eliminar de Airtable:', err);
    // Encolar para reintentar más tarde
    const queue = getPendingSyncQueue().filter((item) => item.id !== poiId);
    queue.push({
      id: poiId,
      action: 'delete',
      airtableRecordId: poiToDelete?.airtableRecordId,
      timestamp: Date.now(),
    });
    savePendingSyncQueue(queue);

    return {
      success: true,
      error: 'Eliminado del dispositivo. Pendiente de sincronizar con Airtable.',
    };
  }
}

/**
 * Subida por lotes masiva (Batch Upload) para migrar o sincronizar todos los POIs a Airtable.
 * Airtable admite hasta 10 registros por petición POST.
 */
export async function batchUploadPOIsToAirtable(
  pois: POI[],
  customConfig?: AirtableConfig
): Promise<{ success: boolean; count: number; error?: string }> {
  const config = customConfig || getAirtableConfig();

  if (!isAirtableConfigured(config)) {
    return {
      success: false,
      count: 0,
      error: 'Debes configurar tu Personal Access Token, Base ID y Nombre de Tabla en Ajustes.',
    };
  }

  if (!pois || pois.length === 0) {
    return { success: false, count: 0, error: 'No hay POIs para subir.' };
  }

  try {
    let uploadedCount = 0;
    const chunkSize = 10; // Límite oficial de la API de Airtable

    for (let i = 0; i < pois.length; i += chunkSize) {
      const chunk = pois.slice(i, i + chunkSize);
      const recordsPayload = chunk.map((p) => ({
        fields: poiToAirtableFields(p),
      }));

      const res = await fetch(getAirtableUrl(config.baseId, config.tableName), {
        method: 'POST',
        headers: getAirtableHeaders(config.token),
        body: JSON.stringify({ records: recordsPayload }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Error HTTP ${res.status} de Airtable`);
      }

      const data = await res.json();
      uploadedCount += Array.isArray(data.records) ? data.records.length : chunk.length;
    }

    // Vaciar cola y actualizar caché
    savePendingSyncQueue([]);
    saveCachedPOIs(pois);

    return {
      success: true,
      count: uploadedCount,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err?.message || 'Error durante la subida por lotes a Airtable.',
    };
  }
}

/**
 * Sincroniza y vacía los cambios pendientes en cola a Airtable
 */
export async function syncPendingQueue(
  customConfig?: AirtableConfig
): Promise<{ syncedCount: number; remainingCount: number }> {
  const config = customConfig || getAirtableConfig();
  const queue = getPendingSyncQueue();
  if (queue.length === 0 || !isAirtableConfigured(config)) {
    return { syncedCount: 0, remainingCount: queue.length };
  }

  const remainingQueue: PendingSyncItem[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      if (item.action === 'create' || item.action === 'update') {
        if (item.poi) {
          const res = await savePOIToAirtable(item.poi, item.action === 'update', config);
          if (res.success && !res.isOffline) {
            syncedCount++;
            continue;
          }
        }
      } else if (item.action === 'delete') {
        const res = await deletePOIFromAirtable(item.id, config);
        if (res.success && !res.error) {
          syncedCount++;
          continue;
        }
      }
    } catch {}
    remainingQueue.push(item);
  }

  savePendingSyncQueue(remainingQueue);
  return { syncedCount, remainingCount: remainingQueue.length };
}

// ============================================================================
// COMPATIBILIDAD CON ALIAS ANTERIORES (Para transición transparente)
// ============================================================================
export const fetchPOIsFromSheet = fetchPOIsFromAirtable;
export const savePOIToSheet = savePOIToAirtable;
export const deletePOIFromSheet = deletePOIFromAirtable;
export const forceBatchSyncAllToSheet = batchUploadPOIsToAirtable;
export const testSheetsConnection = testAirtableConnection;
export const getStoredScriptUrl = () => getAirtableConfig().token;
export const setStoredScriptUrl = (val: string) => setAirtableConfig({ token: val });

// Geocodificación inversa gratuita con OpenStreetMap Nominatim
export async function reverseGeocode(lat: number, lng: number): Promise<{ ciudad?: string; direccion?: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'es',
        },
      }
    );
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
