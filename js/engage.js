// Мотивация и статистика: серия дней, задания тренера, отчёт для родителей,
// значок на иконке приложения и подписка на напоминания.

const VAPID_PUBLIC = "BNaoW5RNYAlQldEnJmUK6SD2Cv7VCRB3rGM0tSTjuSFNqAMubKH2bcNTQ48PbeLJCTV2lpuDK6AXe38NULPmVoA";

function ensureEngage() {
  const p = App.progress;
  p.streak ||= { count: 0, best: 0, last: -10, freezes: 0 };
  p.days ||= {}; // номер дня → { min, lessons, err }
  p.daily ||= { day: -1, c: {}, done: [], chest: false };
  p.bonus ||= 0;
  p.words ||= {};
}

// ---------- серия дней ----------
// Текущая серия с учётом пропусков (одна «заморозка» спасает один пропущенный день)
function streakNow() {
  const s = App.progress.streak;
  const t = today();
  if (s.last >= t - 1) return s.count;
  if (s.last === t - 2 && s.freezes > 0) return s.count;
  return 0;
}
function trainedToday() {
  return App.progress.streak.last === today();
}

// Отметить, что сегодня была тренировка. Возвращает, что изменилось в серии.
function markTrained(minutes, mistakes) {
  ensureEngage();
  const s = App.progress.streak;
  const t = today();
  const res = { grew: false, usedFreeze: false, earnedFreeze: false };
  if (s.last !== t) {
    if (s.last === t - 1) s.count++;
    else if (s.last === t - 2 && s.freezes > 0) {
      s.freezes--;
      s.count++;
      res.usedFreeze = true;
    } else s.count = 1;
    res.grew = true;
    if (s.count % 7 === 0 && s.freezes < 2) {
      s.freezes++;
      res.earnedFreeze = true;
    }
    s.last = t;
    s.best = Math.max(s.best, s.count);
  }
  const d = (App.progress.days[t] ||= { min: 0, lessons: 0, err: 0 });
  d.min = Math.round((d.min + minutes) * 10) / 10;
  d.lessons++;
  d.err += mistakes;
  res.count = s.count;
  App.save();
  syncOutside();
  return res;
}

// Неделя: последние 7 дней (для полоски на главном экране)
function weekStrip() {
  const t = today();
  const names = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const day = t - i;
    const dow = new Date(Date.now() - i * 864e5).getDay();
    out.push({ day, name: names[dow], on: !!App.progress.days[day], isToday: i === 0 });
  }
  return out;
}

// ---------- задания тренера ----------
const QUESTS = [
  { id: "lesson", text: "Пройди тренировку", ev: "lesson", n: 1, icon: "⚽" },
  { id: "goal", text: "Забей 8 голов в пенальти", ev: "goal", n: 8, icon: "🥅" },
  { id: "speak", text: "Скажи 5 слов в микрофон", ev: "speak", n: 5, icon: "🎤" },
  { id: "review", text: "Пройди повторение", ev: "review", n: 1, icon: "🔁" },
  { id: "build", text: "Собери 2 фразы", ev: "build", n: 2, icon: "🧩" },
  { id: "perfect", text: "Пройди урок на 3 звезды", ev: "perfect", n: 1, icon: "⭐" },
  { id: "trace", text: "Обведи 4 буквы", ev: "trace", n: 4, icon: "✍️" },
  { id: "story", text: "Прочитай историю", ev: "story", n: 1, icon: "📖" },
  { id: "read", text: "Прочитай 5 слов", ev: "read", n: 5, icon: "📚" },
  { id: "pairs", text: "Найди все пары", ev: "pairs", n: 1, icon: "🔗" },
  { id: "reading", text: "Пройди уровень в «Читаем»", ev: "reading", n: 1, icon: "📚" },
];

