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
  // --- уроки 16–17 ---
  seven: { en: "seven", ru: "семь", ipa: "ˈsevn", read: "сэвн", pic: "7️⃣", alt: ["7", "heaven", "sevan", "kevin", "seventh"] },
  eight: { en: "eight", ru: "восемь", ipa: "eɪt", read: "эйт", pic: "8️⃣", alt: ["8", "ate", "eat", "hate", "aid"] },
  nine: { en: "nine", ru: "девять", ipa: "naɪn", read: "найн", pic: "9️⃣", alt: ["9", "nein", "line", "mine", "night"] },
  ten: { en: "ten", ru: "десять", ipa: "ten", read: "тэн", pic: "🔟", alt: ["10", "tan", "then", "town", "pen"] },

  // --- уроки 12–15 ---
  chair: { en: "chair", ru: "стул", ipa: "tʃeə", read: "чеа", pic: "🪑", alt: ["chairs", "cheer", "share", "chair's", "char"] },
  table: { en: "table", ru: "стол", ipa: "ˈteɪbl", read: "тэйбл", pic: { svg: "table", color: "#8fb3e0" }, alt: ["tables", "cable", "able", "label", "tabel"] },
  fish: { en: "fish", ru: "рыбка", ipa: "fɪʃ", read: "фиш", pic: "🐠", plural: "fish", alt: ["fis", "fishes", "fist", "wish", "dish"] },
  rat: { en: "rat", ru: "крыса", ipa: "ræt", read: "рэт", pic: "🐀", alt: ["rats", "red", "rad", "right", "wrath"] },
  wash: { en: "wash", ru: "мыть", ipa: "wɒʃ", read: "уош", pic: "🧼", alt: ["wosh", "watch", "was", "washing", "wish"] },
  face: { en: "face", ru: "лицо", ipa: "feɪs", read: "фэйс", pic: "😀", alt: ["faces", "case", "phase", "fase", "base"] },
  hands: { en: "hands", ru: "руки", ipa: "hændz", read: "хэндз", pic: "👐", alt: ["hand", "hens", "hans", "ants", "and"] },
  ears: { en: "ears", ru: "уши", ipa: "ɪəz", read: "иаз", pic: "👂", alt: ["ear", "years", "is", "here's", "eyes"] },
  neck: { en: "neck", ru: "шея", ipa: "nek", read: "нэк", pic: "🦒", alt: ["nick", "next", "neck's", "deck", "nek"] },
  rabbit: { en: "rabbit", ru: "кролик", ipa: "ˈræbɪt", read: "рэ́бит", pic: "🐇", alt: ["rabbits", "rabid", "robert", "rapid", "habit"] },
  goose: { en: "goose", ru: "гусь", ipa: "ɡuːs", read: "гус", pic: "🦢", alt: ["geese", "goose's", "juice", "loose", "goes"] },
  log: { en: "log", ru: "бревно", ipa: "lɒɡ", read: "лог", pic: "🪵", alt: ["logs", "lock", "dog", "lag", "look"] },
  dish: { en: "dish", ru: "блюдце", ipa: "dɪʃ", read: "диш", pic: "🥣", alt: ["dishes", "fish", "this", "dash", "deesh"] },
  plate: { en: "plate", ru: "тарелка", ipa: "pleɪt", read: "плэйт", pic: "🍽️", plural: "plates", alt: ["plates", "play", "played", "late", "plait"] },
  one: { en: "one", ru: "один", ipa: "wʌn", read: "уан", pic: "1️⃣", alt: ["1", "won", "on", "want", "when"] },
  two: { en: "two", ru: "два", ipa: "tuː", read: "ту", pic: "2️⃣", alt: ["2", "to", "too", "tu", "do"] },
  three: { en: "three", ru: "три", ipa: "θriː", read: "сри", pic: "3️⃣", alt: ["3", "tree", "free", "sri", "three's"] },
  four: { en: "four", ru: "четыре", ipa: "fɔː", read: "фо", pic: "4️⃣", alt: ["4", "for", "fore", "far", "floor"] },
  five: { en: "five", ru: "пять", ipa: "faɪv", read: "файв", pic: "5️⃣", alt: ["5", "fife", "fight", "vive", "hive"] },
  six: { en: "six", ru: "шесть", ipa: "sɪks", read: "сикс", pic: "6️⃣", alt: ["6", "sex", "sicks", "sick", "sics"] },

  // --- уроки 8–11 ---
  sleep: { en: "sleep", ru: "спать", ipa: "sliːp", read: "слип", pic: "😴", alt: ["slip", "sleeps", "sheep", "sleeping", "steep"] },
  wakeUp: { en: "wake up", ru: "просыпайся", ipa: "weɪk ʌp", read: "уэйк ап", pic: "⏰", alt: ["wakeup", "wake", "make up", "wakes up", "break up"] },
  draw: { en: "draw", ru: "рисовать", ipa: "drɔː", read: "дро", pic: "🖍️", alt: ["drawing", "drew", "dro", "straw", "throw"] },
  smile: { en: "smile", ru: "улыбаться", ipa: "smaɪl", read: "смайл", pic: "😊", alt: ["smiles", "mile", "smiley", "small", "style"] },
  standUp: { en: "stand up", ru: "встань", ipa: "stænd ʌp", read: "стэнд ап", pic: "🧍", alt: ["standup", "stand", "stand-up", "stands up"] },
  sitDown: { en: "sit down", ru: "садись", ipa: "sɪt daʊn", read: "сит даун", pic: "🪑", alt: ["sitdown", "sit", "set down", "sit-down", "sits down"] },
  house: { en: "house", ru: "дом", ipa: "haʊs", read: "хаус", pic: "🏠", alt: ["houses", "horse", "mouse", "how's", "haus"] },
  horse: { en: "horse", ru: "лошадь", ipa: "hɔːs", read: "хос", pic: "🐴", alt: ["horses", "hoarse", "house", "hose", "hoss"] },
  hen: { en: "hen", ru: "курица", ipa: "hen", read: "хэн", pic: "🐔", alt: ["hand", "ten", "him", "hens", "and"] },
  mat: { en: "mat", ru: "коврик", ipa: "mæt", read: "мэт", pic: { svg: "mat", color: "#c62828" }, alt: ["matt", "met", "map", "mad", "cat", "mud"] },
  teacup: { en: "cup", ru: "чашка", ipa: "kʌp", read: "кап", pic: "☕", plural: "cups", alt: ["cap", "cop", "cub", "cups", "come"] },
  spoon: { en: "spoon", ru: "ложка", ipa: "spuːn", read: "спун", pic: "🥄", plural: "spoons", alt: ["spoons", "soon", "spun", "spoon's", "moon"] },
  big: { en: "big", ru: "большой", ipa: "bɪɡ", read: "биг", pic: "🐘", alt: ["bag", "pig", "beg", "bik", "bigger"] },
  little: { en: "little", ru: "маленький", ipa: "ˈlɪtl", read: "литл", pic: "🐜", alt: ["litle", "lyttle", "middle", "liddle", "lil"] },
  red: { en: "red", ru: "красный", ipa: "red", read: "рэд", pic: { color: "#e53935" }, alt: ["read", "rad", "ret", "bread", "rat"] },
  green: { en: "green", ru: "зелёный", ipa: "ɡriːn", read: "грин", pic: { color: "#43a047" }, alt: ["grin", "greens", "queen", "cream", "clean"] },
  gray: { en: "gray", ru: "серый", ipa: "ɡreɪ", read: "грэй", pic: { color: "#9e9e9e" }, alt: ["grey", "grade", "great", "pray", "gay", "grays"] },
  white: { en: "white", ru: "белый", ipa: "waɪt", read: "уайт", pic: { color: "#ffffff" }, alt: ["wight", "why", "wait", "right", "whites"] },
  black: { en: "black", ru: "чёрный", ipa: "blæk", read: "блэк", pic: { color: "#111111" }, alt: ["block", "back", "blak", "plaque", "blank"] },
  blue: { en: "blue", ru: "синий", ipa: "bluː", read: "блу", pic: { color: "#1e66f5" }, alt: ["blew", "blu", "glue", "blues", "boo"] },

  // --- уроки 2–7 ---
  hello: { en: "hello", ru: "привет", ipa: "həˈləʊ", read: "хэло́у", pic: "👋", alt: ["hallo", "hullo", "halo", "hi", "helo"] },
  goodbye: { en: "goodbye", ru: "до свидания", ipa: "ɡʊdˈbaɪ", read: "гудба́й", pic: "🚶‍♂️🚪", alt: ["good bye", "bye", "bye bye", "good by", "goodby"] },
  name: { en: "name", ru: "имя", ipa: "neɪm", read: "нэйм", pic: "📛", alt: ["names", "nam", "nane", "same", "nay"] },
  jump: { en: "jump", ru: "прыгать", ipa: "dʒʌmp", read: "джамп", pic: "🦘", alt: ["jumps", "jam", "champ", "dump", "jumping"] },
  swim: { en: "swim", ru: "плавать", ipa: "swɪm", read: "суим", pic: "🏊", alt: ["swimming", "swing", "sweem", "swin", "slim"] },
  fly: { en: "fly", ru: "летать", ipa: "flaɪ", read: "флай", pic: "✈️", alt: ["flight", "fry", "flies", "fli", "flying"] },
  hop: { en: "hop", ru: "скакать", ipa: "hɒp", read: "хоп", pic: "🐰💨", alt: ["hope", "hob", "hot", "top", "hopping", "hip"] },
  stop: { en: "stop", ru: "стоп", ipa: "stɒp", read: "стоп", pic: "🛑", alt: ["stopp", "stops", "stock", "top", "stuff"] },
  boy: { en: "boy", ru: "мальчик", ipa: "bɔɪ", read: "бой", pic: "👦", alt: ["boi", "boys", "buoy", "toy", "bo"] },
  girl: { en: "girl", ru: "девочка", ipa: "ɡɜːl", read: "гёл", pic: "👧", alt: ["girls", "gal", "goal", "curl", "gurl"] },
  doll: { en: "doll", ru: "кукла", ipa: "dɒl", read: "дол", pic: "🪆", alt: ["dull", "dog", "dollar", "dolls", "dole", "tall"] },
  rooster: { en: "rooster", ru: "петушок", ipa: "ˈruːstə", read: "ру́стэ", pic: "🐓", alt: ["roster", "roosters", "rooster's", "cock", "booster"] },
  clock: { en: "clock", ru: "часы", ipa: "klɒk", read: "клок", pic: "🕰️", alt: ["clocks", "glock", "lock", "cloak", "block"] },
  stick: { en: "stick", ru: "палка", ipa: "stɪk", read: "стик", pic: "🏒", alt: ["sticks", "steak", "stack", "tick", "stik"] },
  box: { en: "box", ru: "коробка", ipa: "bɒks", read: "бокс", pic: "📦", alt: ["boxes", "books", "fox", "bucks", "bocks"] },
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
  seven: ["Seven little frogs.", "Семь маленьких лягушек."],
  eight: ["Eight little frogs.", "Восемь маленьких лягушек."],
  nine: ["Nine little frogs.", "Девять маленьких лягушек."],
  ten: ["Ten little frogs on a big brown log.", "Десять маленьких лягушек на большом коричневом бревне."],

  chair: ["Sit down on the chair!", "Сядь на стул!"],
  table: ["What's that? It's a table.", "Что это? Это стол."],
  fish: ["What's that? It's a fish.", "Что это? Это рыбка."],
  rat: ["What's this? It's a rat.", "Что это? Это крыса."],
  wash: ["Wash your face.", "Умой лицо."],
  face: ["Wash your face.", "Умой лицо."],
  hands: ["Wash your hands.", "Помой руки."],
  ears: ["Wash your ears.", "Помой уши."],
  neck: ["Wash your neck.", "Помой шею."],
  rabbit: ["A little rabbit.", "Маленький кролик."],
  goose: ["A big goose.", "Большой гусь."],
  log: ["A big brown log.", "Большое коричневое бревно."],
  dish: ["A dish and a fish.", "Блюдце и рыбка."],
  plate: ["A cup and a plate.", "Чашка и тарелка."],
  one: ["One cat.", "Одна кошка."],
  two: ["Two dogs.", "Две собаки."],
  three: ["Three frogs.", "Три лягушки."],
  four: ["Four cups.", "Четыре чашки."],
  five: ["Five spoons.", "Пять ложек."],
  six: ["Six plates.", "Шесть тарелок."],

  car: ["It's a car.", "Это машина."],
  star: ["I can see a star.", "Я вижу звезду."],
  twig: ["It's a twig.", "Это веточка."],
  sleep: ["Sleep!", "Спи!"],
  wakeUp: ["Wake up!", "Просыпайся!"],
  draw: ["Draw!", "Рисуй!"],
  smile: ["Smile!", "Улыбнись!"],
  standUp: ["Stand up!", "Встань!"],
  sitDown: ["Sit down!", "Садись!"],
  house: ["Is this a house? — Yes, it is.", "Это дом? — Да."],
  horse: ["Is this a horse?", "Это лошадь?"],
  hen: ["A big hen.", "Большая курица."],
  mat: ["A little mat.", "Маленький коврик."],
  teacup: ["Is this a little cup?", "Это маленькая чашка?"],
  spoon: ["A big spoon.", "Большая ложка."],
  big: ["A big chick.", "Большой цыплёнок."],
  little: ["A little chick.", "Маленький цыплёнок."],
  red: ["A red car.", "Красная машина."],
  green: ["A green frog.", "Зелёная лягушка."],
  gray: ["A gray mouse.", "Серая мышка."],
  white: ["A white chick.", "Белый цыплёнок."],
  black: ["A black bat.", "Чёрная летучая мышь."],
  blue: ["A blue cup.", "Синяя чашка."],

  hello: ["Hello! I'm Mike.", "Привет! Я Майк."],
  goodbye: ["Goodbye, my doll!", "До свидания, моя кукла!"],
  name: ["What's your name?", "Как тебя зовут?"],
  jump: ["I'm a bear. I can jump.", "Я медведь. Я умею прыгать."],
  swim: ["I'm a frog. I can swim.", "Я лягушка. Я умею плавать."],
  fly: ["Fly!", "Лети!"],
  hop: ["I'm a hare. I can hop.", "Я заяц. Я умею скакать."],
  stop: ["Stop!", "Стой!"],
  boy: ["I'm a boy.", "Я мальчик."],
  girl: ["I'm a girl.", "Я девочка."],
  doll: ["Goodbye, my doll!", "До свидания, моя кукла!"],
  rooster: ["A rooster and a pig.", "Петушок и поросёнок."],
  clock: ["A clock.", "Часы."],
  stick: ["A stick.", "Палка."],
  box: ["A box.", "Коробка."],
  pig: ["A pig.", "Поросёнок."],
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
  greyMouse: { en: "I'm a little grey mouse. I live in this big house.", ru: "Я маленькая серая мышка. Я живу в этом большом доме.", read: "айм э литл грэй маус. ай лив ин зис биг хаус", note: "«I live» — «я живу».", alt: [] },
  canYouSwim: { en: "Can you swim?", ru: "Ты умеешь плавать?", read: "кэн ю суим", note: "«Can you…?» — «Ты умеешь…?»", alt: ["can you swim", "you swim"] },
  yesICan: { en: "Yes, I can.", ru: "Да, умею.", read: "йес, ай кэн", note: "Ответ «да» на «Can you…?»", alt: ["yes i can", "yes", "yes can"] },
  noICant: { en: "No, I can't.", ru: "Нет, не умею.", read: "ноу, ай кант", note: "Ответ «нет» на «Can you…?»", alt: ["no i cant", "no i can't", "no i cannot", "no"] },
  iCanSeeCat: { en: "I can see a cat.", ru: "Я вижу кошку.", read: "ай кэн си э кэт", note: "«I can see» — «я вижу».", alt: ["i can see cat", "i see a cat"] },

  whatsThat: { en: "What's that?", ru: "Что то?", read: "уотс зэт", note: "«What's that?» — про то, что далеко. «What's this?» — про то, что рядом.", alt: ["what is that", "whats that", "what that"] },
  itsRat: { en: "It's a rat.", ru: "Это крыса.", read: "итс э рэт", note: "Так отвечают на «What's this?» и «What's that?».", alt: ["it is a rat", "a rat", "its a rat"] },
  comeHere: { en: "Come here, Mike.", ru: "Иди сюда, Майк.", read: "кам хиа, майк", note: "Так зовут кого-то подойти.", alt: ["come here", "come here mike"] },
  washFace: { en: "Wash your face.", ru: "Умой лицо.", read: "уош ё фэйс", note: "«your» — «твой».", alt: ["wash your face", "wash face"] },
  washHands: { en: "Wash your hands.", ru: "Помой руки.", read: "уош ё хэндз", note: "Перед едой — обязательно!", alt: ["wash your hands", "wash hands"] },
  bigGreenFrog: { en: "This is a big green frog.", ru: "Это большая зелёная лягушка.", read: "зис из э биг грин фрог", note: "Сначала размер (big), потом цвет (green).", alt: [] },
  bigWhiteDog: { en: "That's a big white dog.", ru: "То — большая белая собака.", read: "зэтс э биг уайт дог", note: "Сначала размер, потом цвет.", alt: [] },
  mayIComeIn: { en: "May I come in?", ru: "Можно войти?", read: "мэй ай кам ин", note: "Так вежливо спрашивают, можно ли войти.", alt: ["may i come in", "can i come in", "may come in"] },
  pleaseComeIn: { en: "Please come in.", ru: "Входи, пожалуйста.", read: "плиз кам ин", note: "Так отвечают гостю.", alt: ["please come in", "come in", "come in please"] },
  imSorry: { en: "I'm sorry.", ru: "Извините.", read: "айм со́ри", note: "Так извиняются.", alt: ["i am sorry", "sorry", "im sorry"] },
  imLate: { en: "I'm sorry. I'm late.", ru: "Извините, я опоздал.", read: "айм со́ри. айм лэйт", note: "Говорят, когда опоздали.", alt: ["sorry im late", "i am sorry i am late"] },

  whatsThis: { en: "What's this?", ru: "Что это?", read: "уотс зис", note: "Так спрашивают, что это за предмет.", alt: ["what is this", "whats this", "what this"] },
  itsHat: { en: "It's a hat.", ru: "Это шляпа.", read: "итс э хэт", note: "Так отвечают на «What's this?».", alt: ["it is a hat", "a hat", "its a hat"] },
  isThisBird: { en: "Is this a bird?", ru: "Это птичка?", read: "из зис э бёд", note: "Так спрашивают «Это …?».", alt: ["is it a bird", "this a bird"] },
  yesItIs: { en: "Yes, it is.", ru: "Да.", read: "йес, ит из", note: "Отвечают «да» на вопрос «Is this…?».", alt: ["yes it is", "yes", "yes it's"] },
  noItIsnt: { en: "No, it isn't.", ru: "Нет.", read: "ноу, ит изнт", note: "Отвечают «нет» на вопрос «Is this…?».", alt: ["no it isnt", "no it is not", "no it isn't", "no"] },
  thisIsFrog: { en: "This is a frog.", ru: "Это лягушка.", read: "зис из э фрог", note: "«this» — «это», про то, что рядом.", alt: ["this is frog", "this a frog"] },
  thatsDog: { en: "That's a dog.", ru: "То — собака.", read: "зэтс э дог", note: "«that» — «то», про то, что далеко.", alt: ["that is a dog", "thats a dog", "that a dog"] },
  wakeUpP: { en: "Wake up!", ru: "Просыпайся!", read: "уэйк ап", note: "Так будят утром.", alt: ["wake up", "wakeup"] },
  sitDownP: { en: "Sit down!", ru: "Садись!", read: "сит даун", note: "Просьба сесть.", alt: ["sit down", "sitdown"] },
  standUpP: { en: "Stand up!", ru: "Встань!", read: "стэнд ап", note: "Просьба встать.", alt: ["stand up", "standup"] },

  helloMike: { en: "Hello! I'm Mike.", ru: "Привет! Я Майк.", read: "хэло́у! айм майк", note: "Так здороваются и называют своё имя.", alt: [] },
  helloRoman: { en: "Hello! I'm Roman.", ru: "Привет! Я Роман.", read: "хэло́у! айм ро́ман", note: "Поздоровайся и назови своё имя.", alt: ["hello roman", "hello i am roman", "hello"] },
  goodbyeP: { en: "Goodbye!", ru: "До свидания!", read: "гудба́й", note: "Говорят, когда уходят.", alt: ["good bye", "bye", "bye bye"] },
  whatsName: { en: "What's your name?", ru: "Как тебя зовут?", read: "уотс ё нэйм", note: "Так спрашивают имя.", alt: ["what is your name", "whats your name", "what your name"] },
  imRoman: { en: "I'm Roman.", ru: "Я Роман.", read: "айм ро́ман", note: "Так отвечают на вопрос «What's your name?».", alt: ["i am roman", "roman", "im roman"] },
  myName: { en: "That's my name.", ru: "Это моё имя.", read: "зэтс май нэйм", note: "«my» — «мой, моё».", alt: ["that is my name", "my name"] },
  goodbyeDoll: { en: "Goodbye, my doll!", ru: "До свидания, моя кукла!", read: "гудба́й, май дол", note: "Так прощаются с игрушкой перед сном.", alt: [] },
  youAll: { en: "Goodbye, you all!", ru: "До свидания всем!", read: "гудба́й, ю ол", note: "«you all» — «вы все».", alt: ["goodbye you all", "bye you all"] },
  whoAreYou: { en: "Who are you?", ru: "Ты кто?", read: "ху а ю", note: "Так спрашивают «Кто ты?».", alt: ["who are you", "who r u", "who you"] },
  imBear: { en: "I'm a bear.", ru: "Я медведь.", read: "айм э бэа", note: "Так отвечают на «Who are you?».", alt: ["i am a bear", "a bear", "im bear"] },
  iCanSwim: { en: "I can swim.", ru: "Я умею плавать.", read: "ай кэн суим", note: "«I can» — «я умею, я могу».", alt: ["i can swim"] },
  iCanJump: { en: "I can jump.", ru: "Я умею прыгать.", read: "ай кэн джамп", note: "«I can» — «я умею, я могу».", alt: ["i can jump"] },
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
    id: "u02",
    book: "2–3",
    title: "Hello! What's your name?",
    ru: "Привет! Как тебя зовут?",
    icon: "👋",
    words: [W.hello, W.goodbye, W.name],
    phrases: [P.helloMike, P.whatsName, P.imRoman, P.myName],
    builds: ["Hello! I'm Mike.", "What's your name?", "That's my name."],
    dialogs: [
      { who: "👦", whoEn: "boy", line: "Hello! I'm Mike.", ru: "Майк здоровается. Поздоровайся и скажи, как тебя зовут!", reply: P.helloRoman },
      { who: "👧", whoEn: "girl", line: "What's your name?", ru: "Джейн спрашивает, как тебя зовут", reply: P.imRoman },
      { who: "👧", whoEn: "girl", line: "Goodbye!", ru: "Джейн прощается", reply: P.goodbyeP },
    ],
  },
  {
    id: "u04a",
    book: 4,
    title: "A bear, a hare",
    ru: "Медведь, заяц",
    icon: "🐻",
    words: [W.bear, W.hare, W.dog, W.frog],
    phrases: [],
    builds: ["A bear, a hare."],
    dialogs: [],
  },
  {
    id: "u04b",
    book: 4,
    title: "Run! Jump! Swim!",
    ru: "Беги! Прыгай! Плыви!",
    icon: "🏃",
    words: [W.run, W.jump, W.swim, W.fly, W.hop, W.stop],
    phrases: [
      { en: "Run!", ru: "Беги!", read: "ран", note: "Команда: беги!", alt: ["run", "ran"] },
      { en: "Stop!", ru: "Стой!", read: "стоп", note: "Команда: остановись!", alt: ["stop"] },
    ],
    builds: [],
    dialogs: [
      { who: "🐸", whoEn: "frog", line: "Hop!", ru: "Лягушка скачет. Скажи ей: «Плыви!»", reply: { en: "Swim!", ru: "Плыви!", read: "суим", alt: ["swim", "swimming"] } },
      { who: "🐻", whoEn: "bear", line: "Fly!", ru: "Медведь летит на самолёте. Скажи ему: «Стой!»", reply: { en: "Stop!", ru: "Стой!", read: "стоп", alt: ["stop"] } },
    ],
  },
  {
    id: "u05",
    book: 5,
    title: "Goodbye, my doll!",
    ru: "До свидания, моя кукла!",
    icon: "🪆",
    words: [W.boy, W.girl, W.doll, W.pig, W.rooster],
    phrases: [P.goodbyeDoll, P.youAll],
    builds: ["Goodbye, my doll!", "Goodbye, you all!"],
    dialogs: [
      { who: "👧", whoEn: "girl", line: "Goodbye, my doll!", ru: "Джейн идёт спать и прощается с игрушками. Попрощайся со всеми!", reply: P.youAll },
    ],
  },
  {
    id: "u06",
    book: 6,
    title: "Who are you?",
    ru: "Ты кто?",
    icon: "🦊",
    words: [W.bat, W.cat, W.ball, W.fox],
    phrases: [P.whoAreYou, P.imBear],
    rhymeLine: "a {a} and a",
    rhymes: [
      { a: W.dog, b: W.frog, wrong: [W.cat, W.bear] },
      { a: W.cat, b: W.bat, wrong: [W.fox, W.dog] },
      { a: W.bear, b: W.hare, wrong: [W.frog, W.ball] },
    ],
    builds: ["Who are you?", "I'm a fox."],
    dialogs: [
      { who: "🐻", whoEn: "bear", line: "Who are you?", ask: true, ru: "Ответь за медведя!", reply: P.imBear },
      { who: "🐰", whoEn: "hare", line: "Who are you?", ask: true, ru: "Ответь за зайца!", reply: { en: "I'm a hare.", ru: "Я заяц.", read: "айм э хэа", alt: [] } },
      { who: "🐶", whoEn: "dog", line: "Who are you?", ask: true, ru: "Ответь за собаку!", reply: { en: "I'm a dog.", ru: "Я собака.", read: "айм э дог", alt: [] } },
      { who: "🐸", whoEn: "frog", line: "Who are you?", ask: true, ru: "Ответь за лягушку!", reply: { en: "I'm a frog.", ru: "Я лягушка.", read: "айм э фрог", alt: [] } },
      { who: "🦊", whoEn: "fox", line: "Who are you?", ask: true, ru: "Ответь за лису!", reply: { en: "I'm a fox.", ru: "Я лиса.", read: "айм э фокс", alt: [] } },
    ],
  },
  {
    id: "u07",
    book: 7,
    title: "I can",
    ru: "Я умею",
    icon: "💪",
    words: [W.hat, W.clock, W.stick, W.box],
    phrases: [P.iCanSwim, P.iCanJump],
    pairs: [
      { left: W.hare, right: W.hop, rightText: true, say: "I'm a hare. I can hop." },
      { left: W.dog, right: W.run, rightText: true, say: "I'm a dog. I can run." },
      { left: W.bear, right: W.jump, rightText: true, say: "I'm a bear. I can jump." },
      { left: W.frog, right: W.swim, rightText: true, say: "I'm a frog. I can swim." },
    ],
    builds: ["I'm a frog. I can swim.", "I can jump.", "I'm a hare. I can hop."],
    dialogs: [
      { who: "🐰", whoEn: "hare", line: "Who are you?", ask: true, ru: "Ответь за зайца: кто ты и что умеешь?", reply: { en: "I'm a hare. I can hop.", ru: "Я заяц. Я умею скакать.", read: "айм э хэа. ай кэн хоп", alt: [] } },
      { who: "🐶", whoEn: "dog", line: "Who are you?", ask: true, ru: "Ответь за собаку: кто ты и что умеешь?", reply: { en: "I'm a dog. I can run.", ru: "Я собака. Я умею бегать.", read: "айм э дог. ай кэн ран", alt: [] } },
      { who: "🐸", whoEn: "frog", line: "Who are you?", ask: true, ru: "Ответь за лягушку: кто ты и что умеешь?", reply: { en: "I'm a frog. I can swim.", ru: "Я лягушка. Я умею плавать.", read: "айм э фрог. ай кэн суим", alt: [] } },
    ],
  },
  {
    id: "u08",
    book: 8,
    title: "What's this?",
    ru: "Что это?",
    icon: "🚗",
    words: [W.car, W.star, W.twig, W.mouse],
    phrases: [P.whatsThis, P.itsHat],
    rhymeLine: "a {a} and a",
    rhymes: [
      { a: W.hat, b: W.cat, wrong: [W.twig, W.fox] },
      { a: W.twig, b: W.pig, wrong: [W.cat, W.box] },
      { a: W.fox, b: W.box, wrong: [W.bear, W.frog] },
      { a: W.star, b: W.car, wrong: [W.dog, W.hare] },
      { a: W.frog, b: W.dog, wrong: [W.star, W.bat] },
    ],
    builds: ["What's this?", "It's a hat."],
    dialogs: [
      { who: "🐭", whoEn: "mouse", line: "What's this?", show: W.hat, ru: "Мышка-учительница спрашивает: что это?", reply: { en: "It's a hat.", ru: "Это шляпа.", read: "итс э хэт", alt: ["it is a hat", "a hat", "its a hat"] } },
      { who: "🐭", whoEn: "mouse", line: "What's this?", show: W.clock, ru: "Мышка-учительница спрашивает: что это?", reply: { en: "It's a clock.", ru: "Это часы.", read: "итс э клок", alt: ["it is a clock", "a clock", "its a clock"] } },
      { who: "🐭", whoEn: "mouse", line: "What's this?", show: W.car, ru: "Мышка-учительница спрашивает: что это?", reply: { en: "It's a car.", ru: "Это машина.", read: "итс э ка", alt: ["it is a car", "a car", "its a car"] } },
      { who: "🐭", whoEn: "mouse", line: "What's this?", show: W.twig, ru: "Мышка-учительница спрашивает: что это?", reply: { en: "It's a twig.", ru: "Это веточка.", read: "итс э твиг", alt: ["it is a twig", "a twig", "its a twig"] } },
      { who: "🐭", whoEn: "mouse", line: "What's this?", show: W.cat, ru: "Мышка-учительница спрашивает: что это?", reply: { en: "It's a cat.", ru: "Это кошка.", read: "итс э кэт", alt: ["it is a cat", "a cat", "its a cat"] } },
    ],
  },
  {
    id: "u08b",
    book: 8,
    title: "Wake up! Sit down!",
    ru: "Просыпайся! Садись!",
    icon: "⏰",
    words: [W.sleep, W.wakeUp, W.draw, W.smile, W.standUp, W.sitDown],
    phrases: [P.wakeUpP, P.standUpP, P.sitDownP],
    builds: [],
    dialogs: [
      { who: "🐰", whoEn: "hare", line: "Good morning!", show: W.wakeUp, ru: "Утро! Мама-зайчиха будит сынишку. Что она говорит?", reply: P.wakeUpP },
      { who: "🐰", whoEn: "hare", line: "Please!", show: W.sitDown, ru: "Мама-зайчиха просит сесть на стул. Скажи за неё!", reply: P.sitDownP },
    ],
  },
  {
    id: "u09",
    book: 9,
    title: "Yes, it is. No, it isn't",
    ru: "Да. Нет.",
    icon: "🏠",
    words: [W.bird, W.house, W.chick, W.horse],
    phrases: [P.isThisBird, P.yesItIs, P.noItIsnt],
    yesno: [W.bird, W.house, W.chick, W.horse, W.rooster],
    builds: ["Is this a bird?", "Yes, it is.", "No, it isn't."],
    dialogs: [],
  },
  {
    id: "u10",
    book: 10,
    title: "Big and little",
    ru: "Большой и маленький",
    icon: "🐘",
    words: [W.hen, W.mat, W.teacup, W.spoon, W.big, W.little],
    phrases: [{ en: "A big chick — a little chick.", ru: "Большой цыплёнок — маленький цыплёнок.", read: "э биг чик — э литл чик", note: "big — большой, little — маленький.", alt: [] }],
    sizes: [W.hat, W.chick, W.hen, W.mat, W.teacup, W.spoon, W.bird, W.star, W.ball],
    builds: ["Is this a big hat?", "It's a little cup."],
    dialogs: [],
  },
  {
    id: "u11",
    book: 11,
    title: "This is a frog. That's a dog",
    ru: "Это лягушка. То — собака",
    icon: "🎨",
    words: [W.red, W.green, W.gray, W.white, W.black, W.blue],
    phrases: [P.thisIsFrog, P.thatsDog],
    builds: ["This is a frog.", "That's a dog.", "This is a hare."],
    dialogs: [
      { who: "👦", whoEn: "boy", line: "That's a dog.", show: W.frog, ru: "Майк показывает на лягушку рядом с ним. Скажи: «Это лягушка»", reply: P.thisIsFrog },
      { who: "👧", whoEn: "girl", line: "This is a hare.", show: W.bear, ru: "Джейн показывает на медведя вдалеке. Скажи: «То — медведь»", reply: { en: "That's a bear.", ru: "То — медведь.", read: "зэтс э бэа", alt: ["that is a bear", "thats a bear", "that a bear"] } },
    ],
  },
  {
    id: "u12",
    book: 12,
    title: "What's this? What's that?",
    ru: "Что это? Что то?",
    icon: "🪑",
    words: [W.chair, W.table, W.fish, W.rat],
    phrases: [P.whatsThat, P.itsRat, P.comeHere],
    rhymeLine: "a {a} and a",
    rhymes: [
      { a: W.mouse, b: W.house, wrong: [W.cat, W.box] },
      { a: W.car, b: W.star, wrong: [W.bat, W.chick] },
      { a: W.chick, b: W.stick, wrong: [W.fox, W.car] },
      { a: W.rat, b: W.cat, wrong: [W.fox, W.pig] },
      { a: W.chair, b: W.bear, wrong: [W.dog, W.twig] },
    ],
    builds: ["What's that?", "It's a rat.", "Come here, Mike."],
    dialogs: [
      { who: "👧", whoEn: "girl", line: "What's that?", show: W.star, ru: "Джейн показывает на звезду вдалеке", reply: { en: "It's a star.", ru: "Это звезда.", read: "итс э ста", alt: ["it is a star", "a star", "its a star"] } },
      { who: "👧", whoEn: "girl", line: "What's this?", show: W.car, ru: "Джейн показывает на машину рядом", reply: { en: "It's a car.", ru: "Это машина.", read: "итс э ка", alt: ["it is a car", "a car", "its a car"] } },
      { who: "👦", whoEn: "boy", line: "What's that?", show: W.fish, ru: "Майк показывает на рыбку", reply: { en: "It's a fish.", ru: "Это рыбка.", read: "итс э фиш", alt: ["it is a fish", "a fish", "its a fish"] } },
      { who: "👦", whoEn: "boy", line: "What's this?", show: W.chair, ru: "Майк показывает на стул", reply: { en: "It's a chair.", ru: "Это стул.", read: "итс э чеа", alt: ["it is a chair", "a chair", "its a chair"] } },
    ],
  },
  {
    id: "u12b",
    book: 12,
    title: "Wash your face!",
    ru: "Умой лицо!",
    icon: "🧼",
    words: [W.wash, W.face, W.hands, W.ears, W.neck],
    phrases: [P.washFace, P.washHands],
    builds: ["Wash your face.", "Wash your hands.", "Wash your ears."],
    dialogs: [
      { who: "🐭", whoEn: "mouse", line: "Good morning!", show: W.hands, ru: "Мышонок умывается. Что ему сказать?", reply: P.washHands },
      { who: "🐭", whoEn: "mouse", line: "Good morning!", show: W.face, ru: "Мышонок умывается. Что ему сказать?", reply: P.washFace },
    ],
  },
  {
    id: "u13",
    book: 13,
    title: "What's missing?",
    ru: "Кто исчез?",
    icon: "🐇",
    words: [W.rabbit, W.goose, W.log, W.dish, W.cap],
    phrases: [P.bigGreenFrog, P.bigWhiteDog],
    missing: [W.rabbit, W.goose, W.fish, W.cow, W.log, W.dish, W.cap, W.bird],
    rhymeLine: "a {a} and a",
    rhymes: [
      { a: W.log, b: W.dog, wrong: [W.fish, W.hat] },
      { a: W.fish, b: W.dish, wrong: [W.log, W.mat] },
      { a: W.hat, b: W.mat, wrong: [W.dish, W.dog] },
    ],
    builds: ["This is a big green frog.", "That's a big white dog."],
    dialogs: [],
  },
  {
    id: "u14",
    book: 14,
    title: "May I come in?",
    ru: "Можно войти?",
    icon: "🚪",
    words: [],
    phrases: [P.mayIComeIn, P.pleaseComeIn, P.imSorry, P.imLate],
    builds: ["May I come in?", "Please come in.", "I'm sorry. I'm late."],
    dialogs: [
      { who: "🐻", whoEn: "bear", line: "May I come in?", ru: "Медведь стучится в домик зайца. Ответь за зайца!", reply: P.pleaseComeIn },
      { who: "🐓", whoEn: "cock", line: "May I come in?", ru: "Петух стучится в домик. Пригласи его!", reply: P.pleaseComeIn },
      { who: "🐭", whoEn: "mouse", line: "I'm sorry. I'm late.", ru: "Мышка опоздала. Пригласи её войти!", reply: P.pleaseComeIn },
      { who: "🐰", whoEn: "hare", line: "Please come in.", ru: "Ты стучишься к зайцу. Спроси, можно ли войти!", reply: P.mayIComeIn },
    ],
  },
  {
    id: "u15",
    book: 15,
    title: "One, two, three",
    ru: "Один, два, три",
    icon: "🔢",
    words: [W.one, W.two, W.three, W.four, W.five, W.six],
    phrases: [P.greyMouse],
    counts: [{ word: W.teacup, max: 6 }, { word: W.spoon, max: 6 }, { word: W.plate, max: 6 }, { word: W.cat, max: 6 }, { word: W.frog, max: 6 }],
    builds: ["Three frogs.", "Four cups."],
    dialogs: [],
  },
  {
    id: "u16",
    book: 16,
    title: "Can you swim?",
    ru: "Ты умеешь плавать?",
    icon: "🏊",
    words: [],
    phrases: [P.canYouSwim, P.yesICan, P.noICant],
    // кто что умеет: для задания «Can you …? — Yes, I can / No, I can't»
    canyou: [
      { who: W.fish, can: ["swim"], cant: ["fly", "run", "hop"] },
      { who: W.horse, can: ["run", "jump"], cant: ["fly", "swim"] },
      { who: W.cow, can: ["run"], cant: ["hop", "fly", "jump"] },
      { who: W.cat, can: ["run", "jump"], cant: ["fly", "swim"] },
      { who: W.bird, can: ["fly", "sing"], cant: ["swim", "hop"] },
      { who: W.frog, can: ["hop", "swim", "jump"], cant: ["fly", "run"] },
      { who: W.hare, can: ["hop", "run", "jump"], cant: ["fly", "swim"] },
      { who: W.bear, can: ["run", "swim"], cant: ["fly", "hop"] },
    ],
    builds: ["Can you swim?", "Yes, I can.", "No, I can't."],
    dialogs: [
      { who: "🐷", whoEn: "pig", line: "Can you hop?", show: W.cow, ru: "Поросёнок спрашивает корову. Ответь за корову!", reply: { en: "No, I can't.", ru: "Нет, не умею.", read: "ноу, ай кант", alt: ["no i cant", "no i can't", "no i cannot", "no"] } },
      { who: "🐷", whoEn: "pig", line: "Can you run?", show: W.horse, ru: "Поросёнок спрашивает лошадь. Ответь за лошадь!", reply: { en: "Yes, I can.", ru: "Да, умею.", read: "йес, ай кэн", alt: ["yes i can", "yes", "yes can"] } },
      { who: "🐷", whoEn: "pig", line: "Can you swim?", show: W.fish, ru: "Поросёнок спрашивает рыбку. Ответь за рыбку!", reply: { en: "Yes, I can.", ru: "Да, умею.", read: "йес, ай кэн", alt: ["yes i can", "yes", "yes can"] } },
      { who: "🐷", whoEn: "pig", line: "Can you fly?", show: W.cat, ru: "Поросёнок спрашивает кошку. Ответь за кошку!", reply: { en: "No, I can't.", ru: "Нет, не умею.", read: "ноу, ай кант", alt: ["no i cant", "no i can't", "no i cannot", "no"] } },
      { who: "🐷", whoEn: "pig", line: "Can you fly?", show: W.bear, ru: "Медведь хочет пошутить… но правда — не умеет! Ответь за медведя:", reply: { en: "Oh, no, I can't.", ru: "Ой, нет, не умею.", read: "оу, ноу, ай кант", alt: ["oh no i cant", "no i cant", "oh no"] } },
    ],
  },
  {
    id: "u17",
    book: 17,
    title: "I can see",
    ru: "Я вижу",
    icon: "👀",
    words: [W.seven, W.eight, W.nine, W.ten],
    phrases: [P.iCanSeeCat],
    counts: [{ word: W.frog, max: 10 }, { word: W.cat, max: 10 }, { word: W.dog, max: 10 }, { word: W.bird, max: 9 }, { word: W.cow, max: 8 }],
    builds: ["I can see a cat.", "Ten little frogs."],
    dialogs: [
      { who: "👧", whoEn: "girl", line: "What can you see?", show: W.horse, ru: "Джейн спрашивает, что ты видишь. Ответь!", reply: { en: "I can see a horse.", ru: "Я вижу лошадь.", read: "ай кэн си э хос", alt: ["i can see horse", "i see a horse", "a horse"] } },
      { who: "👦", whoEn: "boy", line: "What can you see?", show: W.fox, ru: "Майк спрашивает, что ты видишь. Ответь!", reply: { en: "I can see a fox.", ru: "Я вижу лису.", read: "ай кэн си э фокс", alt: ["i can see fox", "i see a fox", "a fox"] } },
    ],
  },
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
  { id: "combo", name: "Чеканка: нога — колено — голова", anim: "combo", icon: "🔄" },
  { id: "volley", name: "Удар с лёта", anim: "volley", icon: "💥" },
  { id: "panenka", name: "Пенальти «Паненка»", anim: "panenka", icon: "🪶" },
  { id: "kneeslide", name: "Празднование: скольжение на коленях", anim: "kneeslide", icon: "🙌" },
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

