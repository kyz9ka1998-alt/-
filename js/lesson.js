// Уроки: сборка шагов и все типы заданий.

let L = null; // состояние текущего урока

// ---------- сборка урока ----------
const pick = (arr, n) => shuffle(arr).slice(0, n);

function specialSteps(unit, n) {
  const out = [];
  if (unit.rhymes) pick(unit.rhymes, n).forEach((r) => out.push({ type: "rhyme", rhyme: r }));
  if (unit.counts) pick(unit.counts, n).forEach((c) => out.push({ type: "count", count: c }));
  if (unit.pairs) out.push({ type: "pairs", pairs: pick(unit.pairs, 4), food: true });
  return out.slice(0, Math.max(n, 1));
}

function buildSteps(lesson) {
  const unit = UNITS[lesson.unit];
  const words = lesson.words;
  const all = unit.words;
  const steps = [];
  if (lesson.kind === "train1") {
    words.forEach((w) => steps.push({ type: "intro", word: w }));
    shuffle(words).forEach((w) => steps.push({ type: "penalty", word: w, pool: words }));
    shuffle(words).forEach((w) => steps.push({ type: "read", word: w, pool: all }));
    steps.push({ type: "pairs", pairs: words.map((w) => ({ left: w, right: w })) });
    shuffle(words).forEach((w) => steps.push({ type: "say", word: w }));
  } else if (lesson.kind === "train2") {
    words.forEach((w) => steps.push({ type: "intro", word: w }));
    shuffle(words).forEach((w) => steps.push({ type: "penalty", word: w, pool: words }));
    shuffle(words).forEach((w) => steps.push({ type: "read", word: w, pool: all }));
    steps.push(...specialSteps(unit, 2));
    shuffle(words).forEach((w) => steps.push({ type: "recall", word: w, pool: all }));
  } else {
    (unit.phrases || []).forEach((p) => steps.push({ type: "phrase", phrase: p }));
    pick(unit.dialogs || [], 3).forEach((d) => steps.push({ type: "dialog", dialog: d }));
    pick(unit.builds || [], 2).forEach((b) => steps.push({ type: "build", sentence: b }));
    steps.push(unit.pairs ? { type: "pairs", pairs: pick(unit.pairs, 4), food: true } : { type: "pairs", pairs: pick(all, 4).map((w) => ({ left: w, right: w })) });
    pick(all, 3).forEach((w) => steps.push({ type: "recall", word: w, pool: all }));
    pick(all, 2).forEach((w) => steps.push({ type: "penalty", word: w, pool: all }));
  }
  return steps;
}

function startLesson(index) {
  Sfx.unlock();
  const lesson = LESSONS[index];
  L = { index, lesson, unit: UNITS[lesson.unit], steps: buildSteps(lesson), pos: 0, mistakes: 0, saidTypes: new Set() };
  Sfx.whistle();
  runStep();
}

function lessonShell(inner) {
  const pct = Math.round((L.pos / L.steps.length) * 100);
  const root = render(`
    <div class="screen lesson">
      <header class="lesson-top">
        <button class="icon-btn" id="quit" aria-label="Выйти">✕</button>
        <div class="field-progress"><div class="fp-fill" style="width:${pct}%"></div><span class="fp-ball" style="left:${pct}%">⚽</span><span class="fp-goal">🥅</span></div>
      </header>
      ${inner}
    </div>`);
  $("#quit", root).onclick = () => {
    if (confirm("Закончить тренировку? Прогресс этого урока не сохранится.")) {
      Voice.stop();
      showHome();
    }
  };
  return root;
}

function nextStep() {
  Voice.stop();
  L.pos++;
  if (L.pos >= L.steps.length) finishLesson();
  else runStep();
}

function hintOnce(type, text) {
  if (L.saidTypes.has(type)) return Promise.resolve();
  L.saidTypes.add(type);
  return Voice.ru(text);
}

const STEP_FN = {};
function runStep() {
  const step = L.steps[L.pos];
  STEP_FN[step.type](step);
}

