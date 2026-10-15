# Teknoloji Bağlamı (Tech Context)

## 🖥️ Arka Yüz (Backend Stack)
| Kütüphane / Teknoloji | Rol | Açıklama |
|---|---|---|
| **Python 3.13** | Ana Çalışma Zamanı | Çekirdek mantık ve yapay zekâ motoru |
| **FastAPI** | REST API Sunucusu | Asenkron uç noktalar, OpenAPI dökümantasyonu |
| **Uvicorn** | ASGI Sunucusu | Yüksek performanslı web sunucusu |
| **PyInstaller** | Masaüstü Paketleme | `backend-server.exe` olarak Electron içine gömülü dağıtım |
| **LangChain Core & HuggingFace** | RAG Orkestrasyonu | Chunking, prompt şablonları, vektör indeksleme |
| **PyMuPDF (fitz)** | PDF Ayrıştırma | Metin çıkarma, sayfa analizi ve künye tespiti |
| **Pydantic v2** | Veri Doğrulama | Şema kontrolü ve katı JSON parser |
| **psutil** | Sistem Teşhisi | Donanım, RAM, CPU ve disk alanı tespiti |

---

## 🎨 Ön Yüz (Frontend Stack)
| Kütüphane / Teknoloji | Sürüm | Rol |
|---|---|---|
| **Electron** | 41.x | Masaüstü işletim sistemi köprüsü, pencere yönetimi, IPC |
| **React** | 19.x | Kullanıcı arayüzü bileşenleri |
| **Vite** | 8.x | Modern ve ultra hızlı build motoru |
| **TypeScript** | 5.x | Tip güvenliği ve ölçeklenebilir kodlama |
| **Tailwind CSS** | 4.x | Obsidian Karanlık Mod ve modern stil sistemi |
| **Jodit Editor** | Entegre | Makale yazım alanı ve Word (.docx) workspace |
| **Lucide React** | - | Modern arayüz ikonları |

---

## 🤖 Yapay Zekâ Katmanları (Model Hiyerarşisi)
| Katman | Model | Kullanım Alanı | Gerekçe |
|---|---|---|---|
| **Hızlı PDF Analizi** | `gemini-3.5-flash-lite` | Künye, özet ve anahtar kelime çıkarma | Hızlı, ultra düşük token maliyeti |
| **Ana RAG Motoru** | `gemini-3.5-flash` | Akademik sohbet, kaynakça sentezi, makale taslağı | Yüksek bağlam penceresi, sıfır halüsinasyon |
| **Derin Zekâ** | `DeepSeek-R1` | Formül açıklama, karmaşık metodoloji analizi | Chain-of-thought (düşünce zinciri) |
| **Embedding** | `all-MiniLM-L6-v2` / `bge-m3` | Yerel metin vektörizasyonu | CPU üzerinde hızlı ve kararlı |

---

## 🗄️ Veri Depolama & İzolasyon
| Alan | Teknoloji | Konum | İzolasyon Kuralı |
|---|---|---|---|
| **Vektör Veritabanı** | ChromaDB | `veri/chroma_db` | Seçilen sürücüye kilitli, kalıcı sqlite3 tabanlı |
| **Model Önbelleği** | Hugging Face Cache | `veri/modeller/hf` | `HF_HOME` ortam değişkeniyle kilitli (`C:\` sızıntısı yok) |
| **PDF Kütüphanesi** | Yerel Dosya Sistemi | `veri/Kutuphane_Gelen`, `veri/Kutuphane_Arsiv` | Ham PDF arşivleme |
| **Kullanıcı Ayarları** | JSON | `veri/settings.json` | Sürücü ve API tercihleri |

---

## 🛡️ Test ve Güvenlik Altyapısı
- **Temiz Oda Sanal Test İstasyonu:** `tools/run_sandbox_test.py` (7 Kalite Kapısı).
- **Devre Kesici (Circuit Breaker):** `tools/circuit_breaker.py` (Maksimum 2 retry, HITL insan müdahalesi).
- **Uygulama İçi Akış İndiricisi:** `requests.get(stream=True)` + `os.startfile()`.
- **Hızlı Yükleme Boru Hattı:** `tools/upload_release_fast.py` (GitHub Releases için katı Content-Length akışı).
