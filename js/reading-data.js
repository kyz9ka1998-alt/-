// Обучение чтению: русский букварь (по методике Жуковой: звук → слияние → слог → слово)
// и английская фонетика (synthetic phonics, порядок звуков как в Jolly Phonics).
//
// ph — звук в международной транскрипции (IPA); по ней нейросеть озвучивает отдельный звук.

// ---------- Русский ----------
const RU_VOWELS = "АОУЫИЭЕЁЮЯ";

const RU_LETTERS = {
  А: { ph: "a", key: "арбуз", pic: "🍉" },
  У: { ph: "u", key: "утка", pic: "🦆" },
  О: { ph: "o", key: "облако", pic: "☁️" },
  М: { ph: "mːː", key: "мак", pic: "🌺" },
  С: { ph: "sːː", key: "сыр", pic: "🧀" },
  Х: { ph: "xːː", key: "хлеб", pic: "🍞" },
  Р: { ph: "r", key: "рыба", pic: "🐟" },
  Ш: { ph: "ʃːː", key: "шар", pic: "🎈" },
  Ы: { ph: "ɨ", key: "мышка", pic: "🐭", note: "Звук «ы» не бывает в начале слова: мЫшка, сЫр" },
  Л: { ph: "lːː", key: "лиса", pic: "🦊" },
  Н: { ph: "nːː", key: "нос", pic: "👃" },
  К: { ph: "k", key: "кот", pic: "🐱" },
  Т: { ph: "t", key: "торт", pic: "🎂" },
  П: { ph: "p", key: "пингвин", pic: "🐧" },
  И: { ph: "i", key: "иголка", pic: "🪡" },
};

// w — слово (дефис отделяет слоги для подсказки), pic — картинка
const RU_LEVELS = [
  { id: "ru1", title: "А и У", letters: ["А", "У"], syl: ["АУ", "УА"], words: [{ w: "АУ", pic: "🗣️" }, { w: "УА", pic: "👶" }] },
  { id: "ru2", title: "О", letters: ["О"], syl: ["АУ", "УА", "ОУ"], words: [{ w: "АУ", pic: "🗣️" }, { w: "УА", pic: "👶" }] },
  { id: "ru3", title: "М", letters: ["М"], syl: ["МА", "МО", "МУ", "АМ", "ОМ", "УМ"], words: [{ w: "МА-МА", pic: "👩" }, { w: "МУ-МУ", pic: "🐮" }] },
  { id: "ru4", title: "С", letters: ["С"], syl: ["СА", "СО", "СУ", "АС", "ОС", "УС"], words: [{ w: "О-СА", pic: "🐝" }, { w: "СОМ", pic: "🐟" }, { w: "МА-МА", pic: "👩" }] },
  { id: "ru5", title: "Х", letters: ["Х"], syl: ["ХА", "ХО", "ХУ", "АХ", "ОХ", "УХ"], words: [{ w: "МУ-ХА", pic: "🪰" }, { w: "МОХ", pic: "🌿" }, { w: "О-СА", pic: "🐝" }] },
  { id: "ru6", title: "Р", letters: ["Р"], syl: ["РА", "РО", "РУ", "АР", "ОР", "УР"], words: [{ w: "РО-МА", pic: "👦" }, { w: "РА-МА", pic: "🖼️" }, { w: "РО-СА", pic: "💧" }, { w: "ХОР", pic: "🎤" }] },
  { id: "ru7", title: "Ш", letters: ["Ш"], syl: ["ША", "ШО", "ШУ", "АШ", "ОШ", "УШ"], words: [{ w: "ШАР", pic: "🎈" }, { w: "ШУМ", pic: "📢" }, { w: "МА-ША", pic: "👧" }, { w: "РО-МА", pic: "👦" }] },
  { id: "ru8", title: "Ы", letters: ["Ы"], syl: ["МЫ", "СЫ", "РЫ", "ХЫ"], words: [{ w: "СЫР", pic: "🧀" }, { w: "ША-РЫ", pic: "🎈🎈" }, { w: "У-СЫ", pic: "🥸" }, { w: "СО-МЫ", pic: "🐟🐟" }] },
  { id: "ru9", title: "Л", letters: ["Л"], syl: ["ЛА", "ЛО", "ЛУ", "ЛЫ", "АЛ", "ОЛ"], words: [{ w: "МЫ-ЛО", pic: "🧼" }, { w: "ЛА-МА", pic: "🦙" }, { w: "ША-ЛАШ", pic: "⛺" }, { w: "МА-ЛЫШ", pic: "👶" }] },
  { id: "ru10", title: "Н", letters: ["Н"], syl: ["НА", "НО", "НУ", "НЫ", "АН", "ОН"], words: [{ w: "НОС", pic: "👃" }, { w: "СОН", pic: "😴" }, { w: "СЛОН", pic: "🐘" }, { w: "ЛУ-НА", pic: "🌙" }] },
  { id: "ru11", title: "К", letters: ["К"], syl: ["КА", "КО", "КУ", "АК", "ОК", "УК"], words: [{ w: "СОК", pic: "🧃" }, { w: "ЛУК", pic: "🧅" }, { w: "РУ-КА", pic: "✋" }, { w: "КОШ-КА", pic: "🐈" }] },
  { id: "ru12", title: "Т", letters: ["Т"], syl: ["ТА", "ТО", "ТУ", "ТЫ", "АТ", "ОТ"], words: [{ w: "КОТ", pic: "🐱" }, { w: "ТОРТ", pic: "🎂" }, { w: "РОТ", pic: "👄" }, { w: "ТРАК-ТОР", pic: "🚜" }] },
  { id: "ru13", title: "П", letters: ["П"], syl: ["ПА", "ПО", "ПУ", "ПЫ", "АП", "УП"], words: [{ w: "ПА-ПА", pic: "👨" }, { w: "ЛА-ПА", pic: "🐾" }, { w: "СУП", pic: "🍲" }, { w: "ПУШ-КА", pic: "💣" }] },
  { id: "ru14", title: "И", letters: ["И"], syl: ["МИ", "ЛИ", "НИ", "КИ", "ТИ", "ПИ"], words: [{ w: "КИТ", pic: "🐳" }, { w: "ЛИ-СА", pic: "🦊" }, { w: "РИС", pic: "🍚" }, { w: "МИШ-КА", pic: "🧸" }] },
  {
    id: "ru15", title: "Читаем фразы", letters: [], syl: [],
    words: [{ w: "МА-МА МЫ-ЛА РА-МУ", pic: "👩🖼️" }, { w: "У КО-ШКИ ЛА-ПА", pic: "🐈🐾" }, { w: "РО-МА И ПА-ПА", pic: "👦👨" }, { w: "У СЛО-НА НОС", pic: "🐘👃" }],
  },
];

