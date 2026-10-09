import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { POI, FilterState, AppTheme, GPSLocation, CategoryMeta } from './types';
import {
  fetchPOIsFromSheet,
  savePOIToSheet,
  deletePOIFromSheet,
  getPendingSyncCount,
  syncPendingQueue,
} from './services/api';
import { calculateHaversineDistance } from './utils/geo';
import {
  getStoredCategories,
  saveStoredCategories,
  INITIAL_CATEGORIES_CONFIG,
} from './utils/categories';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { MapView } from './components/MapView';
import { POIList } from './components/POIList';
import { POIDetailModal } from './components/POIDetailModal';
import { POIFormModal } from './components/POIFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SettingsModal } from './components/SettingsModal';
import { NavigationModal } from './components/NavigationModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { BrandIcon } from './components/BrandIcon';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Main Data State
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState<'live' | 'cache'>('cache');
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingSyncCount());
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Category State (Dynamic CRUD)
  const [categories, setCategories] = useState<Record<string, CategoryMeta>>(() => {
    return getStoredCategories();
  });
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // View & UI State
  const [viewMode, setViewMode] = useState<'map' | 'split' | 'grid'>('split');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [detailModalPoi, setDetailModalPoi] = useState<POI | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formInitialPOI, setFormInitialPOI] = useState<Partial<POI> | null>(null);
  const [deletingPoi, setDeletingPoi] = useState<POI | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('poi_app_theme') as AppTheme;
    return saved || 'moderno';
  });

  // GPS & Navigation State
  const [userLocation, setUserLocation] = useState<GPSLocation | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [navigationPoi, setNavigationPoi] = useState<POI | null>(null);
  const [routePoi, setRoutePoi] = useState<POI | null>(null);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categorias: [],
    ciudad: 'all',
    soloFavoritos: false,
    soloVisitados: null,
    minRating: 0,
    sortBy: 'nombre',
    sortOrder: 'asc',
  });

  // Apply Theme to document HTML root
  useEffect(() => {
    localStorage.setItem('poi_app_theme', currentTheme);
    if (currentTheme === 'oscuro') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  // Initial Load from Google Sheets & Automatic Merge
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetchPOIsFromSheet();
      setPois(res.pois);
      setSyncSource(res.source);
      setPendingCount(res.pendingCount);
      if (res.source === 'live') {
        if (!silent) {
          if (res.pendingCount > 0) {
            showToast(`Sincronizados ${res.pois.length} POIs (${res.pendingCount} pendientes de confirmar en Sheets)`, 'info');
          } else {
            showToast(`Sincronizados ${res.pois.length} POIs desde Google Sheets`, 'success');
          }
        }
      } else if (res.error) {
        if (!silent) showToast(`Modo guardado local: ${res.pois.length} POIs disponibles`, 'info');
      }
    } catch {
      showToast('Error al conectar con Google Sheets, usando copia local', 'error');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  const handleSyncPending = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncPendingQueue();
      setPendingCount(res.remainingCount);
      if (res.remainingCount === 0) {
        showToast(`¡Sincronización completa! Se subieron ${res.syncedCount} cambios a Sheets.`, 'success');
      } else {
        showToast(`Sincronizados ${res.syncedCount} cambios. Quedan ${res.remainingCount} pendientes.`, 'info');
      }
      loadData(true);
    } catch {
      showToast('Error al conectar con Google Sheets.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();

    // Periodic check to sync any pending changes in background
    const interval = setInterval(() => {
      const pending = getPendingSyncCount();
      setPendingCount(pending);
      if (pending > 0 && navigator.onLine) {
        syncPendingQueue().then((res) => {
          setPendingCount(res.remainingCount);
        });
      }
    }, 20000);

    const handleOnline = () => {
      showToast('Conexión reestablecida. Sincronizando...', 'info');
      loadData(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  // Request high-accuracy GPS
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      showToast('Tu dispositivo no soporta GPS / Geolocalización', 'error');
      return;
    }
    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const loc: GPSLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude || undefined,
          timestamp: pos.timestamp,
        };
        setUserLocation(loc);
        showToast('Ubicación GPS obtenida con éxito', 'info');
      },
      (err) => {
        setIsLocatingGPS(false);
        showToast(`Error GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Unique list of cities for filter dropdown
  const cities = useMemo(() => {
    const set = new Set<string>();
    pois.forEach((p) => {
      if (p.ciudad && p.ciudad.trim()) {
        set.add(p.ciudad.trim());
      }
    });
    return Array.from(set).sort();
  }, [pois]);

  // Filtered & Sorted POIs
  const filteredPOIs = useMemo(() => {
    let result = pois.filter((p) => {
      // Category filter (array of categories)
      if (filters.categorias.length > 0 && !filters.categorias.includes(p.categoria)) {
        return false;
      }
      // City filter
      if (filters.ciudad !== 'all' && p.ciudad !== filters.ciudad) {
        return false;
      }
      // Status filter
      if (filters.soloFavoritos && !p.favorito) {
        return false;
      }
      if (filters.soloVisitados !== null && p.estado !== filters.soloVisitados) {
        return false;
      }
      // Rating filter
      if (filters.minRating > 0 && (!p.rating || p.rating < filters.minRating)) {
        return false;
      }
      // Text search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const inName = p.nombre?.toLowerCase().includes(query);
        const inDesc = p.descripcion?.toLowerCase().includes(query) || false;
        const inCity = p.ciudad?.toLowerCase().includes(query) || false;
        const inAddr = p.direccion?.toLowerCase().includes(query) || false;
        const inTags = p.tags?.some((t) => t.toLowerCase().includes(query)) || false;
        if (!inName && !inDesc && !inCity && !inAddr && !inTags) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'nombre') {
        const cmp = (a.nombre || '').localeCompare(b.nombre || '', 'es', {
          sensitivity: 'base',
        });
        return filters.sortOrder === 'asc' ? cmp : -cmp;
      }
      if (filters.sortBy === 'ciudad') {
        const cmp = (a.ciudad || '').localeCompare(b.ciudad || '', 'es', {
          sensitivity: 'base',
        });
        return filters.sortOrder === 'asc' ? cmp : -cmp;
      }
      if (filters.sortBy === 'rating') {
        const rateA = a.rating || 0;
        const rateB = b.rating || 0;
        return rateB - rateA;
      }
      if (filters.sortBy === 'distancia' && userLocation) {
        const distA = calculateHaversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateHaversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      }
      return 0;
    });

    return result;
  }, [pois, filters, userLocation]);

  // POI Save Handler (Create / Edit) with zero data loss guarantee
  const handleSavePOI = async (poi: POI, isEdit: boolean) => {
    const res = await savePOIToSheet(poi, isEdit);
    const updatedPoi = { ...poi, id: res.id || poi.id };
    setPendingCount(getPendingSyncCount());

    if (isEdit) {
      setPois((prev) => prev.map((p) => (p.id === updatedPoi.id ? updatedPoi : p)));
      if (detailModalPoi?.id === updatedPoi.id) {
        setDetailModalPoi(updatedPoi);
      }
      if (res.isOffline) {
        showToast(`"${updatedPoi.nombre}" guardado en el dispositivo. Pendiente de sincronizar.`, 'info');
      } else {
        showToast(`"${updatedPoi.nombre}" guardado y sincronizado con Google Sheets.`, 'success');
      }
    } else {
      setPois((prev) => [updatedPoi, ...prev.filter((p) => p.id !== updatedPoi.id)]);
      setSelectedPoi(updatedPoi);
      if (res.isOffline) {
        showToast(`"${updatedPoi.nombre}" creado y guardado en tu dispositivo.`, 'info');
      } else {
        showToast(`"${updatedPoi.nombre}" guardado y sincronizado con Google Sheets.`, 'success');
      }
    }
  };

  // POI Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingPoi) return;
    setIsDeleting(true);
    try {
      await deletePOIFromSheet(deletingPoi.id);
      setPendingCount(getPendingSyncCount());
      setPois((prev) => prev.filter((p) => p.id !== deletingPoi.id));
      if (detailModalPoi?.id === deletingPoi.id) {
        setDetailModalPoi(null);
      }
      if (selectedPoi?.id === deletingPoi.id) {
        setSelectedPoi(null);
      }
      if (routePoi?.id === deletingPoi.id) {
        setRoutePoi(null);
      }
      showToast(`"${deletingPoi.nombre}" ha sido eliminado.`);
    } catch {
      showToast('Error al eliminar el POI', 'error');
    } finally {
      setIsDeleting(false);
      setDeletingPoi(null);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (poi: POI) => {
    const newFav = !poi.favorito;
    const updated = { ...poi, favorito: newFav };
    setPois((prev) => prev.map((p) => (p.id === poi.id ? updated : p)));
    if (detailModalPoi?.id === poi.id) {
      setDetailModalPoi(updated);
    }
    await savePOIToSheet(updated, true);
    setPendingCount(getPendingSyncCount());
    showToast(
      newFav ? `Añadido a favoritos: ${poi.nombre}` : `Eliminado de favoritos: ${poi.nombre}`,
      'info'
    );
  };

  // Open Create with optional prefilled coords from map click
  const handleOpenCreate = (coords?: { lat: number; lng: number }) => {
    setFormInitialPOI(coords ? { lat: coords.lat, lng: coords.lng } : null);
    setFormModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (poi: POI) => {
    setFormInitialPOI(poi);
    setFormModalOpen(true);
  };

  // Start Navigation Modal
  const handleStartNavigation = (poi: POI) => {
    setNavigationPoi(poi);
  };

  // Draw Route On Interactive Map
  const handleDrawRouteOnMap = (poi: POI) => {
    setRoutePoi(poi);
    setSelectedPoi(poi);
    if (!userLocation) {
      handleRequestGPS();
    }
    if (viewMode === 'grid') {
      setViewMode('split');
    }
  };

  // Category Action Handlers
  const handleSaveCategory = (
    oldKey: string | null,
    newKey: string,
    meta: CategoryMeta
  ) => {
    const updated = { ...categories };
    if (oldKey && oldKey !== newKey) {
      delete updated[oldKey];
      // Cascading update to all POIs that had the old category name
      setPois((prev) =>
        prev.map((p) => {
          if (p.categoria === oldKey) {
            const updatedPoi = { ...p, categoria: newKey };
            // Save updated POI to backend in background
            savePOIToSheet(updatedPoi, true).catch(() => {});
            return updatedPoi;
          }
          return p;
        })
      );
      // Also update selectedPoi or detailModalPoi if matching
      if (selectedPoi?.categoria === oldKey) {
        setSelectedPoi((prev) => (prev ? { ...prev, categoria: newKey } : null));
      }
      if (detailModalPoi?.categoria === oldKey) {
        setDetailModalPoi((prev) => (prev ? { ...prev, categoria: newKey } : null));
      }
    }
    updated[newKey] = meta;
    setCategories(updated);
    saveStoredCategories(updated);
    showToast(`Categoría "${newKey}" guardada con éxito.`);
  };

  const handleDeleteCategory = (key: string, reassignToKey?: string) => {
    const targetKey = reassignToKey || 'Otro';
    // Reassign affected POIs
    setPois((prev) =>
      prev.map((p) => {
        if (p.categoria === key) {
          const updatedPoi = { ...p, categoria: targetKey };
          savePOIToSheet(updatedPoi, true).catch(() => {});
          return updatedPoi;
        }
        return p;
      })
    );
    if (selectedPoi?.categoria === key) {
      setSelectedPoi((prev) => (prev ? { ...prev, categoria: targetKey } : null));
    }
    if (detailModalPoi?.categoria === key) {
      setDetailModalPoi((prev) => (prev ? { ...prev, categoria: targetKey } : null));
    }

    const updated = { ...categories };
    delete updated[key];
    if (Object.keys(updated).length === 0) {
      updated.Otro = INITIAL_CATEGORIES_CONFIG.Otro;
    }
    setCategories(updated);
    saveStoredCategories(updated);
    showToast(`Categoría "${key}" eliminada.`);
  };

  const handleResetCategories = () => {
    const reset = { ...INITIAL_CATEGORIES_CONFIG };
    setCategories(reset);
    saveStoredCategories(reset);
    showToast('Categorías restablecidas a los valores por defecto.');
  };

  // Initial Splash Screen while loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 flex flex-col items-center justify-center text-white z-50 p-4">
        <div className="relative flex flex-col items-center animate-pulse">
          <BrandIcon size={110} className="shadow-2xl ring-4 ring-white/30" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-6 uppercase drop-shadow-sm text-center">
            Mis Puntos de Interés
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-1 font-medium tracking-wider">
            Sincronizando con Google Sheets...
          </p>
        </div>
        <div className="mt-8 flex items-center gap-2 text-xs text-white/80 bg-black/20 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Cargando base de datos</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        totalCount={pois.length}
        filteredCount={filteredPOIs.length}
        isSyncing={isSyncing}
        onRefresh={() => loadData(false)}
        onOpenCreate={() => handleOpenCreate()}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenCategoryManager={() => setCategoryModalOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        syncSource={syncSource}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        pendingCount={pendingCount}
        onSyncPending={handleSyncPending}
      />

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        cities={cities}
        totalCount={pois.length}
        filteredCount={filteredPOIs.length}
        onClearFilters={() =>
          setFilters({
            search: '',
            categorias: [],
            ciudad: 'all',
            soloFavoritos: false,
            soloVisitados: null,
            minRating: 0,
            sortBy: 'nombre',
            sortOrder: 'asc',
          })
        }
        hasUserLocation={Boolean(userLocation)}
        categories={categories}
        onOpenCategoryManager={() => setCategoryModalOpen(true)}
      />

      {/* Main Content Area: Responsive Mobile First Layout & Balanced Split */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* MAP VIEW CONTAINER */}
        <div
          className={`transition-all duration-300 relative ${
            viewMode === 'map'
              ? 'h-full w-full'
              : viewMode === 'grid'
              ? 'hidden'
              : /* SPLIT VIEW: Perfectly balanced 50% Top / 50% Bottom on Mobile, and 50% Left / 50% Right on Desktop */
                'h-[50%] md:h-full w-full md:w-1/2 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800'
          }`}
        >
          <MapView
            pois={filteredPOIs}
            selectedPoi={selectedPoi}
            onSelectPoi={(poi) => {
              setSelectedPoi(poi);
              setDetailModalPoi(poi);
            }}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEdit}
            onNavigatePoi={handleStartNavigation}
            currentTheme={currentTheme}
            userLocation={userLocation}
            onRequestGPS={handleRequestGPS}
            isLocatingGPS={isLocatingGPS}
            routePoi={routePoi}
            onClearRoute={() => setRoutePoi(null)}
            categories={categories}
          />
        </div>

        {/* LIST / GRID VIEW CONTAINER */}
        <div
          className={`bg-slate-50 dark:bg-slate-900 transition-all duration-300 overflow-hidden ${
            viewMode === 'grid'
              ? 'h-full w-full'
              : viewMode === 'map'
              ? 'hidden'
              : /* SPLIT VIEW: Perfectly balanced 50% Bottom on Mobile, and 50% Right on Desktop */
                'h-[50%] md:h-full w-full md:w-1/2 flex-1'
          }`}
        >
          <POIList
            pois={filteredPOIs}
            selectedPoi={selectedPoi}
            onSelectPoi={(poi) => {
              setSelectedPoi(poi);
              setDetailModalPoi(poi);
            }}
            onOpenEdit={handleOpenEdit}
            onDeletePoi={(poi) => setDeletingPoi(poi)}
            onToggleFavorite={handleToggleFavorite}
            onOpenCreate={() => handleOpenCreate()}
            onNavigatePoi={handleStartNavigation}
            userLocation={userLocation}
            currentTheme={currentTheme}
            categories={categories}
            onClearFilters={() =>
              setFilters({
                search: '',
                categorias: [],
                ciudad: 'all',
                soloFavoritos: false,
                soloVisitados: null,
                minRating: 0,
                sortBy: 'nombre',
                sortOrder: 'asc',
              })
            }
            hasActiveFilters={
              filters.search !== '' ||
              filters.categorias.length > 0 ||
              filters.ciudad !== 'all' ||
              filters.soloFavoritos ||
              filters.soloVisitados !== null ||
              filters.minRating > 0
            }
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Thumb reachable controls on phones) */}
      <MobileBottomNav
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenCreate={() => handleOpenCreate()}
        onLocateGPS={handleRequestGPS}
        isLocatingGPS={isLocatingGPS}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-16 md:bottom-5 right-4 md:right-5 z-70 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Detail Sheet Modal */}
      <POIDetailModal
        poi={detailModalPoi}
        onClose={() => setDetailModalPoi(null)}
        onEdit={(poi) => {
          setDetailModalPoi(null);
          handleOpenEdit(poi);
        }}
        onDelete={(poi) => {
          setDetailModalPoi(null);
          setDeletingPoi(poi);
        }}
        onToggleFavorite={handleToggleFavorite}
        onNavigate={(poi) => {
          setDetailModalPoi(null);
          handleStartNavigation(poi);
        }}
        userLocation={userLocation}
        categories={categories}
      />

      {/* 2. Create / Edit Form Modal */}
      <POIFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setFormInitialPOI(null);
        }}
        onSave={handleSavePOI}
        onDelete={(poi) => {
          setFormModalOpen(false);
          setDeletingPoi(poi);
        }}
        initialPOI={formInitialPOI}
        existingCities={cities}
        categories={categories}
        onOpenCategoryManager={() => setCategoryModalOpen(true)}
      />

      {/* 3. Delete Confirmation Dialog */}
      <DeleteConfirmModal
        poi={deletingPoi}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPoi(null)}
        isDeleting={isDeleting}
      />

      {/* 4. Settings & Apps Script Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        allPOIs={pois}
        onDataImported={(newPois) => {
          setPois(newPois);
          showToast(`Importados ${newPois.length} POIs correctamente`);
        }}
        onReload={() => loadData(false)}
      />

      {/* 5. GPS Navigation Modal ("Cómo llegar") */}
      <NavigationModal
        poi={navigationPoi}
        userLocation={userLocation}
        onClose={() => setNavigationPoi(null)}
        onRequestGPS={handleRequestGPS}
        isLocatingGPS={isLocatingGPS}
        onDrawRouteOnMap={handleDrawRouteOnMap}
      />

      {/* 6. Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
      />

      {/* 7. Category Manager Modal */}
      <CategoryManagerModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetCategories={handleResetCategories}
        pois={pois}
      />

      {/* 8. PWA Install Prompt Banner for Mobile / Standalone setup */}
      <PWAInstallBanner />
    </div>
  );
}
