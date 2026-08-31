import React, { useState, useEffect } from 'react';
import { POI, POICategory, PriceLevel, VisitStatus } from '../types';
import { CATEGORIES_CONFIG, POPULAR_TAGS } from '../constants';
import { reverseGeocode } from '../services/api';
import {
  X,
  MapPin,
  Star,
  Heart,
  Phone,
  Globe,
  Clock,
  DollarSign,
  Tag,
  FileText,
  Trash2,
  Navigation,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Compass,
} from 'lucide-react';

interface POIFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (poi: POI, isEdit: boolean) => Promise<void>;
  onDelete?: (poi: POI) => void;
  initialPOI?: Partial<POI> | null;
  existingCities?: string[];
}

export const POIFormModal: React.FC<POIFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialPOI,
  existingCities = [],
}) => {
  const isEdit = Boolean(initialPOI?.id);

  // Form State
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<POICategory>('Comida');
  const [ciudad, setCiudad] = useState('');
  const [lat, setLat] = useState<number | string>('');
  const [lng, setLng] = useState<number | string>('');
  const [descripcion, setDescripcion] = useState('');

  // Extended fields
  const [rating, setRating] = useState<number>(0);
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [web, setWeb] = useState('');
  const [horario, setHorario] = useState('');
  const [precio, setPrecio] = useState<PriceLevel | string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [favorito, setFavorito] = useState(false);
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [estado, setEstado] = useState<VisitStatus | string>('Pendiente');

  // UI state
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'contact' | 'extras'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset or Populate form on open
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    setActiveTab('basic');

    if (initialPOI) {
      setNombre(initialPOI.nombre || '');
      setCategoria((initialPOI.categoria as POICategory) || 'Comida');
      setCiudad(initialPOI.ciudad || '');
      setLat(initialPOI.lat !== undefined ? initialPOI.lat : '');
      setLng(initialPOI.lng !== undefined ? initialPOI.lng : '');
      setDescripcion(initialPOI.descripcion || '');
      setRating(initialPOI.rating || 0);
      setDireccion(initialPOI.direccion || '');
      setTelefono(initialPOI.telefono || '');
      setWeb(initialPOI.web || '');
      setHorario(initialPOI.horario || '');
      setPrecio(initialPOI.precio || '');
      setTags(initialPOI.tags ? [...initialPOI.tags] : []);
      setFotoUrl(initialPOI.foto_url || '');
      setFavorito(Boolean(initialPOI.favorito));
      setNotasPrivadas(initialPOI.notas_privadas || '');
      setEstado(initialPOI.estado || 'Pendiente');

      // If lat/lng provided but no city/address (e.g. from map click), try reverse geocode
      if (initialPOI.lat && initialPOI.lng && (!initialPOI.ciudad || !initialPOI.direccion)) {
        handleAutoReverseGeocode(initialPOI.lat, initialPOI.lng);
      }
    } else {
      // Default empty state
      setNombre('');
      setCategoria('Comida');
      setCiudad('');
      setLat(40.4168);
      setLng(-3.7038);
      setDescripcion('');
      setRating(0);
      setDireccion('');
      setTelefono('');
      setWeb('');
      setHorario('');
      setPrecio('');
      setTags([]);
      setFotoUrl('');
      setFavorito(false);
      setNotasPrivadas('');
      setEstado('Pendiente');
    }
  }, [isOpen, initialPOI]);

  const handleAutoReverseGeocode = async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    try {
      const geo = await reverseGeocode(latitude, longitude);
      if (geo.ciudad && !ciudad) setCiudad(geo.ciudad);
      if (geo.direccion && !direccion) setDireccion(geo.direccion);
    } catch {
      // Ignore background geocode errors
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setLat(latitude);
        setLng(longitude);
        await handleAutoReverseGeocode(latitude, longitude);
      },
      (err) => {
        setIsGeocoding(false);
        alert('No se pudo obtener la posición GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const latNum = typeof lat === 'number' ? lat : parseFloat(lat.toString().replace(',', '.'));
    const lngNum = typeof lng === 'number' ? lng : parseFloat(lng.toString().replace(',', '.'));

    if (!nombre.trim()) {
      setErrorMsg('Por favor introduce el nombre del POI.');
      setActiveTab('basic');
      return;
    }
    if (!ciudad.trim()) {
      setErrorMsg('Por favor introduce la ciudad.');
      setActiveTab('basic');
      return;
    }
    if (isNaN(latNum) || isNaN(lngNum)) {
      setErrorMsg('Las coordenadas (Latitud y Longitud) deben ser números válidos.');
      setActiveTab('location');
      return;
    }

    const payload: POI = {
      id: initialPOI?.id || '',
      lat: latNum,
      lng: lngNum,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoria,
      ciudad: ciudad.trim(),
      rating: rating > 0 ? rating : undefined,
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      web: web.trim(),
      horario: horario.trim(),
      precio: precio || undefined,
      tags,
      foto_url: fotoUrl.trim(),
      favorito,
      notas_privadas: notasPrivadas.trim(),
      estado,
    };

    setIsSaving(true);
    try {
      await onSave(payload, isEdit);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar el POI');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
              <span>{isEdit ? 'Editar Punto de Interés' : 'Nuevo Punto de Interés'}</span>
              {isEdit && initialPOI?.id && (
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  {initialPOI.id}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {isEdit ? 'Modifica los datos y se actualizarán en Google Sheets' : 'Completa los datos para registrar el nuevo lugar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'basic'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Básico & Categoría
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'location'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Ubicación GPS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Detalles & Contacto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('extras')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'extras'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            4. Foto, Tags & Notas
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: BASIC INFO & CATEGORY */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del POI <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Mercado Central, Mirador del Sol, Hotel Paraíso..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoría Principal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CATEGORIES_CONFIG).map(([key, config]) => {
                    const isSelected = categoria === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategoria(key as POICategory)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20 shadow-xs font-semibold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-lg">{config.icon}</span>
                        <span className="text-xs truncate">{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* City with suggestions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ciudad / Municipio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ej: Madrid, Barcelona, Valencia, Sevilla..."
                  list="city-suggestions"
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <datalist id="city-suggestions">
                  {existingCities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Status and Favorite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estado de visita
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Pendiente">⏳ Pendiente de visita</option>
                    <option value="Visitado">✅ Visitado</option>
                    <option value="Imprescindible">🔥 Imprescindible / Prioritario</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2.5 p-2.5 bg-amber-50/70 hover:bg-amber-50 border border-amber-200/80 rounded-xl cursor-pointer w-full transition-colors">
                    <input
                      type="checkbox"
                      checked={favorito}
                      onChange={(e) => setFavorito(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded border-amber-300 focus:ring-amber-400"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        Marcar como Favorito
                      </span>
                      <p className="text-[11px] text-amber-700/80">Destacará con estrella en el mapa</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION & GPS */}
          {activeTab === 'location' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Coordenadas Geográficas
                </span>
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isGeocoding}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 text-teal-600 ${isGeocoding ? 'animate-spin' : ''}`} />
                  <span>{isGeocoding ? 'Obteniendo GPS...' : 'Usar mi ubicación GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Latitud <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Ej: 40.4168"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Longitud <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="Ej: -3.7038"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Address / Landmark */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Dirección física / Referencia
                  </label>
                  {lat && lng && (
                    <button
                      type="button"
                      onClick={() => handleAutoReverseGeocode(Number(lat), Number(lng))}
                      className="text-[11px] text-teal-600 hover:text-teal-800 font-medium underline flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" />
                      Autocompletar dirección por GPS
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Plaza Mayor, 12, Centro"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  Consejo: También puedes crear un POI haciendo clic directamente sobre el mapa en cualquier ubicación.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & RATINGS */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe qué hace especial este lugar, qué ver, ambiente, especialidades..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Rating & Price Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rating 1-5 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Valoración ({rating > 0 ? `${rating.toFixed(1)} ★` : 'Sin puntuar'})
                  </label>
                  <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(rating === star ? 0 : star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <button
                        type="button"
                        onClick={() => setRating(0)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 ml-auto"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>

                {/* Price Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nivel de Precio
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['Gratis', '€', '€€', '€€€', '€€€€'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPrecio(precio === lvl ? '' : lvl)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          precio === lvl
                            ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hours, Phone, Web */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Horario
                  </label>
                  <input
                    type="text"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    placeholder="10:00 - 22:00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600" /> Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-teal-600" /> Sitio Web / Enlace
                  </label>
                  <input
                    type="text"
                    value={web}
                    onChange={(e) => setWeb(e.target.value)}
                    placeholder="https://ejemplo.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PHOTO, TAGS & PRIVATE NOTES */}
          {activeTab === 'extras' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Photo URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-teal-600" /> URL de Foto o Imagen
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... o enlace de foto"
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                {fotoUrl && (
                  <div className="mt-2 relative h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={fotoUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Tags & Labels */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-teal-600" /> Etiquetas & Características
                </label>

                {/* Input for new tag */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    placeholder="Escribe una etiqueta y presiona Enter o Añadir..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(newTagInput)}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Añadir
                  </button>
                </div>

                {/* Selected Tags list */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-teal-50/50 rounded-xl border border-teal-100 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-teal-700 hover:text-rose-600"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Popular tag suggestions */}
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold">Sugerencias rápidas: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {POPULAR_TAGS.map((sug) => {
                      const isAdded = tags.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => (isAdded ? handleRemoveTag(sug) : handleAddTag(sug))}
                          className={`px-2 py-0.5 rounded-md text-[11px] border transition-all ${
                            isAdded
                              ? 'bg-teal-600 text-white border-teal-600 font-semibold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Private Notes & Tips */}
              <div>
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-700" /> Notas privadas & Recomendaciones
                </label>
                <textarea
                  rows={2}
                  value={notasPrivadas}
                  onChange={(e) => setNotasPrivadas(e.target.value)}
                  placeholder="Ej: Pedir la tarta de queso, reservar mesa en la terraza, evitar los domingos por la tarde..."
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => initialPOI && onDelete(initialPOI as POI)}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar POI</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Guardando en Sheets...' : isEdit ? 'Guardar Cambios' : 'Crear POI'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
