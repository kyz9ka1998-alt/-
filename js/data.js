// Учебная программа по книге «Английский для малышей» (Шишкова, Вербовская, под ред. Н. А. Бонк).
//
// Слово: { en, ru, ipa (транскрипция), read (как читается русскими буквами), pic, alt (похожие варианты
//          для распознавания речи), ex: [пример по-английски, перевод] }
// pic: "эмодзи" | { color } (цветной кружок) | { svg: "hat"|"cap", color } (нарисованная вещь нужного цвета)
//
// Фраза: { en, ru, read, note (когда так говорят), alt }
//
// Дополнительные задания юнита:
//   rhymes:  [{ a: слово, b: рифма, wrong: [неверные варианты] }]       — «I can see a cat and a …»
//   counts:  [{ word, max }]                                              — «How many cats?»
//   pairs:   [{ left: pic, leftEn, right: pic, rightEn, say }]           — «Найди пару» (кто что любит)
//   dialogs: [{ who, whoEn, line, ru, give, options, reply }]              — диалог: дай нужное и ответь
//   builds:  [фраза для сборки из слов]

const W = {
  // --- урок 18 ---
  cat: { en: "cat", ru: "кошка", ipa: "kæt", read: "кэт", pic: "🐱", plural: "cats", alt: ["cut", "kat", "cap", "cats", "kit"] },
  dog: { en: "dog", ru: "собака", ipa: "dɒɡ", read: "дог", pic: "🐶", plural: "dogs", alt: ["dug", "doug", "dogs", "duck", "dark"] },
  cow: { en: "cow", ru: "корова", ipa: "kaʊ", read: "кау", pic: "🐮", plural: "cows", alt: ["cows", "how", "car", "ciao", "kau"] },
  frog: { en: "frog", ru: "лягушка", ipa: "frɒɡ", read: "фрог", pic: "🐸", plural: "frogs", alt: ["frock", "fog", "frogs", "frag", "frank"] },
  bird: { en: "bird", ru: "птичка", ipa: "bɜːd", read: "бёд", pic: "🐦", plural: "birds", alt: ["bert", "bud", "birds", "word", "bed"] },
  bat: { en: "bat", ru: "летучая мышь", ipa: "bæt", read: "бэт", pic: "🦇", plural: "bats", alt: ["bad", "bet", "but", "bats", "back"] },
  // слова для рифм
  twig: { en: "twig", ru: "веточка", ipa: "twɪɡ", read: "твиг", pic: "🌿", alt: ["twigs", "big", "tweak"] },
  pig: { en: "pig", ru: "поросёнок", ipa: "pɪɡ", read: "пиг", pic: "🐷", alt: ["big", "pick", "pigs", "peg"] },
  star: { en: "star", ru: "звезда", ipa: "stɑː", read: "ста", pic: "⭐", alt: ["stars", "stah", "store"] },
  car: { en: "car", ru: "машина", ipa: "kɑː", read: "ка", pic: "🚗", alt: ["cars", "ka", "cut", "kar"] },

  // --- урок 19 ---
  yellow: { en: "yellow", ru: "жёлтый", ipa: "ˈjeləʊ", read: "йе́лоу", pic: { color: "#fdd835" }, alt: ["yello", "hello", "jello", "yell"] },
  brown: { en: "brown", ru: "коричневый", ipa: "braʊn", read: "браун", pic: { color: "#7b4a24" }, alt: ["brownie", "round", "crown", "brawn", "bron"] },
  hat: { en: "hat", ru: "шляпа", ipa: "hæt", read: "хэт", pic: { svg: "hat", color: "#e0a030" }, alt: ["had", "hut", "hats", "cat", "hot"] },
  cap: { en: "cap", ru: "кепка", ipa: "kæp", read: "кэп", pic: { svg: "cap", color: "#3a6fd8" }, alt: ["cup", "cab", "caps", "cop", "cat"] },
  dance: { en: "dance", ru: "танцевать", ipa: "dɑːns", read: "данс", pic: "💃", alt: ["dans", "dancing", "dense", "thanks", "dancer"] },
  sing: { en: "sing", ru: "петь", ipa: "sɪŋ", read: "синг", pic: "🎤", alt: ["sin", "sang", "seeing", "thing", "singing", "sink"] },

  // --- урок 20 ---
  honey: { en: "honey", ru: "мёд", ipa: "ˈhʌni", read: "ха́ни", pic: "🍯", alt: ["hunny", "hani", "money", "funny", "hockey"] },
  cabbage: { en: "cabbage", ru: "капуста", ipa: "ˈkæbɪdʒ", read: "кэ́бидж", pic: "🥬", alt: ["cabbages", "cab itch", "cabbie", "kebab"] },
  corn: { en: "corn", ru: "кукуруза", ipa: "kɔːn", read: "кон", pic: "🌽", alt: ["con", "corner", "cone", "cohn", "khan"] },
  cheese: { en: "cheese", ru: "сыр", ipa: "tʃiːz", read: "чиз", pic: "🧀", alt: ["chees", "cheez", "she's", "jeez", "cheeze", "trees"] },
  milk: { en: "milk", ru: "молоко", ipa: "mɪlk", read: "милк", pic: "🥛", alt: ["mil", "milky", "melk", "milks"] },
  meat: { en: "meat", ru: "мясо", ipa: "miːt", read: "мит", pic: "🍖", alt: ["meet", "mead", "mit", "neat", "me"] },

  // --- урок 21 ---
  mouse: { en: "mouse", ru: "мышка", ipa: "maʊs", read: "маус", pic: "🐭", alt: ["mice", "mouth", "mous", "moose", "mows"] },
  cock: { en: "cock", ru: "петух", ipa: "kɒk", read: "кок", pic: "🐓", alt: ["rooster", "cook", "coke", "cork", "rock"] },
  fox: { en: "fox", ru: "лиса", ipa: "fɒks", read: "фокс", pic: "🦊", alt: ["fax", "folks", "fog", "box", "socks", "fucks"] },
  hare: { en: "hare", ru: "заяц", ipa: "heə", read: "хэа", pic: "🐰", alt: ["hair", "here", "rabbit", "hear", "air", "her"] },
  chick: { en: "chick", ru: "цыплёнок", ipa: "tʃɪk", read: "чик", pic: "🐥", alt: ["check", "chip", "cheek", "chicken", "chic"] },
  bear: { en: "bear", ru: "медведь", ipa: "beə", read: "бэа", pic: "🐻", alt: ["bare", "bar", "beer", "pear", "where", "bed"] },

  // --- бонус: футбол ---
  ball: { en: "ball", ru: "мяч", ipa: "bɔːl", read: "бол", pic: "⚽", alt: ["bowl", "paul", "bol", "balls", "fall", "bowel"] },
  goal: { en: "goal", ru: "гол / ворота", ipa: "ɡəʊl", read: "гоул", pic: "🥅", alt: ["gold", "go", "girl", "call", "cole", "goals"] },
  boots: { en: "boots", ru: "бутсы", ipa: "buːts", read: "бутс", pic: "👟", alt: ["boot", "boats", "boat", "books", "bootz"] },
  kick: { en: "kick", ru: "удар ногой", ipa: "kɪk", read: "кик", pic: "🦵", alt: ["kik", "kicks", "quick", "keep", "kid"] },
  run: { en: "run", ru: "бежать", ipa: "rʌn", read: "ран", pic: "🏃", alt: ["ran", "fun", "running", "won", "rum"] },
  cup: { en: "cup", ru: "кубок", ipa: "kʌp", read: "кап", pic: "🏆", alt: ["cap", "cop", "cub", "cups", "come"] },
};

