/* ===================== GOALBOUND — PWA: service worker registration ===================== */
'use strict';
// Register the offline service worker (only over http/https; opening the file directly from disk skips it)
(function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker kaydedilemedi:', e));
  });
})();