async function celebrate(fb, text, { big = true } = {}) {
  fb.innerHTML = `<span class="ok">${text}</span>`;
  Sfx.correct();
  if (big) {
    Sfx.cheer();
    confetti(35);
  }
}

// Ответы-кнопки. Возвращает Promise, который завершается, когда выбран правильный вариант.
// Ошибки считаются; после 2 ошибок правильный вариант подсвечивается.
function choice(root, { onWrong } = {}) {
  return new Promise((resolve) => {
    let tries = 0;
    let locked = false;
    root.querySelectorAll("[data-ok]").forEach((btn) => {
      btn.onclick = async () => {
        if (locked || btn.disabled) return;
        if (btn.dataset.ok === "1") {
          locked = true;
          btn.classList.add("right");
          resolve(btn);
        } else {
          tries++;
          L.mistakes++;
          Sfx.wrong();
          btn.classList.add("wrong");
          btn.disabled = true;
          if (onWrong) onWrong(btn, tries);
          if (tries >= 2) root.querySelectorAll('[data-ok="1"]').forEach((b) => b.classList.add("hint"));
        }
      };
    });
  });
}

// Блок «скажи вслух» с микрофоном. target: слово или фраза. Возвращает Promise после успеха.
function speakTask(box, target, { isPhrase = false, prompt = "Нажми и скажи" } = {}) {
  return new Promise((resolve) => {
    const canListen = Recognizer.supported && !Recognizer.broken;
    box.innerHTML = canListen
      ? `<button class="mic-btn"><span class="mic-ico">🎤</span><span class="mic-txt">${prompt}</span></button><div class="feedback"></div>`
      : `<div class="nomic">Скажи вслух, а мама или папа нажмут кнопку</div><button class="big-btn next said">✅ Сказал!</button><div class="feedback"></div>`;
    const fb = $(".feedback", box);
    const done = async (text) => {
      await celebrate(fb, text);
      await sleep(1100);
      resolve();
    };
    if (!canListen) {
      $(".said", box).onclick = () => done("Молодец! ⭐");
      return;
    }
    const mic = $(".mic-btn", box);
    let attempts = 0;
    let busy = false;
    mic.onclick = async () => {
      if (busy) return;
      busy = true;
      Sfx.unlock();
      mic.classList.add("listening");
      $(".mic-txt", mic).textContent = "Слушаю...";
      fb.innerHTML = "";
      let heard = [];
      try {
        heard = await Recognizer.listen({ timeout: isPhrase ? 8000 : 6000 });
      } catch (e) {
        mic.classList.remove("listening");
        $(".mic-txt", mic).textContent = prompt;
        busy = false;
        if (Recognizer.broken) {
          fb.innerHTML = `<span class="bad">Нет доступа к микрофону. Разреши микрофон в настройках Safari.</span>`;
          setTimeout(() => speakTask(box, target, { isPhrase, prompt }).then(resolve), 2500);
        }
        return;
      }
      mic.classList.remove("listening");
      $(".mic-txt", mic).textContent = prompt;
      const score = isPhrase ? scorePhrase(target, heard) : scorePronunciation(target, heard);
      attempts++;
      if (score >= 0.6) return done(score >= 0.85 ? "Отлично! ⭐⭐⭐" : "Хорошо! ⭐⭐");
      if (attempts === 1) L.mistakes++;
      if (attempts >= 3) return done("Хорошая попытка! 👍");
      const heardTxt = heard[0] ? ` <small>(я услышал: «${esc(heard[0])}»)</small>` : "";
      fb.innerHTML = `<span class="bad">${heard.length ? "Почти! Послушай и скажи ещё раз" : "Я ничего не услышал. Скажи громче!"}${heardTxt}</span>`;
      Sfx.wrong();
      await sleep(400);
      busy = false;
      Voice.en(target.en, true);
    };
  });
}

function infoLine(w) {
  return `<div class="ipa">${w.ipa ? `[${esc(w.ipa)}]` : ""} <span class="readru">читается: «${esc(w.read)}»</span></div>`;
}

