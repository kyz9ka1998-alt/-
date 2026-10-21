"""Озвучка всех текстов приложения голосами Microsoft (edge-tts).

Читает audio/texts.json (его делает tools/collect-texts.js), озвучивает недостающие записи
в audio/clips/<id>.mp3 и пишет audio/index.json: { id: [длительность_мс, [[мс, "слово"], ...]] }.
Время слов нужно для подсветки текста в историях.
"""
import asyncio, json, os, sys
import edge_tts

VOICES = {"en": ("en-GB-MaisieNeural", "-10%"), "ru": ("ru-RU-SvetlanaNeural", "+0%")}
ROOT = os.path.join(os.path.dirname(__file__), "..")
CLIPS = os.path.join(ROOT, "audio", "clips")
INDEX = os.path.join(ROOT, "audio", "index.json")


async def make(item, index, sem, stats):
    voice, rate = VOICES[item["lang"]]
    out = os.path.join(CLIPS, item["id"] + ".mp3")
    async with sem:
        for attempt in range(4):
            try:
                audio, words = bytearray(), []
                com = edge_tts.Communicate(item["text"], voice, rate=rate, boundary="WordBoundary")
                async for ch in com.stream():
                    if ch["type"] == "audio":
                        audio += ch["data"]
                    elif ch["type"] == "WordBoundary":
                        words.append([round(ch["offset"] / 10000), ch["text"]])
                if not audio:
                    raise RuntimeError("пустой ответ")
                with open(out, "wb") as f:
                    f.write(audio)
                dur = round(len(audio) * 8 / 48)  # 48 кбит/с → мс
                index[item["id"]] = [dur, words if len(words) > 1 else []]
                stats["ok"] += 1
                return
            except Exception as e:  # noqa: BLE001
                if attempt == 3:
                    print("FAIL", item["text"], e)
                    stats["fail"] += 1
                await asyncio.sleep(2 * (attempt + 1))


async def main():
    texts = json.load(open(os.path.join(ROOT, "audio", "texts.json"), encoding="utf8"))
    os.makedirs(CLIPS, exist_ok=True)
    index = json.load(open(INDEX, encoding="utf8")) if os.path.exists(INDEX) else {}
    wanted = {t["id"] for t in texts}
    # убрать записи, которых больше нет в приложении
    for f in os.listdir(CLIPS):
        if f.endswith(".mp3") and f[:-4] not in wanted:
            os.remove(os.path.join(CLIPS, f))
    index = {k: v for k, v in index.items() if k in wanted and os.path.exists(os.path.join(CLIPS, k + ".mp3"))}
    todo = [t for t in texts if t["id"] not in index]
    print(f"всего {len(texts)}, уже есть {len(index)}, озвучить {len(todo)}")
    stats = {"ok": 0, "fail": 0}
    sem = asyncio.Semaphore(6)
    await asyncio.gather(*(make(t, index, sem, stats) for t in todo))
    with open(INDEX, "w", encoding="utf8") as f:
        json.dump(dict(sorted(index.items())), f, ensure_ascii=False, separators=(",", ":"))
    print(f"готово: {stats['ok']}, ошибок: {stats['fail']}, в индексе: {len(index)}")
    if stats["ok"] == 0 and todo:
        sys.exit(1)


asyncio.run(main())
