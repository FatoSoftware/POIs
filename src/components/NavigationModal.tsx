import React, { useState, useEffect } from 'react';
import { POI, GPSLocation } from '../types';
import { CATEGORIES_CONFIG } from '../constants';
import { computeNavigationInfo, getNavigationAppUrls } from '../utils/geo';
import {
  X,
  Navigation,
  Compass,
  MapPin,
  ExternalLink,
  Footprints,
  Car,
  Bike,
  RefreshCw,
  Share2,
  Check,
  Copy,
  LocateFixed,
  AlertTriangle,
} from 'lucide-react';

interface NavigationModalProps {
  poi: POI | null;
  userLocation: GPSLocation | null;
  onClose: () => void;
  onRequestGPS: () => void;
  isLocatingGPS: boolean;
  onDrawRouteOnMap: (poi: POI) => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  poi,
  userLocation,
  onClose,
  onRequestGPS,
  isLocatingGPS,
  onDrawRouteOnMap,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!userLocation) {
      onRequestGPS();
    }
  }, [userLocation]);

  if (!poi) return null;

  const catMeta = CATEGORIES_CONFIG[poi.categoria] || CATEGORIES_CONFIG.Otro;

  const navInfo = userLocation
    ? computeNavigationInfo(userLocation.lat, userLocation.lng, poi.lat, poi.lng)
    : null;

  const appUrls = getNavigationAppUrls(
    userLocation?.lat || null,
    userLocation?.lng || null,
    poi.lat,
    poi.lng,
    poi.nombre
  );

  const handleShare = () => {
    const shareUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`;
    if (navigator.share) {
      navigator.share({
        title: `Ruta a ${poi.nombre}`,
        text: `Cómo llegar a ${poi.nombre} (${poi.ciudad})`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle on mobile */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-sm"
              style={{ backgroundColor: catMeta.color, color: '#ffffff' }}
            >
              <Navigation className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Navegación GPS
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {poi.ciudad}
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                {poi.nombre}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Compartir ruta"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* GPS Live Status Card */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-teal-950/40 p-4 rounded-2xl border border-teal-200/80 dark:border-teal-900/60 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                        userLocation ? 'bg-teal-400' : 'bg-amber-400'
                      } opacity-75`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        userLocation ? 'bg-teal-600' : 'bg-amber-500'
                      }`}
                    />
                  </span>
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                    {userLocation ? 'Tu ubicación GPS actual' : 'Obteniendo señal GPS...'}
                  </span>
                </div>

                {userLocation ? (
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-teal-950 dark:text-white tracking-tight">
                      {navInfo?.distanceFormatted}
                    </span>
                    <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                      en línea recta
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Permite el acceso a tu GPS para calcular la distancia exacta y el tiempo de llegada desde donde te encuentras.
                  </p>
                )}
              </div>

              {/* Refresh GPS button */}
              <button
                onClick={onRequestGPS}
                disabled={isLocatingGPS}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-200 rounded-xl text-xs font-semibold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                <span>Actualizar GPS</span>
              </button>
            </div>

            {/* Direction & Bearing widget */}
            {navInfo && (
              <div className="mt-3 pt-3 border-t border-teal-200/60 dark:border-teal-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-medium">
                  <div
                    className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs transition-transform duration-500"
                    style={{ transform: `rotate(${navInfo.bearingDeg}deg)` }}
                    title={`Rumbo: ${navInfo.bearingDeg}°`}
                  >
                    ↑
                  </div>
                  <span>
                    Rumbo <strong>{navInfo.bearingCardinal}</strong> ({navInfo.bearingDeg}°)
                  </span>
                </div>
                {userLocation?.accuracy && (
                  <span className="text-[11px] text-teal-700 dark:text-teal-400">
                    Precisión ±{Math.round(userLocation.accuracy)}m
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Travel Modes and ETAs */}
          {navInfo && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <Footprints className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">A pie</div>
                <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                  ~{navInfo.etaWalkingMin} min
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <Car className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">En coche</div>
                <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                  ~{navInfo.etaDrivingMin} min
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <Bike className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">En bici</div>
                <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                  ~{navInfo.etaCyclingMin} min
                </div>
              </div>
            </div>
          )}

          {/* In-App Map Trace Route Button */}
          <button
            onClick={() => {
              onDrawRouteOnMap(poi);
              onClose();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Trazar ruta en el mapa interactivo</span>
          </button>

          {/* Direct Mobile Navigation Apps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Abrir en tu app de navegación favorita
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Google Maps */}
              <a
                href={appUrls.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                  🗺️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    Google Maps
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Navegación paso a paso
                  </div>
                </div>
              </a>

              {/* Apple Maps */}
              <a
                href={appUrls.appleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                  🍏
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    Apple Maps
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Navegación nativa iOS
                  </div>
                </div>
              </a>

              {/* Waze */}
              <a
                href={appUrls.waze}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
                  🚗
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    Waze
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-600 transition-colors" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Alertas de tráfico en tiempo real
                  </div>
                </div>
              </a>

              {/* OpenStreetMap */}
              <a
                href={appUrls.openStreetMap}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                  🌍
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    OpenStreetMap
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Ruta libre & Open Source
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Destination Details reminder */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Destino: {poi.nombre}</span>
            </div>
            {poi.direccion && (
              <p className="text-slate-500 dark:text-slate-400 pl-5">{poi.direccion}</p>
            )}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 pl-5 font-mono">
              Coordenadas: {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
