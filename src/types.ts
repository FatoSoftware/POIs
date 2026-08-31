export type POICategory =
  | 'Comida'
  | 'Restaurante'
  | 'Copas'
  | 'Hotel'
  | 'Turismo'
  | 'Ocio'
  | 'Alojamiento'
  | 'Naturaleza'
  | 'Cultura'
  | 'Compras'
  | 'Transporte'
  | 'Otro'
  | string;

export type Category = POICategory;

export type PriceLevel = 'Gratis' | '€' | '€€' | '€€€' | '€€€€';

export type VisitStatus = 'Pendiente' | 'Visitado' | 'Imprescindible' | 'Favorito';

export type AppTheme = 'moderno' | 'oscuro' | 'claro' | 'tradicional' | 'maps';

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface NavigationInfo {
  distanceKm: number;
  distanceFormatted: string;
  bearingDeg: number;
  bearingCardinal: string;
  etaWalkingMin: number;
  etaDrivingMin: number;
  etaCyclingMin: number;
}

export interface POI {
  id: string;
  lat: number;
  lng: number;
  nombre: string;
  descripcion: string;
  categoria: POICategory | string;
  ciudad: string;
  // Extended fields for improved identification & description
  rating?: number; // 0-5
  direccion?: string;
  telefono?: string;
  web?: string;
  horario?: string;
  precio?: PriceLevel | string;
  tags?: string[];
  foto_url?: string;
  favorito?: boolean;
  notas_privadas?: string;
  estado?: VisitStatus | string;
  fecha_creacion?: string;
}

export interface FilterState {
  search: string;
  categorias: POICategory[];
  ciudad: string; // 'all' or specific city
  soloFavoritos: boolean;
  soloVisitados: VisitStatus | null;
  minRating: number;
  sortBy: 'nombre' | 'ciudad' | 'rating' | 'categoria' | 'distancia';
  sortOrder: 'asc' | 'desc';
}

export interface CategoryMeta {
  id?: string;
  label: string;
  icon: string;
  color: string;
  bgLight?: string;
  borderColor?: string;
  isCustom?: boolean;
}

export interface AppThemeConfig {
  id: AppTheme;
  name: string;
  description: string;
  icon: string;
  primaryColor: string;
  defaultTileId: string;
}
