// Главная логика приложения: экраны, уроки, награды, прогресс.

const STORE_KEY = "football-english-v1";

const App = {
  progress: { done: {}, skills: [], cups: [], words: {} },
  settings: { ruVoice: true, sound: true, unlockAll: false },
  stage: null,

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        Object.assign(this.progress, d.progress || {});
        Object.assign(this.settings, d.settings || {});
        // убираем уроки и кубки, которых больше нет в программе (навыки сохраняются)
        const ids = new Set(LESSONS.map((l) => l.id));
        Object.keys(this.progress.done).forEach((k) => ids.has(k) || delete this.progress.done[k]);
        this.progress.cups = this.progress.cups.filter((c) => UNITS.some((u) => u.id === c));
        this.progress.words ||= {};
      }
    } catch (e) {}
  },
  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ progress: this.progress, settings: this.settings }));
    } catch (e) {}
  },

  get careerLevel() {
    return Math.min(this.progress.cups.length, CAREER.length - 1);
  },
  get totalStars() {
    return Object.values(this.progress.done).reduce((a, b) => a + b, 0);
  },
  lessonUnlocked(i) {
    if (this.settings.unlockAll || i === 0) return true;
    return LESSONS[i - 1].id in this.progress.done;
  },
  nextLessonIndex() {
    const i = LESSONS.findIndex((l) => !(l.id in this.progress.done));
    return i === -1 ? Math.floor(Math.random() * LESSONS.length) : i;
  },
  latestSkill() {
    const id = this.progress.skills[this.progress.skills.length - 1];
    return SKILLS.find((s) => s.id === id) || null;
  },
};

