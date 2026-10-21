"""Озвучка отдельных звуков (фонем) для раздела «Читаем».

Голос Maisie читает только текст, а отдельный звук ([æ], [ш], [м-м-м]) лучше получается
у открытой модели Kokoro: она принимает транскрипцию IPA напрямую.
Запуск (нужны kokoro-onnx, lameenc и файлы модели kokoro-v1.0.onnx, voices-v1.0.bin):
  python tools/phonemes.py phonemes.json models/ audio/phonemes/
phonemes.json получается так: node -e "<js/reading-data.js>; print(JSON.stringify(phonemeList()))"
"""
import json, os, sys, warnings
import numpy as np, lameenc
from kokoro_onnx import Kokoro

warnings.filterwarnings("ignore")
src, models, out = sys.argv[1:4]
k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
os.makedirs(out, exist_ok=True)
for item in json.load(open(src)):
    s, sr = k.create(item["ph"], voice="bf_emma", speed=0.75, is_phonemes=True)
    pad = np.zeros(int(sr * 0.08), dtype=np.float32)
    s = np.concatenate([pad, s, pad])
    pcm = (np.clip(s, -1, 1) * 32767).astype(np.int16).tobytes()
    e = lameenc.Encoder()
    e.set_bit_rate(48)
    e.set_in_sample_rate(sr)
    e.set_channels(1)
    e.set_quality(2)
    open(os.path.join(out, item["file"] + ".mp3"), "wb").write(e.encode(pcm) + e.flush())
    print(item["file"], item["ph"], f"{len(s) / sr:.2f}s")
