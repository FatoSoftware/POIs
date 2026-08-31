import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check } from 'lucide-react';
import { BeforeInstallPromptEvent } from '../utils/pwa';

export const PWAInstallBanner: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Check if user dismissed prompt recently
    const dismissed = localStorage.getItem('pois_pwa_banner_dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 1000 * 60 * 60 * 24 * 3) {
      // Dismissed within last 3 days
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Delay showing on iOS so it doesn't obstruct initial load
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt on Chrome/Android/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => setShowBanner(false), 2000);
      }
      setInstallPrompt(null);
    } catch (err) {
      console.error('Error during PWA installation:', err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pois_pwa_banner_dismissed', Date.now().toString());
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/40 backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {installedSuccess ? '¡Aplicación Instalada!' : 'Instalar App en tu Móvil'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                {installedSuccess
                  ? 'Ya puedes acceder directamente desde tu pantalla de inicio.'
                  : isIOS
                  ? 'Añádela a tu inicio para abrirla como app nativa a pantalla completa.'
                  : 'Acceso rápido, navegación offline y mapas a pantalla completa.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-slate-800/80 rounded-xl p-2.5 text-[11px] text-slate-200 space-y-1 border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.5 rounded text-[10px]">1</span>
              <span>Pulsa el botón Compartir</span>
              <Share className="w-3.5 h-3.5 text-teal-400 inline" />
              <span>en la barra de Safari.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.5 rounded text-[10px]">2</span>
              <span>Selecciona</span>
              <PlusSquare className="w-3.5 h-3.5 text-teal-400 inline" />
              <strong className="text-white">"Añadir a pantalla de inicio"</strong>.
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              disabled={installedSuccess}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
            >
              {installedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Instalada</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Instalar Aplicación</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Ahora no
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
