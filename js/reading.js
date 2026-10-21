// Раздел «Читаем»: русский букварь и английская фонетика (phonics).
// Отдельно от уроков английского. Задания используют общий движок уроков (lesson.js).

const RD = {
  levels: (lang) => (lang === "ru" ? RU_LEVELS : EN_LEVELS),
  done: (lang) => ((App.progress.reading ||= { ru: {}, en: {} })[lang] ||= {}),
};

const ruLow = (s) => s.toLowerCase().replace(/-/g, "");
const isVowelRu = (ch) => RU_VOWELS.includes(ch.toUpperCase());

// ---------- звук ----------
function playSound(lang, g) {
  const url = "audio/phonemes/" + phonemeFile(lang, g) + ".mp3";
  if (AudioBank.ready())
    return AudioBank.playUrl(url).then((ok) => (ok ? undefined : Voice.synth(lang === "ru" ? g.toLowerCase() : g, { lang: lang === "ru" ? "ru-RU" : "en-GB" })));
  return Voice.synth(lang === "ru" ? g.toLowerCase() : g, { lang: lang === "ru" ? "ru-RU" : "en-GB" });
}
// слог / слово / фраза целиком
function sayText(lang, text, slow = false) {
  return lang === "ru" ? Voice.say(ruLow(text), { lang: "ru-RU", rate: slow ? 0.7 : 0.95 }) : Voice.say(text, { rate: slow ? 0.6 : 0.8 });
}

// Слово по слогам: гласные — красные, согласные — синие (как в букваре)
function ruWordHTML(w, cls = "") {
  return `<span class="rw ${cls}">${w
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((syl) => `<span class="syl">${[...syl].map((ch) => `<b class="${isVowelRu(ch) ? "v" : "c"}">${esc(ch)}</b>`).join("")}</span>`)
        .join(`<i class="arc"></i>`)
    )
    .join(`<span class="sp"> </span>`)}</span>`;
}
function enWordHTML(w, cls = "") {
  return `<span class="rw en ${cls}">${esc(w)}</span>`;
}
const wordHTML = (lang, w, cls) => (lang === "ru" ? ruWordHTML(w, cls) : enWordHTML(w, cls));
const gHTML = (lang, g) => (lang === "ru" ? `<span class="glyph"><b class="${isVowelRu(g) ? "v" : "c"}">${g}</b><small>${g.toLowerCase()}</small></span>` : `<span class="glyph en"><b>${g}</b></span>`);

// ---------- сборка урока ----------
function knownGraphemes(lang, idx) {
  const lv = RD.levels(lang);
  const out = [];
  for (let i = 0; i <= idx; i++) out.push(...(lang === "ru" ? lv[i].letters : lv[i].sounds));
  return out;
}
function knownWords(lang, idx) {
  const lv = RD.levels(lang);
  const out = [];
  for (let i = 0; i <= idx; i++) out.push(...lv[i].words);
  return out;
}

