# Proje Kuralları: ORTAC Akademik Asistan

## 🧠 Bellek Bankası (Memory Bank) Entegrasyonu
- **Her görevden ÖNCE:** Mutlaka `memory-bank/activeContext.md` dosyasını oku ve aktif durumu kavra.
- **Her görevden SONRA:** Yapılan işleri, kararları ve sonraki adımları `memory-bank/activeContext.md` ve `memory-bank/progress.md` içine işle.
- **Kritik Kararlar:** Mimari ve model değişikliklerini `memory-bank/decisions.md` dosyasına kaydet.

---

## 🏗️ Sistem Mimarisi & Teknoloji Yığını
- **Masaüstü Katmanı:** Electron (`product/adim-8/electron-builder-uygulama`), tek tıkla kurulum (`Setup.exe`) ve taşınabilir zip.
- **Arka Yüz (Backend):** Python 3.13 + FastAPI + Uvicorn (`dev/backend/main.py`), PyInstaller ile `backend-server.exe` olarak Electron içine gömülü.
- **Ön Yüz (Frontend):** React 19 + TypeScript + Vite 8 (`dev/frontend`), Tailwind CSS, Jodit Editor, Lucide React.
- **Vektör & RAG:** ChromaDB (`veri/chroma_db`), LangChain, PyMuPDF (fitz), Sentence-Transformers.

---

## 🤖 Model Hiyerarşisi (Google Gemini 3.5 Standardı)
- **Sohbet & RAG Sentezi:** `gemini-3.5-flash` (Yüksek bağlam, halüsinasyonsuz akademik yanıtlar).
- **PDF Künye & Özet Çıkarma:** `gemini-3.5-flash-lite` (Hızlı ve maliyetsiz JSON analizi).
- **Embedding Motoru:** `bge-m3` veya `all-MiniLM-L6-v2`.
- *(Not: Google tarafından kapatılan `gemini-2.5-flash` ASLA kullanılmamalıdır - 404 döner).*

---

## 🛡️ Temiz Oda Testi & Devre Kesici (Clean-Room Sandbox)
- **Yayınlama Öncesi Zorunluluk:** Kod GitHub'a yüklenmeden önce `python tools/run_sandbox_test.py` çalıştırılarak 7 Kalite Kapısı %100 PASS olmalıdır.
- **Devre Kesici (Circuit Breaker):** Bir hata üst üste 2 kez çözülemezse otonom döngü durdurulur ve kullanıcıya danışılır.
- **Sürücü & Önbellek İzolasyonu:** `HF_HOME`, `TORCH_HOME` ve `veri/` dizini seçilen hedef sürücüye kilitlenmelidir. `C:\Users\` altına sızıntı yapılmaz.
- **Taşınabilirlik (Portability):** Sabit yollar (`C:\`, `D:\`, `E:\`) YASAK; daima `model_factory.get_data_dir()`, `veri/` ve dinamik yollar kullanılmalıdır.

---

## ⚡ Güncelleme ve Dağıtım Standardı
- Masaüstü güncellemeleri tarayıcı açtırmaz; backend üzerinden canlı stream indirilir ve `os.startfile` ile başlatılır.
- GitHub Releases yüklemeleri için katı `Content-Length` başlığına sahip Python akış betiği (`tools/upload_release_fast.py`) kullanılır.