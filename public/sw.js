/* Minimal PWA shell: precache offline page; document navigations fall back when network fails. */
const CACHE = 'icn-flight-alert-shell-v1';
const PRECACHE_URLS = ['/offline.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/offline.html');
        return (
          cached ||
          new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><p>Offline</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          )
        );
      }),
    );
  }
});