// примеры к словам (из учебника, где возможно)
const EX = {
  cat: ["I can see a cat.", "Я вижу кошку."],
  dog: ["I can see three dogs.", "Я вижу трёх собак."],
  cow: ["One cow — two cows.", "Одна корова — две коровы."],
  frog: ["Ten little frogs.", "Десять маленьких лягушек."],
  bird: ["Please sing, little bird!", "Спой, пожалуйста, птичка!"],
  bat: ["I can see a cat and a bat.", "Я вижу кошку и летучую мышь."],
  yellow: ["A yellow hat.", "Жёлтая шляпа."],
  brown: ["A big brown log.", "Большое коричневое бревно."],
  hat: ["Please give me a yellow hat!", "Дай мне, пожалуйста, жёлтую шляпу!"],
  cap: ["Please give me a brown cap!", "Дай мне, пожалуйста, коричневую кепку!"],
  dance: ["Please dance!", "Потанцуй, пожалуйста!"],
  sing: ["Please sing!", "Спой, пожалуйста!"],
  honey: ["The bear likes honey.", "Медведь любит мёд."],
  cabbage: ["The hare likes cabbage.", "Заяц любит капусту."],
  corn: ["Give me some corn.", "Дай мне немного кукурузы."],
  cheese: ["Give me some cheese.", "Дай мне немного сыра."],
  milk: ["Give me some milk.", "Дай мне немного молока."],
  meat: ["The dog likes meat.", "Собака любит мясо."],
  mouse: ["The mouse is hungry.", "Мышка голодная."],
  cock: ["The cock likes corn.", "Петух любит кукурузу."],
  fox: ["The fox is hungry.", "Лиса голодная."],
  hare: ["The hare likes cabbage.", "Заяц любит капусту."],
  chick: ["A yellow chick.", "Жёлтый цыплёнок."],
  bear: ["The bear likes honey.", "Медведь любит мёд."],
  ball: ["Kick the ball!", "Ударь по мячу!"],
  goal: ["Goal!", "Гол!"],
  boots: ["My boots.", "Мои бутсы."],
  kick: ["Kick the ball!", "Ударь по мячу!"],
  run: ["Run, Roman, run!", "Беги, Роман, беги!"],
  cup: ["We won the cup!", "Мы выиграли кубок!"],
};
Object.keys(EX).forEach((k) => (W[k].ex = EX[k]));