function buildReadingSteps(lang, idx) {
  const lv = RD.levels(lang)[idx];
  const known = knownGraphemes(lang, idx);
  const fresh = lang === "ru" ? lv.letters : lv.sounds;
  const pics = knownWords(lang, idx).filter((x) => x.pic);
  const steps = [];
  for (const g of fresh) {
    steps.push({ type: "rLetter", lang, g });
    steps.push({ type: "rTrace", lang, g });
    steps.push({ type: "rFind", lang, g, pool: known });
  }
  if (lang === "ru") {
    const cons = fresh.filter((g) => !isVowelRu(g));
    const vowels = known.filter((g) => isVowelRu(g));
    for (const c of cons) pick(vowels, 3).forEach((v) => steps.push({ type: "rMerge", c, v }));
    if (fresh.length && lv.syl.length) {
      pick(lv.syl, 3).forEach((s) => steps.push({ type: "rPickHeard", lang, target: s, pool: lv.syl }));
      pick(lv.syl, 2).forEach((s) => steps.push({ type: "rAloud", lang, text: s, syllable: true }));
    }
  } else if (lv.tricky) {
    lv.words.forEach((x) => steps.push({ type: "rTricky", word: x.w }));
    pick(lv.words, 4).forEach((x) => steps.push({ type: "rPickHeard", lang, target: x.w, pool: lv.words.map((y) => y.w) }));
  } else if (!lv.sentences) {
    pick(lv.words, 4).forEach((x) => steps.push({ type: "rBlend", word: x }));
  }
  // чтение слов: прочитай и найди картинку
  const withPic = lv.words.filter((x) => x.pic);
  pick(withPic, 4).forEach((x) => steps.push({ type: "rReadPic", lang, word: x, pool: pics }));
  pick(lv.words, lv.sentences || (lang === "ru" && idx === RU_LEVELS.length - 1) ? 2 : 2).forEach((x) => steps.push({ type: "rAloud", lang, text: x.w }));
  return steps;
}

function startReading(lang, idx) {
  Sfx.unlock();
  AudioBank.unlock();
  const lv = RD.levels(lang)[idx];
  const lesson = { id: lv.id, kind: "reading", lang, idx, title: lv.title, unit: 0, words: [] };
  L = { index: -1, lesson, unit: UNITS[0], steps: buildReadingSteps(lang, idx), pos: 0, mistakes: 0, saidTypes: new Set(), startedAt: Date.now() };
  Sfx.whistle();
  runStep();
}

// ---------- задания ----------

// Новая буква / звук
STEP_FN.rLetter = async ({ lang, g }) => {
  const info = lang === "ru" ? RU_LETTERS[g] : EN_SOUNDS[g];
  const root = lessonShell(`
    <div class="card rcard">
      <div class="tag">${lang === "ru" ? "Новая буква" : "New sound — новый звук"}</div>
      <button class="big-glyph" id="snd">${gHTML(lang, g)}</button>
      <button class="round-btn big-snd" id="snd2">🔊</button>
      <div class="key-row" id="key">${info.pic} <b>${lang === "ru" ? esc(info.key) : esc(info.key)}</b></div>
      ${info.note ? `<div class="note">💡 ${esc(info.note)}</div>` : ""}
      ${lang === "en" ? `<div class="muted small">Учим <b>звук</b>, а не название буквы</div>` : ""}
    </div>
    <button class="big-btn next" id="next">Дальше ➜</button>`);
  const snd = () => playSound(lang, g);
  $("#snd", root).onclick = snd;
  $("#snd2", root).onclick = snd;
  $("#key", root).onclick = () => sayText(lang, info.key);
  $("#next", root).onclick = nextStep;
  await hintOnce(lang === "ru" ? "rLetter" : "rLetterEn", lang === "ru" ? "Познакомься с новой буквой. Нажми на неё, чтобы услышать звук" : "Это английский звук. Нажми на букву, чтобы услышать, как он звучит");
  if (lang === "ru") await Voice.say(`Буква ${g}`, { lang: "ru-RU", rate: 0.95 });
  await snd();
  await sleep(350);
  await snd();
  await sleep(350);
  await sayText(lang, info.key);
};

// Обведи букву
STEP_FN.rTrace = async ({ lang, g }) => {
  const chars = lang === "ru" ? [g] : [...g];
  for (let i = 0; i < chars.length; i++) {
    const root = lessonShell(`
      <div class="card trace">
        <div class="tag">✍️ Обведи букву пальцем</div>
        <div class="tr-word">${chars.map((c, j) => `<span class="${j < i ? "ok" : j === i ? "cur" : ""}">${esc(c)}</span>`).join("")}</div>
        <div class="tr-wrap"><canvas id="cv"></canvas></div>
        <div class="tr-bar"><b id="prog"></b></div>
        <div class="actions">
          <button class="round-btn" id="clear" aria-label="Стереть">🧽</button>
          <button class="round-btn slow" id="hear" aria-label="Послушать">🔊</button>
        </div>
        <div class="feedback" id="fb"></div>
        <button class="skip" id="skip">пропустить</button>
      </div>`);
    if (i === 0) hintOnce("trace", "Обведи букву пальцем по пунктиру");
    const ok = await traceLetter(root, chars[i]);
    if (ok) track("trace");
    else L.mistakes++;
  }
  await playSound(lang, g);
  nextStep();
};