// ---------- Английский (phonics) ----------
// Звуки, а не названия букв! «a» читается как [æ] в слове ant.
const EN_SOUNDS = {
  s: { ph: "sːː", key: "snake", pic: "🐍" },
  a: { ph: "a", key: "ant", pic: "🐜" },
  t: { ph: "t", key: "tiger", pic: "🐯" },
  i: { ph: "ɪ", key: "insect", pic: "🐛" },
  p: { ph: "p", key: "pig", pic: "🐷" },
  n: { ph: "nːː", key: "nest", pic: "🪺" },
  c: { ph: "k", key: "cat", pic: "🐱" },
  k: { ph: "k", key: "kite", pic: "🪁" },
  e: { ph: "ɛ", key: "egg", pic: "🥚" },
  h: { ph: "h", key: "hat", pic: "🎩" },
  r: { ph: "ɹːː", key: "rabbit", pic: "🐇" },
  m: { ph: "mːː", key: "mouse", pic: "🐭" },
  d: { ph: "d", key: "dog", pic: "🐶" },
  g: { ph: "ɡ", key: "goat", pic: "🐐" },
  o: { ph: "ɒ", key: "octopus", pic: "🐙" },
  u: { ph: "ʌ", key: "umbrella", pic: "☂️" },
  l: { ph: "lːː", key: "lion", pic: "🦁" },
  f: { ph: "fːː", key: "fish", pic: "🐟" },
  b: { ph: "b", key: "ball", pic: "⚽" },
  j: { ph: "dʒ", key: "jam", pic: "🍓" },
  z: { ph: "zːː", key: "zebra", pic: "🦓" },
  w: { ph: "w", key: "web", pic: "🕸️" },
  v: { ph: "vːː", key: "van", pic: "🚐" },
  x: { ph: "ks", key: "fox", pic: "🦊", note: "x читается [кс], обычно в конце слова: fox, box" },
  y: { ph: "j", key: "yo-yo", pic: "🪀" },
  sh: { ph: "ʃːː", key: "ship", pic: "🚢", note: "Две буквы — один звук!" },
  ch: { ph: "tʃ", key: "chick", pic: "🐥", note: "Две буквы — один звук!" },
  th: { ph: "θːː", key: "three", pic: "3️⃣", note: "Кончик языка между зубами!" },
  ck: { ph: "k", key: "duck", pic: "🦆", note: "ck в конце слова — просто [к]" },
  ee: { ph: "iː", key: "bee", pic: "🐝", note: "Две буквы — долгий звук [ии]" },
  oo: { ph: "uː", key: "moon", pic: "🌙", note: "Две буквы — долгий звук [уу]" },
  ai: { ph: "eɪ", key: "rain", pic: "🌧️", note: "ai читается [эй]" },
  oa: { ph: "əʊ", key: "boat", pic: "⛵", note: "oa читается [оу]" },
};

