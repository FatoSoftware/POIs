import React, { useState, useEffect } from 'react';
import { POI } from '../types';
import {
  DEFAULT_SCRIPT_URL,
  MODERN_APPS_SCRIPT_CODE,
} from '../constants';
import {
  getStoredScriptUrl,
  setStoredScriptUrl,
  testSheetsConnection,
  forceBatchSyncAllToSheet,
  getPendingSyncCount,
  syncPendingQueue,
  saveCachedPOIs,
} from '../services/api';
import {
  X,
  Settings,
  Link,
  Code2,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Database,
  Globe,
  GitBranch,
  CloudUpload,
  RefreshCw,
  Info,
  ShieldCheck,
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
  const [url, setUrl] = useState(getStoredScriptUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedActionCode, setCopiedActionCode] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);
  const [syncingAllStatus, setSyncingAllStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'connection' | 'code' | 'backup' | 'github'>('connection');

  useEffect(() => {
    if (isOpen) {
      setUrl(getStoredScriptUrl());
      setPendingCount(getPendingSyncCount());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    setStoredScriptUrl(url);
    onReload();
    onClose();
  };

  const handleResetUrl = () => {
    setUrl(DEFAULT_SCRIPT_URL);
    setStoredScriptUrl(DEFAULT_SCRIPT_URL);
  };

  const handleTestConnection = async () => {
    setTestingStatus('testing');
    setTestResultMsg(null);
    try {
      const res = await testSheetsConnection(url);
      if (res.success) {
        setTestingStatus('success');
        setTestResultMsg(res.message);
      } else {
        setTestingStatus('error');
        setTestResultMsg(res.error || res.message || 'No se pudo conectar en directo. Verifica los permisos de la aplicación web.');
      }
    } catch (e: any) {
      setTestingStatus('error');
      setTestResultMsg(e.message || 'Error de conexión.');
    }
  };

  const handleForceUploadAll = async () => {
    setSyncingAllStatus('syncing');
    setSyncResultMsg(null);
    try {
      const res = await forceBatchSyncAllToSheet(allPOIs, url);
      if (res.success) {
        setSyncingAllStatus('success');
        setSyncResultMsg(`¡Éxito! Se han subido y actualizado ${res.count} POIs en tu Google Sheet.`);
        setPendingCount(0);
        onReload();
      } else {
        setSyncingAllStatus('error');
        setSyncResultMsg(res.error || 'Error al sincronizar con Google Sheets.');
      }
    } catch (e: any) {
      setSyncingAllStatus('error');
      setSyncResultMsg(e.message || 'Error durante la sincronización.');
    }
  };

  const handleFlushPending = async () => {
    setSyncingAllStatus('syncing');
    setSyncResultMsg(null);
    try {
      const res = await syncPendingQueue(url);
      setPendingCount(res.remainingCount);
      if (res.remainingCount === 0) {
        setSyncingAllStatus('success');
        setSyncResultMsg(`Se han sincronizado los ${res.syncedCount} cambios pendientes.`);
      } else {
        setSyncingAllStatus('error');
        setSyncResultMsg(`Se sincronizaron ${res.syncedCount} cambios, pero ${res.remainingCount} siguen pendientes.`);
      }
      onReload();
    } catch (e: any) {
      setSyncingAllStatus('error');
      setSyncResultMsg(e.message || 'Error al procesar la cola pendiente.');
    }
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(MODERN_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Conexión Bidireccional con Google Sheets</h3>
              <p className="text-xs text-slate-500">Sincronización multi-dispositivo y backend Apps Script</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'connection'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Enlace y Sincronización</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Código Apps Script (Requerido)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Copia de Seguridad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>GitHub Pages</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: CONNECTION */}
          {activeTab === 'connection' && (
            <div className="space-y-4">
              {/* Info banner explaining multi-device sync */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-teal-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Sincronización Multi-Dispositivo con Google Sheets
                </p>
                <p>
                  Cualquier POI creado o editado desde el móvil o el ordenador se actualiza directamente en la hoja de cálculo.
                  Si modificaste POIs en el teléfono y aún no los ves en Sheets, pulsa el botón de <strong>"Subir todos los POIs locales a Sheets"</strong> a continuación.
                </p>
              </div>

              {/* Pending changes alert if any */}
              {pendingCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Tienes <strong>{pendingCount} cambios pendientes</strong> de sincronizar en este dispositivo.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFlushPending}
                    disabled={syncingAllStatus === 'syncing'}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingAllStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>Sincronizar ahora</span>
                  </button>
                </div>
              )}

              {/* Batch Upload Section */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudUpload className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      Sincronización Total a Sheets (Batch Upload)
                    </h4>
                  </div>
                  <span className="text-[11px] bg-slate-800 text-teal-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                    {allPOIs.length} POIs disponibles
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Envía todos los POIs actuales con todas sus modificaciones a tu Google Sheet en un único lote rápido.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleForceUploadAll}
                    disabled={syncingAllStatus === 'syncing'}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingAllStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>{syncingAllStatus === 'syncing' ? 'Subiendo a Google Sheets...' : `Subir y Actualizar los ${allPOIs.length} POIs en Sheets`}</span>
                  </button>
                </div>

                {syncResultMsg && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      syncingAllStatus === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {syncingAllStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{syncResultMsg}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  URL de Implementación Web de Google Apps Script
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingStatus === 'testing'}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>{testingStatus === 'testing' ? 'Verificando...' : 'Comprobar Enlace con Sheets'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetUrl}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer URL por defecto</span>
                </button>
              </div>

              {testResultMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testingStatus === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testingStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResultMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">¡Paso Crucial para Actualizar en Sheets!</p>
                  <p className="text-amber-800 leading-relaxed">
                    Si modificaste POIs y no se guardaron en Sheets, es porque tu script de Google Sheets debe tener habilitadas las funciones de escritura (POST/GET/Batch). Pega este código y publica una <strong>"Nueva versión"</strong> en Apps Script siguiendo los pasos abajo.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Código Apps Script Actualizado y Completo
                  </h4>
                  <p className="text-xs text-slate-500">
                    Soporta lectura, creación, modificación, borrado y subida masiva por lotes (Batch Sync).
                  </p>
                </div>
                <button
                  onClick={handleCopyAppsScript}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800 leading-relaxed">
                  {MODERN_APPS_SCRIPT_CODE}
                </pre>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <p className="font-bold text-slate-900">Pasos exactos en Google Sheets (1 minuto):</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                  <li>Abre tu hoja de Google Sheets.</li>
                  <li>En el menú superior haz clic en <strong className="text-slate-800">Extensiones</strong> &rarr; <strong className="text-slate-800">Apps Script</strong>.</li>
                  <li>Borra todo el contenido del archivo y <strong>pega el código copiado</strong>.</li>
                  <li>Haz clic en el botón azul superior <strong className="text-slate-800">Implementar</strong> &rarr; <strong className="text-slate-800">Administrar implementaciones</strong> (o Nueva implementación).</li>
                  <li>Haz clic en el icono del <strong className="text-slate-800">lápiz (Editar)</strong> &rarr; en Versión selecciona <strong className="text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Nueva versión</strong> &rarr; <strong className="text-slate-800">Implementar</strong>.</li>
                  <li>Asegúrate de que el acceso esté en <strong className="text-slate-800">"Cualquiera"</strong> (anónimo).</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Exportar Copia de Seguridad</h4>
                <p className="text-xs text-slate-500">
                  Descarga un archivo JSON completo con todos los POIs, sus coordenadas y campos ampliados.
                </p>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Backup JSON ({allPOIs.length} POIs)</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Importar Copia de Seguridad</h4>
                <p className="text-xs text-slate-500">
                  Restaura una lista de puntos de interés desde un archivo JSON previo.
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-teal-600" />
                  <span>Seleccionar archivo JSON</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB PAGES */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-teal-800">
                  <Globe className="w-4 h-4 text-teal-600" />
                  ¡Todo Listo para GitHub Pages!
                </p>
                <p className="text-slate-600 leading-relaxed">
                  El proyecto ya está configurado con rutas relativas (<code>base: './'</code>) y un flujo automatizado de <strong>GitHub Actions</strong> en <code>.github/workflows/deploy.yml</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs text-slate-700">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-slate-700" />
                  Pasos para Publicar en GitHub Pages (2 minutos)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-0.5">
                  <li>
                    <strong className="text-slate-800">Sube el código a tu repositorio de GitHub</strong> (haciendo <code>git push</code> a la rama <code>main</code> o <code>master</code>).
                  </li>
                  <li>
                    En tu repositorio en GitHub, ve a la pestaña superior <strong className="text-slate-800">Settings</strong> (Configuración) &rarr; en el menú lateral izquierdo haz clic en <strong className="text-slate-800">Pages</strong>.
                  </li>
                  <li>
                    En la sección <strong className="text-slate-800">Build and deployment &gt; Source</strong>, selecciona <strong className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-mono border border-teal-200">GitHub Actions</strong>.
                  </li>
                  <li>
                    ¡Listo! GitHub Actions compilará la app automáticamente. En unos segundos verás el enlace público de tu aplicación: <span className="font-mono text-teal-700 bg-slate-100 px-1.5 py-0.5 rounded">https://tu-usuario.github.io/tu-repo/</span>.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-xs space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">.github/workflows/deploy.yml</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
        run: npm install
      - name: Build static project
        run: npm run build
      - name: Upload GitHub Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`);
                      setCopiedActionCode(true);
                      setTimeout(() => setCopiedActionCode(false), 2500);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedActionCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedActionCode ? 'Copiado' : 'Copiar YAML'}</span>
                  </button>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Este flujo de integración continua compila la aplicación en un paquete estático optimizado y lo despliega automáticamente con cada cambio.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSaveUrl}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Guardar y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
