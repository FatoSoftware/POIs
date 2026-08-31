import React, { useState } from 'react';
import { POI } from '../types';
import {
  DEFAULT_SCRIPT_URL,
  MODERN_APPS_SCRIPT_CODE,
} from '../constants';
import {
  getStoredScriptUrl,
  setStoredScriptUrl,
  fetchPOIsFromSheet,
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
  ExternalLink,
  Database,
  Layers,
  Globe,
  GitBranch,
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
  const [activeTab, setActiveTab] = useState<'connection' | 'code' | 'backup' | 'github'>('connection');

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
      const res = await fetchPOIsFromSheet(url);
      if (res.source === 'live') {
        setTestingStatus('success');
        setTestResultMsg(`¡Conexión exitosa! Se han recuperado ${res.pois.length} POIs desde Google Sheets.`);
      } else {
        setTestingStatus('error');
        setTestResultMsg(res.error || 'No se pudo conectar en directo. Verifica los permisos de la aplicación web.');
      }
    } catch (e: any) {
      setTestingStatus('error');
      setTestResultMsg(e.message || 'Error de conexión.');
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
      } catch (err) {
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
              <h3 className="font-bold text-base text-slate-800">Conexión con Google Sheets</h3>
              <p className="text-xs text-slate-500">Configuración del backend y sincronización de datos</p>
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
        <div className="flex border-b border-slate-200 bg-white px-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'connection'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>URL de Apps Script</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Código Apps Script Moderno</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-teal-500 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Copia de Seguridad & Exportar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
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
              <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-teal-900 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-600" />
                  Base de Datos en Google Sheets
                </p>
                <p>
                  Tu aplicación se conecta directamente a la aplicación web de Apps Script vinculada a tu hoja de cálculo.
                  Los datos actuales se conservan al 100% y se pueden enriquecer con los nuevos campos.
                </p>
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
                  <span>{testingStatus === 'testing' ? 'Probando...' : 'Probar Conexión Live'}</span>
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
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Código Apps Script Actualizado
                  </h4>
                  <p className="text-xs text-slate-500">
                    Compatible con columnas A-G existentes y ampliable a las nuevas columnas de forma automática.
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

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-bold text-slate-800">Pasos para actualizar en Google Sheets:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Abre tu hoja de cálculo de Google Sheets.</li>
                  <li>Ve al menú superior: <strong className="text-slate-800">Extensiones</strong> &rarr; <strong className="text-slate-800">Apps Script</strong>.</li>
                  <li>Reemplaza el código con el copiado arriba.</li>
                  <li>Haz clic en <strong className="text-slate-800">Implementar</strong> &rarr; <strong className="text-slate-800">Nueva implementación</strong>.</li>
                  <li>Selecciona tipo <strong className="text-slate-800">Aplicación web</strong>, Ejecutar como <strong className="text-slate-800">"Yo"</strong> y Acceso <strong className="text-slate-800">"Cualquiera"</strong>.</li>
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
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
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