// Юнит = 1–2 тренировки (новые слова, за каждую — навык) + матч (фразы и диалоги, за него — кубок).
function buildLessons() {
  const lessons = [];
  UNITS.forEach((u, ui) => {
    const n = u.words.length;
    if (n === 0) {
      // только фразы и диалоги
    } else if (n <= 4) {
      lessons.push({ id: `${u.id}-1`, unit: ui, kind: "train", title: "Тренировка", words: u.words.slice() });
    } else {
      const h = Math.ceil(n / 2);
      lessons.push({ id: `${u.id}-1`, unit: ui, kind: "train1", title: "Тренировка 1", words: u.words.slice(0, h) });
      lessons.push({ id: `${u.id}-2`, unit: ui, kind: "train2", title: "Тренировка 2", words: u.words.slice(h) });
    }
    lessons.push({ id: `${u.id}-m`, unit: ui, kind: "match", title: "Матч за кубок", words: u.words.slice(), cup: u.id });
  });
  return lessons;
}

const LESSONS = buildLessons();

// Истории-комиксы: голос читает, слова подсвечиваются. Открываются после первого урока своей темы.
// Кадр: { bg — фон-эмодзи, who — кто говорит, name, text, ru — перевод, show — что показано крупно }
const STORIES = [
  {
    id: "s-hello", unit: "u02", title: "Hello, Mike!", icon: "👋",
    panels: [
      { bg: "🌳", who: "👦", name: "Mike", text: "Hello! I'm Mike.", ru: "Привет! Я Майк." },
      { bg: "🌳", who: "👧", name: "Jane", text: "Hello! I'm Jane.", ru: "Привет! Я Джейн." },
      { bg: "🌳", who: "👦", name: "Mike", text: "What's your name?", ru: "Как тебя зовут?", show: "🐶" },
      { bg: "🌳", who: "🐶", name: "Dog", text: "Woof! I'm Rex.", ru: "Гав! Я Рекс." },
      { bg: "🌙", who: "👧", name: "Jane", text: "Goodbye, Mike! Goodbye, Rex!", ru: "Пока, Майк! Пока, Рекс!" },
    ],
    questions: [
      { q: "Как зовут девочку?", opts: ["Jane", "Mike", "Rex"], a: 0 },
      { q: "Кто такой Rex?", opts: ["🐶 a dog", "🐱 a cat", "👦 a boy"], a: 0 },
    ],
  },
  {
    id: "s-who", unit: "u06", title: "Who are you?", icon: "🦊",
    panels: [
      { bg: "🌲", who: "👦", name: "Mike", text: "Who are you?", ru: "Ты кто?", show: "🐻" },
      { bg: "🌲", who: "🐻", name: "Bear", text: "I'm a bear.", ru: "Я медведь." },
      { bg: "🌲", who: "👦", name: "Mike", text: "Who are you?", ru: "А ты кто?", show: "🦊" },
      { bg: "🌲", who: "🦊", name: "Fox", text: "I'm a fox.", ru: "Я лиса." },
      { bg: "🌲", who: "🐸", name: "Frog", text: "And I'm a frog!", ru: "А я лягушка!" },
      { bg: "🌙", who: "👦", name: "Mike", text: "Goodbye, you all!", ru: "До свидания всем!" },
    ],
    questions: [
      { q: "Кто сказал «I'm a fox»?", opts: ["🦊", "🐻", "🐸"], a: 0 },
      { q: "Как спросить «Ты кто?»", opts: ["Who are you?", "What's your name?", "Goodbye!"], a: 0 },
    ],
  },
  {
    id: "s-ican", unit: "u07", title: "I can!", icon: "💪",
    panels: [
      { bg: "🏞️", who: "🐰", name: "Hare", text: "I'm a hare. I can hop.", ru: "Я заяц. Я умею скакать." },
      { bg: "🏞️", who: "🐶", name: "Dog", text: "I'm a dog. I can run.", ru: "Я собака. Я умею бегать." },
      { bg: "🏞️", who: "🐻", name: "Bear", text: "I'm a bear. I can jump.", ru: "Я медведь. Я умею прыгать." },
      { bg: "🌊", who: "🐸", name: "Frog", text: "I'm a frog. I can swim.", ru: "Я лягушка. Я умею плавать." },
      { bg: "🏟️", who: "👦", name: "Roman", text: "I'm Roman. I can kick the ball!", ru: "Я Роман. Я умею бить по мячу!", show: "⚽" },
    ],
    questions: [
      { q: "Что умеет лягушка?", opts: ["swim", "hop", "run"], a: 0 },
      { q: "Кто умеет скакать (hop)?", opts: ["🐰", "🐻", "🐶"], a: 0 },
    ],
  },
  {
    id: "s-this", unit: "u08", title: "What's this?", icon: "🐭",
    panels: [
      { bg: "🏫", who: "🐭", name: "Mouse", text: "What's this?", ru: "Что это?", show: "🕰️" },
      { bg: "🏫", who: "🐀", name: "Rat", text: "It's a clock.", ru: "Это часы." },
      { bg: "🏫", who: "🐭", name: "Mouse", text: "What's this?", ru: "Что это?", show: "🚗" },
      { bg: "🏫", who: "🐀", name: "Rat", text: "It's a car.", ru: "Это машина." },
      { bg: "🏫", who: "🐭", name: "Mouse", text: "Good! Wake up! Stand up!", ru: "Молодец! Проснись! Встань!" },
    ],
    questions: [
      { q: "Что мышка показала первым?", opts: ["🕰️ a clock", "🚗 a car", "⭐ a star"], a: 0 },
      { q: "«It's a car» — это…", opts: ["Это машина", "Это часы", "Это кошка"], a: 0 },
    ],
  },
  {
    id: "s-isthis", unit: "u09", title: "Is this a bird?", icon: "🎨",
    panels: [
      { bg: "🖼️", who: "🐸", name: "Frog", text: "Is this a bird?", ru: "Это птичка?", show: "🐦" },
      { bg: "🖼️", who: "🐻", name: "Bear", text: "Yes, it is.", ru: "Да." },
      { bg: "🖼️", who: "🐸", name: "Frog", text: "Is this a chick?", ru: "Это цыплёнок?", show: "🐴" },
      { bg: "🖼️", who: "🐻", name: "Bear", text: "No, it isn't. It's a horse.", ru: "Нет. Это лошадь." },
    ],
    questions: [
      { q: "Что медведь нарисовал вторым?", opts: ["🐴 a horse", "🐥 a chick", "🐦 a bird"], a: 0 },
      { q: "Как сказать «Нет»?", opts: ["No, it isn't.", "Yes, it is.", "Hello!"], a: 0 },
    ],
  },
  {
    id: "s-comein", unit: "u14", title: "May I come in?", icon: "🚪",
    panels: [
      { bg: "🏡", who: "🐻", name: "Bear", text: "May I come in?", ru: "Можно войти?" },
      { bg: "🏡", who: "🐰", name: "Hare", text: "Please come in.", ru: "Входи, пожалуйста." },
      { bg: "🏡", who: "🐓", name: "Rooster", text: "May I come in?", ru: "Можно войти?" },
      { bg: "🏡", who: "🐰", name: "Hare", text: "Please come in.", ru: "Входи, пожалуйста." },
      { bg: "🏡", who: "🐭", name: "Mouse", text: "I'm sorry. I'm late.", ru: "Извините, я опоздала." },
      { bg: "🏡", who: "🐰", name: "Hare", text: "Please come in!", ru: "Входи, пожалуйста!" },
    ],
    questions: [
      { q: "Кто опоздал?", opts: ["🐭", "🐻", "🐓"], a: 0 },
      { q: "Как спросить «Можно войти?»", opts: ["May I come in?", "Please come in.", "I'm late."], a: 0 },
    ],
  },
  {
    id: "s-song", unit: "u17", title: "One — a cat!", icon: "🎵",
    panels: [
      { bg: "🎵", who: "👧", name: "Jane", text: "One — a cat, two — a bat,", ru: "Раз — кошка, два — летучая мышь,", show: "🐱🦇" },
      { bg: "🎵", who: "👧", name: "Jane", text: "Three — a dog, four — a frog,", ru: "Три — собака, четыре — лягушка,", show: "🐶🐸" },
      { bg: "🎵", who: "👧", name: "Jane", text: "Five — a hare, six — a bear.", ru: "Пять — заяц, шесть — медведь.", show: "🐰🐻" },
      { bg: "🎵", who: "👦", name: "Mike", text: "One, two, three, four, five, six — one!", ru: "Раз, два, три, четыре, пять, шесть — раз!" },
      { bg: "🌳", who: "👦", name: "Mike", text: "I can see seven, eight, nine, ten frogs!", ru: "Я вижу семь, восемь, девять, десять лягушек!", show: "🐸🐸🐸" },
    ],
    questions: [
      { q: "Кто в песенке под номером «four»?", opts: ["🐸 a frog", "🐶 a dog", "🐻 a bear"], a: 0 },
      { q: "Как по-английски «десять»?", opts: ["ten", "nine", "seven"], a: 0 },
    ],
  },
  {
    id: "s-cats", unit: "u18", title: "One cat, two cats", icon: "🐱",
    panels: [
      { bg: "🌅", who: "👧", name: "Jane", text: "Good morning! I'm glad to see you!", ru: "Доброе утро! Рада тебя видеть!" },
      { bg: "🏡", who: "👧", name: "Jane", text: "I can see one cat.", ru: "Я вижу одну кошку.", show: "🐱" },
      { bg: "🏡", who: "👦", name: "Mike", text: "I can see two dogs.", ru: "Я вижу двух собак.", show: "🐶🐶" },
      { bg: "🌊", who: "👧", name: "Jane", text: "I can see three frogs!", ru: "Я вижу трёх лягушек!", show: "🐸🐸🐸" },
    ],
    questions: [
      { q: "Сколько лягушек?", opts: ["three", "two", "one"], a: 0 },
      { q: "«Good morning» — это…", opts: ["Доброе утро", "До свидания", "Спасибо"], a: 0 },
    ],
  },
  {
    id: "s-hungry", unit: "u21", title: "Give me some cheese", icon: "🧀",
    panels: [
      { bg: "🏡", who: "🐭", name: "Mouse", text: "I'm hungry. Give me some cheese.", ru: "Я голодная. Дай мне сыра.", show: "🧀" },
      { bg: "🏡", who: "🐰", name: "Hare", text: "Here you are!", ru: "Вот, держи!" },
      { bg: "🏡", who: "🐱", name: "Cat", text: "I'm hungry. Give me some milk.", ru: "Я голодная. Дай мне молока.", show: "🥛" },
      { bg: "🏡", who: "🐰", name: "Hare", text: "Here you are!", ru: "Вот, держи!" },
      { bg: "🌲", who: "🦊", name: "Fox", text: "I'm hungry. Give me a yellow chick.", ru: "Я голодная. Дай мне жёлтого цыплёнка.", show: "🐥" },
      { bg: "🌲", who: "🐰", name: "Hare", text: "Oh, no!", ru: "О нет!" },
    ],
    questions: [
      { q: "Что попросила лиса?", opts: ["🐥 a chick", "🧀 cheese", "🥛 milk"], a: 0 },
      { q: "Что ответил заяц лисе?", opts: ["Oh, no!", "Here you are!", "With pleasure!"], a: 0 },
    ],
  },
  {
    id: "s-football", unit: "football", title: "Let's play football!", icon: "⚽",
    panels: [
      { bg: "🏟️", who: "👦", name: "Roman", text: "Let's play football!", ru: "Давай играть в футбол!" },
      { bg: "🏟️", who: "👧", name: "Jane", text: "With pleasure!", ru: "С удовольствием!" },
      { bg: "🏟️", who: "👦", name: "Roman", text: "Run! Kick the ball!", ru: "Беги! Бей по мячу!", show: "⚽" },
      { bg: "🏟️", who: "🧑‍🦱", name: "Coach", text: "Goal! Goal! Goal!", ru: "Гол! Гол! Гол!", show: "🥅" },
    ],
    questions: [
      { q: "Что крикнул тренер?", opts: ["Goal!", "Hello!", "Stop!"], a: 0 },
      { q: "«With pleasure» — это…", opts: ["С удовольствием", "Нет", "Извини"], a: 0 },
    ],
  },
];

function availableStories() {
  return STORIES.filter((s) => {
    if (App.settings.unlockAll) return true;
    const ui = UNITS.findIndex((u) => u.id === s.unit);
    return LESSONS.some((l) => l.unit === ui && l.id in App.progress.done);
  });
}
