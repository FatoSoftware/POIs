import { CategoryMeta, POICategory, POI, VisitStatus } from './types';

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx2lzGsngRn9jK3r0clhms4so0PUhJ8JplJPToMk1fckb02x-ff2TGUzrR7RiXLmovtdA/exec';

export const CATEGORIES_CONFIG: Record<string, CategoryMeta> = {
  Restaurante: {
    label: 'Restaurantes & Gastronomía',
    icon: '🍽️',
    color: '#E63946',
    bgLight: '#FDF0F1',
    borderColor: '#F8BCC3',
  },
  Copas: {
    label: 'Copas & Coctelería',
    icon: '🍸',
    color: '#7209B7',
    bgLight: '#F7EDFC',
    borderColor: '#E2BCF5',
  },
  Hotel: {
    label: 'Hoteles & Alojamientos',
    icon: '🏨',
    color: '#4361EE',
    bgLight: '#EEF2FE',
    borderColor: '#BAC8FB',
  },
  Comida: {
    label: 'Comida & Tapeo',
    icon: '🍔',
    color: '#FF6B6B',
    bgLight: '#FFF0F0',
    borderColor: '#FFD1D1',
  },
  Turismo: {
    label: 'Turismo & Monumentos',
    icon: '📸',
    color: '#06D6A0',
    bgLight: '#E8FAF5',
    borderColor: '#A8F3DE',
  },
  Naturaleza: {
    label: 'Naturaleza & Miradores',
    icon: '🌲',
    color: '#2A9D8F',
    bgLight: '#EAF6F5',
    borderColor: '#A6DCD6',
  },
  Ocio: {
    label: 'Ocio & Entretenimiento',
    icon: '🎉',
    color: '#F77F00',
    bgLight: '#FFF4E6',
    borderColor: '#FFD6A5',
  },
  Alojamiento: {
    label: 'Alojamiento & Hostales',
    icon: '🛏️',
    color: '#A06CD5',
    bgLight: '#F6F0FA',
    borderColor: '#DFCEF3',
  },
  Cultura: {
    label: 'Cultura & Museos',
    icon: '🏛️',
    color: '#9B5DE5',
    bgLight: '#F7EFFF',
    borderColor: '#DEC4FC',
  },
  Compras: {
    label: 'Compras & Mercados',
    icon: '🛍️',
    color: '#F15BB5',
    bgLight: '#FEF0F8',
    borderColor: '#FAC4E5',
  },
  Transporte: {
    label: 'Transporte & Estaciones',
    icon: '🚆',
    color: '#00BBF9',
    bgLight: '#E6F8FE',
    borderColor: '#A4E8FD',
  },
  Otro: {
    label: 'Otro Lugar',
    icon: '📌',
    color: '#6C757D',
    bgLight: '#F4F5F7',
    borderColor: '#DEE2E6',
  },
};

export const ALL_CATEGORIES: POICategory[] = [
  'Restaurante',
  'Copas',
  'Hotel',
  'Comida',
  'Turismo',
  'Naturaleza',
  'Ocio',
  'Alojamiento',
  'Cultura',
  'Compras',
  'Transporte',
  'Otro',
];

export const STATUS_OPTIONS: VisitStatus[] = [
  'Pendiente',
  'Visitado',
  'Imprescindible',
  'Favorito',
];

export const POPULAR_TAGS = [
  'Terraza',
  'Vistas panorámicas',
  'Tapas',
  'Café especialidad',
  'Familiar / Niños',
  'Pet Friendly',
  'Romántico',
  'Económico',
  'Gourmet',
  'Vegetariano / Vegano',
  'Gratis',
  'Wifi rápido',
  'Accesible',
  'Histórico',
  'Atardecer',
  'Fotogénico',
  'Reserva recomendada',
];

