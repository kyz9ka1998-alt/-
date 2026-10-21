// Собирает все тексты, которые произносит приложение, в audio/texts.json.
// Озвучку по этому списку делает GitHub Actions (.github/workflows/tts-build.yml).
// Запуск: node tools/collect-texts.js
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.App = { settings: {}, progress: { done: {} } };
const loadJs = (f) => fs.readFileSync(path.join(root, f), "utf8");
eval((loadJs("js/data.js") + "\n" + loadJs("js/reading-data.js")).replace(/^const /gm, "var ").replace(/^let /gm, "var ").replace(/^function (\w+)/gm, "global.$1 = function $1"));

// тот же хэш, что в js/speech.js (FNV-1a по UTF-8)
function clipId(lang, text) {
  const bytes = Buffer.from(lang + "|" + text.trim(), "utf8");
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

const en = new Set();
const ru = new Set();
const addEn = (t) => t && t.trim() && en.add(t.trim());
const addRu = (t) => t && t.trim() && ru.add(t.trim());

// слова и примеры
for (const w of Object.values(W)) {
  addEn(w.en);
  addRu(w.ru);
  if (w.ex) addEn(w.ex[0]);
}
for (const p of Object.values(P)) {
  addEn(p.en);
  addRu(p.ru);
}
// предметы для диалогов
for (const it of Object.values(ITEMS)) addEn(it.en);

for (const u of UNITS) {
  for (const p of u.phrases || []) {
    addEn(p.en);
    addRu(p.ru);
  }
  for (const d of u.dialogs || []) {
    addEn(d.line);
    addEn(d.reply.en);
  }
  for (const b of u.builds || []) {
    addEn(b);
    b.replace(/[.!?]+$/, "").split(" ").forEach(addEn); // слова-карточки
  }
  for (const p of u.pairs || []) {
    addEn(p.say);
    addEn(p.left.en);
    addEn(p.right.en);
  }
  for (const r of u.rhymes || []) {
    const line = (u.rhymeLine || "I can see a {a} and a").replace("{a}", r.a.en);
    addEn(line + "...");
    addEn(`${line} ${r.b.en}!`);
    r.wrong.forEach((w) => addEn(w.en));
  }
  for (const c of u.counts || []) {
    const w = c.word;
    addEn(`How many ${w.plural}?`);
    for (let n = 1; n <= c.max; n++) addEn(`I can see ${NUMBERS[n]} ${n === 1 ? w.en : w.plural}!`);
  }
  if (u.yesno) {
    addEn("Yes, it is.");
    for (const a of u.yesno) {
      addEn(`Is this a ${a.en}?`);
      addEn(`No, it isn't. It's a ${a.en}.`);
    }
  }
  if (u.sizes) {
    addEn("Yes, it is.");
    for (const w of u.sizes)
      for (const s of ["big", "little"]) {
        addEn(`Is this a ${s} ${w.en}?`);
        addEn(`No, it isn't. It's a ${s} ${w.en}.`);
      }
  }
  if (u.missing) {
    addEn("What's missing?");
    for (const w of u.missing) addEn(`A ${w.en}!`);
  }
  if (u.canyou) {
    addEn("Yes, I can.");
    addEn("No, I can't.");
    for (const v of ["swim", "fly", "run", "hop", "jump", "sing"]) addEn(`Can you ${v}?`);
  }
}

// истории: строки, отдельные слова (по нажатию), вопросы
for (const st of STORIES) {
  for (const pn of st.panels) {
    addEn(pn.text);
    pn.text.split(" ").forEach((tok) => addEn(tok.replace(/[^a-z' ]/gi, "")));
  }
  for (const q of st.questions) {
    addRu(q.q);
    q.opts.forEach((o) => /[a-z]/i.test(o) && addEn(o.replace(/[^a-z' ,.!?]/gi, "")));
  }
}

// раздел «Читаем»
const ruLow = (s) => s.toLowerCase().replace(/-/g, "");
for (const [g, v] of Object.entries(RU_LETTERS)) {
  addRu(`Буква ${g}`);
  addRu(v.key);
}
for (const lv of RU_LEVELS) {
  lv.syl.forEach((s) => addRu(ruLow(s)));
  lv.words.forEach((x) => addRu(ruLow(x.w)));
}
for (const [, v] of Object.entries(EN_SOUNDS)) addEn(v.key);
for (const lv of EN_LEVELS) lv.words.forEach((x) => addEn(x.w));

// буквы для обводки
"abcdefghijklmnopqrstuvwxyz".split("").forEach(addEn);

// фразы прямо из кода (Voice.say("…"), Voice.ru("…"), подсказки hintOnce)
for (const f of ["js/app.js", "js/lesson.js", "js/engage.js", "js/reading.js"]) {
  const src = fs.readFileSync(path.join(root, f), "utf8");
  for (const m of src.matchAll(/Voice\.say\("([^"]+)"(?:,\s*\{([^}]*)\})?\)/g)) (/lang:\s*"ru/.test(m[2] || "") ? addRu : addEn)(m[1]);
  for (const m of src.matchAll(/Voice\.ru\("([^"]+)"\)/g)) addRu(m[1]);
  for (const m of src.matchAll(/hintOnce\("[^"]+",\s*"([^"]+)"\)/g)) addRu(m[1]);
  // подсказки с выбором по условию: hintOnce(a ? "…" : "…", b ? "…" : "…")
  for (const line of src.split("\n").filter((l) => l.includes("hintOnce(")))
    for (const m of line.matchAll(/"([^"]*[А-Яа-яЁё][^"]*)"/g)) addRu(m[1]);
  for (const m of src.matchAll(/Voice\.ru\(stars === 3 \? "([^"]+)" : "([^"]+)"\)/g)) {
    addRu(m[1]);
    addRu(m[2]);
  }
}
// составные русские фразы
for (const s of SKILLS) addRu("Молодец! Ты научился новому трюку: " + s.name);
for (const c of CAREER) addRu("Тебя перевели в " + c);

const list = [
  ...[...en].sort().map((text) => ({ id: clipId("en", text), lang: "en", text })),
  ...[...ru].sort().map((text) => ({ id: clipId("ru", text), lang: "ru", text })),
];
const ids = new Set();
for (const x of list) {
  if (ids.has(x.id)) throw new Error("Совпадение хэшей: " + x.text);
  ids.add(x.id);
}
fs.mkdirSync(path.join(root, "audio"), { recursive: true });
fs.writeFileSync(path.join(root, "audio/texts.json"), JSON.stringify(list, null, 0).replace(/\},\{/g, "},\n{"));
console.log(`en: ${en.size}, ru: ${ru.size}, всего: ${list.length}`);