// Услышь звук — найди букву
STEP_FN.rFind = async ({ lang, g, pool }) => {
  const others = pick(pool.filter((x) => x !== g), 2);
  const opts = shuffle([g, ...others]);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">👂 Какая буква так звучит?</div>
      <button class="hear-btn" id="hear">🔊 <span>Послушай</span></button>
      <div class="glyph-opts">${opts.map((x) => `<button class="glyph-opt" data-ok="${x === g ? 1 : 0}" data-g="${esc(x)}">${gHTML(lang, x)}</button>`).join("")}</div>
      <div class="feedback" id="fb"></div>
    </div>`);
  const say = () => playSound(lang, g);
  $("#hear", root).onclick = say;
  await hintOnce("rFind", "Послушай звук и найди букву");
  say();
  await choice(root, { onWrong: (b) => playSound(lang, b.dataset.g) });
  await celebrate($("#fb", root), "Верно! ⭐", { big: false });
  await say();
  await sleep(400);
  nextStep();
};

// Слияние: согласная «бежит» к гласной (букварь)
STEP_FN.rMerge = async ({ c, v }) => {
  const syl = c + v;
  const root = lessonShell(`
    <div class="card">
      <div class="tag">🏃 Буква ${esc(c)} бежит к букве ${esc(v)}</div>
      <div class="merge">
        <span class="m-c">${gHTML("ru", c)}</span>
        <span class="m-path"></span>
        <span class="m-v">${gHTML("ru", v)}</span>
      </div>
      <div class="m-res" id="res">${ruWordHTML(syl)}</div>
      <div class="actions"><button class="round-btn" id="again">🔁</button></div>
    </div>
    <button class="big-btn next" id="next" style="visibility:hidden">Дальше ➜</button>`);
  const mg = $(".merge", root);
  const run = async () => {
    mg.classList.remove("go");
    $("#res", root).classList.remove("on");
    void mg.offsetWidth;
    await sleep(200);
    mg.classList.add("go");
    await playSound("ru", c);
    await sayText("ru", syl, true);
    $("#res", root).classList.add("on");
    await sleep(300);
    await sayText("ru", syl);
  };
  $("#again", root).onclick = run;
  $("#next", root).onclick = nextStep;
  await hintOnce("rMerge", "Смотри: согласная бежит к гласной, и получается слог. Тяни звук, пока не добежишь");
  await run();
  $("#next", root).style.visibility = "visible";
};

// Английское сливание: звуки по очереди → слово
STEP_FN.rBlend = async ({ word }) => {
  const gs = enGraphemes(word.w);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">🔗 Нажми на каждый звук, потом — «Слить!»</div>
      <div class="blend">${gs.map((g, i) => `<button class="bl-g" data-i="${i}">${esc(g)}<i></i></button>`).join("")}</div>
      <div class="bl-arrow">➜</div>
      <button class="big-btn bl-go" id="go" disabled>🔗 Слить!</button>
      <div class="bl-res" id="res">${word.pic ? `<span class="pic">${word.pic}</span>` : ""}${enWordHTML(word.w)}</div>
      <div class="feedback" id="fb"></div>
    </div>
    <button class="big-btn next" id="next" style="visibility:hidden">Дальше ➜</button>`);
  const tiles = [...root.querySelectorAll(".bl-g")];
  const tapped = new Set();
  tiles.forEach((b) => {
    b.onclick = async () => {
      tiles.forEach((x) => x.classList.remove("hl"));
      b.classList.add("hl", "done");
      tapped.add(+b.dataset.i);
      await playSound("en", gs[+b.dataset.i]);
      if (tapped.size === gs.length) $("#go", root).disabled = false;
    };
  });
  $("#go", root).onclick = async () => {
    $("#go", root).disabled = true;
    for (let i = 0; i < gs.length; i++) {
      tiles.forEach((x) => x.classList.remove("hl"));
      tiles[i].classList.add("hl");
      await playSound("en", gs[i]);
    }
    tiles.forEach((x) => x.classList.remove("hl"));
    root.querySelector(".blend").classList.add("joined");
    $("#res", root).classList.add("on");
    await sayText("en", word.w);
    track("read");
    await celebrate($("#fb", root), `${esc(word.w)}! 🎉`, { big: false });
    $("#go", root).disabled = false;
    $("#next", root).style.visibility = "visible";
  };
  $("#next", root).onclick = nextStep;
  await hintOnce("rBlend", "Нажми на каждую букву и послушай звук. Потом нажми Слить, и звуки сольются в слово");
};

