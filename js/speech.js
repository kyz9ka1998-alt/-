// Озвучка (синтез речи), распознавание произношения и звуковые эффекты.

const Voice = {
  voices: [],
  init() {
    if (!("speechSynthesis" in window)) return;
    const load = () => (this.voices = speechSynthesis.getVoices());
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  // Оценка голоса: лучшие — Premium / Enhanced («Улучшенный»), «смешные» и роботизированные — исключаем
  NOVELTY: ["albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos", "good news", "jester", "organ", "superstar", "trinoids", "whisper", "wobble", "zarvox", "eddy", "flo", "grandma", "grandpa", "reed", "rocko", "sandy", "shelley", "fred", "junior", "ralph", "kathy", "hysterical", "deranged", "pipe organ"],
  NICE: ["ava", "zoe", "evan", "samantha", "allison", "susan", "nathan", "tom", "joelle", "noelle", "karen", "daniel", "serena", "kate", "moira", "tessa", "milena", "katya", "yuri", "google"],
  score(v) {
    const id = ((v.voiceURI || "") + " " + v.name).toLowerCase();
    const name = v.name.toLowerCase();
    if (this.NOVELTY.some((n) => name === n || name.startsWith(n + " ") || id.includes("speech.synthesis.voice." + n.replace(" ", "")) || id.includes("eloquence"))) return -100;
    let sc = 0;
    if (id.includes("premium")) sc += 100;
    else if (id.includes("enhanced") || name.includes("улучш")) sc += 60;
    if (this.NICE.some((n) => name.startsWith(n))) sc += 20;
    if (v.localService) sc += 3;
    if ((v.lang || "").replace("_", "-").toLowerCase() === "en-us") sc += 2;
    return sc;
  },
  list(lang) {
    const l = lang.slice(0, 2).toLowerCase();
    return this.voices
      .filter((v) => v.lang && v.lang.replace("_", "-").toLowerCase().startsWith(l))
      .map((v) => ({ v, sc: this.score(v) }))
      .filter((x) => x.sc > -100)
      .sort((a, b) => b.sc - a.sc)
      .map((x) => x.v);
  },
  quality(v) {
    const sc = this.score(v);
    return sc >= 100 ? "⭐ Premium" : sc >= 60 ? "✨ Улучшенный" : "обычный";
  },
  pick(lang) {
    const key = lang.startsWith("ru") ? "voiceRu" : "voiceEn";
    const chosen = typeof App !== "undefined" && App.settings[key];
    if (chosen) {
      const v = this.voices.find((x) => x.voiceURI === chosen);
      if (v) return v;
    }
    return this.list(lang)[0] || null;
  },
  // Произнести текст. Возвращает Promise, который завершается после окончания фразы.
  // onBoundary(charIndex) — вызывается, когда голос начинает новое слово (для подсветки)
  say(text, { lang = "en-US", rate = 0.8, pitch = 1.05, onBoundary = null } = {}) {
    // сначала — готовая запись диктора (Maisie / Светлана), если она есть
    const clip = AudioBank.get(lang.slice(0, 2), text);
    if (clip && AudioBank.ready()) {
      return AudioBank.play(clip, text, (rate / (lang.startsWith("ru") ? 1.0 : 0.8)), onBoundary).then((ok) => (ok ? undefined : this.synth(text, { lang, rate, pitch, onBoundary })));
    }
    return this.synth(text, { lang, rate, pitch, onBoundary });
  },
  // синтез речи iPhone (запасной вариант)
  synth(text, { lang = "en-US", rate = 0.8, pitch = 1.05, onBoundary = null } = {}) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        const v = this.pick(lang.slice(0, 2) === "en" ? lang : lang);
        if (v) u.voice = v;
        u.rate = rate;
        u.pitch = v && this.score(v) >= 60 ? 1 + (pitch - 1) * 0.3 : pitch;
        let finished = false;
        const done = () => {
          if (!finished) {
            finished = true;
            resolve();
          }
        };
        u.onend = done;
        u.onerror = done;
        if (onBoundary) u.onboundary = (e) => (e.name === undefined || e.name === "word") && onBoundary(e.charIndex);
        // на iOS onend иногда не приходит — страховка по времени
        setTimeout(done, 900 + text.length * 120);
        speechSynthesis.speak(u);
      } catch (e) {
        resolve();
      }
    });
  },
  en(word, slow = false) {
    return this.say(word, { lang: "en-US", rate: slow ? 0.6 : 0.8 });
  },
  ru(text) {
    if (!App.settings.ruVoice) return Promise.resolve();
    return this.say(text, { lang: "ru-RU", rate: 1.0, pitch: 1.1 });
  },
  stop() {
    AudioBank.stop();
    try {
      speechSynthesis.cancel();
    } catch (e) {}
  },
};