function seeded(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// 3 задания на сегодня: всегда «тренировка» + 2 случайных (одинаковых в течение дня)
function todayQuests() {
  ensureEngage();
  const t = today();
  const dl = App.progress.daily;
  if (dl.day !== t) Object.assign(dl, { day: t, c: {}, done: [], chest: false });
  const r = seeded(t * 7919);
  const pool = QUESTS.filter((q) => q.id !== "lesson")
    .filter((q) => q.id !== "review" || learnedWords().length > 0)
    .filter((q) => q.id !== "story" || availableStories().length > 0);
  const picks = pool.map((q) => ({ q, k: r() })).sort((a, b) => a.k - b.k).slice(0, 2).map((x) => x.q);
  return [QUESTS[0], ...picks].map((q) => ({ ...q, have: Math.min(q.n, dl.c[q.ev] || 0), done: dl.done.includes(q.id) }));
}

// Событие из урока: забил гол, сказал слово и т. д.
function track(ev, n = 1) {
  ensureEngage();
  const quests = todayQuests();
  const dl = App.progress.daily;
  dl.c[ev] = (dl.c[ev] || 0) + n;
  for (const q of quests) {
    if (!q.done && q.ev === ev && dl.c[ev] >= q.n) {
      dl.done.push(q.id);
      App.progress.bonus += 5;
      toast(`${q.icon} Задание выполнено! <b>+5 ⭐</b>`);
      Sfx.fanfare();
    }
  }
  App.save();
}

function questsCardHTML() {
  const qs = todayQuests();
  const all = qs.every((q) => q.done);
  const dl = App.progress.daily;
  return `
    <div class="quests">
      <div class="q-head">
        <span>📋 Задания тренера</span>
        <span class="q-week">${weekStrip().map((d) => `<i class="${d.on ? "on" : ""} ${d.isToday ? "today" : ""}" title="${d.name}">${d.on ? "🔥" : d.name}</i>`).join("")}</span>
      </div>
      ${qs
        .map(
          (q) => `<div class="q-row ${q.done ? "done" : ""}">
            <span class="q-ico">${q.done ? "✅" : q.icon}</span>
            <span class="q-text">${esc(q.text)}</span>
            <span class="q-bar"><b style="width:${Math.round((q.have / q.n) * 100)}%"></b></span>
            <span class="q-num">${q.have}/${q.n}</span>
          </div>`
        )
        .join("")}
      ${all && !dl.chest ? `<button class="chest-btn" id="chest">🎁 Открыть сундук!</button>` : ""}
      ${all && dl.chest ? `<div class="q-all">🏆 Все задания выполнены! Приходи завтра</div>` : ""}
    </div>`;
}

async function openChest() {
  const dl = App.progress.daily;
  if (dl.chest) return;
  dl.chest = true;
  App.progress.bonus += 15;
  App.save();
  const box = document.createElement("div");
  box.className = "chest-overlay";
  box.innerHTML = `<div class="chest-box"><div class="chest-ico">🎁</div><div class="chest-txt">+15 ⭐</div><div class="chest-sub">Отличная работа, ${esc(PLAYER.fullName)}!</div></div>`;
  document.body.appendChild(box);
  Sfx.fanfare();
  Sfx.cheer();
  confetti(120);
  setTimeout(() => box.querySelector(".chest-ico").textContent = "💰", 600);
  Voice.ru("Сундук открыт! Ты получил пятнадцать звёзд!");
  box.onclick = () => {
    box.remove();
    showHome();
  };
  setTimeout(() => box.isConnected && box.onclick(), 3500);
}

function toast(html) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = html;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("out"), 2200);
  setTimeout(() => t.remove(), 2700);
}

// ---------- значок на иконке и данные для напоминаний ----------
function updateBadge() {
  try {
    if (!("setAppBadge" in navigator)) return;
    if (trainedToday()) navigator.clearAppBadge();
    else navigator.setAppBadge(1);
  } catch (e) {}
}

// Записать состояние в IndexedDB, чтобы его видел service worker при напоминании
function saveStateForSW() {
  try {
    const req = indexedDB.open("fe-state", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put({ last: App.progress.streak.last, streak: streakNow(), name: PLAYER.fullName }, "state");
      tx.oncomplete = () => db.close();
    };
  } catch (e) {}
}

function syncOutside() {
  updateBadge();
  saveStateForSW();
}

