// Учебная программа. Сейчас — стартовый набор слов.
// Когда появятся фото учебника, юниты заменяются на юниты из книги.
// Формат слова: { en: "слово", ru: "перевод", pic: "эмодзи" | {color: "#hex"}, alt: [похожие варианты для распознавания речи] }

const UNITS = [
  {
    id: "hello",
    title: "Hello!",
    ru: "Привет!",
    icon: "👋",
    words: [
      { en: "hello", ru: "привет", pic: "👋", alt: ["hallo", "hullo", "halo", "hi"] },
      { en: "goodbye", ru: "пока", pic: "👋🚪", alt: ["good bye", "bye", "bye bye", "good by"] },
      { en: "boy", ru: "мальчик", pic: "👦", alt: ["boi", "boys", "buoy"] },
      { en: "girl", ru: "девочка", pic: "👧", alt: ["girls", "gal", "goal"] },
      { en: "yes", ru: "да", pic: "👍", alt: ["yeah", "yep", "yas"] },
      { en: "no", ru: "нет", pic: "👎", alt: ["know", "now", "nope"] },
    ],
  },
  {
    id: "football",
    title: "Football",
    ru: "Футбол",
    icon: "⚽",
    words: [
      { en: "ball", ru: "мяч", pic: "⚽", alt: ["bowl", "paul", "bol", "balls", "fall"] },
      { en: "goal", ru: "гол / ворота", pic: "🥅", alt: ["gold", "go", "girl", "call"] },
      { en: "boots", ru: "бутсы", pic: "👟", alt: ["boot", "boats", "boat", "books"] },
      { en: "kick", ru: "удар", pic: "🦵", alt: ["kik", "kicks", "quick", "keep"] },
      { en: "run", ru: "бежать", pic: "🏃", alt: ["ran", "fun", "running", "won"] },
      { en: "cup", ru: "кубок", pic: "🏆", alt: ["cap", "cop", "cub", "cups"] },
    ],
  },
  {
    id: "colours",
    title: "Colours",
    ru: "Цвета",
    icon: "🎨",
    words: [
      { en: "red", ru: "красный", pic: { color: "#e53935" }, alt: ["read", "rad", "ret", "bread"] },
      { en: "blue", ru: "синий", pic: { color: "#1e66f5" }, alt: ["blew", "blu", "glue"] },
      { en: "green", ru: "зелёный", pic: { color: "#2e9e44" }, alt: ["grin", "greens", "queen"] },
      { en: "yellow", ru: "жёлтый", pic: { color: "#fdd835" }, alt: ["yello", "hello", "yell"] },
      { en: "black", ru: "чёрный", pic: { color: "#111111" }, alt: ["block", "back", "blak", "plaque"] },
      { en: "white", ru: "белый", pic: { color: "#ffffff" }, alt: ["wight", "why", "wait", "right"] },
    ],
  },
  {
    id: "numbers",
    title: "Numbers",
    ru: "Цифры",
    icon: "🔢",
    words: [
      { en: "one", ru: "один", pic: "1️⃣", alt: ["1", "won", "on", "want"] },
      { en: "two", ru: "два", pic: "2️⃣", alt: ["2", "to", "too", "tu", "do"] },
      { en: "three", ru: "три", pic: "3️⃣", alt: ["3", "tree", "free", "sri"] },
      { en: "four", ru: "четыре", pic: "4️⃣", alt: ["4", "for", "fore", "far"] },
      { en: "five", ru: "пять", pic: "5️⃣", alt: ["5", "fife", "fight", "vive"] },
      { en: "six", ru: "шесть", pic: "6️⃣", alt: ["6", "sex", "sicks", "sick", "sics"] },
    ],
  },
  {
    id: "animals",
    title: "Animals",
    ru: "Животные",
    icon: "🐶",
    words: [
      { en: "cat", ru: "кошка", pic: "🐱", alt: ["cut", "kat", "cap", "cats"] },
      { en: "dog", ru: "собака", pic: "🐶", alt: ["dug", "doug", "dogs", "duck"] },
      { en: "bird", ru: "птица", pic: "🐦", alt: ["bert", "bud", "birds", "word"] },
      { en: "fish", ru: "рыба", pic: "🐟", alt: ["fis", "fishes", "fist", "wish"] },
      { en: "frog", ru: "лягушка", pic: "🐸", alt: ["frock", "fog", "frogs", "frag"] },
      { en: "horse", ru: "лошадь", pic: "🐴", alt: ["horses", "hoarse", "house", "hose"] },
    ],
  },
  {
    id: "family",
    title: "My family",
    ru: "Моя семья",
    icon: "👨‍👩‍👦",
    words: [
      { en: "mum", ru: "мама", pic: "👩", alt: ["mom", "mam", "ma", "mama", "mommy", "mummy"] },
      { en: "dad", ru: "папа", pic: "👨", alt: ["dat", "dead", "daddy", "that", "dada"] },
      { en: "brother", ru: "брат", pic: "👦", alt: ["brothers", "bra the", "bother"] },
      { en: "sister", ru: "сестра", pic: "👧", alt: ["sisters", "cister", "system"] },
      { en: "baby", ru: "малыш", pic: "👶", alt: ["babe", "babies", "bebe"] },
      { en: "grandma", ru: "бабушка", pic: "👵", alt: ["granma", "grandmother", "grammar", "grandmom", "granny"] },
    ],
  },
];