// ---------- Готовые записи (озвучка нейросетью, audio/clips) ----------
const AudioBank = {
  index: null,
  el: null,
  timers: [],
  finish: null,
  SILENT: "data:audio/mpeg;base64,//NAxAAAAANIAAAAAExBTUU0LjBVVVVVVVVVVVVVVVVMQU1FNC4wVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEWwAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FNC4wVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUU0LjBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUU0LjBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
  async load() {
    try {
      const r = await fetch("audio/index.json", { cache: "no-cache" });
      if (r.ok) this.index = await r.json();
    } catch (e) {}
  },
  // тот же хэш, что в tools/collect-texts.js (FNV-1a по UTF-8)
  id(lang, text) {
    const bytes = new TextEncoder().encode(lang + "|" + text.trim());
    let h = 0x811c9dc5;
    for (const b of bytes) {
      h ^= b;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  },
  get(lang, text) {
    if (!this.index || !text) return null;
    const id = this.id(lang, text);
    const e = this.index[id];
    return e ? { id, dur: e[0], words: e[1] } : null;
  },
  // iPhone разрешает звук только после первого касания — «разогреваем» плеер
  unlock() {
    if (this.el) return;
    const a = new Audio();
    a.preload = "auto";
    a.src = this.SILENT;
    a.play().catch(() => {});
    this.el = a;
  },
  ready() {
    return !!this.el;
  },
  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.el) {
      try {
        this.el.pause();
      } catch (e) {}
    }
    if (this.finish) this.finish(true);
  },
  // Возвращает Promise<boolean>: true — запись проиграна, false — не вышло (тогда говорит голос iPhone)
  play(clip, text, speed, onBoundary) {
    this.stop();
    return new Promise((resolve) => {
      const a = this.el;
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        this.finish = null;
        a.onended = a.onerror = null;
        resolve(ok);
      };
      this.finish = done;
      const rate = Math.max(0.5, Math.min(1.3, speed || 1));
      a.onended = () => done(true);
      a.onerror = () => done(false);
      a.src = "audio/clips/" + clip.id + ".mp3";
      a.preservesPitch = true;
      a.webkitPreservesPitch = true;
      a.defaultPlaybackRate = rate;
      a.playbackRate = rate;
      a.play()
        .then(() => {
          // подсветка слов по времени из озвучки
          if (onBoundary && clip.words.length) {
            let pos = 0;
            for (const [ms, word] of clip.words) {
              const i = text.indexOf(word, pos);
              if (i < 0) continue;
              pos = i + word.length;
              this.timers.push(setTimeout(() => !settled && onBoundary(i), ms / rate));
            }
          }
          // страховка, если «ended» не придёт
          this.timers.push(setTimeout(() => done(true), clip.dur / rate + 1500));
        })
        .catch(() => done(false));
    });
  },
};

// ---------- Распознавание речи ----------
const Recognizer = {
  get supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },
  broken: false, // выставляется, если браузер отказал (например, нет доступа к микрофону)
  current: null,

  // Слушает одно слово. Возвращает Promise<string[]> — варианты того, что услышано.
  listen({ lang = "en-US", timeout = 6000 } = {}) {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return reject(new Error("unsupported"));
      Voice.stop();
      const r = new SR();
      this.current = r;
      r.lang = lang;
      r.interimResults = false;
      r.continuous = false;
      r.maxAlternatives = 5;
      const heard = [];
      let settled = false;
      const finish = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.current = null;
        try {
          r.abort();
        } catch (e) {}
        if (err) reject(err);
        else resolve(heard);
      };
      r.onresult = (ev) => {
        for (let i = 0; i < ev.results.length; i++) {
          for (let j = 0; j < ev.results[i].length; j++) heard.push(ev.results[i][j].transcript);
        }
        if (ev.results[ev.results.length - 1].isFinal !== false) finish();
      };
      r.onerror = (ev) => {
        if (ev.error === "no-speech" || ev.error === "aborted") return finish();
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture") this.broken = true;
        finish(new Error(ev.error));
      };
      r.onend = () => finish();
      const timer = setTimeout(() => finish(), timeout);
      try {
        r.start();
      } catch (e) {
        finish(e);
      }
    });
  },
  stop() {
    if (this.current) {
      try {
        this.current.stop();
      } catch (e) {}
    }
  },
};

