import React, { useState, useEffect } from 'react';
import { POI } from '../types';
import {
  getAirtableConfig,
  setAirtableConfig,
  testAirtableConnection,
  batchUploadPOIsToAirtable,
  getPendingSyncCount,
  syncPendingQueue,
  saveCachedPOIs,
  AIRTABLE_PERSONAL_ACCESS_TOKEN,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_NAME,
} from '../services/api';
import {
  X,
  Settings,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CloudUpload,
  ExternalLink,
  Eye,
  EyeOff,
  Table,
  Globe,
  FileSpreadsheet,
  Check,
  Copy,
  Info,
  HelpCircle,
  Key,
  Layers,
  BookOpen,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPOIs: POI[];
  onDataImported: (pois: POI[]) => void;
  onReload: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  allPOIs,
  onDataImported,
  onReload,
}) => {
  const [token, setToken] = useState('');
  const [baseId, setBaseId] = useState('');
  const [tableName, setTableName] = useState('POIs');
  const [showToken, setShowToken] = useState(false);

  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  const [syncingAllStatus, setSyncingAllStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'airtable' | 'schema' | 'cloudflare' | 'backup'>('airtable');

  useEffect(() => {
    if (isOpen) {
      const cfg = getAirtableConfig();
      setToken(cfg.token);
      setBaseId(cfg.baseId);
      setTableName(cfg.tableName || 'POIs');
      setPendingCount(getPendingSyncCount());
      setTestingStatus('idle');
      setTestResultMsg(null);
      setSyncingAllStatus('idle');
      setSyncResultMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    setAirtableConfig({
      token,
      baseId,
      tableName,
    });
    onReload();
    onClose();
  };

  const handleTestConnection = async () => {
    setTestingStatus('testing');
    setTestResultMsg(null);
    try {
      const res = await testAirtableConnection({
        token,
        baseId,
        tableName,
      });
      if (res.success) {
        setTestingStatus('success');
        setTestResultMsg(res.message);
      } else {
        setTestingStatus('error');
        setTestResultMsg(res.error || res.message);
      }
    } catch (e: any) {
      setTestingStatus('error');
      setTestResultMsg(e.message || 'Error de conexión con Airtable');
    }
  };

  const handleForceUploadAll = async () => {
    setSyncingAllStatus('syncing');
    setSyncResultMsg(null);
    try {
      // Guardar primero configuración
      setAirtableConfig({ token, baseId, tableName });

      const res = await batchUploadPOIsToAirtable(allPOIs, {
        token,
        baseId,
        tableName,
      });

      if (res.success) {
        setSyncingAllStatus('success');
        setSyncResultMsg(`¡Éxito! Se han subido y migrado ${res.count} POIs a tu base de Airtable.`);
        setPendingCount(0);
        onReload();
      } else {
        setSyncingAllStatus('error');
        setSyncResultMsg(res.error || 'Error al subir a Airtable.');
      }
    } catch (e: any) {
      setSyncingAllStatus('error');
      setSyncResultMsg(e.message || 'Error durante la subida masiva a Airtable.');
    }
  };

  const handleFlushPending = async () => {
    setSyncingAllStatus('syncing');
    setSyncResultMsg(null);
    try {
      const res = await syncPendingQueue({ token, baseId, tableName });
      setPendingCount(res.remainingCount);
      if (res.remainingCount === 0) {
        setSyncingAllStatus('success');
        setSyncResultMsg(`Se han sincronizado los ${res.syncedCount} cambios pendientes en Airtable.`);
      } else {
        setSyncingAllStatus('error');
        setSyncResultMsg(`Se sincronizaron ${res.syncedCount} cambios, quedan ${res.remainingCount} pendientes.`);
      }
      onReload();
    } catch (e: any) {
      setSyncingAllStatus('error');
      setSyncResultMsg(e.message || 'Error al procesar la cola pendiente.');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPOIs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mis_pois_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nombre',
      'Lat',
      'Lng',
      'Categoria',
      'Ciudad',
      'Descripcion',
      'Rating',
      'Direccion',
      'Telefono',
      'Web',
      'Horario',
      'Precio',
      'Tags',
      'Foto_URL',
      'Favorito',
      'Notas_Privadas',
      'Estado',
    ];

    const rows = allPOIs.map((p) => [
      `"${(p.id || '').replace(/"/g, '""')}"`,
      `"${(p.nombre || '').replace(/"/g, '""')}"`,
      p.lat || 0,
      p.lng || 0,
      `"${(p.categoria || '').replace(/"/g, '""')}"`,
      `"${(p.ciudad || '').replace(/"/g, '""')}"`,
      `"${(p.descripcion || '').replace(/"/g, '""')}"`,
      p.rating !== undefined ? p.rating : '',
      `"${(p.direccion || '').replace(/"/g, '""')}"`,
      `"${(p.telefono || '').replace(/"/g, '""')}"`,
      `"${(p.web || '').replace(/"/g, '""')}"`,
      `"${(p.horario || '').replace(/"/g, '""')}"`,
      `"${(p.precio || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || '').replace(/"/g, '""')}"`,
      `"${(p.foto_url || '').replace(/"/g, '""')}"`,
      p.favorito ? 'true' : 'false',
      `"${(p.notas_privadas || '').replace(/"/g, '""')}"`,
      `"${(p.estado || 'Pendiente').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `mis_pois_airtable_ready_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          saveCachedPOIs(parsed);
          onDataImported(parsed);
          alert(`Se han importado ${parsed.length} POIs correctamente.`);
        } else {
          alert('El archivo no tiene un formato de lista de POIs válido.');
        }
      } catch {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const schemaColumns = [
    { name: 'ID', type: 'Single line text', desc: 'Identificador único (ej: ID-EX1001)' },
    { name: 'Nombre', type: 'Single line text', desc: 'Nombre del punto de interés' },
    { name: 'Lat', type: 'Number (Decimal 6)', desc: 'Latitud geográfica (ej: 40.415363)' },
    { name: 'Lng', type: 'Number (Decimal 6)', desc: 'Longitud geográfica (ej: -3.707398)' },
    { name: 'Categoria', type: 'Single line text o Single select', desc: 'Comida, Turismo, Copas, Hotel, etc.' },
    { name: 'Ciudad', type: 'Single line text', desc: 'Ciudad o municipio (ej: Madrid, Barcelona)' },
    { name: 'Descripcion', type: 'Long text', desc: 'Descripción o detalles del lugar' },
    { name: 'Rating', type: 'Number (Decimal 1)', desc: 'Puntuación de 0 a 5' },
    { name: 'Direccion', type: 'Single line text', desc: 'Dirección física completa' },
    { name: 'Telefono', type: 'Phone number o Single line text', desc: 'Teléfono de contacto' },
    { name: 'Web', type: 'URL', desc: 'Página web o enlace oficial' },
    { name: 'Horario', type: 'Single line text', desc: 'Horario comercial o de visitas' },
    { name: 'Precio', type: 'Single line text', desc: 'Gratis, €, €€, €€€, €€€€' },
    { name: 'Tags', type: 'Single line text o Long text', desc: 'Etiquetas separadas por comas' },
    { name: 'Foto_URL', type: 'URL o Single line text', desc: 'Enlace web directo a una foto' },
    { name: 'Favorito', type: 'Checkbox', desc: 'Marcado si es favorito' },
    { name: 'Notas_Privadas', type: 'Long text', desc: 'Notas personales y recomendaciones' },
    { name: 'Estado', type: 'Single line text o Single select', desc: 'Pendiente, Visitado, Imprescindible' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Base de Datos Airtable & Cloudflare</h3>
              <p className="text-xs text-slate-500">API nativa Fetch (100% estático, sin Google Apps Script)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('airtable')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'airtable'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Credenciales Airtable</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'schema'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Columnas Airtable</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloudflare')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'cloudflare'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Guía Cloudflare Pages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Copia / Exportar CSV</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: AIRTABLE CREDENTIALS */}
          {activeTab === 'airtable' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-teal-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Arquitectura 100% Estática con API de Airtable
                </p>
                <p>
                  Tu aplicación se comunica directamente desde el navegador web mediante <code>fetch</code> nativo con la API de Airtable.
                  No necesitas Google Sheets, Google Apps Script ni servidores Node intermedios.
                </p>
              </div>

              {/* Pending changes alert */}
              {pendingCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Tienes <strong>{pendingCount} cambios pendientes</strong> de subir a Airtable.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFlushPending}
                    disabled={syncingAllStatus === 'syncing'}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingAllStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Sincronizar ahora</span>
                  </button>
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-3.5">
                {/* 1. PAT */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>AIRTABLE_PERSONAL_ACCESS_TOKEN</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <a
                      href="https://airtable.com/create/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                    >
                      <span>Crear Token en Airtable</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="patxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full text-xs font-mono p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    En Airtable: dale permisos de lectura y escritura (<code>data.records:read</code>, <code>data.records:write</code>) y acceso a tu Base.
                  </p>
                </div>

                {/* 2. BASE ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>AIRTABLE_BASE_ID</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Empieza por "app..."</span>
                  </div>
                  <input
                    type="text"
                    value={baseId}
                    onChange={(e) => setBaseId(e.target.value)}
                    placeholder="appxxxxxxxxxxxxxx"
                    className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Lo verás en la URL de tu base en el navegador: <code>airtable.com/appXXXXXXXXXXXXXX/...</code> o en la documentación de la API.
                  </p>
                </div>

                {/* 3. TABLE NAME */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>AIRTABLE_TABLE_NAME</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Por defecto: "POIs"</span>
                  </div>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="POIs"
                    className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Debe coincidir exactamente con el nombre de la pestaña/tabla en tu base de Airtable.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Save & Test */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Guardar Credenciales
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingStatus === 'testing' || !token || !baseId}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Probar Conexión en Directo</span>
                </button>
              </div>

              {/* Test Connection Output */}
              {testingStatus !== 'idle' && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    testingStatus === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : testingStatus === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {testingStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {testingStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                  {testingStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-slate-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-semibold">{testingStatus === 'testing' ? 'Verificando API de Airtable...' : testResultMsg}</p>
                  </div>
                </div>
              )}

              {/* Batch Upload Section */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudUpload className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      Migración / Subida Masiva a Airtable
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono bg-slate-800 px-2 py-0.5 rounded text-teal-300">
                    {allPOIs.length} POIs disponibles
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ¿Quieres cargar todos los POIs actuales en tu nueva tabla de Airtable? Este proceso los enviará en lotes de 10 directamente con la API oficial.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleForceUploadAll}
                    disabled={syncingAllStatus === 'syncing' || !token || !baseId}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className={`w-3.5 h-3.5 ${syncingAllStatus === 'syncing' ? 'animate-bounce' : ''}`} />
                    <span>Subir todos los POIs a Airtable</span>
                  </button>
                  {syncingAllStatus === 'syncing' && (
                    <span className="text-xs text-teal-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Subiendo registros...
                    </span>
                  )}
                </div>

                {syncResultMsg && (
                  <p className={`text-xs p-2 rounded-lg ${syncingAllStatus === 'success' ? 'bg-emerald-950/80 text-emerald-300' : 'bg-red-950/80 text-red-300'}`}>
                    {syncResultMsg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMA / COLUMNS */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-blue-600" />
                  Estructura de la Tabla en Airtable (Nombre de la Tabla: "{tableName || 'POIs'}")
                </p>
                <p>
                  Para que la API lea y guarde sin errores, crea en Airtable los siguientes campos con estos nombres exactos (respetando mayúsculas y minúsculas).
                  <strong> Consejo rápido:</strong> Puedes exportar el archivo CSV desde la pestaña "Copia / Exportar CSV" e importarlo directamente en Airtable para que cree todas las columnas automáticamente.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 sticky top-0 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Columna en Airtable</th>
                        <th className="py-2 px-3">Tipo de Campo Recomendado</th>
                        <th className="py-2 px-3">Descripción</th>
                        <th className="py-2 px-2 text-right">Copiar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schemaColumns.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-teal-800">{col.name}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{col.type}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{col.desc}</td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleCopyText(col.name, col.name)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Copiar nombre"
                            >
                              {copiedIndex === col.name ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="text-slate-600 font-medium">¿Quieres crear la tabla con un clic?</span>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUDFLARE PAGES GUIDE */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-600" />
                  Despliegue Estático en Cloudflare Pages
                </p>
                <p>
                  Tu aplicación está compilada con Vite en puro HTML, JavaScript y CSS sin servidor Node permanente.
                  Es 100% compatible con el plan gratuito de <strong>Cloudflare Pages</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] flex items-center justify-center font-bold">1</span>
                    Método Sencillo: Subida Directa (Drag & Drop)
                  </h4>
                  <p className="text-slate-600 mb-2">
                    Si no quieres usar Git o terminal, puedes subir la carpeta de producción compilada:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                    <li>Ejecuta <code>npm run build</code> (genera la carpeta <code>dist/</code>).</li>
                    <li>Ve a <strong>Cloudflare Dashboard &gt; Workers &amp; Pages &gt; Create &gt; Pages &gt; Upload assets</strong>.</li>
                    <li>Ponle nombre a tu proyecto y arrastra la carpeta <code>dist</code>.</li>
                    <li>¡Listo! Tu webapp estará online con HTTPS gratuito en <code>tudominio.pages.dev</code>.</li>
                  </ol>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] flex items-center justify-center font-bold">2</span>
                    Método Automático: Conectar con GitHub
                  </h4>
                  <p className="text-slate-600 mb-2">
                    Si tu código está en un repositorio de GitHub:
                  </p>
                  <ul className="space-y-1 text-slate-600">
                    <li>• <strong>Framework preset:</strong> Vite</li>
                    <li>• <strong>Build command:</strong> <code>npm run build</code></li>
                    <li>• <strong>Build output directory:</strong> <code>dist</code></li>
                  </ul>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] flex items-center justify-center font-bold">3</span>
                    Variables de Entorno en Cloudflare Pages
                  </h4>
                  <p className="text-slate-600 mb-1.5">
                    Puedes preconfigurar tus credenciales de Airtable en Cloudflare Pages (en Settings &gt; Environment variables):
                  </p>
                  <div className="bg-slate-900 text-teal-300 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                    <div>VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN = pat...</div>
                    <div>VITE_AIRTABLE_BASE_ID = app...</div>
                    <div>VITE_AIRTABLE_TABLE_NAME = POIs</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & EXPORT */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700">
                <p className="font-semibold mb-1 text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  Copia de Seguridad y Migración de Datos
                </p>
                <p>
                  Descarga todos tus puntos de interés en formato CSV o JSON. Puedes usar el archivo CSV para importarlo directamente en tu nueva base de Airtable.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 border border-slate-200 rounded-2xl bg-white flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs mb-1">Exportar CSV para Airtable</h5>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Genera un CSV con las 17 columnas y cabeceras exactas para importar en Airtable.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar CSV ({allPOIs.length} POIs)</span>
                  </button>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-white flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs mb-1">Exportar Copia JSON</h5>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Guarda una copia exacta completa de todos los datos y campos locales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar JSON</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                <h5 className="font-bold text-slate-800 text-xs mb-1">Restaurar Copia JSON</h5>
                <p className="text-[11px] text-slate-500 mb-3">
                  Carga un archivo de respaldo previo en formato JSON para restaurar en este navegador.
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  <span>Seleccionar archivo JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span>Los cambios en credenciales se guardan de inmediato.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