// Trick-слова: читаются не по правилам, их запоминают целиком
STEP_FN.rTricky = async ({ word }) => {
  const root = lessonShell(`
    <div class="card rcard">
      <div class="tag">⭐ Trick word — запомни целиком</div>
      <button class="big-word" id="hear">${enWordHTML(word, "xl")}</button>
      <div class="muted small">Это слово читается не по правилам. Его просто запоминаем.</div>
      <div class="actions"><button class="round-btn" id="h2">🔊</button></div>
    </div>
    <button class="big-btn next" id="next">Дальше ➜</button>`);
  const say = () => sayText("en", word);
  $("#hear", root).onclick = say;
  $("#h2", root).onclick = say;
  $("#next", root).onclick = nextStep;
  await hintOnce("rTricky", "Это хитрое слово. Его не читают по звукам, а запоминают целиком");
  await say();
};

// Услышь — найди, как пишется
STEP_FN.rPickHeard = async ({ lang, target, pool }) => {
  const opts = shuffle([target, ...pick(pool.filter((x) => x !== target), 2)]);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">👂 Найди, что ты услышал</div>
      <button class="hear-btn" id="hear">🔊 <span>Послушай</span></button>
      <div class="word-opts">${opts.map((x) => `<button class="word-opt rd" data-ok="${x === target ? 1 : 0}">${wordHTML(lang, x)}</button>`).join("")}</div>
      <div class="feedback" id="fb"></div>
    </div>`);
  const say = () => sayText(lang, target);
  $("#hear", root).onclick = say;
  await hintOnce("rPick", "Послушай и найди, как это пишется");
  say();
  await choice(root, { onWrong: () => ($("#fb", root).innerHTML = `<span class="bad">Послушай ещё раз 👂</span>`) });
  track("read");
  await celebrate($("#fb", root), "Верно! ⭐", { big: false });
  await sleep(700);
  nextStep();
};

// Прочитай сам и найди картинку (настоящее чтение — без звука!)
STEP_FN.rReadPic = async ({ lang, word, pool }) => {
  const others = pick(pool.filter((x) => x.pic !== word.pic && x.w !== word.w), 2);
  const opts = shuffle([word, ...others]);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">📖 Прочитай и найди картинку</div>
      <div class="read-box">${wordHTML(lang, word.w, "big")}</div>
      <div class="targets three">${opts.map((x) => `<button class="target" data-ok="${x === word ? 1 : 0}"><span class="pic">${x.pic}</span></button>`).join("")}</div>
      <div class="feedback" id="fb"></div>
      <button class="skip" id="help">🔊 подсказка</button>
    </div>`);
  $("#help", root).onclick = () => {
    L.mistakes++;
    sayText(lang, word.w, true);
  };
  await hintOnce(lang === "ru" ? "rReadPic" : "rReadPicEn", "Прочитай слово сам и нажми на нужную картинку");
  await choice(root, { onWrong: () => ($("#fb", root).innerHTML = `<span class="bad">Прочитай ещё раз, по слогам 🙂</span>`) });
  track("read");
  await celebrate($("#fb", root), "Молодец, прочитал! 📖");
  await sayText(lang, word.w);
  await sleep(500);
  nextStep();
};