// ---------- 1. Новое слово ----------
STEP_FN.intro = async ({ word }) => {
  const root = lessonShell(`
    <div class="card intro">
      <div class="tag">Новое слово</div>
      <button class="pic-big" id="hear">${picHTML(word, "xl")}</button>
      <div class="word">${esc(word.en)}</div>
      ${infoLine(word)}
      <div class="ru">${esc(word.ru)}</div>
      ${word.ex ? `<button class="example" id="ex"><span>🔊 ${esc(word.ex[0])}</span><small>${esc(word.ex[1])}</small></button>` : ""}
      <div class="actions">
        <button class="round-btn" id="hear2" aria-label="Послушать">🔊</button>
        <button class="round-btn slow" id="slow" aria-label="Медленно">🐢</button>
      </div>
    </div>
    <button class="big-btn next" id="next">Дальше ➜</button>`);
  const speak = () => Voice.en(word.en);
  $("#hear", root).onclick = speak;
  $("#hear2", root).onclick = speak;
  $("#slow", root).onclick = () => Voice.en(word.en, true);
  if (word.ex) $("#ex", root).onclick = () => Voice.say(word.ex[0], { rate: 0.75 });
  $("#next", root).onclick = nextStep;
  await hintOnce("intro", "Послушай новое слово");
  await Voice.en(word.en);
  await sleep(250);
  await Voice.ru(word.ru);
  await sleep(250);
  await Voice.en(word.en, true);
};

// ---------- 2. Новая фраза ----------
STEP_FN.phrase = async ({ phrase }) => {
  const root = lessonShell(`
    <div class="card intro">
      <div class="tag">Новая фраза</div>
      <button class="bubble" id="hear">💬 ${esc(phrase.en)}</button>
      <div class="ipa"><span class="readru">читается: «${esc(phrase.read)}»</span></div>
      <div class="ru big">${esc(phrase.ru)}</div>
      <div class="note">💡 ${esc(phrase.note)}</div>
      <div class="actions">
        <button class="round-btn" id="hear2">🔊</button>
        <button class="round-btn slow" id="slow">🐢</button>
      </div>
      <div class="sub">Повтори фразу:</div>
      <div id="speak" class="speak-area"></div>
    </div>`);
  const speak = () => Voice.say(phrase.en, { rate: 0.8 });
  $("#hear", root).onclick = speak;
  $("#hear2", root).onclick = speak;
  $("#slow", root).onclick = () => Voice.say(phrase.en, { rate: 0.55 });
  const task = speakTask($("#speak", root), phrase, { isPhrase: true });
  await hintOnce("phrase", "Послушай фразу и повтори");
  await speak();
  await sleep(250);
  await Voice.ru(phrase.ru);
  await task;
  nextStep();
};

// ---------- 3. Пенальти: услышь слово и забей в нужный угол ----------
STEP_FN.penalty = async ({ word, pool }) => {
  const others = pick(pool.filter((w) => w !== word), 2);
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
    ball.style.transform = `translate(${t.left + t.width / 2 - (b.left + b.width / 2)}px, ${t.top + t.height / 2 - (b.top + b.height / 2)}px) scale(.7) rotate(540deg)`;
  };
  const keeperTo = (el) => {
    const f = $(".goal-frame", root).getBoundingClientRect();
    const t = el.getBoundingClientRect();
    keeper.style.left = t.left - f.left + t.width / 2 + "px";
  };
  root.querySelectorAll(".target").forEach((btn) => {
    btn.onclick = async () => {
      if (locked || btn.disabled) return;
      locked = true;
      Voice.stop();
      const chosen = opts[+btn.dataset.i];
      Sfx.kick();
      flyTo(btn);
      if (chosen === word) {
        keeperTo([...root.querySelectorAll(".target")].find((b) => b !== btn));
        await sleep(450);
        btn.classList.add("scored");
        await celebrate(fb, `ГОЛ! ⚽ ${esc(word.en)} — ${esc(word.ru)}`);
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
        fb.innerHTML = `<span class="bad">Вратарь поймал! Это ${esc(chosen.en)} — ${esc(chosen.ru)}. Попробуй ещё 💪</span>`;
        await sleep(1100);
        ball.style.transform = "";
        btn.classList.remove("saved");
        btn.classList.add("used");
        btn.disabled = true;
        if (tries >= 2) root.querySelectorAll(".target").forEach((b) => opts[+b.dataset.i] === word && b.classList.add("hint"));
        locked = false;
        say();
      }
    };
  });
  await hintOnce("penalty", "Послушай слово и забей мяч в нужную картинку");
  await say();
};