// Навыки футболиста — по одному за каждый пройденный урок-тренировку.
const SKILLS = [
  { id: "juggle10", name: "Набивает мяч 10 раз", anim: "juggle", count: 10, icon: "⚽" },
  { id: "juggle20", name: "Набивает мяч 20 раз", anim: "juggle", count: 20, icon: "⚽" },
  { id: "shot", name: "Удар по воротам", anim: "shot", icon: "🥅" },
  { id: "knee", name: "Чеканка коленом", anim: "knee", count: 15, icon: "🦵" },
  { id: "juggle50", name: "Набивает мяч 50 раз", anim: "juggle", count: 50, icon: "🔥" },
  { id: "head", name: "Чеканка головой", anim: "head", count: 10, icon: "🧠" },
  { id: "roulette", name: "Финт «Рулетка»", anim: "roulette", icon: "🌀" },
  { id: "topcorner", name: "Удар в девятку", anim: "topcorner", icon: "🎯" },
  { id: "rainbow", name: "Финт «Радуга»", anim: "rainbow", icon: "🌈" },
  { id: "juggle100", name: "Набивает мяч 100 раз", anim: "juggle", count: 100, icon: "💯" },
  { id: "stepover", name: "Финт «Ножницы»", anim: "stepover", icon: "✂️" },
  { id: "bicycle", name: "Удар через себя", anim: "bicycle", icon: "🤸" },
];

// Ступени карьеры — по количеству выигранных кубков.
const CAREER = [
  "Дворовая команда",
  "Детская футбольная школа",
  "Футбольная академия",
  "Юношеская команда",
  "Молодёжный состав",
  "Основной состав",
  "Капитан команды ⭐",
];

const PLAYER = { name: "ROMAN", fullName: "Роман", number: 8, position: "Полузащитник" };

// Каждый юнит = 3 урока: 2 тренировки (по 3 новых слова, дают навык) + матч (повторение всех 6 слов, даёт кубок).
function buildLessons() {
  const lessons = [];
  let skillIdx = 0;
  UNITS.forEach((u, ui) => {
    lessons.push({ id: `${u.id}-1`, unit: ui, kind: "train", title: "Тренировка 1", words: u.words.slice(0, 3), skill: SKILLS[skillIdx++]?.id });
    lessons.push({ id: `${u.id}-2`, unit: ui, kind: "train", title: "Тренировка 2", words: u.words.slice(3, 6), skill: SKILLS[skillIdx++]?.id });
    lessons.push({ id: `${u.id}-m`, unit: ui, kind: "match", title: "Матч за кубок", words: u.words.slice(), cup: u.id });
  });
  return lessons;
}

const LESSONS = buildLessons();