// ---------- напоминания (Web Push) ----------
function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}
function urlB64ToUint8(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
async function enableReminders() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (!isStandalone()) throw new Error("Сначала добавьте приложение на экран «Домой» и откройте его с иконки.");
    throw new Error("Этот браузер не поддерживает уведомления. Нужен iOS 16.4 или новее.");
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Уведомления не разрешены. Включите их: Настройки → Уведомления → Football English.");
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC) });
  updateBadge();
  saveStateForSW();
  return JSON.stringify(sub.toJSON());
}
async function currentSubscription() {
  try {
    if (!("serviceWorker" in navigator)) return null;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && (await reg.pushManager.getSubscription());
    return sub ? JSON.stringify(sub.toJSON()) : null;
  } catch (e) {
    return null;
  }
}

// ---------- отчёт для родителей ----------
function reportHTML() {
  ensureEngage();
  const p = App.progress;
  const t = today();
  const s = p.streak;
  let week = 0, weekDays = 0, month = 0;
  for (let i = 0; i < 30; i++) {
    const d = p.days[t - i];
    if (!d) continue;
    month += d.min;
    if (i < 7) {
      week += d.min;
      weekDays++;
    }
  }
  const learned = learnedWords();
  const strong = learned.filter((w) => (p.words[w.en]?.box || 0) >= 3).length;
  const hard = Object.entries(p.words)
    .filter(([, v]) => (v.err || 0) > 0)
    .sort((a, b) => b[1].err - a[1].err)
    .slice(0, 8);
  const sayHard = Object.entries(p.words)
    .filter(([, v]) => (v.sayErr || 0) > 0)
    .sort((a, b) => b[1].sayErr - a[1].sayErr)
    .slice(0, 6);
  const wordRu = (en) => Object.values(W).find((w) => w.en === en)?.ru || "";
  const cal = [];
  for (let i = 27; i >= 0; i--) {
    const d = p.days[t - i];
    const lvl = !d ? 0 : d.min >= 10 ? 3 : d.min >= 5 ? 2 : 1;
    cal.push(`<i class="l${lvl}" title="${d ? d.min + " мин" : "—"}"></i>`);
  }
  const doneCount = Object.keys(p.done).length;
  return `
    <div class="report">
      <h3>📊 Отчёт</h3>
      <div class="r-grid">
        <div><b>🔥 ${streakNow()}</b><small>серия дней</small></div>
        <div><b>🏅 ${s.best}</b><small>рекорд серии</small></div>
        <div><b>🧊 ${s.freezes}</b><small>заморозки</small></div>
        <div><b>${Math.round(week)} мин</b><small>за 7 дней (${weekDays} дн.)</small></div>
        <div><b>${Math.round(month)} мин</b><small>за 30 дней</small></div>
        <div><b>${doneCount}/${LESSONS.length}</b><small>уроков пройдено</small></div>
        <div><b>${learned.length}</b><small>слов изучено</small></div>
        <div><b>${strong}</b><small>слов знает уверенно</small></div>
        <div><b>${p.reviews || 0}</b><small>повторений</small></div>
      </div>
      <div class="r-sub">Последние 4 недели</div>
      <div class="r-cal">${cal.join("")}</div>
      <div class="r-legend"><i class="l0"></i> нет <i class="l1"></i> до 5 мин <i class="l2"></i> 5–10 <i class="l3"></i> 10+</div>
      <div class="r-sub">Трудные слова (больше всего ошибок)</div>
      ${hard.length ? `<div class="r-words">${hard.map(([en, v]) => `<button class="r-word" data-en="${esc(en)}">🔊 <b>${esc(en)}</b> ${esc(wordRu(en))} <span>${v.err}✗</span></button>`).join("")}</div>` : `<p class="muted">Пока ошибок нет 👍</p>`}
      <div class="r-sub">Произношение — над чем поработать</div>
      ${sayHard.length ? `<div class="r-words">${sayHard.map(([en, v]) => `<button class="r-word" data-en="${esc(en)}">🔊 <b>${esc(en)}</b> ${esc(wordRu(en))} <span>${v.sayErr}✗</span></button>`).join("")}</div>` : `<p class="muted">Пока всё хорошо 👍</p>`}
    </div>`;
}