// ---------- 4. Прочитай: картинка → выбрать написанное слово ----------
STEP_FN.read = async ({ word, pool }) => {
  const opts = shuffle([word, ...pick(pool.filter((w) => w !== word), 2)]);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">📖 Прочитай! Какое слово подходит?</div>
      ${picHTML(word, "xl")}
      <div class="ru">${esc(word.ru)}</div>
      <div class="word-opts">
        ${opts.map((w) => `<button class="word-opt" data-ok="${w === word ? 1 : 0}">${esc(w.en)}</button>`).join("")}
      </div>
      <div class="feedback" id="fb"></div>
    </div>`);
  hintOnce("read", "Прочитай слова и выбери, какое подходит к картинке");
  await choice(root, { onWrong: (b) => ($("#fb", root).innerHTML = `<span class="bad">Это не то слово. Попробуй ещё!</span>`) });
  await celebrate($("#fb", root), `Верно! ${esc(word.en)} — ${esc(word.ru)}`, { big: false });
  await Voice.en(word.en);
  await sleep(500);
  nextStep();
};

// ---------- 5. Скажи слово (повторение за диктором) ----------
STEP_FN.say = async ({ word }) => {
  const root = lessonShell(`
    <div class="card say">
      <div class="tag">🎤 Скажи по-английски!</div>
      <button class="pic-big" id="hear">${picHTML(word, "xl")}</button>
      <div class="word">${esc(word.en)}</div>
      ${infoLine(word)}
      <div class="actions">
        <button class="round-btn" id="hear2">🔊</button>
        <button class="round-btn slow" id="slow">🐢</button>
      </div>
      <div id="speak" class="speak-area"></div>
      <button class="skip" id="skip">пропустить</button>
    </div>`);
  const speak = () => Voice.en(word.en);
  $("#hear", root).onclick = speak;
  $("#hear2", root).onclick = speak;
  $("#slow", root).onclick = () => Voice.en(word.en, true);
  $("#skip", root).onclick = () => {
    L.mistakes++;
    nextStep();
  };
  const task = speakTask($("#speak", root), word);
  await hintOnce("say", "Теперь скажи слово сам. Нажми на микрофон");
  await speak();
  await task;
  nextStep();
};

// ---------- 6. Вспомни сам: по-русски → сказать по-английски ----------
STEP_FN.recall = async ({ word, pool }) => {
  const canListen = Recognizer.supported && !Recognizer.broken;
  const root = lessonShell(`
    <div class="card say">
      <div class="tag">🧠 Вспомни! Как это по-английски?</div>
      ${picHTML(word, "xl")}
      <div class="word ru-word">${esc(word.ru)}</div>
      <div class="hint-line" id="hintline">&nbsp;</div>
      <button class="hint-btn" id="hint">💡 Подсказка</button>
      ${
        canListen
          ? `<div id="speak" class="speak-area"></div>`
          : `<div class="word-opts">${shuffle([word, ...pick(pool.filter((w) => w !== word), 2)])
              .map((w) => `<button class="word-opt" data-ok="${w === word ? 1 : 0}">${esc(w.en)}</button>`)
              .join("")}</div><div class="feedback" id="fb"></div>`
      }
      <button class="skip" id="skip">не помню — пропустить</button>
    </div>`);
  let hints = 0;
  $("#hint", root).onclick = () => {
    hints++;
    if (hints === 1) L.mistakes++;
    const hl = $("#hintline", root);
    if (hints === 1) hl.textContent = `начинается на «${word.en[0].toUpperCase()}»  ·  читается «${word.read}»`;
    else {
      hl.textContent = `${word.en}  ·  «${word.read}»`;
      Voice.en(word.en, true);
    }
  };
  $("#skip", root).onclick = async () => {
    L.mistakes++;
    $("#hintline", root).textContent = `${word.en} — «${word.read}»`;
    await Voice.en(word.en);
    await sleep(600);
    nextStep();
  };
  hintOnce("recall", "Вспомни, как это слово по-английски, и скажи его");
  if (canListen) {
    await speakTask($("#speak", root), word, { prompt: "Нажми и скажи по-английски" });
  } else {
    await choice(root);
    await celebrate($("#fb", root), "Верно!");
  }
  await Voice.en(word.en);
  nextStep();
};

// ---------- 7. Найди пару ----------
STEP_FN.pairs = async ({ pairs, food }) => {
  const left = shuffle(pairs.map((p, i) => ({ p, i })));
  const right = shuffle(pairs.map((p, i) => ({ p, i })));
  const rightHTML = (p) => (food ? picHTML(p.right) : `<span class="pair-word">${esc(p.right.en)}</span>`);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">🔗 ${food ? "Кто что любит? Соедини пары" : "Найди пару: картинка и слово"}</div>
      <div class="pairs">
        <div class="col">${left.map(({ p, i }) => `<button class="pair-btn" data-side="l" data-i="${i}">${picHTML(p.left)}</button>`).join("")}</div>
        <div class="col">${right.map(({ p, i }) => `<button class="pair-btn" data-side="r" data-i="${i}">${rightHTML(p)}</button>`).join("")}</div>
      </div>
      <div class="feedback" id="fb"></div>
    </div>`);
  hintOnce(food ? "pairsfood" : "pairs", food ? "Покажи, кто что любит. Нажми на животное, а потом на еду" : "Нажми на картинку, а потом на подходящее слово");
  const fb = $("#fb", root);
  let sel = null;
  let left_ = pairs.length;
  await new Promise((resolve) => {
    root.querySelectorAll(".pair-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (btn.classList.contains("matched")) return;
        const side = btn.dataset.side;
        const i = +btn.dataset.i;
        if (side === "l") {
          root.querySelectorAll(".pair-btn.sel").forEach((b) => b.classList.remove("sel"));
          btn.classList.add("sel");
          sel = { btn, i };
          Voice.en(pairs[i].left.en);
          return;
        }
        if (!sel) {
          // сначала нужно выбрать картинку слева
          if (!food) Voice.en(pairs[i].right.en);
          root.querySelectorAll('.pair-btn[data-side="l"]:not(.matched)').forEach((b) => b.classList.add("nudge"));
          setTimeout(() => root.querySelectorAll(".nudge").forEach((b) => b.classList.remove("nudge")), 600);
          return;
        }
        if (i === sel.i) {
          btn.classList.add("matched");
          sel.btn.classList.add("matched");
          sel.btn.classList.remove("sel");
          Sfx.correct();
          const p = pairs[i];
          fb.innerHTML = `<span class="ok">${esc(p.say || p.left.en + " — " + p.left.ru)}</span>`;
          sel = null;
          left_--;
          await Voice.say(p.say || p.left.en, { rate: 0.8 });
          if (left_ === 0) resolve();
        } else {
          L.mistakes++;
          Sfx.wrong();
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 500);
        }
      };
    });
  });
  await celebrate(fb, "Все пары найдены! 🎉");
  await sleep(1000);
  nextStep();
};

