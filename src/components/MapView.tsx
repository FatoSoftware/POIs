import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { POI, GPSLocation, AppTheme } from '../types';
import { CATEGORIES_CONFIG, MAP_TILE_PROVIDERS, APP_THEMES } from '../constants';
import {
  Navigation,
  Layers,
  Maximize2,
  Star,
  ExternalLink,
  Edit3,
  Eye,
  Info,
  Plus,
  Compass,
  X,
} from 'lucide-react';

interface MapViewProps {
  pois: POI[];
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI) => void;
  onOpenCreate: (coords?: { lat: number; lng: number }) => void;
  onOpenEdit: (poi: POI) => void;
  onNavigatePoi?: (poi: POI) => void;
  currentTheme?: AppTheme;
  userLocation?: GPSLocation | null;
  onRequestGPS?: () => void;
  isLocatingGPS?: boolean;
  routePoi?: POI | null;
  onClearRoute?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  pois,
  selectedPoi,
  onSelectPoi,
  onOpenCreate,
  onOpenEdit,
  onNavigatePoi,
  currentTheme = 'moderno',
  userLocation: propUserLocation,
  onRequestGPS,
  isLocatingGPS = false,
  routePoi,
  onClearRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  const [currentTileIndex, setCurrentTileIndex] = useState(0);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [localUserLocation, setLocalUserLocation] = useState<GPSLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [clickCoordPrompt, setClickCoordPrompt] = useState<{ lat: number; lng: number } | null>(null);

  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const effectiveUserLocation = propUserLocation || localUserLocation;

  // Sync default tile with theme when theme changes
  useEffect(() => {
    const themeConfig = APP_THEMES[currentTheme];
    if (themeConfig) {
      const idx = MAP_TILE_PROVIDERS.findIndex((t) => t.id === themeConfig.defaultTileId);
      if (idx !== -1) {
        setCurrentTileIndex(idx);
      }
    }
  }, [currentTheme]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] =
      pois.length > 0 && typeof pois[0].lat === 'number'
        ? [pois[0].lat, pois[0].lng]
        : [40.4168, -3.7038]; // Madrid default

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 6,
      zoomControl: false,
    });

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add Tile Layer
    const tileConfig = MAP_TILE_PROVIDERS[currentTileIndex] || MAP_TILE_PROVIDERS[0];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Route Layer Group
    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;

    // Markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Map click handler to create POI
    map.on('click', (e: L.LeafletMouseEvent) => {
      setClickCoordPrompt({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when tile index changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileConfig = MAP_TILE_PROVIDERS[currentTileIndex] || MAP_TILE_PROVIDERS[0];
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [currentTileIndex]);

  // Sync user location marker on map
  useEffect(() => {
    if (!mapInstanceRef.current || !effectiveUserLocation) return;

    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }
    if (userAccuracyCircleRef.current) {
      mapInstanceRef.current.removeLayer(userAccuracyCircleRef.current);
    }

    const latlng: [number, number] = [effectiveUserLocation.lat, effectiveUserLocation.lng];

    if (effectiveUserLocation.accuracy) {
      userAccuracyCircleRef.current = L.circle(latlng, {
        radius: effectiveUserLocation.accuracy / 2,
        color: '#0d9488',
        fillColor: '#0d9488',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(mapInstanceRef.current);
    }

    userMarkerRef.current = L.circleMarker(latlng, {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: '#0d9488',
      fillOpacity: 1,
    }).addTo(mapInstanceRef.current);

    userMarkerRef.current.bindPopup(
      '<div class="p-1 text-center font-sans font-bold text-xs text-teal-800">📍 Tu ubicación GPS</div>'
    );
  }, [effectiveUserLocation]);

  // Draw Navigation Route Polyline when routePoi is active
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;

    routeLayerRef.current.clearLayers();

    if (routePoi && effectiveUserLocation) {
      const userLatLng: [number, number] = [effectiveUserLocation.lat, effectiveUserLocation.lng];
      const poiLatLng: [number, number] = [routePoi.lat, routePoi.lng];

      // Route Glow line
      const glowPolyline = L.polyline([userLatLng, poiLatLng], {
        color: '#0d9488',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
      }).addTo(routeLayerRef.current);

      // Dash main polyline
      const mainPolyline = L.polyline([userLatLng, poiLatLng], {
        color: '#0f766e',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.95,
        lineCap: 'round',
      }).addTo(routeLayerRef.current);

      // Fit bounds to show both user and destination nicely
      const bounds = L.latLngBounds([userLatLng, poiLatLng]);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16,
      });
    }
  }, [routePoi, effectiveUserLocation]);

  // Render Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    pois.forEach((poi) => {
      if (
        typeof poi.lat !== 'number' ||
        typeof poi.lng !== 'number' ||
        isNaN(poi.lat) ||
        isNaN(poi.lng)
      ) {
        return;
      }

      const catMeta = CATEGORIES_CONFIG[poi.categoria] || CATEGORIES_CONFIG.Otro;
      const isSelected = selectedPoi?.id === poi.id;
      const isRouteDest = routePoi?.id === poi.id;
      const hasRating = poi.rating !== undefined && poi.rating > 0;

      // Custom HTML Marker
      const customIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div class="relative group cursor-pointer transition-transform duration-200 ${
            isSelected || isRouteDest ? 'scale-125 z-50' : 'hover:scale-115'
          }">
            <div style="background-color: ${catMeta.color};" class="w-9 h-9 rounded-2xl shadow-lg border-2 border-white flex items-center justify-center text-base transform transition-all duration-200 ${
              isRouteDest
                ? 'ring-4 ring-rose-500 ring-offset-2 animate-bounce'
                : isSelected
                ? 'ring-4 ring-teal-400 ring-offset-2'
                : ''
            }">
              <span>${catMeta.icon}</span>
            </div>
            ${
              poi.favorito
                ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border border-white rounded-full flex items-center justify-center text-[9px] shadow-xs">⭐</div>'
                : ''
            }
            ${
              hasRating
                ? `<div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white shadow-xs whitespace-nowrap">${poi.rating?.toFixed(
                    1
                  )}</div>`
                : ''
            }
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: customIcon }).addTo(
        markersLayerRef.current!
      );

      // Popup content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 min-w-[210px] max-w-[270px] text-slate-800 font-sans';
      popupDiv.innerHTML = `
        <div class="flex items-start gap-2">
          ${
            poi.foto_url
              ? `<img src="${poi.foto_url}" class="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200" onerror="this.style.display='none'" />`
              : ''
          }
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1">
              <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md" style="background:${
                catMeta.bgLight
              }; color:${catMeta.color}; border: 1px solid ${catMeta.borderColor};">${
        catMeta.icon
      } ${poi.categoria}</span>
              ${
                poi.rating
                  ? `<span class="text-[11px] font-bold text-amber-600 flex items-center ml-auto">★ ${poi.rating.toFixed(
                      1
                    )}</span>`
                  : ''
              }
            </div>
            <h4 class="font-bold text-sm text-slate-900 mt-1 leading-tight truncate">${
              poi.nombre
            }</h4>
            <p class="text-xs text-slate-500 truncate">${poi.ciudad || ''}</p>
          </div>
        </div>
        ${
          poi.descripcion
            ? `<p class="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed bg-slate-50 p-1.5 rounded border border-slate-100">${poi.descripcion}</p>`
            : ''
        }
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <button id="view-poi-${
            poi.id
          }" class="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold text-center transition-colors">
            Ver Ficha
          </button>
          <button id="nav-poi-${
            poi.id
          }" class="py-1 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold text-center transition-colors flex items-center gap-1">
            🧭 Cómo llegar
          </button>
          <button id="edit-poi-${
            poi.id
          }" class="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs border border-slate-200">
            ✏️
          </button>
        </div>
      `;

      marker.bindPopup(popupDiv, { maxWidth: 290, closeButton: false });

      marker.on('click', () => {
        onSelectPoi(poi);
      });

      marker.on('popupopen', () => {
        const viewBtn = document.getElementById(`view-poi-${poi.id}`);
        const navBtn = document.getElementById(`nav-poi-${poi.id}`);
        const editBtn = document.getElementById(`edit-poi-${poi.id}`);

        if (viewBtn) {
          viewBtn.onclick = (e) => {
            e.stopPropagation();
            onSelectPoi(poi);
            marker.closePopup();
          };
        }
        if (navBtn) {
          navBtn.onclick = (e) => {
            e.stopPropagation();
            marker.closePopup();
            if (onNavigatePoi) {
              onNavigatePoi(poi);
            }
          };
        }
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            onOpenEdit(poi);
            marker.closePopup();
          };
        }
      });
    });
  }, [pois, selectedPoi, routePoi]);

  // Center on selected POI if changed
  useEffect(() => {
    if (selectedPoi && mapInstanceRef.current && !routePoi) {
      mapInstanceRef.current.flyTo([selectedPoi.lat, selectedPoi.lng], 15, {
        duration: 1.2,
      });
    }
  }, [selectedPoi, routePoi]);

  // Geolocation locate handler
  const handleLocateUser = () => {
    if (onRequestGPS) {
      onRequestGPS();
    }
    if (!mapInstanceRef.current) return;
    setIsLocating(true);

    mapInstanceRef.current.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true });

    mapInstanceRef.current.once('locationfound', (e: L.LocationEvent) => {
      setIsLocating(false);
      const loc: GPSLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        accuracy: e.accuracy,
        timestamp: Date.now(),
      };
      setLocalUserLocation(loc);
    });

    mapInstanceRef.current.once('locationerror', (err) => {
      setIsLocating(false);
      alert('No se pudo obtener la ubicación GPS: ' + err.message);
    });
  };

  // Fit all markers in view
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || pois.length === 0) return;
    const validCoords: [number, number][] = pois
      .filter(
        (p) =>
          typeof p.lat === 'number' &&
          typeof p.lng === 'number' &&
          !isNaN(p.lat) &&
          !isNaN(p.lng)
      )
      .map((p) => [p.lat, p.lng]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[220px] bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* The Leaflet map container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Active Route Floating Chip */}
      {routePoi && (
        <div className="absolute top-3 left-3 z-10 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-xl border border-teal-500/40 flex items-center gap-2.5 max-w-[280px] sm:max-w-xs animate-in slide-in-from-top-3">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
              Ruta activa
            </div>
            <div className="text-xs font-bold text-white truncate">{routePoi.nombre}</div>
          </div>
          {onClearRoute && (
            <button
              onClick={onClearRoute}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cancelar ruta"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
            title="Cambiar capa del mapa"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-12 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 min-w-[210px] z-20 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                Estilo de mapa
              </div>
              {MAP_TILE_PROVIDERS.map((provider, idx) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setCurrentTileIndex(idx);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    currentTileIndex === idx
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{provider.name}</span>
                  {currentTileIndex === idx && <span className="text-teal-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fit Bounds Button */}
        <button
          onClick={handleFitBounds}
          className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]"
          title="Ajustar vista a todos los POIs"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Geolocation GPS Button */}
        <button
          onClick={handleLocateUser}
          disabled={isLocating || isLocatingGPS}
          className={`p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px] ${
            isLocating || isLocatingGPS
              ? 'text-teal-600 animate-pulse'
              : 'text-slate-700 dark:text-slate-200'
          }`}
          title="Centrar en mi ubicación actual (GPS)"
        >
          <Navigation
            className={`w-4 h-4 ${isLocating || isLocatingGPS ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Floating Prompt when user clicks on Map */}
      {clickCoordPrompt && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 max-w-sm">
          <div className="text-xs">
            <p className="font-semibold text-teal-300">Punto seleccionado</p>
            <p className="text-[11px] text-slate-300 font-mono">
              {clickCoordPrompt.lat.toFixed(4)}, {clickCoordPrompt.lng.toFixed(4)}
            </p>
          </div>
          <button
            onClick={() => {
              onOpenCreate(clickCoordPrompt);
              setClickCoordPrompt(null);
            }}
            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear POI aquí
          </button>
          <button
            onClick={() => setClickCoordPrompt(null)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Small Map Hint */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 shadow-xs hidden sm:flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>Haz clic en el mapa para añadir un POI</span>
      </div>
    </div>
  );
};