export const MAP_TILE_PROVIDERS = [
  {
    id: 'voyager',
    name: 'Moderno (Carto Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  },
  {
    id: 'dark',
    name: 'Oscuro (Carto Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  },
  {
    id: 'positron',
    name: 'Claro Minimalista (Positron)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
  },
  {
    id: 'osm',
    name: 'Tradicional (OpenStreetMap)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    id: 'maps',
    name: 'Estilo Maps (OSM HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="https://hot.osm.org/">HOT</a>',
  },
  {
    id: 'satellite',
    name: 'Esri Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, GeoEye',
  },
];

export interface ThemeConfig {
  id: 'moderno' | 'oscuro' | 'claro' | 'tradicional' | 'maps';
  name: string;
  icon: string;
  description: string;
  defaultTileId: string;
  primaryColor: string;
  accentBadge: string;
  bgApp: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  navbarBg: string;
  filterBg: string;
}

export const APP_THEMES: Record<string, ThemeConfig> = {
  moderno: {
    id: 'moderno',
    name: 'Moderno',
    icon: '✨',
    description: 'Tonos turquesa, coral vibrante y estética contemporánea',
    defaultTileId: 'voyager',
    primaryColor: '#0d9488',
    accentBadge: 'bg-teal-50 text-teal-800 border-teal-200',
    bgApp: 'bg-slate-100 text-slate-900',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200/90',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-500',
    navbarBg: 'bg-white/95 backdrop-blur-md border-slate-200/80',
    filterBg: 'bg-white border-slate-200/80',
  },
  oscuro: {
    id: 'oscuro',
    name: 'Oscuro',
    icon: '🌙',
    description: 'Modo noche descansado con fondo oscuro y alto contraste',
    defaultTileId: 'dark',
    primaryColor: '#2dd4bf',
    accentBadge: 'bg-teal-950/80 text-teal-300 border-teal-800',
    bgApp: 'bg-slate-950 text-slate-100',
    cardBg: 'bg-slate-900',
    cardBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    navbarBg: 'bg-slate-900/95 backdrop-blur-md border-slate-800',
    filterBg: 'bg-slate-900 border-slate-800',
  },
  claro: {
    id: 'claro',
    name: 'Claro',
    icon: '☀️',
    description: 'Limpio, luminoso y minimalista con paleta neutra',
    defaultTileId: 'positron',
    primaryColor: '#2563eb',
    accentBadge: 'bg-blue-50 text-blue-800 border-blue-200',
    bgApp: 'bg-zinc-50 text-zinc-900',
    cardBg: 'bg-white',
    cardBorder: 'border-zinc-200',
    textPrimary: 'text-zinc-900',
    textSecondary: 'text-zinc-500',
    navbarBg: 'bg-white/95 backdrop-blur-md border-zinc-200',
    filterBg: 'bg-white border-zinc-200',
  },
  tradicional: {
    id: 'tradicional',
    name: 'Tradicional',
    icon: '📜',
    description: 'Estilo clásico y cálido con matices pergamino y sepia',
    defaultTileId: 'osm',
    primaryColor: '#b45309',
    accentBadge: 'bg-amber-50 text-amber-900 border-amber-200',
    bgApp: 'bg-amber-50/40 text-stone-900',
    cardBg: 'bg-[#fdfbf7]',
    cardBorder: 'border-amber-200/80',
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-600',
    navbarBg: 'bg-[#fcf9f2]/95 backdrop-blur-md border-amber-200/70',
    filterBg: 'bg-[#fdfbf7] border-amber-200/70',
  },
  maps: {
    id: 'maps',
    name: 'Maps',
    icon: '🗺️',
    description: 'Inspirado en la interfaz y tonos clásicos de Google Maps',
    defaultTileId: 'maps',
    primaryColor: '#1a73e8',
    accentBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    bgApp: 'bg-slate-100 text-slate-800',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-300',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    navbarBg: 'bg-white/95 backdrop-blur-md border-slate-200',
    filterBg: 'bg-white border-slate-200',
  },
};

export const INITIAL_POIS_SAMPLE: POI[] = [
  {
    id: 'ID-EX1001',
    lat: 40.415363,
    lng: -3.707398,
    nombre: 'Mercado de San Miguel',
    descripcion: 'Histórico mercado gastronómico con puestos gourmet de tapas, mariscos, jamón ibérico y vinos de autor.',
    categoria: 'Comida',
    ciudad: 'Madrid',
    rating: 4.8,
    direccion: 'Plaza de San Miguel, s/n, 28005 Madrid',
    telefono: '+34 915 42 49 01',
    web: 'https://mercadodesanmiguel.es',
    horario: '10:00 - 00:00',
    precio: '€€',
    tags: ['Tapas', 'Gourmet', 'Histórico', 'Fotogénico'],
    foto_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    favorito: true,
    estado: 'Imprescindible',
    notas_privadas: 'Ir antes de las 13:00 para evitar las colas. Probar las ostras y el vermut de grifo.',
  },
  {
    id: 'ID-EX1002',
    lat: 40.413788,
    lng: -3.682201,
    nombre: 'Parque de El Retiro & Palacio de Cristal',
    descripcion: 'Pulmón verde de Madrid, declarado Patrimonio de la Humanidad. Incluye el estanque grande y el icónico Palacio de Cristal.',
    categoria: 'Turismo',
    ciudad: 'Madrid',
    rating: 4.9,
    direccion: 'Plaza de la Independencia, 7, 28001 Madrid',
    horario: '06:00 - 22:00',
    precio: 'Gratis',
    tags: ['Vistas panorámicas', 'Familiar / Niños', 'Atardecer', 'Fotogénico', 'Gratis'],
    foto_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    favorito: true,
    estado: 'Visitado',
    notas_privadas: 'Ideal para pasear en otoño y alquilar una barca al atardecer.',
  },
  {
    id: 'ID-EX1003',
    lat: 41.387015,
    lng: 2.170047,
    nombre: 'Plaça de Catalunya & Las Ramblas',
    descripcion: 'Punto de encuentro central entre el Eixample y el Barrio Gótico de Barcelona.',
    categoria: 'Turismo',
    ciudad: 'Barcelona',
    rating: 4.6,
    direccion: 'Plaça de Catalunya, 08002 Barcelona',
    precio: 'Gratis',
    tags: ['Histórico', 'Accesible', 'Compras'],
    foto_url: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop&q=80',
    favorito: false,
    estado: 'Visitado',
  },
  {
    id: 'ID-EX1004',
    lat: 37.38283,
    lng: -5.99629,
    nombre: 'Plaza de España & Parque de María Luisa',
    descripcion: 'Conjunto monumental y arquitectónico imponente en Sevilla, célebre por sus bancos azulejados y canales navegables.',
    categoria: 'Turismo',
    ciudad: 'Sevilla',
    rating: 5.0,
    direccion: 'Av. de Isabel la Católica, 41004 Sevilla',
    horario: '08:00 - 22:00',
    precio: 'Gratis',
    tags: ['Histórico', 'Fotogénico', 'Vistas panorámicas', 'Gratis', 'Romántico'],
    foto_url: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=800&auto=format&fit=crop&q=80',
    favorito: true,
    estado: 'Imprescindible',
    notas_privadas: 'La luz dorada de la tarde es espectacular para fotografías.',
  },
];

export const MODERN_APPS_SCRIPT_CODE = `/**
 * BACKEND GOOGLE APPS SCRIPT PARA GESTOR DE POIS
 * Compatible 100% con creación, edición, eliminación y sincronización por lotes (Batch Sync).
 * 
 * Instrucciones:
 * 1. En tu hoja de Google Sheets, ve a Extensiones -> Apps Script.
 * 2. Pega este código reemplazando todo el contenido anterior.
 * 3. Haz clic en "Implementar" -> "Nueva implementación" (o Administrar implementaciones -> Editar -> Nueva versión).
 * 4. Tipo: "Aplicación web".
 * 5. Ejecutar como: "Yo" (tu cuenta de Google).
 * 6. Quién tiene acceso: "Cualquiera" (Anyone / Anónimo).
 * 7. Copia la URL generada y pégala en la configuración de la app.
 */

const SHEET_NAME = "POIs"; 

function doGet(e) {
  generarIdsFaltantes();
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "ID", "Lat", "Lng", "Nombre", "Descripcion", "Categoria", "Ciudad",
        "Rating", "Direccion", "Telefono", "Web", "Horario", "Precio", "Tags", "Foto_URL", "Favorito", "Notas_Privadas", "Estado"
      ]);
    }
    
    // Parse request payload from POST body or GET/POST query parameters
    let data = null;
    let action = null;

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        action = data.action;
      } catch (err) {}
    }
    
    if (!data && e && e.parameter) {
      if (e.parameter.data) {
        try {
          data = JSON.parse(e.parameter.data);
          action = data.action || e.parameter.action;
        } catch (err) {}
      } else if (e.parameter.payload) {
        try {
          data = JSON.parse(e.parameter.payload);
          action = data.action || e.parameter.action;
        } catch (err) {}
      } else if (e.parameter.action && e.parameter.action !== 'read' && e.parameter.action !== 'ping') {
        data = e.parameter;
        action = e.parameter.action;
      }
    }

    // Helper: convert POI object to row values array
    function formatRow(poiData) {
      const latStr = poiData.lat !== undefined && poiData.lat !== null ? poiData.lat.toString().replace('.', ',') : '0';
      const lngStr = poiData.lng !== undefined && poiData.lng !== null ? poiData.lng.toString().replace('.', ',') : '0';
      const tagsStr = Array.isArray(poiData.tags) ? poiData.tags.join(',') : (poiData.tags || '');
      const ratingVal = poiData.rating !== undefined && poiData.rating !== null ? poiData.rating : '';
      const favoritoVal = (poiData.favorito === true || poiData.favorito === 'TRUE' || poiData.favorito === 'true') ? 'TRUE' : 'FALSE';

      return [
        latStr,
        lngStr,
        poiData.nombre || '',
        poiData.descripcion || '',
        poiData.categoria || 'Otro',
        poiData.ciudad || '',
        ratingVal,
        poiData.direccion || '',
        poiData.telefono || '',
        poiData.web || '',
        poiData.horario || '',
        poiData.precio || '',
        tagsStr,
        poiData.foto_url || '',
        favoritoVal,
        poiData.notas_privadas || '',
        poiData.estado || 'Pendiente'
      ];
    }

    // Process Action: BATCH SYNC (Fast bulk update)
    if (data && (action === 'batch_sync' || action === 'batch') && Array.isArray(data.pois)) {
      const rows = sheet.getDataRange().getValues();
      const idToRowIndex = {};
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0]) {
          idToRowIndex[rows[i][0].toString().trim()] = i + 1;
        }
      }

      let updatedCount = 0;
      let insertedCount = 0;

      for (let p = 0; p < data.pois.length; p++) {
        const item = data.pois[p];
        const poiId = (item.id || '').toString().trim() || ("ID-" + Math.random().toString(36).substr(2, 9).toUpperCase());
        const rowVals = formatRow(item);

        if (idToRowIndex[poiId]) {
          const rowIndex = idToRowIndex[poiId];
          sheet.getRange(rowIndex, 2, 1, rowVals.length).setValues([rowVals]);
          updatedCount++;
        } else {
          sheet.appendRow([poiId, ...rowVals]);
          idToRowIndex[poiId] = sheet.getLastRow();
          insertedCount++;
        }
      }

      return response({
        status: "success",
        action: "batch_sync",
        updated: updatedCount,
        inserted: insertedCount,
        total: data.pois.length
      });
    }

    // Process Actions: create, update, delete
    if (data && action && action !== 'read' && action !== 'ping') {
      const rowValues = formatRow(data);
      const idBusqueda = data.id ? data.id.toString().trim() : "";

      if (action === "create") {
        const newId = idBusqueda || ("ID-" + Math.random().toString(36).substr(2, 9).toUpperCase());
        sheet.appendRow([newId, ...rowValues]);
        return response({status: "success", action: "create", id: newId});
      
      } else if (action === "update") {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] && rows[i][0].toString().trim() === idBusqueda) {
            sheet.getRange(i + 1, 2, 1, rowValues.length).setValues([rowValues]);
            return response({status: "success", action: "update", id: idBusqueda});
          }
        }
        // Fallback: si no existía el ID, añadirlo como nueva fila para garantizar no perder datos
        const finalId = idBusqueda || ("ID-" + Math.random().toString(36).substr(2, 9).toUpperCase());
        sheet.appendRow([finalId, ...rowValues]);
        return response({status: "success", action: "created_on_update_fallback", id: finalId});

      } else if (action === "delete") {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] && rows[i][0].toString().trim() === idBusqueda) {
            sheet.deleteRow(i + 1);
            return response({status: "success", action: "delete", id: idBusqueda});
          }
        }
        return response({status: "success", action: "delete", message: "ID no encontrado o ya eliminado"});
      }
    }

    // ACCIÓN POR DEFECTO: LECTURA DE DATOS
    const dataRange = sheet.getDataRange();
    const sheetData = dataRange.getValues();
    if (sheetData.length <= 1) {
      return response([]);
    }
    sheetData.shift(); // Quitar cabecera
    
    const result = sheetData.map(row => {
      const latParsed = parseFloat((row[1] || '0').toString().replace(',', '.'));
      const lngParsed = parseFloat((row[2] || '0').toString().replace(',', '.'));
      const tagsRaw = row[13] || '';
      const tagsArr = typeof tagsRaw === 'string' ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

      return {
        id: (row[0] || '').toString(),
        lat: isNaN(latParsed) ? 0 : latParsed,
        lng: isNaN(lngParsed) ? 0 : lngParsed,
        nombre: (row[3] || '').toString(),
        descripcion: (row[4] || '').toString(),
        categoria: (row[5] || 'Otro').toString(),
        ciudad: (row[6] || '').toString(),
        rating: row[7] !== undefined && row[7] !== '' ? parseFloat(row[7]) : undefined,
        direccion: (row[8] || '').toString(),
        telefono: (row[9] || '').toString(),
        web: (row[10] || '').toString(),
        horario: (row[11] || '').toString(),
        precio: (row[12] || '').toString(),
        tags: tagsArr,
        foto_url: (row[14] || '').toString(),
        favorito: row[15] === true || (row[15] || '').toString().toUpperCase() === 'TRUE',
        notas_privadas: (row[16] || '').toString(),
        estado: (row[17] || 'Pendiente').toString()
      };
    });
    return response(result);
  } catch (error) {
    return response({status: "error", message: error.toString()});
  } finally {
    lock.releaseLock();
  }
}

function generarIdsFaltantes() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return;
    const range = sheet.getDataRange();
    const data = range.getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) {
        const newId = "ID-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        sheet.getRange(i + 1, 1).setValue(newId);
      }
    }
  } catch(e) {
    // Silencioso
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;
