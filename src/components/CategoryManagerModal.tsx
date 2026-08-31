import React, { useState } from 'react';
import { CategoryMeta, POI } from '../types';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_EMOJI_PRESETS,
  computeLightBg,
  computeBorderColor,
  INITIAL_CATEGORIES_CONFIG,
} from '../utils/categories';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Tag,
  AlertTriangle,
  Layers,
  Palette,
  Smile,
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Record<string, CategoryMeta>;
  onSaveCategory: (oldKey: string | null, newKey: string, meta: CategoryMeta) => void;
  onDeleteCategory: (key: string, reassignToKey?: string) => void;
  onResetCategories: () => void;
  pois: POI[];
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
  onResetCategories,
  pois,
}) => {
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State for Create / Edit
  const [categoryName, setCategoryName] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('📍');
  const [categoryColor, setCategoryColor] = useState('#E63946');
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion confirm state
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [reassignKey, setReassignKey] = useState<string>('Otro');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  if (!isOpen) return null;

  // Calculate POI counts per category
  const poiCountPerCategory: Record<string, number> = {};
  pois.forEach((poi) => {
    const cat = poi.categoria || 'Otro';
    poiCountPerCategory[cat] = (poiCountPerCategory[cat] || 0) + 1;
  });

  const categoryEntries = Object.entries(categories) as [string, CategoryMeta][];

  const startCreate = () => {
    setEditingCategoryKey(null);
    setCategoryName('');
    setCategoryLabel('');
    setCategoryIcon('📍');
    setCategoryColor('#E63946');
    setFormError(null);
    setIsCreatingNew(true);
  };

  const startEdit = (key: string) => {
    const item = categories[key];
    if (!item) return;
    setEditingCategoryKey(key);
    setCategoryName(key);
    setCategoryLabel(item.label || key);
    setCategoryIcon(item.icon || '📍');
    setCategoryColor(item.color || '#6C757D');
    setFormError(null);
    setIsCreatingNew(false);
  };

  const handleCancelForm = () => {
    setEditingCategoryKey(null);
    setIsCreatingNew(false);
    setFormError(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = categoryName.trim();
    if (!cleanKey) {
      setFormError('Introduce un nombre identificador para la categoría.');
      return;
    }

    // Check duplicate key if creating or renaming to existing key
    if (
      (isCreatingNew && categories[cleanKey]) ||
      (editingCategoryKey && editingCategoryKey !== cleanKey && categories[cleanKey])
    ) {
      setFormError(`Ya existe una categoría llamada "${cleanKey}". Elige otro nombre.`);
      return;
    }

    const cleanLabel = categoryLabel.trim() || cleanKey;
    const cleanIcon = categoryIcon.trim() || '📍';
    const cleanColor = categoryColor.trim() || '#6C757D';

    const newMeta: CategoryMeta = {
      id: cleanKey,
      label: cleanLabel,
      icon: cleanIcon,
      color: cleanColor,
      bgLight: computeLightBg(cleanColor),
      borderColor: computeBorderColor(cleanColor),
      isCustom: true,
    };

    onSaveCategory(editingCategoryKey, cleanKey, newMeta);
    handleCancelForm();
  };

  const handleConfirmDelete = () => {
    if (!deletingKey) return;
    onDeleteCategory(deletingKey, reassignKey);
    setDeletingKey(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors my-auto">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                Gestión de Categorías
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Crea, personaliza colores, iconos y edita categorías para tus puntos de interés
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Main Action Banner */}
          {!isCreatingNew && !editingCategoryKey && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200/80 dark:border-teal-800/80 p-3.5 sm:p-4 rounded-2xl">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-teal-950 dark:text-teal-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{categoryEntries.length} Categorías Disponibles</span>
                </h4>
                <p className="text-xs text-teal-800/80 dark:text-teal-300/80 mt-0.5">
                  Puedes añadir tantas categorías personalizadas como necesites.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Restablecer categorías originales"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
                <button
                  type="button"
                  onClick={startCreate}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Categoría</span>
                </button>
              </div>
            </div>
          )}

          {/* CREATE / EDIT FORM */}
          {(isCreatingNew || editingCategoryKey) && (
            <form
              onSubmit={handleSaveForm}
              className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/70 border border-teal-300 dark:border-teal-700/80 rounded-2xl space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {isCreatingNew ? (
                    <>
                      <Plus className="w-4 h-4 text-teal-600" />
                      <span>Nueva Categoría</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 text-teal-600" />
                      <span>Editar Categoría: {editingCategoryKey}</span>
                    </>
                  )}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* ID / Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Corto / Identificador *
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      if (!categoryLabel || categoryLabel === categoryName) {
                        setCategoryLabel(e.target.value);
                      }
                    }}
                    placeholder="Ej: Copas, Restaurante, Playa..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Es el valor guardado en Google Sheets y en los POIs.
                  </p>
                </div>

                {/* Visible Label */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Etiqueta Descriptiva
                  </label>
                  <input
                    type="text"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    placeholder="Ej: Copas & Vida Nocturna"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Texto descriptivo que se muestra en menús y filtros.
                  </p>
                </div>
              </div>

              {/* Icon / Emoji Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-teal-600" />
                    <span>Icono / Emoji</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Seleccionado: <strong className="text-base ml-1">{categoryIcon}</strong>
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-h-28 overflow-y-auto">
                  {CATEGORY_EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCategoryIcon(emoji)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all cursor-pointer ${
                        categoryIcon === emoji
                          ? 'bg-teal-100 dark:bg-teal-900/60 ring-2 ring-teal-500 scale-110'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      maxLength={4}
                      value={categoryIcon}
                      onChange={(e) => setCategoryIcon(e.target.value)}
                      placeholder="Otro"
                      className="w-16 px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      title="Escribe un emoji personalizado"
                    />
                  </div>
                </div>
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-teal-600" />
                    <span>Color Temático</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="text-[11px] font-mono text-slate-500">{categoryColor}</span>
                  </div>
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {CATEGORY_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setCategoryColor(preset.hex)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                        categoryColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'scale-115 ring-2 ring-slate-900 dark:ring-white shadow-xs'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    >
                      {categoryColor.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}

                  {/* Custom color input */}
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                    <input
                      type="color"
                      value={categoryColor}
                      onChange={(e) => setCategoryColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      title="Elegir color personalizado"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Personalizado</span>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Vista Previa:</span>
                <div className="flex items-center gap-3">
                  {/* Badge Preview */}
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: computeLightBg(categoryColor),
                      color: categoryColor,
                      borderColor: computeBorderColor(categoryColor),
                      borderWidth: '1px',
                    }}
                  >
                    <span>{categoryIcon}</span>
                    <span>{categoryLabel || categoryName || 'Nueva Categoría'}</span>
                  </span>

                  {/* Map Pin Preview */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white"
                    style={{ backgroundColor: categoryColor }}
                  >
                    <span>{categoryIcon}</span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreatingNew ? 'Crear Categoría' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          )}

          {/* CATEGORY LIST GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categoryEntries.map(([key, meta]) => {
              const poiCount = poiCountPerCategory[key] || 0;
              const isDefault = Boolean(INITIAL_CATEGORIES_CONFIG[key]);

              return (
                <div
                  key={key}
                  className="p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:border-teal-400 dark:hover:border-teal-600 rounded-2xl flex items-center justify-between gap-2.5 transition-all shadow-2xs"
                >
                  {/* Category Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: meta.bgLight || computeLightBg(meta.color),
                        color: meta.color,
                        borderColor: meta.borderColor || computeBorderColor(meta.color),
                        borderWidth: '1px',
                      }}
                    >
                      {meta.icon || '📌'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                          {key}
                        </h4>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                          title={meta.color}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {meta.label !== key ? meta.label : ''}
                        {meta.label !== key ? ' • ' : ''}
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          {poiCount} {poiCount === 1 ? 'lugar' : 'lugares'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(key)}
                      className="p-2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer"
                      title="Editar categoría"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingKey(key);
                        setReassignKey(
                          key === 'Otro' ? Object.keys(categories)[0] || 'Comida' : 'Otro'
                        );
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total: <strong>{categoryEntries.length}</strong> categorías
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      {deletingKey && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  ¿Eliminar categoría "{deletingKey}"?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción eliminará la categoría de la lista de opciones.
                </p>
              </div>
            </div>

            {(poiCountPerCategory[deletingKey] || 0) > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-bold">
                  ⚠️ Hay {poiCountPerCategory[deletingKey]} punto(s) de interés con esta categoría.
                </p>
                <label className="block text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  Reasignar estos lugares a:
                </label>
                <select
                  value={reassignKey}
                  onChange={(e) => setReassignKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {categoryEntries
                    .filter(([k]) => k !== deletingKey)
                    .map(([k]) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingKey(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET DIALOG */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  ¿Restablecer categorías originales?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Se restaurarán las categorías predeterminadas (Restaurante, Copas, Hotel, Comida, Turismo, Naturaleza, Ocio, etc.).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetCategories();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
