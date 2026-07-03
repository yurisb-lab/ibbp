// service-worker.js — Network First para HTML, Cache First para assets estáticos

const CACHE_NAME = "ibbp-v3";
const STATIC_ASSETS = ["/logo.png", "/icons/icon-192.png", "/icons/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Ativa imediatamente sem esperar
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // Assume controle imediato de todas as abas
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Firebase e APIs externas — nunca cachear
  if (
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit") ||
    url.hostname.includes("bible-api.com") ||
    url.hostname.includes("anthropic.com")
  ) {
    return; // Deixa o browser buscar direto
  }

  // HTML (index.html) — Network First: sempre tenta buscar versão nova
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // JS e CSS — Network First também (garante código sempre atualizado)
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Imagens e fontes — Cache First (mudam raramente)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2|woff|ttf)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Demais recursos — Network First
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Força atualização quando há novo service worker
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});
