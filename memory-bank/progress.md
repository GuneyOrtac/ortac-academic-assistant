# İlerleme

## ✅ Tamamlanan (MVP Çekirdeği)

### Adım 1: PDF İşleme & Ayrıştırma
- [x] PyMuPDF ile PDF yükleme ve metin çıkarma
- [x] Gemini 3.1 Flash-Lite entegrasyonu (PDF künye analizi)
- [x] Otomatik Türkçe özet oluşturma
- [x] APA 7 formatında kaynakça üretimi
- [x] Akıllı dosya adı: `Yazar_Yıl_Başlık.pdf`

### Adım 2: RAG & Vektör Veritabanı
- [x] ChromaDB kurulumu (`veri/chroma_db` dizini)
- [x] Chunking stratejisi (1000 char, 200 overlap)
- [x] all-MiniLM-L6-v2 embedding modeli entegrasyonu
- [x] Semantik arama endpoint'leri implementasyonu

### Adım 3: RAG & Sohbet Motoru
- [x] Gemini 3.8 Flash bağlantısı (Ana RAG motoru)
- [x] Selective Context stratejisi (ilgili metin parçaları)
- [x] OpenDraft motoru → Word (.docx) çıktısı üretimi

### Adım 4: Arayüz Uygulaması
- [x] React 19 + Vite 8 + TypeScript kurulumu
- [x] PDF okuyucu (sol panel) + Chat widget'ı mizanpajı
- [x] Jodit Editor entegrasyonu (makale düzenleme workspace)
- [x] Literatür Radarı bileşeni
- [x] SettingsTab (ayarlar panosu)

### Adım 5: Backend API (FastAPI) - Tüm Endpoint'ler ✅
Aşağıdaki REST endpoints başarıyla implement edilmiş ve çalıştırılmakta:

| METOD | Endpoint | Açıklama |
|-------|----------|-----------|
| GET | `/` | Sistem durumu / anasayfa |
| POST | `/api/pdf-yukle` | PDF yükleme, metin çıkarma + vektörizasyon |
| GET | `/api/kutuphane` | Kütüphane dosya listesi |
| DELETE | `/api/kutuphane/{file_id}` | Dosya silme |
| GET | `/api/pdf/{file_id}` | PDF dosyasını indirme |
| POST | `/api/ara` | Anlamsal arama (semantic search) |
| POST | `/api/sohbet` | Sohbet cevabı (kaynak gösterimli RAG) |
| POST | `/api/taslak-olustur` | Makale taslağı → .docx indir |
| POST | `/api/literatur-tara` | OpenAlex API ile literatür taraması |
| POST | `/api/pdf-indir-ve-ekle` | URL'den PDF indirme + ekleme |
| POST | `/api/mcp-baglan` | MCP sunucusu bağlantısı |
| GET | `/api/mcp-araclar` | MCP araçları listesi |
| GET/POST | `/api/ayarlar` | Model/MCP ayarlarını yükle/kaydet |

### Adım 6: Frontend (Vite React SPA) ✅
- [x] Temel yapı kurulması
  - Vite 8 dev server (port 5173)
  - React 19 + TypeScript
  - Tailwind CSS styling

### Adım 7: Profesyonel Kurulum Sihirbazı (Onboarding Wizard) & Donanım Teşhisi ✅
- [x] Dinamik Donanım & Disk Tespiti (`psutil` ile RAM, çekirdek, sürücü boş alan analizi)
- [x] 4 Kademeli Kurulum Akışı:
  1. Model ve Donanım Analizi (`bge-m3`, `e5-small`, `qwen2-7b`, `cloud-gemini`)
  2. Yapay Zeka API Tercihi (Dahili Havuz vs Bağımsız Gemini/DeepSeek API Anahtarı)
  3. Kütüphane Dizini ve Disk Güvence Kontrolü (Seçilen Model + 20 GB RAG Payı kuralı ve buton kilidi)
  4. Kurulum Tamamlandı ve Doğrulama Listesi
- [x] %100 Türkçe, Linear & Raycast Obsidian Karanlık Tasarımı, Sabit Kadraj, Sol Üst Kurumsal Logo
- [x] Dinamik ChromaDB ve PDF Kütüphanesi Dizin Yapılandırması (`settings.json`)
- [x] Sihirbazı Ayarlar Ekranından Yeniden Başlatabilme Desteği (`/api/kurulum-sifirla`)

## 🚧 Devam Eden
- [ ] Token tasarrufu optimizasyonları
  - Aynı sorguları cache etme
  - LiteLLM kütüphanesi ile API maliyeti azaltımı

### Adım 8: Masaüstü Uygulaması & GitHub Otomatik Güncelleme Motoru ✅
- [x] **Tek Tıkla Masaüstü Başlatıcı:** [ORTAC_Akademik_Asistan.bat](file:///e:/Makale%20YZ/ORTAC_Akademik_Asistan.bat) ile arka planda backend/frontend ayağa kaldırma ve yerel app penceresi açma.
- [x] **Electron Sarmalayıcı Mimarisi:** [product/adim-8/electron-builder-uygulama/build/main.js](file:///e:/Makale%20YZ/product/adim-8/electron-builder-uygulama/build/main.js) ile FastAPI backend yaşam döngüsü (açılışta başlat, kapanışta sonlandır) ve IPC köprüsü.
- [x] **GitHub Releases Otomatik Güncelleme:**
  - Backend uç noktaları: `/api/guncelleme-kontrol` ve `/api/guncelleme-uygula`
  - Canlı Sürüm Etiketi & Parlayan Rozet (`UpdateBadge`)
  - Arayüzden tek tıkla GitHub Releases sorgulama ve doğrudan `git pull` ile güncelleme.
- [x] **GitHub v0.0.1 Resmi Release Yayını:** [Releases v0.0.1](https://github.com/GuneyOrtac/ortac-academic-assistant/releases/tag/v0.0.1) ilk sürümü GitHub üzerinde yayınlandı.

## 🚧 Devam Eden
- [ ] Token tasarrufu optimizasyonları
  - Aynı sorguları cache etme
  - LiteLLM kütüphanesi ile API maliyeti azaltımı

## 🔜 Bekleyen (Bkz: roadmap.md)
- Adım 9: Auth & Lisanslama sistemi
- Adım 10: Token/Maliyet paneli
- Adım 11: .akpack P2P senkronizasyon paketi
- Adım 12: GitHub-merkezli Admin Dashboard

