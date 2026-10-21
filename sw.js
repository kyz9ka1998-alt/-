// Офлайн-кэш и напоминания.
// Кэш: сначала сеть (чтобы обновления приходили сразу), без сети — из кэша.
const CACHE = "football-english-v11";
const FILES = ["./", "index.html", "css/style.css", "js/data.js", "js/speech.js", "js/player.js", "js/lesson.js", "js/engage.js", "js/app.js", "manifest.json", "icons/icon-180.png", "icons/icon-192.png"];

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
  // аудио запрашивается кусками (Range) — такие ответы не кэшируем, отдаём как есть
  if (e.request.headers.get("range")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ---------- напоминания ----------
// Состояние (серия, когда была тренировка) приложение кладёт в IndexedDB.
function readState() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open("fe-state", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        const db = req.result;
        const get = db.transaction("kv").objectStore("kv").get("state");
        get.onsuccess = () => resolve(get.result || null);
        get.onerror = () => resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}
const todayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);

self.addEventListener("push", (e) => {
  e.waitUntil(
    readState().then((st) => {
      const name = (st && st.name) || "Роман";
      const t = todayNum();
      const streak = st ? (st.last >= t - 1 ? st.streak : 0) : 0;
      let title, body;
      if (st && st.last === t) {
        title = `🔥 Серия: ${streak}!`;
        body = `${name}, сегодняшняя тренировка пройдена. Молодец! До завтра ⚽`;
      } else if (streak > 0) {
        title = `⚽ ${name}, тренер ждёт!`;
        body = `Серия ${streak} 🔥 — не прерывай! Всего 5 минут английского.`;
      } else {
        title = `⚽ ${name}, пора на тренировку!`;
        body = "5 минут английского — и новый трюк для твоего футболиста!";
      }
      return self.registration.showNotification(title, { body, icon: "icons/icon-192.png", badge: "icons/icon-192.png", tag: "daily" });
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("./");
    })
  );
});