// Прочитай вслух (микрофон или проверка родителем)
STEP_FN.rAloud = async ({ lang, text, syllable }) => {
  const canListen = Recognizer.supported && !Recognizer.broken && !syllable;
  const root = lessonShell(`
    <div class="card">
      <div class="tag">🗣 Прочитай вслух</div>
      <div class="read-box">${wordHTML(lang, text, "big")}</div>
      ${canListen ? `<button class="mic-btn" id="mic"><span class="mic-ico">🎤</span><span class="mic-txt">Нажми и прочитай</span></button>` : ""}
      <div class="row2">
        <button class="mid-btn" id="check">🔊<span>Проверить</span></button>
        <button class="mid-btn accent" id="ok">✅<span>Прочитал!</span></button>
      </div>
      <div class="feedback" id="fb"></div>
    </div>`);
  const fb = $("#fb", root);
  let checked = false;
  $("#check", root).onclick = () => {
    checked = true;
    sayText(lang, text, true);
  };
  await hintOnce(canListen ? "rAloudMic" : "rAloud", canListen ? "Прочитай вслух и нажми на микрофон. Или нажми Проверить, чтобы послушать" : "Прочитай вслух. Потом нажми Проверить, чтобы послушать, правильно ли");
  await new Promise((resolve) => {
    $("#ok", root).onclick = resolve;
    if (canListen) {
      let tries = 0;
      const mic = $("#mic", root);
      mic.onclick = async () => {
        mic.classList.add("listening");
        $(".mic-txt", mic).textContent = "Слушаю...";
        let heard = [];
        try {
          heard = await Recognizer.listen({ lang: lang === "ru" ? "ru-RU" : "en-US", timeout: 7000 });
        } catch (e) {}
        mic.classList.remove("listening");
        $(".mic-txt", mic).textContent = "Нажми и прочитай";
        const norm = (s) => s.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();
        const target = norm(lang === "ru" ? ruLow(text) : text);
        const score = Math.max(0, ...heard.map((h) => similarity(norm(h), target)));
        tries++;
        if (score >= 0.6 || tries >= 3) resolve();
        else {
          fb.innerHTML = `<span class="bad">Почти! Прочитай ещё раз, по слогам${heard[0] ? ` <small>(я услышал: «${esc(heard[0])}»)</small>` : ""}</span>`;
          Sfx.wrong();
        }
      };
    }
  });
  if (checked) L.mistakes += 0.5;
  track("speak");
  await celebrate(fb, "Отлично читаешь! ⭐");
  await sayText(lang, text);
  await sleep(400);
  nextStep();
};

