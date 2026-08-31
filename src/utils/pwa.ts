// PWA Registration and Installation utilities

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Calculate SW path relative to current base URL (GitHub Pages subpaths compatible)
      const currentUrl = window.location.href.split('?')[0].split('#')[0];
      const basePath = currentUrl.endsWith('/') ? currentUrl : currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
      const swUrl = `${basePath}sw.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration error:', error);
        });
    });
  }
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
