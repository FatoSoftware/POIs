import React from 'react';
import { POI, GPSLocation, CategoryMeta } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { formatDistance, calculateHaversineDistance } from '../utils/geo';
import {
  X,
  MapPin,
  Star,
  Heart,
  Phone,
  Globe,
  Clock,
  Tag,
  FileText,
  Navigation,
  Edit,
  Trash2,
  Share2,
  Copy,
  Check,
  Compass,
} from 'lucide-react';

interface POIDetailModalProps {
  poi: POI | null;
  onClose: () => void;
  onEdit: (poi: POI) => void;
  onDelete: (poi: POI) => void;
  onToggleFavorite: (poi: POI) => void;
  onNavigate?: (poi: POI) => void;
  userLocation?: GPSLocation | null;
  categories?: Record<string, CategoryMeta>;
}

export const POIDetailModal: React.FC<POIDetailModalProps> = ({
  poi,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onNavigate,
  userLocation,
  categories,
}) => {
  const [copiedCoords, setCopiedCoords] = React.useState(false);

  if (!poi) return null;

  const catMeta = getCategoryMeta(poi.categoria, categories);

  const distanceText =
    userLocation && typeof poi.lat === 'number' && typeof poi.lng === 'number'
      ? formatDistance(
          calculateHaversineDistance(userLocation.lat, userLocation.lng, poi.lat, poi.lng)
        )
      : null;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${poi.lat}, ${poi.lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: poi.nombre,
        text: `Mira este punto de interés: ${poi.nombre} (${poi.ciudad})`,
        url: `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`,
      });
    } else {
      handleCopyCoords();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header Photo or Decorative Banner */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden shrink-0">
          {poi.foto_url ? (
            <img
              src={poi.foto_url}
              alt={poi.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${catMeta.color}dd, #1e293b)`,
              }}
            >
              <span className="text-6xl filter drop-shadow-md select-none">{catMeta.icon}</span>
              <span className="text-white/80 font-medium text-xs mt-2 uppercase tracking-widest">
                {poi.categoria}
              </span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-black/30 to-black/40 pointer-events-none" />

          {/* Top Actions: Close & Favorite & Share */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer min-w-[44px] min-h-[44px]"
              title="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer min-w-[44px] min-h-[44px]"
                title="Compartir o copiar enlace"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleFavorite(poi)}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer min-w-[44px] min-h-[44px] ${
                  poi.favorito
                    ? 'bg-amber-400 text-slate-900 shadow-lg scale-105'
                    : 'bg-black/40 hover:bg-black/60 text-white'
                }`}
                title={poi.favorito ? 'En favoritos' : 'Añadir a favoritos'}
              >
                <Heart
                  className={`w-5 h-5 ${poi.favorito ? 'fill-slate-900 text-slate-900' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Banner bottom info: Title & Badges */}
          <div className="absolute bottom-3 inset-x-4 text-white z-10">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs"
                style={{ backgroundColor: catMeta.color, color: '#ffffff' }}
              >
                <span>{catMeta.icon}</span>
                <span>{poi.categoria}</span>
              </span>

              {poi.estado && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    poi.estado === 'Visitado'
                      ? 'bg-emerald-500/90 text-white'
                      : poi.estado === 'Imprescindible'
                      ? 'bg-rose-500/90 text-white'
                      : 'bg-slate-700/80 text-slate-200'
                  }`}
                >
                  {poi.estado}
                </span>
              )}

              {poi.precio && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-amber-300 border border-amber-400/30">
                  {poi.precio}
                </span>
              )}

              {distanceText && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-600/90 text-white flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  A {distanceText} de ti
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm leading-tight">
              {poi.nombre}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{poi.ciudad}</span>
              {poi.rating && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {poi.rating.toFixed(1)} / 5.0
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Quick Action Navigation Bar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate(poi);
                }
              }}
              className="flex flex-col items-center justify-center p-2.5 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-slate-800 hover:from-teal-100 hover:to-emerald-100 text-teal-900 dark:text-teal-300 rounded-2xl border border-teal-200 dark:border-teal-800 transition-colors text-center font-bold text-xs gap-1 cursor-pointer min-h-[48px] shadow-xs"
            >
              <Navigation className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Cómo llegar</span>
            </button>

            {poi.telefono ? (
              <a
                href={`tel:${poi.telefono}`}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors text-center font-semibold text-xs gap-1 cursor-pointer min-h-[48px]"
              >
                <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Llamar</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center p-2.5 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 rounded-2xl border border-slate-100 dark:border-slate-800 text-center font-medium text-xs gap-1 min-h-[48px]">
                <Phone className="w-4 h-4" />
                <span>Sin teléfono</span>
              </div>
            )}

            {poi.web ? (
              <a
                href={poi.web.startsWith('http') ? poi.web : `https://${poi.web}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors text-center font-semibold text-xs gap-1 cursor-pointer min-h-[48px]"
              >
                <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Sitio Web</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center p-2.5 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 rounded-2xl border border-slate-100 dark:border-slate-800 text-center font-medium text-xs gap-1 min-h-[48px]">
                <Globe className="w-4 h-4" />
                <span>Sin enlace</span>
              </div>
            )}
          </div>

          {/* Description */}
          {poi.descripcion && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Descripción
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {poi.descripcion}
              </p>
            </div>
          )}

          {/* Address and Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {poi.direccion && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Dirección</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{poi.direccion}</p>
              </div>
            )}

            {poi.horario && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Horario habitual</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{poi.horario}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {poi.tags && poi.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Etiquetas & Características</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {poi.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800 rounded-xl text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Private Notes & Tips */}
          {poi.notas_privadas && (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3.5 space-y-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Notas & Recomendaciones personales</span>
              </h4>
              <p className="text-xs sm:text-sm text-amber-950/90 dark:text-amber-200 leading-relaxed italic">
                "{poi.notas_privadas}"
              </p>
            </div>
          )}

          {/* Coordinates & ID footer info */}
          <div className="bg-slate-100/70 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 flex items-center justify-between text-xs font-mono">
            <div className="truncate">
              <span className="text-slate-400 select-none">Coord: </span>
              <span>
                {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
              </span>
            </div>
            <button
              onClick={handleCopyCoords}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors shrink-0 ml-2 cursor-pointer"
              title="Copiar coordenadas"
            >
              {copiedCoords ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500" />
              )}
              <span>{copiedCoords ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions: Edit & Delete */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDelete(poi)}
            className="px-3.5 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>

          <button
            onClick={() => onEdit(poi)}
            className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/20 cursor-pointer min-h-[44px]"
          >
            <Edit className="w-4 h-4" />
            <span>Editar este POI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