// ---------- 8. Рифма: I can see a cat and a … ----------
STEP_FN.rhyme = async ({ rhyme }) => {
  const { a, b, wrong } = rhyme;
  const opts = shuffle([b, ...wrong]);
  const line = `I can see a ${a.en} and a`;
  const root = lessonShell(`
    <div class="card">
      <div class="tag">🎵 Придумай рифму!</div>
      <div class="rhyme-row">${picHTML(a)} <span class="plus">+</span> <span class="qmark">?</span></div>
      <button class="bubble small" id="hear">🔊 ${esc(line)} …?</button>
      <div class="targets three">${opts.map((w) => `<button class="target" data-ok="${w === b ? 1 : 0}" data-en="${esc(w.en)}">${picHTML(w)}</button>`).join("")}</div>
      <div class="feedback" id="fb"></div>
    </div>`);
  const say = () => Voice.say(line + "...", { rate: 0.8 });
  $("#hear", root).onclick = say;
  hintOnce("rhyme", "Какое слово звучит похоже? Найди рифму");
  say();
  await choice(root, {
    onWrong: (btn) => {
      const en = btn.dataset.en;
      $("#fb", root).innerHTML = `<span class="bad">${esc(en)} — не рифмуется с ${esc(a.en)}. Ещё раз!</span>`;
      Voice.en(en);
    },
  });
  $(".qmark", root).outerHTML = picHTML(b);
  await celebrate($("#fb", root), `${esc(a.en)} — ${esc(b.en)}! 🎵`);
  await Voice.say(`I can see a ${a.en} and a ${b.en}!`, { rate: 0.8 });
  await sleep(400);
  nextStep();
};