// ---------- утилиты ----------
const $ = (s, root = document) => root.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function itemSVG(kind, color) {
  if (kind === "hat")
    return `<svg viewBox="0 0 100 70"><ellipse cx="50" cy="55" rx="46" ry="11" fill="${color}" stroke="#222" stroke-width="3"/><path d="M26 54 Q26 12 50 12 Q74 12 74 54 Z" fill="${color}" stroke="#222" stroke-width="3"/><path d="M27 44 Q50 50 73 44 L73 50 Q50 56 27 50 Z" fill="#222" opacity=".55"/></svg>`;
  if (kind === "table")
    return `<svg viewBox="0 0 100 70"><line x1="28" y1="30" x2="22" y2="66" stroke="#6d4c41" stroke-width="5"/><line x1="72" y1="30" x2="78" y2="66" stroke="#6d4c41" stroke-width="5"/><line x1="50" y1="32" x2="50" y2="62" stroke="#6d4c41" stroke-width="5"/><ellipse cx="50" cy="26" rx="44" ry="12" fill="${color}" stroke="#222" stroke-width="3"/></svg>`;
  if (kind === "mat")
    return `<svg viewBox="0 0 100 70"><rect x="14" y="12" width="72" height="46" rx="3" fill="${color}" stroke="#222" stroke-width="3"/><rect x="24" y="20" width="52" height="30" fill="none" stroke="#ffd54f" stroke-width="3"/><path d="M50 24 L60 35 L50 46 L40 35 Z" fill="#1e66f5"/>${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${20 + i * 12}" y1="58" x2="${20 + i * 12}" y2="66" stroke="#e0a030" stroke-width="3"/><line x1="${20 + i * 12}" y1="4" x2="${20 + i * 12}" y2="12" stroke="#e0a030" stroke-width="3"/>`).join("")}</svg>`;
  return `<svg viewBox="0 0 100 70"><path d="M18 50 Q18 14 52 14 Q84 14 84 50 Z" fill="${color}" stroke="#222" stroke-width="3"/><path d="M80 48 Q98 48 98 56 Q80 60 60 54 Z" fill="${color}" stroke="#222" stroke-width="3"/><line x1="52" y1="14" x2="52" y2="50" stroke="#222" stroke-width="2" opacity=".5"/><circle cx="52" cy="13" r="4" fill="#222"/></svg>`;
}

function picHTML(word, cls = "") {
  const pic = word.pic;
  if (typeof pic === "object" && pic.svg) return `<span class="pic svg-pic ${cls}">${itemSVG(pic.svg, pic.color)}</span>`;
  if (typeof pic === "object" && pic.color) {
    return `<span class="pic color-pic ${cls}" style="background:${pic.color}"></span>`;
  }
  const duo = [...new Intl.Segmenter().segment(word.pic)].length > 1 ? "duo" : "";
  return `<span class="pic ${duo} ${cls}">${word.pic}</span>`;
}

function render(html) {
  if (App.stage) App.stage.stop();
  App.stage = null;
  Recognizer.stop();
  const root = $("#app");
  root.innerHTML = html;
  root.scrollTop = 0;
  window.scrollTo(0, 0);
  return root;
}

function confetti(n = 60) {
  const box = document.createElement("div");
  box.className = "confetti";
  const colors = ["#1f9d55", "#ffd400", "#ffffff", "#111", "#3ddc84", "#ff5a5a"];
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.5 + "s";
    p.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3500);
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

// =================== ГЛАВНЫЙ ЭКРАН ===================
function showHome() {
  const lvl = App.careerLevel;
  const next = LESSONS[App.nextLessonIndex()];
  const unit = UNITS[next.unit];
  const allDone = Object.keys(App.progress.done).length >= LESSONS.length;
  const root = render(`
    <div class="screen home">
      <header class="topbar">
        <div class="badge-name">
          <div class="shirt-num">${PLAYER.number}</div>
          <div>
            <div class="pname">${PLAYER.name}</div>
            <div class="pcareer">${esc(CAREER[lvl])}</div>
          </div>
        </div>
        <button class="icon-btn" id="btn-settings" aria-label="Настройки для родителей">⚙️</button>
      </header>

      <div class="stage-wrap pitch">
        <div id="stage" class="stage"></div>
        <div class="skill-caption">${App.latestSkill() ? esc(App.latestSkill().name) : "Пройди тренировку — и я научусь новому трюку!"}</div>
      </div>

      <div class="stats">
        <div class="stat"><span>🏅</span><b>${App.progress.skills.length}</b><small>навыков</small></div>
        <div class="stat"><span>🏆</span><b>${App.progress.cups.length}</b><small>кубков</small></div>
        <div class="stat"><span>⭐</span><b>${App.totalStars}</b><small>звёзд</small></div>
      </div>

      <button class="big-btn play" id="btn-play">
        <span class="bb-icon">▶</span>
        <span class="bb-text">
          <b>${allDone ? "Повторить" : next.kind === "match" ? "Матч за кубок!" : "Тренировка"}</b>
          <small>${unit.book ? "Урок " + unit.book + " · " : ""}${esc(unit.title)} · ${esc(next.title)}</small>
        </span>
      </button>

      ${(() => {
        const learned = learnedWords().length;
        const due = dueWords().length;
        return learned
          ? `<button class="review-btn ${due ? "has-due" : ""}" id="btn-review">🔁 <b>Повторение</b> <span>${due ? `${due} ${plural(due, "слово", "слова", "слов")}` : "всё повторено ✓"}</span></button>`
          : "";
      })()}
      <div class="row2">
        <button class="mid-btn" id="btn-map">🗺️<span>Карьера</span></button>
        <button class="mid-btn" id="btn-awards">🏅<span>Награды</span></button>
      </div>
    </div>
  `);
  App.stage = new PlayerStage($("#stage", root));
  App.stage.onCount = () => Sfx.tick();
  App.stage.play(App.latestSkill());
  $("#stage", root).onclick = () => {
    Sfx.unlock();
    Voice.say("Let's play football!", { rate: 0.85 });
  };
  $("#btn-play", root).onclick = () => startLesson(App.nextLessonIndex());
  $("#btn-map", root).onclick = showMap;
  if ($("#btn-review", root)) $("#btn-review", root).onclick = startReview;
  $("#btn-awards", root).onclick = showAwards;
  $("#btn-settings", root).onclick = parentGate;
}

// =================== КАРТА КАРЬЕРЫ ===================
function showMap() {
  const root = render(`
    <div class="screen map">
      <header class="topbar"><button class="icon-btn" id="back">←</button><h2>Карьера</h2><span></span></header>
      <div class="career-ladder">
        ${CAREER.map((c, i) => `<div class="rung ${i <= App.careerLevel ? "on" : ""} ${i === App.careerLevel ? "now" : ""}">${i <= App.careerLevel ? "✅" : "⬜"} ${esc(c)}</div>`)
          .reverse()
          .join("")}
      </div>
      ${UNITS.map((u, ui) => {
        const ls = LESSONS.map((l, i) => ({ l, i })).filter((x) => x.l.unit === ui);
        return `
        <section class="unit">
          <h3>${u.book ? `<span class="book-n">${u.book}</span>` : ""}${u.icon} ${esc(u.title)} <small>${esc(u.ru)}</small> ${App.progress.cups.includes(u.id) ? "🏆" : ""}</h3>
          <div class="lessons">
            ${ls
              .map(({ l, i }) => {
                const open = App.lessonUnlocked(i);
                const stars = App.progress.done[l.id];
                return `<button class="lesson-tile ${l.kind} ${open ? "" : "locked"} ${stars ? "done" : ""}" data-i="${i}" ${open ? "" : "disabled"}>
                  <span class="lt-icon">${open ? (l.kind === "match" ? "🏆" : "⚽") : "🔒"}</span>
                  <span class="lt-title">${esc(l.title)}</span>
                  <span class="lt-stars">${stars ? "⭐".repeat(stars) : "&nbsp;"}</span>
                </button>`;
              })
              .join("")}
          </div>
        </section>`;
      }).join("")}
    </div>`);
  $("#back", root).onclick = showHome;
  root.querySelectorAll(".lesson-tile:not(.locked)").forEach((b) => (b.onclick = () => startLesson(+b.dataset.i)));
}

// =================== НАГРАДЫ ===================
function showAwards() {
  const root = render(`
    <div class="screen awards">
      <header class="topbar"><button class="icon-btn" id="back">←</button><h2>Награды</h2><span></span></header>
      <div class="stage-wrap pitch small"><div id="stage" class="stage"></div><div class="skill-caption" id="cap">Нажми на навык, чтобы посмотреть</div></div>
      <h3 class="sec">🏆 Кубки</h3>
      <div class="cups">
        ${UNITS.map((u) => `<div class="cup ${App.progress.cups.includes(u.id) ? "on" : ""}"><span>${App.progress.cups.includes(u.id) ? "🏆" : "🔒"}</span><small>${esc(u.title)}</small></div>`).join("")}
      </div>
      <h3 class="sec">🏅 Навыки</h3>
      <div class="skills">
        ${SKILLS.map((s) => {
          const on = App.progress.skills.includes(s.id);
          return `<button class="skill ${on ? "on" : ""}" data-id="${s.id}" ${on ? "" : "disabled"}><span>${on ? s.icon : "🔒"}</span><small>${esc(s.name)}</small></button>`;
        }).join("")}
      </div>
    </div>`);
  $("#back", root).onclick = showHome;
  App.stage = new PlayerStage($("#stage", root));
  App.stage.onCount = () => Sfx.tick();
  App.stage.play(App.latestSkill());
  root.querySelectorAll(".skill.on").forEach(
    (b) =>
      (b.onclick = () => {
        Sfx.unlock();
        const s = SKILLS.find((x) => x.id === b.dataset.id);
        $("#cap", root).textContent = s.name;
        App.stage.play(s);
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
  );
}

// =================== КОНЕЦ УРОКА ===================
async function finishLesson() {
  const { lesson } = L;
  const stars = L.mistakes === 0 ? 3 : L.mistakes <= 2 ? 2 : 1;
  const firstTime = !(lesson.id in App.progress.done);
  App.progress.done[lesson.id] = Math.max(stars, App.progress.done[lesson.id] || 0);

  let newSkill = null;
  let newCup = null;
  if (firstTime && lesson.kind !== "match") {
    newSkill = SKILLS.find((s) => !App.progress.skills.includes(s.id)) || null;
    if (newSkill) App.progress.skills.push(newSkill.id);
  }
  const levelBefore = App.careerLevel;
  if (lesson.cup && !App.progress.cups.includes(lesson.cup)) {
    App.progress.cups.push(lesson.cup);
    newCup = UNITS.find((u) => u.id === lesson.cup);
  }
  App.save();
  const promoted = App.careerLevel > levelBefore;

  const showSkill = newSkill || (!newCup ? App.latestSkill() : null);
  const root = render(`
    <div class="screen finish">
      <h2 class="fin-title">${newCup ? "ПОБЕДА! 🏆" : "Тренировка окончена!"}</h2>
      <div class="fin-stars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? "on" : ""}" style="animation-delay:${i * 0.25}s">⭐</span>`).join("")}</div>
      ${newCup ? `<div class="trophy">🏆</div><div class="fin-sub">Кубок «${esc(newCup.title)}» твой!</div>` : ""}
      ${promoted ? `<div class="promo">Тебя перевели: <b>${esc(CAREER[App.careerLevel])}</b></div>` : ""}
      ${
        showSkill
          ? `<div class="stage-wrap pitch small"><div id="stage" class="stage"></div></div>
             <div class="fin-sub">${newSkill ? "Новый навык: " : ""}<b>${esc(showSkill.name)}</b></div>`
          : ""
      }
      ${!firstTime ? `<div class="fin-note">Повторение — мать учения! 💪</div>` : ""}
      <div class="row2">
        <button class="mid-btn" id="home">🏠<span>Домой</span></button>
        <button class="mid-btn accent" id="more">▶<span>Ещё урок</span></button>
      </div>
    </div>`);
  if (showSkill) {
    App.stage = new PlayerStage($("#stage", root));
    App.stage.onCount = () => Sfx.tick();
    App.stage.play(showSkill);
  }
  $("#home", root).onclick = showHome;
  $("#more", root).onclick = () => startLesson(App.nextLessonIndex());
  Sfx.whistle();
  await sleep(300);
  Sfx.fanfare();
  confetti(newCup ? 120 : 70);
  if (newCup) await Voice.ru("Победа! Ты выиграл кубок!");
  else if (newSkill) await Voice.ru("Молодец! Ты научился новому трюку: " + newSkill.name);
  else await Voice.ru("Молодец!");
  if (promoted) await Voice.ru("Тебя перевели в " + CAREER[App.careerLevel]);
}

