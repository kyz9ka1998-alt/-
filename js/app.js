// Главная логика приложения: экраны, уроки, награды, прогресс.

const STORE_KEY = "football-english-v1";

const App = {
  progress: { done: {}, skills: [], cups: [] },
  settings: { ruVoice: true, sound: true, unlockAll: false },
  stage: null,

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        Object.assign(this.progress, d.progress || {});
        Object.assign(this.settings, d.settings || {});
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

function picHTML(word, cls = "") {
  if (typeof word.pic === "object" && word.pic.color) {
    return `<span class="pic color-pic ${cls}" style="background:${word.pic.color}"></span>`;
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
          <small>${unit.icon} ${esc(unit.title)} · ${esc(next.title)}</small>
        </span>
      </button>

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
          <h3>${u.icon} ${esc(u.title)} <small>${esc(u.ru)}</small> ${App.progress.cups.includes(u.id) ? "🏆" : ""}</h3>
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

// =================== УРОК ===================
let L = null; // состояние текущего урока

function buildSteps(lesson) {
  const words = lesson.words;
  const steps = [];
  if (lesson.kind === "train") {
    words.forEach((w) => steps.push({ type: "intro", word: w }));
    let pen = shuffle([...words, ...words]);
    // без одинаковых слов подряд
    for (let i = 1; i < pen.length; i++) if (pen[i] === pen[i - 1]) [pen[i], pen[(i + 1) % pen.length]] = [pen[(i + 1) % pen.length], pen[i]];
    pen.forEach((w) => steps.push({ type: "penalty", word: w, pool: words }));
    shuffle(words).forEach((w) => steps.push({ type: "say", word: w }));
  } else {
    shuffle(words).forEach((w) => steps.push({ type: "penalty", word: w, pool: words }));
    shuffle(words).slice(0, 4).forEach((w) => steps.push({ type: "say", word: w }));
  }
  return steps;
}

function startLesson(index) {
  Sfx.unlock();
  const lesson = LESSONS[index];
  L = { index, lesson, steps: buildSteps(lesson), pos: 0, mistakes: 0, saidTypes: new Set() };
  Sfx.whistle();
  runStep();
}

function lessonShell(inner) {
  const pct = Math.round((L.pos / L.steps.length) * 100);
  return render(`
    <div class="screen lesson">
      <header class="lesson-top">
        <button class="icon-btn" id="quit" aria-label="Выйти">✕</button>
        <div class="field-progress"><div class="fp-fill" style="width:${pct}%"></div><span class="fp-ball" style="left:${pct}%">⚽</span><span class="fp-goal">🥅</span></div>
      </header>
      ${inner}
    </div>`);
}

function wireQuit(root) {
  $("#quit", root).onclick = () => {
    if (confirm("Закончить тренировку? Прогресс этого урока не сохранится.")) {
      Voice.stop();
      showHome();
    }
  };
}

function nextStep() {
  L.pos++;
  if (L.pos >= L.steps.length) finishLesson();
  else runStep();
}

function hintOnce(type, text) {
  if (L.saidTypes.has(type)) return Promise.resolve();
  L.saidTypes.add(type);
  return Voice.ru(text);
}

function runStep() {
  const step = L.steps[L.pos];
  if (step.type === "intro") stepIntro(step);
  else if (step.type === "penalty") stepPenalty(step);
  else stepSay(step);
}

// ---------- 1. Новое слово ----------
async function stepIntro({ word }) {
  const root = lessonShell(`
    <div class="card intro">
      <div class="tag">Новое слово</div>
      <button class="pic-big" id="hear">${picHTML(word, "xl")}</button>
      <div class="word">${esc(word.en)}</div>
      <div class="ru">${esc(word.ru)}</div>
      <div class="actions">
        <button class="round-btn" id="hear2" aria-label="Послушать">🔊</button>
        <button class="round-btn slow" id="slow" aria-label="Медленно">🐢</button>
      </div>
    </div>
    <button class="big-btn next" id="next">Дальше ➜</button>`);
  wireQuit(root);
  const speak = () => Voice.en(word.en);
  $("#hear", root).onclick = speak;
  $("#hear2", root).onclick = speak;
  $("#slow", root).onclick = () => Voice.en(word.en, true);
  $("#next", root).onclick = () => {
    Voice.stop();
    nextStep();
  };
  await hintOnce("intro", "Послушай новое слово");
  await Voice.en(word.en);
  await sleep(300);
  await Voice.ru(word.ru);
  await sleep(300);
  await Voice.en(word.en, true);
}

// ---------- 2. Пенальти: услышь слово и забей в нужный угол ----------
async function stepPenalty({ word, pool }) {
  const others = shuffle(pool.filter((w) => w !== word)).slice(0, 2);
  const opts = shuffle([word, ...others]);
  const root = lessonShell(`
    <div class="card penalty">
      <div class="tag">Пенальти! Забей в <b>нужный</b> угол</div>
      <button class="hear-btn" id="hear">🔊 <span>Послушай</span></button>
      <div class="goal-frame">
        <div class="targets">
          ${opts.map((w, i) => `<button class="target" data-i="${i}">${picHTML(w)}</button>`).join("")}
        </div>
        <div class="keeper" id="keeper">🧤</div>
      </div>
      <div class="spot"><span class="pball" id="pball">⚽</span></div>
      <div class="feedback" id="fb"></div>
    </div>`);
  wireQuit(root);
  let tries = 0;
  let locked = false;
  const say = () => Voice.en(word.en);
  $("#hear", root).onclick = say;

  const keeper = $("#keeper", root);
  const ball = $("#pball", root);
  const fb = $("#fb", root);

  const flyTo = (el) => {
    const b = ball.getBoundingClientRect();
    const t = el.getBoundingClientRect();
    const dx = t.left + t.width / 2 - (b.left + b.width / 2);
    const dy = t.top + t.height / 2 - (b.top + b.height / 2);
    ball.style.transform = `translate(${dx}px, ${dy}px) scale(.7) rotate(540deg)`;
  };
  const keeperTo = (el) => {
    const f = $(".goal-frame", root).getBoundingClientRect();
    const t = el.getBoundingClientRect();
    keeper.style.left = t.left - f.left + t.width / 2 + "px";
  };

  root.querySelectorAll(".target").forEach((btn) => {
    btn.onclick = async () => {
      if (locked) return;
      locked = true;
      Voice.stop();
      const chosen = opts[+btn.dataset.i];
      Sfx.kick();
      flyTo(btn);
      if (chosen === word) {
        // вратарь прыгает в другую сторону
        const wrongSide = [...root.querySelectorAll(".target")].find((b) => b !== btn);
        keeperTo(wrongSide);
        await sleep(450);
        btn.classList.add("scored");
        fb.innerHTML = `<span class="ok">ГОЛ! ⚽ ${esc(word.en)}</span>`;
        Sfx.cheer();
        Sfx.correct();
        confetti(30);
        await Voice.en(word.en);
        await sleep(500);
        nextStep();
      } else {
        keeperTo(btn);
        await sleep(450);
        btn.classList.add("saved");
        Sfx.wrong();
        tries++;
        L.mistakes++;
        fb.innerHTML = `<span class="bad">Вратарь поймал! Попробуй ещё 💪</span>`;
        await sleep(900);
        ball.style.transform = "";
        btn.classList.remove("saved");
        btn.classList.add("used");
        btn.disabled = true;
        if (tries >= 2) {
          root.querySelectorAll(".target").forEach((b) => {
            if (opts[+b.dataset.i] === word) b.classList.add("hint");
          });
        }
        locked = false;
        say();
      }
    };
  });

  await hintOnce("penalty", "Послушай слово и забей мяч в нужную картинку");
  await say();
}

// ---------- 3. Произношение: скажи слово ----------
async function stepSay({ word }) {
  const canListen = Recognizer.supported && !Recognizer.broken;
  const root = lessonShell(`
    <div class="card say">
      <div class="tag">Скажи по-английски!</div>
      <button class="pic-big" id="hear">${picHTML(word, "xl")}</button>
      <div class="word">${esc(word.en)}</div>
      <div class="actions">
        <button class="round-btn" id="hear2" aria-label="Послушать">🔊</button>
        <button class="round-btn slow" id="slow" aria-label="Медленно">🐢</button>
      </div>
      ${
        canListen
          ? `<button class="mic-btn" id="mic"><span class="mic-ico">🎤</span><span class="mic-txt">Нажми и скажи</span></button>`
          : `<div class="nomic">Скажи слово вслух, а мама или папа нажмут кнопку</div>
             <button class="big-btn next" id="said">✅ Сказал!</button>`
      }
      <div class="feedback" id="fb"></div>
      <button class="skip" id="skip">пропустить</button>
    </div>`);
  wireQuit(root);
  const fb = $("#fb", root);
  const speak = () => Voice.en(word.en);
  $("#hear", root).onclick = speak;
  $("#hear2", root).onclick = speak;
  $("#slow", root).onclick = () => Voice.en(word.en, true);
  $("#skip", root).onclick = () => {
    L.mistakes++;
    nextStep();
  };

  const success = async (text) => {
    fb.innerHTML = `<span class="ok">${text}</span>`;
    Sfx.correct();
    Sfx.cheer();
    confetti(40);
    await sleep(1300);
    nextStep();
  };

  if (!canListen) {
    $("#said", root).onclick = () => success("Молодец! ⭐");
  } else {
    let attempts = 0;
    let busy = false;
    const mic = $("#mic", root);
    mic.onclick = async () => {
      if (busy) return;
      busy = true;
      Sfx.unlock();
      mic.classList.add("listening");
      $(".mic-txt", mic).textContent = "Слушаю...";
      fb.innerHTML = "";
      let heard = [];
      try {
        heard = await Recognizer.listen();
      } catch (e) {
        mic.classList.remove("listening");
        busy = false;
        if (Recognizer.broken) {
          fb.innerHTML = `<span class="bad">Нет доступа к микрофону. Разреши микрофон в настройках Safari.</span>`;
          setTimeout(() => stepSay({ word }), 2500);
        } else {
          $(".mic-txt", mic).textContent = "Нажми и скажи";
        }
        return;
      }
      mic.classList.remove("listening");
      $(".mic-txt", mic).textContent = "Нажми и скажи";
      const score = scorePronunciation(word, heard);
      attempts++;
      if (score >= 0.6) {
        busy = true;
        return success(score >= 0.85 ? "Отлично! ⭐⭐⭐" : "Хорошо! ⭐⭐");
      }
      L.mistakes += attempts === 1 ? 1 : 0;
      if (attempts >= 3) {
        return success("Хорошая попытка! 👍");
      }
      const heardTxt = heard[0] ? ` <small>(я услышал: «${esc(heard[0])}»)</small>` : "";
      fb.innerHTML = `<span class="bad">${heard.length ? "Почти! Послушай и скажи ещё раз" : "Я ничего не услышал. Скажи громче!"}${heardTxt}</span>`;
      Sfx.wrong();
      busy = false;
      await sleep(400);
      speak();
    };
  }

  await hintOnce("say", "Теперь скажи слово сам. Нажми на микрофон");
  await speak();
}

// =================== КОНЕЦ УРОКА ===================
async function finishLesson() {
  const { lesson } = L;
  const stars = L.mistakes === 0 ? 3 : L.mistakes <= 2 ? 2 : 1;
  const firstTime = !(lesson.id in App.progress.done);
  App.progress.done[lesson.id] = Math.max(stars, App.progress.done[lesson.id] || 0);

  let newSkill = null;
  let newCup = null;
  if (lesson.skill && !App.progress.skills.includes(lesson.skill)) {
    App.progress.skills.push(lesson.skill);
    newSkill = SKILLS.find((s) => s.id === lesson.skill);
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
        <p class="muted">Прогресс хранится в этом браузере на этом устройстве.</p>
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
  $("#reset", root).onclick = () => {
    if (confirm("Точно сбросить весь прогресс Романа?")) {
      App.progress = { done: {}, skills: [], cups: [] };
      App.save();
      showHome();
    }
  };
}

// =================== СТАРТ ===================
function boot() {
  App.load();
  Voice.init();
  document.addEventListener("touchstart", () => Sfx.unlock(), { once: true, passive: true });
  document.addEventListener("click", () => Sfx.unlock(), { once: true });
  showHome();
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
document.addEventListener("DOMContentLoaded", boot);