const P = {
  goodMorning: { en: "Good morning!", ru: "Доброе утро!", read: "гуд мо́нинг", note: "Так здороваются утром.", alt: ["good morning", "morning"] },
  glad: { en: "I'm glad to see you!", ru: "Я рад тебя видеть!", read: "айм глэд ту си ю", note: "Говорят при встрече с другом.", alt: [] },
  goodbye: { en: "Goodbye!", ru: "До свидания!", read: "гудба́й", note: "Говорят, когда уходят.", alt: ["good bye", "bye", "bye bye"] },
  seeDogs: { en: "I can see three dogs.", ru: "Я вижу трёх собак.", read: "ай кэн си сри догз", note: "«I can see» — «я вижу».", alt: [] },
  giveHat: { en: "Please give me a yellow hat!", ru: "Дай мне, пожалуйста, жёлтую шляпу!", read: "плиз гив ми э йе́лоу хэт", note: "«Please give me…» — так вежливо просят что-то дать.", alt: [] },
  hereYouAre: { en: "Here you are!", ru: "Вот, возьми!", read: "хиа ю а", note: "Говорят, когда что-то даёшь.", alt: ["here you go", "here you", "here are"] },
  withPleasure: { en: "With pleasure!", ru: "С удовольствием!", read: "уиз пле́жэ", note: "Так отвечают, когда рады что-то сделать.", alt: ["with pleasure", "pleasure", "with pleasant"] },
  pleaseDance: { en: "Please dance!", ru: "Потанцуй, пожалуйста!", read: "плиз данс", note: "Вежливая просьба.", alt: [] },
  pleaseSing: { en: "Please sing!", ru: "Спой, пожалуйста!", read: "плиз синг", note: "Вежливая просьба.", alt: [] },
  hungry: { en: "I'm hungry.", ru: "Я голодный.", read: "айм ха́нгри", note: "Говорят, когда хочется есть.", alt: ["i am hungry", "hungry"] },
  giveCheese: { en: "Give me some cheese.", ru: "Дай мне немного сыра.", read: "гив ми сам чиз", note: "«some» — «немного».", alt: [] },
  ohNo: { en: "Oh, no!", ru: "О нет!", read: "оу ноу", note: "Так говорят, когда не согласны или испугались.", alt: ["oh no", "no", "oh know", "o no"] },
  letsPlay: { en: "Let's play football!", ru: "Давай играть в футбол!", read: "летс плэй фу́тбол", note: "Приглашение поиграть.", alt: [] },
};