// ---------- конец уровня ----------
async function finishReading() {
  const { lang, idx, id } = L.lesson;
  const stars = L.mistakes === 0 ? 3 : L.mistakes <= 2 ? 2 : 1;
  const done = RD.done(lang);
  done[id] = Math.max(stars, done[id] || 0);
  const sr = markTrained(Math.min(30, (Date.now() - L.startedAt) / 60000), Math.round(L.mistakes));
  track("reading");
  App.save();
  const lv = RD.levels(lang)[idx];
  const fresh = lang === "ru" ? lv.letters : lv.sounds;
  const hasNext = idx + 1 < RD.levels(lang).length;
  const root = render(`
    <div class="screen finish">
      <h2 class="fin-title">${fresh.length ? (lang === "ru" ? `Ты выучил ${fresh.length > 1 ? "буквы" : "букву"} ${fresh.join(", ")}!` : `New sounds: ${fresh.join(" ")}!`) : "Уровень пройден!"}</h2>
      <div class="fin-stars">${[1, 2, 3].map((i) => `<span class="${i <= stars ? "on" : ""}" style="animation-delay:${i * 0.25}s">⭐</span>`).join("")}</div>
      <div class="fin-glyphs">${fresh.map((g) => gHTML(lang, g)).join("") || "📖"}</div>
      ${streakBannerHTML(sr)}
      <div class="row2">
        <button class="mid-btn" id="back">📚<span>К чтению</span></button>
        ${hasNext ? `<button class="mid-btn accent" id="next">▶<span>Дальше</span></button>` : `<button class="mid-btn accent" id="home">🏠<span>Домой</span></button>`}
      </div>
    </div>`);
  $("#back", root).onclick = () => showTrack(lang);
  if (hasNext) $("#next", root).onclick = () => startReading(lang, idx + 1);
  else $("#home", root).onclick = showHome;
  Sfx.fanfare();
  confetti(80);
  await Voice.ru("Молодец! Ты хорошо читаешь!");
}

// ---------- экраны ----------
function showReading() {
  const p = (lang) => Object.keys(RD.done(lang)).length;
  const root = render(`
    <div class="screen reading">
      <header class="topbar"><button class="icon-btn" id="back">←</button><h2>📚 Читаем</h2><span></span></header>
      <button class="track-card ru" id="ru">
        <span class="tc-ico">🇷🇺</span>
        <span class="tc-text"><b>Букварь</b><small>Буквы → слоги → слова. Гласные красные, согласные синие.</small></span>
        <span class="tc-prog">${p("ru")}/${RU_LEVELS.length}</span>
      </button>
      <button class="track-card en" id="en">
        <span class="tc-ico">🇬🇧</span>
        <span class="tc-text"><b>Phonics</b><small>Английские звуки → сливаем в слова: c-a-t → cat!</small></span>
        <span class="tc-prog">${p("en")}/${EN_LEVELS.length}</span>
      </button>
      <div class="info muted small">Совет: 1 уровень в день, 5–10 минут. Если тяжело — повторите вчерашний уровень, это нормально.</div>
    </div>`);
  $("#back", root).onclick = showHome;
  $("#ru", root).onclick = () => showTrack("ru");
  $("#en", root).onclick = () => showTrack("en");
}

function showTrack(lang) {
  const lv = RD.levels(lang);
  const done = RD.done(lang);
  const root = render(`
    <div class="screen reading">
      <header class="topbar"><button class="icon-btn" id="back">←</button><h2>${lang === "ru" ? "🇷🇺 Букварь" : "🇬🇧 Phonics"}</h2><span></span></header>
      <div class="lv-grid">
        ${lv
          .map((l, i) => {
            const open = App.settings.unlockAll || i === 0 || lv[i - 1].id in done;
            const st = done[l.id];
            const label = lang === "ru" ? (l.letters.length ? l.letters.join(" ") : "📖") : l.sounds.length ? l.sounds.join(" ") : l.tricky ? "⭐" : "📖";
            return `<button class="lv-tile ${open ? "" : "locked"} ${st ? "done" : ""}" data-i="${i}" ${open ? "" : "disabled"}>
              <span class="lv-g ${lang} ${label.length > 7 ? "long" : ""}">${open ? esc(label) : "🔒"}</span>
              <small>${esc(l.title)}</small>
              <span class="lt-stars">${st ? "⭐".repeat(st) : "&nbsp;"}</span>
            </button>`;
          })
          .join("")}
      </div>
    </div>`);
  $("#back", root).onclick = showReading;
  root.querySelectorAll(".lv-tile:not(.locked)").forEach((b) => (b.onclick = () => startReading(lang, +b.dataset.i)));
}
