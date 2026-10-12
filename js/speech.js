// Озвучка (синтез речи), распознавание произношения и звуковые эффекты.

const Voice = {
  voices: [],
  init() {
    if (!("speechSynthesis" in window)) return;
    const load = () => (this.voices = speechSynthesis.getVoices());
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  pick(lang) {
    const vs = this.voices.filter((v) => v.lang && v.lang.replace("_", "-").toLowerCase().startsWith(lang.toLowerCase()));
    if (!vs.length) return null;
    // на iPhone приятнее звучат голоса Samantha / Karen / Daniel; «enhanced/premium» — ещё лучше
    const pref = ["premium", "enhanced", "samantha", "karen", "daniel", "serena", "milena", "katya", "google"];
    for (const p of pref) {
      const v = vs.find((x) => x.name.toLowerCase().includes(p));
      if (v) return v;
    }
    return vs[0];
  },
  // Произнести текст. Возвращает Promise, который завершается после окончания фразы.
  say(text, { lang = "en-US", rate = 0.8, pitch = 1.05 } = {}) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        const v = this.pick(lang.slice(0, 2) === "en" ? lang : lang);
        if (v) u.voice = v;
        u.rate = rate;
        u.pitch = pitch;
        let finished = false;
        const done = () => {
          if (!finished) {
            finished = true;
            resolve();
          }
        };
        u.onend = done;
        u.onerror = done;
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
    try {
      speechSynthesis.cancel();
    } catch (e) {}
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
