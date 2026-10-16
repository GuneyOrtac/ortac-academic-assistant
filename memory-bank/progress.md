# İlerleme (Progress)

## ✅ Tamamlanan Aşamalar

### Adım 1: PDF İşleme & Ayrıştırma ✅
- [x] PyMuPDF (fitz) ile PDF yükleme ve metin çıkarma
- [x] Google Gemini 3.5 Flash-Lite entegrasyonu (PDF künye analizi)
- [x] Otomatik Türkçe özet oluşturma
- [x] APA 7 formatında kaynakça üretimi
- [x] Akıllı dosya adı oluşturma: `Yazar_Yıl_Başlık.pdf`

### Adım 2: RAG & Vektör Veritabanı ✅
- [x] ChromaDB dinamik kurulumu (`veri/chroma_db` dizini)
- [x] Chunking stratejisi (1000 karakter, 200 overlap)
- [x] all-MiniLM-L6-v2 ve bge-m3 embedding modeli entegrasyonu
- [x] Semantik benzerlik arama endpoint'leri implementasyonu

### Adım 3: RAG & Sohbet Motoru ✅
- [x] Gemini 3.5 Flash bağlantısı (Ana RAG motoru)
- [x] Selective Context stratejisi (en alakalı metin parçacıkları)
- [x] OpenDraft motoru → Word (.docx) çıktısı üretimi

### Adım 4: Arayüz Uygulaması (React 19 + TypeScript) ✅
- [x] React 19 + Vite 8 + TypeScript kurulumu
- [x] PDF okuyucu (sol panel) + Chat widget'ı mizanpajı
- [x] Jodit Editor entegrasyonu (makale düzenleme workspace)
- [x] Literatür Radarı bileşeni (OpenAlex entegrasyonu)
- [x] SettingsTab (ayarlar panosu ve canlı donanım durumu)

### Adım 5: Backend API (FastAPI) - Tüm Temel Endpoint'ler ✅
- [x] `/api/pdf-yukle`, `/api/kutuphane`, `/api/ara`, `/api/sohbet`, `/api/taslak-olustur`
- [x] `/api/literatur-tara` (OpenAlex literatür taraması)
- [x] `/api/pdf-indir-ve-ekle` (URL'den göreceli ve mutlak bağlantı çözümleyerek PDF indirme + kütüphaneye ekleme)
- [x] `/api/mcp-baglan`, `/api/mcp-araclar` (MCP mimarisi)
- [x] `/api/ayarlar`, `/api/sistem-bilgisi`, `/api/kurulum-tamamla`

### Adım 6: Profesyonel Kurulum Sihirbazı (Onboarding Wizard) ✅
- [x] Dinamik Donanım & Disk Tespiti (`psutil` ile RAM, çekirdek, sürücü boş alan analizi)
- [x] 4 Kademeli Kurulum Akışı (Model seçimi, API tercihi, hedef disk alanı kontrolü)
- [x] %100 Türkçe, Obsidian Karanlık Tasarımı, Kurumsal Logo

### Adım 7: Masaüstü Paketleme & Dağıtım (Electron + PyInstaller) ✅
- [x] **PyInstaller Backend:** `main.py` ve tüm bağımlılıklar `backend-server.exe` olarak derlendi.
- [x] **Electron Mimarisi:** Arka planda FastAPI backend'ini otomatik başlatan ve kapanışta sonlandıran Electron sarmalayıcısı.
- [x] **NSIS Setup & Portable Zip:** `ORTAC.Akademik.Asistan.Setup.0.0.3.exe` (455 MB) ve taşınabilir zip (392 MB).
- [x] **GitHub Dağıtımı:** `v0.0.1`, `v0.0.2` ve `v0.0.3` sürümleri GitHub Releases üzerinde yayınlandı.

### Adım 8: Uygulama İçi Canlı Akış Güncelleyicisi (In-App Live Updater) ✅
- [x] Tarayıcı yönlendirmesi yerine backend üzerinden `requests.get(stream=True)` ile arka plan indirmesi.
- [x] Arayüzde anlık canlı ilerleme çubuğu (% ve MB göstergesi).
- [x] İndirme tamamlandığında `os.startfile` ile kurulum sihirbazını otomatik başlatma.

### Adım 9: Temiz Oda Test Çerçevesi & Devre Kesici (Clean-Room CI/CD) ✅
- [x] [`CLEAN_ROOM_SANDBOX_TESTING_FRAMEWORK.md`](file:///e:/Makale%20YZ/CLEAN_ROOM_SANDBOX_TESTING_FRAMEWORK.md) evrensel mimari standardı.
- [x] [`tools/circuit_breaker.py`](file:///e:/Makale%20YZ/tools/circuit_breaker.py) ile otonom kısır döngü kalkanı (Maksimum 2 hata, ardından insan müdahalesi).
- [x] [`tools/run_sandbox_test.py`](file:///e:/Makale%20YZ/tools/run_sandbox_test.py) ile 7 Aşamalı Kalite Kapısı doğrulaması (%100 PASS).

---

## 🚧 Tamamlanan Son Öncelikler (v0.0.4)

- [x] **Temiz Oda 10 Kalite Kapısı Testi:** Multi-model izolasyonu, kütüphane döngüsü ve uninstaller simülasyonu dahil %100 PASS.
- [x] **Görsel & Arayüz Duman Testi (Headless UI Smoke Test):** `tools/electron_smoke_test.js` ile React DOM Mount ve IPC doğrulaması tam not aldı.
- [x] **Kullanıcı Odaklı Uninstaller Mimarisi:** NSIS scripti ve Python temizleme motoruyla kullanıcı verisini koruma / tam temizlik opsiyonu sağlandı.
- [x] **Kullanıcı Hedef Sürücüsünde Uçtan Uca Doğrulama & Güncelleme:** `F:\AkademikAsistan\veri` hedef dizinindeki kullanıcı verileri korunarak `resources` v0.0.4'e sıcak yamalandı.
- [x] **v0.0.4 Kararlı Üretim Sürümü:** `ORTAC.Akademik.Asistan.Setup.0.0.4.exe` ve `Akademik Asistan-0.0.4-win.zip` başarıyla paketlendi.

---

## 🔜 Gelecek Yol Haritası
- Adım 10: Auth & Lisanslama sistemi (HWID tabanlı lisans doğrulama)
- Adım 11: Token & Maliyet paneli (LiteLLM cache)
- Adım 12: .akpack P2P senkronizasyon paketi
- Adım 13: GitHub-merkezli Admin Dashboard