const UNITS = [
  {
    id: "u18",
    book: 18,
    title: "One cat — two cats",
    ru: "Одна кошка — две кошки",
    icon: "🐱",
    words: [W.cat, W.dog, W.cow, W.frog, W.bird, W.bat],
    phrases: [P.goodMorning, P.glad, P.goodbye],
    rhymes: [
      { a: W.cat, b: W.bat, wrong: [W.dog, W.star] },
      { a: W.dog, b: W.frog, wrong: [W.cat, W.car] },
      { a: W.twig, b: W.pig, wrong: [W.cow, W.bird] },
      { a: W.star, b: W.car, wrong: [W.frog, W.bat] },
    ],
    counts: [{ word: W.cat, max: 4 }, { word: W.dog, max: 5 }, { word: W.cow, max: 4 }, { word: W.frog, max: 6 }, { word: W.bird, max: 6 }, { word: W.bat, max: 6 }],
    builds: ["I can see three dogs.", "Good morning!", "I'm glad to see you!"],
    dialogs: [
      { who: "🐱", whoEn: "cat", line: "Good morning!", ru: "Кошка здоровается", reply: P.goodMorning },
      { who: "🐭", whoEn: "mouse", line: "Goodbye!", ru: "Мышка прощается", reply: P.goodbye },
    ],
  },
  {
    id: "u19",
    book: 19,
    title: "Please give me…",
    ru: "Дай мне, пожалуйста…",
    icon: "👒",
    words: [W.yellow, W.brown, W.hat, W.cap, W.dance, W.sing],
    phrases: [P.giveHat, P.hereYouAre, P.withPleasure],
    counts: [{ word: W.frog, max: 10 }],
    builds: ["Please give me a yellow hat!", "Here you are!", "With pleasure!"],
    dialogs: [
      {
        who: "🐮", whoEn: "cow", line: "Please give me a yellow hat!", ru: "Что просит корова? Послушай!", tr: "Дай мне, пожалуйста, жёлтую шляпу!",
        give: "yhat", options: ["yhat", "bhat", "ycap", "bcap"], reply: P.hereYouAre,
      },
      {
        who: "🐻", whoEn: "bear", line: "Please give me a brown cap!", ru: "Что просит медведь? Послушай!", tr: "Дай мне, пожалуйста, коричневую кепку!",
        give: "bcap", options: ["yhat", "bhat", "ycap", "bcap"], reply: P.hereYouAre,
      },
      { who: "🐻", whoEn: "bear", line: "Please dance!", ru: "Медведь просит потанцевать", reply: P.withPleasure },
      { who: "🐦", whoEn: "bird", line: "Please sing!", ru: "Просят птичку спеть", reply: P.withPleasure },
    ],
  },
  {
    id: "u20",
    book: 20,
    title: "I'm hungry",
    ru: "Я голодный",
    icon: "🍯",
    words: [W.honey, W.cabbage, W.corn, W.cheese, W.milk, W.meat],
    phrases: [P.hungry],
    pairs: [
      { left: W.bear, right: W.honey, say: "The bear likes honey." },
      { left: W.cock, right: W.corn, say: "The cock likes corn." },
      { left: W.hare, right: W.cabbage, say: "The hare likes cabbage." },
      { left: W.dog, right: W.meat, say: "The dog likes meat." },
      { left: W.mouse, right: W.cheese, say: "The mouse likes cheese." },
      { left: W.cat, right: W.milk, say: "The cat likes milk." },
    ],
    builds: ["I'm hungry.", "The bear likes honey."],
    dialogs: [
      { who: "🐻", whoEn: "bear", line: "I'm hungry.", ru: "Медведь голодный — что он любит?", give: "honey", options: ["honey", "meat", "corn"], reply: P.hereYouAre },
      { who: "🐰", whoEn: "hare", line: "I'm hungry.", ru: "Заяц голодный — что он любит?", give: "cabbage", options: ["cheese", "cabbage", "milk"], reply: P.hereYouAre },
    ],
  },
  {
    id: "u21",
    book: 21,
    title: "Give me some cheese",
    ru: "Дай мне немного сыра",
    icon: "🧀",
    words: [W.mouse, W.cock, W.fox, W.hare, W.chick, W.bear],
    phrases: [P.giveCheese, P.hereYouAre, P.ohNo],
    pairs: [
      { left: W.mouse, right: W.cheese, say: "The mouse likes cheese." },
      { left: W.cat, right: W.milk, say: "The cat likes milk." },
      { left: W.cock, right: W.corn, say: "The cock likes corn." },
      { left: W.bear, right: W.honey, say: "The bear likes honey." },
    ],
    builds: ["Give me some cheese.", "Here you are!", "Give me some milk."],
    dialogs: [
      { who: "🐭", whoEn: "mouse", line: "I'm hungry. Give me some cheese.", ru: "Что просит мышка? Послушай!", tr: "Я голодная. Дай мне немного сыра.", give: "cheese", options: ["cheese", "milk", "corn"], reply: P.hereYouAre },
      { who: "🐱", whoEn: "cat", line: "I'm hungry. Give me some milk.", ru: "Что просит кошка? Послушай!", tr: "Я голодная. Дай мне немного молока.", give: "milk", options: ["meat", "milk", "honey"], reply: P.hereYouAre },
      { who: "🐓", whoEn: "cock", line: "I'm hungry. Give me some corn.", ru: "Что просит петух? Послушай!", tr: "Я голодный. Дай мне немного кукурузы.", give: "corn", options: ["cabbage", "cheese", "corn"], reply: P.hereYouAre },
      { who: "🦊", whoEn: "fox", line: "I'm hungry. Please, give me a yellow chick.", ru: "Лиса просит цыплёнка! 😱", give: "NO", options: ["chick", "NO"], reply: P.ohNo },
    ],
  },
  {
    id: "football",
    book: null,
    title: "Football",
    ru: "Бонус: футбол",
    icon: "⚽",
    words: [W.ball, W.goal, W.boots, W.kick, W.run, W.cup],
    phrases: [P.letsPlay],
    builds: ["Let's play football!", "Kick the ball!"],
    dialogs: [{ who: "🧑‍🦱", whoEn: "coach", line: "Let's play football!", ru: "Тренер зовёт играть", reply: P.withPleasure }],
  },
];

