import React, { useState } from 'react';
import { FilterState, Category, CategoryMeta } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { getCategoryMeta } from '../utils/categories';
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  Heart,
  MapPin,
  ArrowUpDown,
  Filter,
  Navigation,
  Tag,
  Plus,
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  cities: string[];
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
  hasUserLocation?: boolean;
  categories?: Record<string, CategoryMeta>;
  onOpenCategoryManager?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  cities,
  totalCount,
  filteredCount,
  onClearFilters,
  hasUserLocation,
  categories,
  onOpenCategoryManager,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCategoryCount = filters.categorias.length;
  const isAnyFilterActive =
    filters.search.trim() !== '' ||
    filters.ciudad !== 'all' ||
    filters.categorias.length > 0 ||
    filters.soloFavoritos ||
    filters.soloVisitados !== null ||
    filters.minRating > 0;

  const categoryKeys = categories ? Object.keys(categories) : [];

  const toggleCategory = (cat: Category) => {
    setFilters((prev) => {
      const exists = prev.categorias.includes(cat);
      if (exists) {
        return { ...prev, categorias: prev.categorias.filter((c) => c !== cat) };
      } else {
        return { ...prev, categorias: [...prev.categorias, cat] };
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 space-y-2.5 transition-colors">
      {/* Top row: Search input, City dropdown, Quick Status, Advanced toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Buscar por nombre, descripción, tag o ciudad..."
            className="w-full pl-9.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* City Filter */}
        <div className="relative shrink-0 min-w-[130px] max-w-[180px]">
          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.ciudad}
            onChange={(e) => setFilters((prev) => ({ ...prev, ciudad: e.target.value }))}
            className="w-full appearance-none pl-8 pr-7 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer truncate"
          >
            <option value="all">🌍 Todas las ciudades</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                📍 {city}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="relative shrink-0 min-w-[135px]">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [
                FilterState['sortBy'],
                FilterState['sortOrder']
              ];
              setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
            }}
            className="w-full appearance-none pl-8 pr-6 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
          >
            <option value="nombre-asc">Nombre (A-Z)</option>
            <option value="nombre-desc">Nombre (Z-A)</option>
            <option value="rating-desc">Mayor valoración ⭐</option>
            <option value="ciudad-asc">Ciudad (A-Z)</option>
            {hasUserLocation && <option value="distancia-asc">📍 Más cercanos (GPS)</option>}
          </select>
        </div>

        {/* Favorites Fast Filter Button */}
        <button
          onClick={() => setFilters((prev) => ({ ...prev, soloFavoritos: !prev.soloFavoritos }))}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer shrink-0 min-h-[38px] ${
            filters.soloFavoritos
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
          title="Ver solo favoritos"
        >
          <Heart className={`w-3.5 h-3.5 ${filters.soloFavoritos ? 'fill-slate-950' : ''}`} />
          <span className="hidden sm:inline">Favoritos</span>
        </button>

        {/* Advanced Filters Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer shrink-0 min-h-[38px] ${
            showAdvanced || isAnyFilterActive
              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCategoryCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeCategoryCount}
            </span>
          )}
        </button>

        {/* Clear filters if active */}
        {isAnyFilterActive && (
          <button
            onClick={onClearFilters}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2 py-1 flex items-center gap-1 cursor-pointer shrink-0"
            title="Restablecer todos los filtros"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Horizontal Category Chips Bar (Quick category selection) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setFilters((prev) => ({ ...prev, categorias: [] }))}
          className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            filters.categorias.length === 0
              ? 'bg-teal-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Todos ({totalCount})
        </button>

        {categoryKeys.map((cat) => {
          const isSelected = filters.categorias.includes(cat);
          const meta = getCategoryMeta(cat, categories);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{cat}</span>
            </button>
          );
        })}

        {onOpenCategoryManager && (
          <button
            onClick={onOpenCategoryManager}
            className="px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 border border-dashed border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/50"
            title="Gestionar o añadir categorías"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Categorías</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Drawer / Section */}
      {showAdvanced && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs animate-in slide-in-from-top-2 duration-150">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Estado:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, soloVisitados: null }))}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  filters.soloVisitados === null
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Todos
              </button>
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  onClick={() => setFilters((prev) => ({ ...prev, soloVisitados: st }))}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    filters.soloVisitados === st
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Min Rating Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Mín. Valoración:</span>
            <div className="flex items-center gap-1">
              {[0, 3, 4, 4.5].map((val) => (
                <button
                  key={val}
                  onClick={() => setFilters((prev) => ({ ...prev, minRating: val }))}
                  className={`px-2 py-1 rounded-lg font-medium transition-all border ${
                    filters.minRating === val
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {val === 0 ? 'Cualquiera' : `★ ${val}+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
