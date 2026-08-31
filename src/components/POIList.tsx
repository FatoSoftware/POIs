import React from 'react';
import { POI, GPSLocation, AppTheme } from '../types';
import { CATEGORIES_CONFIG } from '../constants';
import { formatDistance, calculateHaversineDistance } from '../utils/geo';
import {
  MapPin,
  Star,
  Heart,
  Navigation,
  Edit3,
  Trash2,
  Plus,
  Compass,
} from 'lucide-react';

interface POIListProps {
  pois: POI[];
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI) => void;
  onOpenEdit: (poi: POI) => void;
  onDeletePoi: (poi: POI) => void;
  onToggleFavorite: (poi: POI) => void;
  onOpenCreate: () => void;
  onNavigatePoi?: (poi: POI) => void;
  userLocation?: GPSLocation | null;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  currentTheme?: AppTheme;
}

export const POIList: React.FC<POIListProps> = ({
  pois,
  selectedPoi,
  onSelectPoi,
  onOpenEdit,
  onDeletePoi,
  onToggleFavorite,
  onOpenCreate,
  onNavigatePoi,
  userLocation,
  onClearFilters,
  hasActiveFilters,
  currentTheme = 'moderno',
}) => {
  if (pois.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl mb-4 text-slate-400">
          🗺️
        </div>
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 mb-1">
          No se encontraron lugares
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          {hasActiveFilters
            ? 'Ningún punto de interés coincide con los filtros aplicados actualmente.'
            : 'Aún no hay puntos de interés registrados en tu base de datos de Google Sheets.'}
        </p>
        <div className="flex items-center gap-2">
          {hasActiveFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors min-h-[44px]"
            >
              Limpiar filtros
            </button>
          )}
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Crear nuevo POI</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2.5 sm:p-4 space-y-2.5 sm:space-y-3">
      {pois.map((poi) => {
        const catMeta = CATEGORIES_CONFIG[poi.categoria] || CATEGORIES_CONFIG.Otro;
        const isSelected = selectedPoi?.id === poi.id;

        const distanceStr =
          userLocation && typeof poi.lat === 'number' && typeof poi.lng === 'number'
            ? formatDistance(
                calculateHaversineDistance(userLocation.lat, userLocation.lng, poi.lat, poi.lng)
              )
            : null;

        return (
          <div
            key={poi.id}
            onClick={() => onSelectPoi(poi)}
            className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-3 hover:shadow-md ${
              isSelected
                ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-sm bg-teal-50/20 dark:bg-teal-950/20'
                : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail or Category Icon Badge */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700">
                {poi.foto_url ? (
                  <img
                    src={poi.foto_url}
                    alt={poi.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-xl sm:text-2xl"
                    style={{ backgroundColor: `${catMeta.color}18` }}
                  >
                    <span>{catMeta.icon}</span>
                  </div>
                )}
                {/* Status indicator badge */}
                {poi.estado && (
                  <span
                    className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-0.5 backdrop-blur-xs ${
                      poi.estado === 'Visitado'
                        ? 'bg-emerald-600/90 text-white'
                        : poi.estado === 'Imprescindible'
                        ? 'bg-rose-600/90 text-white'
                        : 'bg-slate-800/85 text-white'
                    }`}
                  >
                    {poi.estado}
                  </span>
                )}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Header Row: Category Badge, Rating, Favorite */}
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1"
                      style={{
                        backgroundColor: `${catMeta.color}18`,
                        color: catMeta.color,
                        border: `1px solid ${catMeta.color}35`,
                      }}
                    >
                      <span>{catMeta.icon}</span>
                      <span>{poi.categoria}</span>
                    </span>

                    {distanceStr && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800 flex items-center gap-0.5">
                        <Compass className="w-2.5 h-2.5" />
                        {distanceStr}
                      </span>
                    )}

                    {poi.precio && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                        {poi.precio}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {poi.rating !== undefined && poi.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {poi.rating.toFixed(1)}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(poi);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                      title={poi.favorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          poi.favorito ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                  {poi.nombre}
                </h4>

                {/* City and Address */}
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {poi.ciudad}
                  </span>
                  {poi.direccion && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="truncate">{poi.direccion}</span>
                    </>
                  )}
                </div>

                {/* Description snippet */}
                {poi.descripcion && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-1 leading-relaxed">
                    {poi.descripcion}
                  </p>
                )}

                {/* Tags snippet */}
                {poi.tags && poi.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {poi.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                    {poi.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{poi.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer Quick Action Buttons */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigatePoi) {
                        onNavigatePoi(poi);
                      }
                    }}
                    className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold rounded-lg text-[11px] border border-teal-200/80 dark:border-teal-800 flex items-center gap-1 transition-colors min-h-[34px] cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    <span>Cómo llegar</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPoi(poi);
                      }}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors min-h-[34px] cursor-pointer"
                    >
                      Ver ficha
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEdit(poi);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePoi(poi);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-slate-200 dark:border-slate-700 min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
