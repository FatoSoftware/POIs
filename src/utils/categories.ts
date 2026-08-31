import { CategoryMeta } from '../types';

export const INITIAL_CATEGORIES_CONFIG: Record<string, CategoryMeta> = {
  Restaurante: {
    label: 'Restaurantes & Gastronomía',
    icon: '🍽️',
    color: '#E63946',
    bgLight: '#FDF0F1',
    borderColor: '#F8BCC3',
  },
  Copas: {
    label: 'Copas, Bares & Coctelería',
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

export const CATEGORY_COLOR_PRESETS = [
  { name: 'Rojo Coral', hex: '#E63946' },
  { name: 'Fucsia Neón', hex: '#F15BB5' },
  { name: 'Púrpura Vibrante', hex: '#7209B7' },
  { name: 'Lavanda', hex: '#9B5DE5' },
  { name: 'Azul Real', hex: '#4361EE' },
  { name: 'Cian Océano', hex: '#00BBF9' },
  { name: 'Verde Esmeralda', hex: '#06D6A0' },
  { name: 'Verde Pino', hex: '#2A9D8F' },
  { name: 'Naranja Cítrico', hex: '#F77F00' },
  { name: 'Ámbar Cálido', hex: '#FFB703' },
  { name: 'Marrón Café', hex: '#8B5A2B' },
  { name: 'Gris Pizarra', hex: '#64748B' },
];

export const CATEGORY_EMOJI_PRESETS = [
  '🍽️', '🍔', '🍕', '🌮', '🍣', '🥩', '☕', '🍦', '🍷', '🍸',
  '🍺', '🍹', '🏨', '🛏️', '🏠', '🏕️', '📸', '🏛️', '🏰', '🌲',
  '🏖️', '⛰️', '🌅', '🎭', '🎬', '🎨', '🛍️', '🛒', '🚆', '✈️',
  '🚗', '⛽', '🏥', '💊', '⚽', '🧗', '🎡', '🎪', '📍', '📌', '⭐'
];

const STORAGE_KEY = 'poi_custom_categories_map_v1';

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

export function computeLightBg(hex: string): string {
  return hexToRgba(hex, 0.1);
}

export function computeBorderColor(hex: string): string {
  return hexToRgba(hex, 0.35);
}

export function getStoredCategories(): Record<string, CategoryMeta> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        // Ensure standard fields exist for all categories
        const normalized: Record<string, CategoryMeta> = {};
        Object.entries(parsed).forEach(([key, val]) => {
          const item = val as CategoryMeta;
          const color = item.color || '#6C757D';
          normalized[key] = {
            id: key,
            label: item.label || key,
            icon: item.icon || '📌',
            color: color,
            bgLight: item.bgLight || computeLightBg(color),
            borderColor: item.borderColor || computeBorderColor(color),
            isCustom: item.isCustom ?? !INITIAL_CATEGORIES_CONFIG[key],
          };
        });
        return normalized;
      }
    }
  } catch (e) {
    console.error('Error loading stored categories:', e);
  }
  return { ...INITIAL_CATEGORIES_CONFIG };
}

export function saveStoredCategories(categories: Record<string, CategoryMeta>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories to localStorage:', e);
  }
}

export function getCategoryMeta(
  categoryName: string | undefined,
  categoriesMap?: Record<string, CategoryMeta>
): CategoryMeta {
  if (!categoryName) {
    return (
      categoriesMap?.Otro ||
      INITIAL_CATEGORIES_CONFIG.Otro || {
        label: 'Otro',
        icon: '📌',
        color: '#6C757D',
        bgLight: '#F4F5F7',
        borderColor: '#DEE2E6',
      }
    );
  }

  const map = categoriesMap || getStoredCategories();

  if (map[categoryName]) {
    const item = map[categoryName];
    return {
      ...item,
      bgLight: item.bgLight || computeLightBg(item.color),
      borderColor: item.borderColor || computeBorderColor(item.color),
    };
  }

  // If not found in map, generate consistent fallback
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % CATEGORY_COLOR_PRESETS.length;
  const fallbackColor = CATEGORY_COLOR_PRESETS[colorIndex].hex;

  return {
    label: categoryName,
    icon: '📍',
    color: fallbackColor,
    bgLight: computeLightBg(fallbackColor),
    borderColor: computeBorderColor(fallbackColor),
    isCustom: true,
  };
}