// w — слово; pic — картинка (если нет — слово только читаем и слушаем)
const EN_LEVELS = [
  { id: "en1", title: "s a t", sounds: ["s", "a", "t"], words: [{ w: "at" }, { w: "sat" }, { w: "as" }] },
  { id: "en2", title: "i p n", sounds: ["i", "p", "n"], words: [{ w: "pin", pic: "📌" }, { w: "pan", pic: "🍳" }, { w: "ant", pic: "🐜" }, { w: "tap", pic: "🚰" }, { w: "nap", pic: "😴" }, { w: "tin", pic: "🥫" }] },
  { id: "en3", title: "c k e", sounds: ["c", "k", "e"], words: [{ w: "cat", pic: "🐱" }, { w: "cap", pic: "🧢" }, { w: "pen", pic: "🖊️" }, { w: "ten", pic: "🔟" }, { w: "net", pic: "🥅" }, { w: "kit" }] },
  { id: "en4", title: "h r m d", sounds: ["h", "r", "m", "d"], words: [{ w: "hat", pic: "🎩" }, { w: "hen", pic: "🐔" }, { w: "man", pic: "👨" }, { w: "map", pic: "🗺️" }, { w: "rat", pic: "🐀" }, { w: "red", pic: "🟥" }] },
  { id: "en5", title: "g o u", sounds: ["g", "o", "u"], words: [{ w: "dog", pic: "🐶" }, { w: "pig", pic: "🐷" }, { w: "cup", pic: "☕" }, { w: "sun", pic: "☀️" }, { w: "nut", pic: "🥜" }, { w: "hug", pic: "🤗" }] },
  { id: "en6", title: "l f b", sounds: ["l", "f", "b"], words: [{ w: "bed", pic: "🛏️" }, { w: "bag", pic: "👜" }, { w: "bat", pic: "🦇" }, { w: "leg", pic: "🦵" }, { w: "log", pic: "🪵" }, { w: "bus", pic: "🚌" }] },
  { id: "en7", title: "j z w v x y", sounds: ["j", "z", "w", "v", "x", "y"], words: [{ w: "jam", pic: "🍓" }, { w: "zip", pic: "🤐" }, { w: "web", pic: "🕸️" }, { w: "van", pic: "🚐" }, { w: "box", pic: "📦" }, { w: "fox", pic: "🦊" }, { w: "six", pic: "6️⃣" }, { w: "yes" }] },
  { id: "en8", title: "sh ch th ck", sounds: ["sh", "ch", "th", "ck"], words: [{ w: "ship", pic: "🚢" }, { w: "fish", pic: "🐟" }, { w: "chip", pic: "🍟" }, { w: "bath", pic: "🛁" }, { w: "duck", pic: "🦆" }, { w: "sock", pic: "🧦" }] },
  { id: "en9", title: "ee oo", sounds: ["ee", "oo"], words: [{ w: "bee", pic: "🐝" }, { w: "tree", pic: "🌳" }, { w: "feet", pic: "🦶" }, { w: "sheep", pic: "🐑" }, { w: "moon", pic: "🌙" }, { w: "zoo", pic: "🦁" }] },
  { id: "en10", title: "ai oa", sounds: ["ai", "oa"], words: [{ w: "rain", pic: "🌧️" }, { w: "snail", pic: "🐌" }, { w: "boat", pic: "⛵" }, { w: "goat", pic: "🐐" }, { w: "coat", pic: "🧥" }, { w: "soap", pic: "🧼" }] },
  {
    id: "en11", title: "Tricky words", sounds: [], tricky: true,
    words: [{ w: "I" }, { w: "the" }, { w: "to" }, { w: "he" }, { w: "she" }, { w: "we" }, { w: "me" }, { w: "go" }, { w: "no" }, { w: "my" }],
  },
  {
    id: "en12", title: "Sentences", sounds: [], sentences: true,
    words: [{ w: "I can see a cat.", pic: "🐱" }, { w: "The dog is on a log.", pic: "🐶🪵" }, { w: "A fish in a dish.", pic: "🐟🥣" }, { w: "The hen is red.", pic: "🐔" }, { w: "I am Roman.", pic: "👦" }, { w: "A bee on the moon.", pic: "🐝🌙" }],
  },
];

// Разбор английского слова на звуки: сначала двухбуквенные сочетания
function enGraphemes(word) {
  const out = [];
  const w = word.toLowerCase();
  for (let i = 0; i < w.length; ) {
    const two = w.slice(i, i + 2);
    if (EN_SOUNDS[two]) {
      out.push(two);
      i += 2;
    } else {
      out.push(w[i]);
      i += 1;
    }
  }
  return out;
}

// Имя файла со звуком: audio/phonemes/<lang>-<коды символов>.mp3 (без кириллицы в именах файлов)
function phonemeFile(lang, g) {
  return lang + "-" + [...g].map((c) => c.codePointAt(0).toString(16)).join("_");
}

// Все звуки для озвучки нейросетью (tools/phonemes.py)
function phonemeList() {
  return [
    ...Object.entries(RU_LETTERS).map(([g, v]) => ({ file: phonemeFile("ru", g), ph: v.ph })),
    ...Object.entries(EN_SOUNDS).map(([g, v]) => ({ file: phonemeFile("en", g), ph: v.ph })),
  ];
}
