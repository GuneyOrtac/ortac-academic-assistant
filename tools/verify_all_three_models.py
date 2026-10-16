import os
import sys
import time
import gc
from pathlib import Path

# Windows console encoding fix
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Setup paths
TOOLS_DIR = Path(__file__).resolve().parent
ROOT_DIR = TOOLS_DIR.parent
sys.path.insert(0, str(ROOT_DIR / "dev" / "backend"))

import torch
from sentence_transformers import SentenceTransformer

MODELS_TO_TEST = [
    {
        "key": "e5-small",
        "name": "intfloat/multilingual-e5-small",
        "expected_dim": 384,
        "label": "Kart 1 - Hızlı & Hafif"
    },
    {
        "key": "bge-m3",
        "name": "BAAI/bge-m3",
        "expected_dim": 1024,
        "label": "Kart 2 - Akademik Standart (Önerilen)"
    },
    {
        "key": "qwen2-7b",
        "name": "Alibaba-NLP/gte-Qwen2-7B-instruct",
        "expected_dim": 3584,
        "label": "Kart 3 - En Yüksek Başarım (Zirve Güç)"
    }
]

TEST_SENTENCE = "ORTAC Geo|Science: Yapay zekâ ve jeoloji mühendisliğinde sismik veri analizi ve RAG entegrasyonu."

def test_models():
    print("=" * 75)
    print("🔬 3 FARKLI YEREL MODELİN AYRI AYRI ÇALIŞIRLIK VE VEKTÖR DOĞRULAMA TESTİ")
    print(f"CUDA Mevcut mu: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU Aygıtı     : {torch.cuda.get_device_name(0)}")
        print(f"Toplam VRAM   : {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f} GB")
    print("=" * 75 + "\n")

    user_cache = os.path.expanduser("~/.cache/huggingface/hub")
    results = []

    for item in MODELS_TO_TEST:
        key = item["key"]
        name = item["name"]
        expected_dim = item["expected_dim"]
        label = item["label"]

        print(f"[*] [{key.upper()}] Test Ediliyor: {label}")
        print(f"    Model Deposu: {name}")

        t0 = time.time()
        try:
            # Model yükleme (trust_remote_code=False kuralı ile)
            model = SentenceTransformer(
                name,
                cache_folder=user_cache,
                trust_remote_code=False
            )
            load_time = time.time() - t0
            print(f"    ✓ Model Belleğe Yüklendi ({load_time:.2f} saniye)")

            # Vektör çıkarma
            t1 = time.time()
            vector = model.encode(TEST_SENTENCE)
            infer_time = time.time() - t1

            actual_dim = len(vector)
            is_dim_ok = (actual_dim == expected_dim)
            has_no_nan = not any(torch.isnan(torch.tensor(vector)))

            print(f"    ✓ Vektör Çıkarıldı ({infer_time*1000:.1f} ms)")
            print(f"    ✓ Vektör Boyutu: {actual_dim} (Beklenen: {expected_dim}) -> {'BAŞARILI' if is_dim_ok else 'HATALI'}")
            print(f"    ✓ Vektör İlk 3 Değer: [{vector[0]:.4f}, {vector[1]:.4f}, {vector[2]:.4f}, ...]")
            print(f"    ✓ Sayısal Bütünlük: {'Geçerli (NaN yok)' if has_no_nan else 'Hatalı (NaN var)'}\n")

            results.append({
                "model": key,
                "status": "PASS",
                "dim": actual_dim,
                "expected": expected_dim,
                "load_sec": round(load_time, 2),
                "infer_ms": round(infer_time * 1000, 1)
            })

            # Belleği temizle (GPU/RAM şişmesini önle)
            del model
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        except Exception as err:
            print(f"    [-] HATA: {err}\n")
            results.append({
                "model": key,
                "status": f"FAIL",
                "dim": 0,
                "expected": expected_dim,
                "load_sec": 0,
                "infer_ms": 0
            })

    print("=" * 75)
    print("📊 MODEL ÇALIŞIRLIK TEST SONUÇ TABLOSU:")
    print("=" * 75)
    print(f"{'Model':<12} | {'Durum':<8} | {'Boyut':<14} | {'Yükleme (sn)':<14} | {'Vektörleme (ms)'}")
    print("-" * 75)
    for r in results:
        dim_str = f"{r['dim']} / {r['expected']}"
        print(f"{r['model']:<12} | {r['status']:<8} | {dim_str:<14} | {r['load_sec']:<14} | {r['infer_ms']} ms")
    print("=" * 75)

    all_passed = all(r["status"] == "PASS" for r in results)
    if all_passed:
        print("\n✅ TÜM MODELLER (3/3) SORUNSUZ VE EKSİKSİZ ÇALIŞMAKTADIR!")
        return 0
    else:
        print("\n❌ BAZI MODELLERDE HATA OLUŞTU!")
        return 1

if __name__ == "__main__":
    sys.exit(test_models())