// =================== ДЛЯ РОДИТЕЛЕЙ ===================
function parentGate() {
  const a = 3 + Math.floor(Math.random() * 6);
  const b = 4 + Math.floor(Math.random() * 5);
  const ans = prompt(`Для родителей: сколько будет ${a} × ${b}?`);
  if (ans === null) return;
  if (parseInt(ans, 10) === a * b) showSettings();
  else alert("Неверно 🙂");
}

function showSettings() {
  const s = App.settings;
  const root = render(`
    <div class="screen settings">
      <header class="topbar"><button class="icon-btn" id="back">←</button><h2>Для родителей</h2><span></span></header>
      <label class="set"><input type="checkbox" id="ruVoice" ${s.ruVoice ? "checked" : ""}> Подсказки голосом на русском</label>
      <label class="set"><input type="checkbox" id="sound" ${s.sound ? "checked" : ""}> Звуки (свисток, трибуны)</label>
      <label class="set"><input type="checkbox" id="unlockAll" ${s.unlockAll ? "checked" : ""}> Открыть все уроки</label>
      <div class="info">
        <p><b>Распознавание речи:</b> ${Recognizer.supported ? "✅ поддерживается этим браузером" : "❌ не поддерживается — будет кнопка «Сказал!»"}</p>
        <p><b>Пройдено уроков:</b> ${Object.keys(App.progress.done).length} из ${LESSONS.length}</p>
        <p><b>Слова в программе:</b> ${UNITS.map((u) => u.title).join(", ")}</p>
        <p class="muted">Прогресс хранится на этом устройстве. Чтобы перенести его на другое устройство или сохранить копию — используйте код ниже.</p>
      </div>
      <div class="info">
        <p><b>Код прогресса</b></p>
        <textarea id="code" class="code" readonly>${esc(exportCode())}</textarea>
        <div class="row2">
          <button class="mid-btn" id="copy">📋<span>Скопировать код</span></button>
          <button class="mid-btn" id="import">📥<span>Вставить код</span></button>
        </div>
        <p></p>
      </div>
      <button class="mid-btn danger" id="reset">🗑<span>Сбросить прогресс</span></button>
    </div>`);
  ["ruVoice", "sound", "unlockAll"].forEach((k) => {
    $("#" + k, root).onchange = (e) => {
      App.settings[k] = e.target.checked;
      App.save();
    };
  });
  $("#back", root).onclick = showHome;
  $("#copy", root).onclick = async () => {
    const ta = $("#code", root);
    try {
      await navigator.clipboard.writeText(ta.value);
    } catch (e) {
      ta.select();
      document.execCommand("copy");
    }
    alert("Код скопирован. Сохраните его в Заметках или отправьте себе в мессенджер.");
  };
  $("#import", root).onclick = () => {
    const code = prompt("Вставьте код прогресса:");
    if (!code) return;
    if (importCode(code)) {
      alert("Прогресс загружен! ✅");
      showHome();
    } else alert("Код не подошёл. Проверьте, что он скопирован целиком.");
  };
  $("#reset", root).onclick = () => {
    if (confirm("Точно сбросить весь прогресс Романа?")) {
      App.progress = { done: {}, skills: [], cups: [], words: {} };
      App.save();
      showHome();
    }
  };
}

// Код прогресса: прогресс в виде короткой строки, чтобы перенести его на другое устройство.
function exportCode() {
  const p = App.progress;
  const data = { v: 1, d: p.done, s: p.skills, c: p.cups, w: p.words };
  return "FE1-" + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function importCode(code) {
  try {
    const raw = code.trim().replace(/^FE1-/, "");
    const d = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (!d || typeof d.d !== "object" || !Array.isArray(d.s) || !Array.isArray(d.c)) return false;
    App.progress = { done: d.d, skills: d.s, cups: d.c, words: d.w || {} };
    App.save();
    return true;
  } catch (e) {
    return false;
  }
}

// =================== СТАРТ ===================
function boot() {
  App.load();
  Voice.init();
  // просим браузер не удалять сохранённые данные
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  document.addEventListener("touchstart", () => Sfx.unlock(), { once: true, passive: true });
  document.addEventListener("click", () => Sfx.unlock(), { once: true });
  showHome();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
document.addEventListener("DOMContentLoaded", boot);