// Насколько услышанное похоже на нужное слово (0..1). Детское произношение распознаётся хуже,
// поэтому оценка мягкая: учитываем похожие слова, цифры и расстояние Левенштейна.
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function similarity(a, b) {
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}
function scorePronunciation(word, heardList) {
  const target = normalize(word.en);
  const accepted = [target, ...(word.alt || []).map(normalize)];
  let best = 0;
  for (const h of heardList) {
    const phrase = normalize(h);
    if (!phrase) continue;
    const tokens = phrase.split(" ");
    const candidates = [phrase, ...tokens];
    // склейка соседних слов: "good bye" → "goodbye"
    for (let i = 0; i < tokens.length - 1; i++) candidates.push(tokens[i] + tokens[i + 1]);
    for (const c of candidates) {
      if (c === target) return 1;
      if (accepted.includes(c)) best = Math.max(best, 0.9);
      best = Math.max(best, similarity(c, target));
    }
  }
  return best;
}

// ---------- Звуковые эффекты (генерируются, без файлов) ----------
const Sfx = {
  ctx: null,
  unlock() {
    if (!App.settings.sound) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
    } catch (e) {}
  },
  tone(freq, dur, { type = "sine", vol = 0.2, when = 0, slide = 0 } = {}) {
    if (!this.ctx || !App.settings.sound) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  noise(dur, { vol = 0.2, when = 0, freq = 1000, q = 0.7, attack = 0.01 } = {}) {
    if (!this.ctx || !App.settings.sound) return;
    const t = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.ctx.destination);
    src.start(t);
  },
  kick() {
    this.tone(140, 0.15, { type: "sine", vol: 0.5, slide: 0.4 });
    this.noise(0.08, { vol: 0.25, freq: 2500 });
  },
  correct() {
    this.tone(660, 0.12, { type: "triangle", vol: 0.25 });
    this.tone(990, 0.2, { type: "triangle", vol: 0.25, when: 0.1 });
  },
  wrong() {
    this.tone(260, 0.25, { type: "sine", vol: 0.2, slide: 0.7 });
  },
  whistle() {
    this.tone(2600, 0.5, { type: "sine", vol: 0.12 });
    this.tone(2750, 0.5, { type: "sine", vol: 0.06 });
  },
  cheer() {
    this.noise(1.6, { vol: 0.25, freq: 900, q: 0.4, attack: 0.3 });
    this.noise(1.4, { vol: 0.15, freq: 2200, q: 0.6, attack: 0.25, when: 0.1 });
  },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, { type: "square", vol: 0.08, when: i * 0.13 }));
    this.tone(1047, 0.6, { type: "triangle", vol: 0.15, when: 0.55 });
  },
  tick() {
    this.tone(1200, 0.04, { type: "square", vol: 0.04 });
  },
};

// Оценка фразы: какая доля слов фразы прозвучала (с поправкой на детское произношение).
function scorePhrase(phrase, heardList) {
  const target = normalize(phrase.en.replace(/'/g, "")).split(" ").filter(Boolean);
  const alts = (phrase.alt || []).map((a) => normalize(a.replace(/'/g, "")));
  let best = 0;
  for (const h of heardList) {
    const heard = normalize(h.replace(/'/g, ""));
    if (!heard) continue;
    if (alts.includes(heard) || heard === target.join(" ")) return 1;
    const tokens = heard.split(" ");
    let hit = 0;
    for (const t of target) {
      if (tokens.some((x) => x === t || similarity(x, t) >= 0.67)) hit++;
    }
    best = Math.max(best, hit / target.length);
  }
  return best;
}