// ---------- 9. Сколько? One cat — two cats ----------
STEP_FN.count = async ({ count }) => {
  const w = count.word;
  const n = 1 + Math.floor(Math.random() * count.max);
  const label = (k) => `${NUMBERS[k]} ${k === 1 ? w.en : w.plural}`;
  const choices = new Set([n]);
  while (choices.size < 3) {
    const k = Math.max(1, Math.min(count.max + 1, n + Math.floor(Math.random() * 5) - 2));
    choices.add(k);
  }
  const opts = shuffle([...choices]);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">🔢 Посчитай! How many ${esc(w.plural)}?</div>
      <div class="count-box">${Array(n).fill(picHTML(w)).join("")}</div>
      <div class="word-opts">${opts.map((k) => `<button class="word-opt" data-ok="${k === n ? 1 : 0}">${esc(label(k))}</button>`).join("")}</div>
      <div class="feedback" id="fb"></div>
    </div>`);
  hintOnce("count", "Посчитай и выбери правильный ответ");
  Voice.say(`How many ${w.plural}?`, { rate: 0.8 });
  await choice(root, { onWrong: () => ($("#fb", root).innerHTML = `<span class="bad">Посчитай ещё раз!</span>`) });
  await celebrate($("#fb", root), `I can see ${esc(label(n))}!`);
  await Voice.say(`I can see ${label(n)}!`, { rate: 0.8 });
  await sleep(400);
  nextStep();
};

// ---------- 10. Диалог ----------
STEP_FN.dialog = async ({ dialog: d }) => {
  const itemHTML = (id) =>
    id === "NO" ? `<span class="no-btn">🙅 Oh, no!</span>` : picHTML(ITEMS[id]);
  const root = lessonShell(`
    <div class="card dialog">
      <div class="tag">💬 Диалог</div>
      <div class="scene">
        <span class="who">${d.who}</span>
        <button class="bubble" id="hear">${esc(d.line)}</button>
      </div>
      <div class="ru">${esc(d.ru)}</div>
      ${d.give ? `<div class="sub">Что ты дашь?</div><div class="targets ${d.options.length === 4 ? "four" : "three"}">${d.options.map((id) => `<button class="target" data-ok="${id === d.give ? 1 : 0}">${itemHTML(id)}</button>`).join("")}</div>` : ""}
      <div class="feedback" id="fb"></div>
      <div id="reply" class="reply" style="${d.give ? "display:none" : ""}">
        <div class="sub">Ответь: <b>${esc(d.reply.en)}</b> <small>(${esc(d.reply.ru)})</small></div>
        <div id="speak" class="speak-area"></div>
      </div>
    </div>`);
  const pitch = { mouse: 1.6, cat: 1.3, bird: 1.7, chick: 1.8, fox: 0.9, bear: 0.6, cow: 0.7, cock: 1.2, hare: 1.4, coach: 0.9 }[d.whoEn] || 1;
  const say = () => Voice.say(d.line, { rate: 0.8, pitch });
  $("#hear", root).onclick = say;
  await hintOnce("dialog", "Послушай, что говорит зверёк, и ответь ему");
  await say();
  if (d.give) {
    await choice(root, {
      onWrong: (btn) => {
        const fb = $("#fb", root);
        if (d.give === "NO") {
          fb.innerHTML = `<span class="bad">Нет-нет! Лиса съест цыплёнка! 😱</span>`;
          Voice.ru("Нет-нет! Лиса съест цыплёнка!");
        } else fb.innerHTML = `<span class="bad">Нет, ${esc(d.whoEn)} хочет другое. Послушай ещё!</span>`;
        if (d.give !== "NO") say();
      },
    });
    Sfx.correct();
    $("#fb", root).innerHTML = d.give === "NO" ? `<span class="ok">Правильно! Цыплёнка не отдаём! 🐥</span>` : `<span class="ok">Вот, держи! 🎁</span>`;
    if (d.tr) $(".dialog .ru", root).textContent = d.tr;
    $("#reply", root).style.display = "";
  }
  Voice.say(d.reply.en, { rate: 0.75 });
  await speakTask($("#speak", root), d.reply, { isPhrase: true, prompt: `Скажи: ${d.reply.en}` });
  nextStep();
};

// ---------- 11. Собери фразу ----------
function ruFor(sentence) {
  for (const p of Object.values(P)) if (p.en === sentence) return p.ru;
  for (const w of Object.values(W)) if (w.ex && w.ex[0] === sentence) return w.ex[1];
  for (const u of UNITS) for (const p of u.pairs || []) if (p.say === sentence) return p.left.ru + " любит " + p.right.ru;
  return "";
}

STEP_FN.build = async ({ sentence }) => {
  const end = (sentence.match(/[.!?]+$/) || [""])[0];
  const tokens = sentence.replace(/[.!?]+$/, "").split(" ");
  const tiles = shuffle(tokens.map((t, i) => ({ t, i })));
  const ru = ruFor(sentence);
  const root = lessonShell(`
    <div class="card">
      <div class="tag">🧩 Собери фразу</div>
      ${ru ? `<div class="ru big">${esc(ru)}</div>` : ""}
      <button class="hear-btn" id="hear">🔊 <span>Послушай</span></button>
      <div class="build-line" id="line"></div>
      <div class="tiles">${tiles.map(({ t, i }) => `<button class="tile" data-i="${i}">${esc(t)}</button>`).join("")}</div>
      <div class="feedback" id="fb"></div>
    </div>`);
  const say = () => Voice.say(sentence, { rate: 0.75 });
  $("#hear", root).onclick = say;
  await hintOnce("build", "Собери фразу из слов. Нажимай слова по порядку");
  say();
  let next = 0;
  let missed = false;
  await new Promise((resolve) => {
    root.querySelectorAll(".tile").forEach((btn) => {
      btn.onclick = () => {
        const i = +btn.dataset.i;
        const tok = tokens[i];
        // одинаковые слова взаимозаменяемы
        if (tok === tokens[next]) {
          Voice.say(tok, { rate: 0.85 });
          btn.classList.add("placed");
          btn.disabled = true;
          const s = document.createElement("span");
          s.className = "placed-word";
          s.textContent = tok + (next === tokens.length - 1 ? end : "");
          $("#line", root).appendChild(s);
          next++;
          if (next === tokens.length) resolve();
        } else {
          if (!missed) L.mistakes++;
          missed = true;
          Sfx.wrong();
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 450);
        }
      };
    });
  });
  await celebrate($("#fb", root), "Отлично собрано! 🧩");
  await say();
  await sleep(400);
  nextStep();
};