// Предметы для диалогов «дай мне…»
const ITEMS = {
  yhat: { en: "a yellow hat", ru: "жёлтая шляпа", pic: { svg: "hat", color: "#fdd835" } },
  bhat: { en: "a brown hat", ru: "коричневая шляпа", pic: { svg: "hat", color: "#7b4a24" } },
  ycap: { en: "a yellow cap", ru: "жёлтая кепка", pic: { svg: "cap", color: "#fdd835" } },
  bcap: { en: "a brown cap", ru: "коричневая кепка", pic: { svg: "cap", color: "#7b4a24" } },
  honey: W.honey, meat: W.meat, corn: W.corn, cheese: W.cheese, milk: W.milk, cabbage: W.cabbage, chick: W.chick,
};

const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

// Навыки футболиста — по одному за каждую новую тренировку.
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

// Каждый юнит = 2 тренировки (новые слова, за каждую — навык) + матч (фразы и диалоги, за него — кубок).
function buildLessons() {
  const lessons = [];
  UNITS.forEach((u, ui) => {
    lessons.push({ id: `${u.id}-1`, unit: ui, kind: "train1", title: "Тренировка 1", words: u.words.slice(0, 3) });
    lessons.push({ id: `${u.id}-2`, unit: ui, kind: "train2", title: "Тренировка 2", words: u.words.slice(3, 6) });
    lessons.push({ id: `${u.id}-m`, unit: ui, kind: "match", title: "Матч за кубок", words: u.words.slice(), cup: u.id });
  });
  return lessons;
}

const LESSONS = buildLessons();
