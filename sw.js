// Офлайн-кэш: сначала сеть (чтобы обновления приходили сразу), при отсутствии сети — кэш.
const CACHE = "football-english-v7";
const FILES = ["./", "index.html", "css/style.css", "js/data.js", "js/speech.js", "js/player.js", "js/lesson.js", "js/app.js", "manifest.json", "icons/icon-180.png", "icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
