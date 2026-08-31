import React from 'react';
import { Map, Columns, LayoutGrid, Navigation, Plus, SlidersHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  viewMode: 'map' | 'split' | 'grid';
  setViewMode: (mode: 'map' | 'split' | 'grid') => void;
  onOpenCreate: () => void;
  onLocateGPS: () => void;
  isLocatingGPS: boolean;
  onToggleFilters?: () => void;
  hasActiveFilters?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  viewMode,
  setViewMode,
  onOpenCreate,
  onLocateGPS,
  isLocatingGPS,
  onToggleFilters,
  hasActiveFilters,
}) => {
  return (
    <nav className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shrink-0 z-30 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Map view button */}
        <button
          onClick={() => setViewMode('map')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-2xl transition-all active:scale-95 cursor-pointer ${
            viewMode === 'map'
              ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 font-bold ring-1 ring-teal-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
          title="Vista solo mapa"
        >
          <Map className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-none">Mapa</span>
        </button>

        {/* Split balanced view button */}
        <button
          onClick={() => setViewMode('split')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-2xl transition-all active:scale-95 cursor-pointer ${
            viewMode === 'split'
              ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 font-bold ring-1 ring-teal-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
          title="Pantalla dividida (Mapa + Tarjetas 50/50)"
        >
          <Columns className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-none">Dividida</span>
        </button>

        {/* Floating Add Button in Center */}
        <button
          onClick={onOpenCreate}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/30 active:scale-90 transition-transform -mt-4 border-2 border-white dark:border-slate-900 cursor-pointer"
          title="Crear nuevo punto de interés"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Tarjetas / Grid view button */}
        <button
          onClick={() => setViewMode('grid')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-2xl transition-all active:scale-95 cursor-pointer ${
            viewMode === 'grid'
              ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 font-bold ring-1 ring-teal-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
          title="Vista solo tarjetas / catálogo"
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-none">Tarjetas</span>
        </button>

        {/* GPS location button */}
        <button
          onClick={onLocateGPS}
          disabled={isLocatingGPS}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-all active:scale-95 disabled:opacity-50"
          title="Mi ubicación GPS actual"
        >
          <Navigation className={`w-5 h-5 mb-0.5 ${isLocatingGPS ? 'animate-spin text-teal-600' : ''}`} />
          <span className="text-[10px] leading-none">{isLocatingGPS ? 'Buscando' : 'GPS'}</span>
        </button>
      </div>
    </nav>
  );
};
