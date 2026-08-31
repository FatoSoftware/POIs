import React, { useState } from 'react';
import { BrandIcon } from './BrandIcon';
import { AppTheme } from '../types';
import { APP_THEMES } from '../constants';
import {
  Plus,
  RefreshCw,
  Settings,
  Map,
  LayoutGrid,
  Columns,
  Palette,
  Check,
} from 'lucide-react';

interface NavbarProps {
  totalCount: number;
  filteredCount: number;
  isSyncing: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onOpenSettings: () => void;
  viewMode: 'map' | 'split' | 'grid';
  setViewMode: (mode: 'map' | 'split' | 'grid') => void;
  syncSource: 'live' | 'cache';
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCount,
  filteredCount,
  isSyncing,
  onRefresh,
  onOpenCreate,
  onOpenSettings,
  viewMode,
  setViewMode,
  syncSource,
  currentTheme,
  onSelectTheme,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeConfig = APP_THEMES[currentTheme] || APP_THEMES.moderno;

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <BrandIcon
            size={36}
            className="cursor-pointer hover:scale-105 transition-transform shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm sm:text-base md:text-lg text-slate-800 dark:text-white tracking-tight leading-none truncate">
                Mis Puntos de Interés
              </h1>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                  syncSource === 'live'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
                title={syncSource === 'live' ? 'Sincronizado con Google Sheets' : 'Modo local / caché'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    syncSource === 'live' ? 'bg-emerald-500' : 'bg-amber-500'
                  } ${isSyncing ? 'animate-ping' : ''}`}
                />
                <span className="hidden xs:inline">
                  {syncSource === 'live' ? 'Sheets Live' : 'Caché'}
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate mt-0.5">
              {filteredCount === totalCount ? (
                <span>{totalCount} lugares registrados</span>
              ) : (
                <span>
                  Mostrando {filteredCount} de {totalCount} lugares
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center: View Switcher (Desktop / Tablets) */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Mapa</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dividida (50/50)</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tarjetas</span>
          </button>
        </div>

        {/* Right Actions: Theme, Refresh, Settings, New */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Switcher dropdown button */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer min-w-[40px] min-h-[40px] justify-center"
              title="Cambiar tema visual (Oscuro, Claro, Moderno, Tradicional, Maps)"
            >
              <span className="text-sm">{themeConfig.icon}</span>
              <span className="hidden lg:inline text-xs font-bold">{themeConfig.name}</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 top-12 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 min-w-[200px] z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                  Temas visuales
                </div>
                {Object.values(APP_THEMES).map((thm) => (
                  <button
                    key={thm.id}
                    onClick={() => {
                      onSelectTheme(thm.id as AppTheme);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      currentTheme === thm.id
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{thm.icon}</span>
                      <span>{thm.name}</span>
                    </div>
                    {currentTheme === thm.id && (
                      <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            title="Recargar datos desde Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 border border-slate-200 dark:border-slate-700 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            title="Ajustes y Apps Script"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-teal-500/25 transition-all cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo POI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
