# Akademik Asistan - Geliştirme İş Planı (Roadmap)

*Not: Sistem ilk aşamada Google Gemini Flash modelleri (gemini-3.8-flash & gemini-3.1-flash-lite) üzerinden en yüksek hız ve minimum token maliyetiyle çalışacak şekilde optimize edilmiştir.*

---

## Tamamlanan Temel Aşamalar (MVP Çekirdeği)

### Adım 1: PDF Ayrıştırma ve Gemini Analizi (Backend)
- [x] PDF yükleme ve metin/sayfa çıkarma altyapısı (`PyMuPDF`).
- [x] **Gemini 3.1 Flash-Lite Entegrasyonu:** PDF ilk sayfalarını analiz edip Eser Türü, Yazar, Yıl, Dergi, Dil ve Anahtar Kelimeleri otomatik çıkarma.
- [x] Otomatik kapsamlı Türkçe özet ve APA formatında kaynakça oluşturma.
- [x] Akıllı isimlendirme ile kalıcı depolama (`Yazar_Yıl_Başlık.pdf`).

### Adım 2: RAG ve Vektör Veritabanı (Backend)
- [x] ChromaDB yerel kurulumu ve bağlantısı (`veri/chroma_db`).
- [x] Metin parçalama (Chunking: 1000 char, 200 overlap).
- [x] **Yerel HuggingFace Embeddings:** `all-MiniLM-L6-v2` ile sıfır API maliyetli vektörleştirme.
- [x] Bellek & Performans: Singleton embedding önbelleklemesi (SSL gecikmelerinin önlenmesi).
- [x] Semantik Arama (Semantic Search) uç noktaları.

### Adım 3: Akademik Danışman & Sohbet Modülü (Backend)
- [x] RAG vektör arama motorunun **Gemini 3.8 Flash** modeline bağlanması.
- [x] Seçici RAG (Selective Context): İstenen PDF'leri filtreleyerek odaklı soru-cevap.
- [x] Bağlam farkındalığı (Kullanıcının hangi sekmede olduğunu bilerek yanıt verme).
- [x] **OpenDraft Motoru:** Makale taslağı üretimi, eksik atıf tespiti ve Word (.docx) olarak dışa aktarım.

### Adım 4: Arayüz (Frontend) Temelleri
- [x] React 19 + Vite 8 + TypeScript modern arayüzü.
- [x] Beyaz/ferah akademik tema, yan navigasyon menüsü.
- [x] Sol (PDF Okuyucu & Kütüphane) ve Sağ (Akademik Yoldaş Sohbeti) mizanpajı.
- [x] Jodit Editor zengin metin düzenleyici ile A4 Word çalışma alanı.
- [x] Literatür Radarı (OpenAlex API ile açık ve kapalı kaynak makale tarama).
- [x] Çoklu Model ve API Anahtarları yönetim sekmesi (`SettingsTab`).

---

## Yeni Planlanan Geliştirme Aşamaları (Ürünleştirme & Dağıtım)

### Adım 8: Masaüstü Uygulaması (.exe) ve GitHub Otomatik Güncelleme
- [ ] **Electron Sarmalayıcısı:** React arayüzü ve Python backend'i tek bir masaüstü uygulaması altında birleştirme.
- [ ] **Yaşam Döngüsü (Process Lifecycle):** Uygulama açıldığında Python FastAPI sunucusunu arka planda başlatma, uygulama kapandığında arka planda açık kalmayacak şekilde güvenle sonlandırma.
- [ ] **GitHub Releases Tabanlı Güncelleme Motoru:**
  - Uygulama açılışında arka planda sessizce `api.github.com/repos/.../releases/latest` kontrolü.
  - Yeni sürüm varsa arayüzü kilitlemeden sağ üstte parlayan bildirim rozeti (`UpdateBadge`) gösterme.
- [ ] **"Neler Yeni?" ve Onay Modalı:**
  - Bildirime tıklandığında GitHub Release açıklamasındaki (Changelog) maddelerin gösterilmesi.
  - Kullanıcı onayına bağlı `[Şimdi Güncelle ve Yeniden Başlat]` veya `[Daha Sonra]` butonları.
  - Güncelleme sırasında `veri/` klasörünün ve API anahtarlarının korunması (veri kaybını önleme).

### Adım 9: Güvenlik, Kimlik Doğrulama ve Lisanslama (Auth & License)
- [ ] **Kullanıcı Girişi (Kimlik Doğrulama):**
  - Yerel/Offline modda çalışan kullanıcı adı ve şifre korumalı profil yapısı.
  - Şifrelerin güvenli hash'lenerek (`bcrypt` / `argon2`) saklanması.
- [ ] **Lisans Anahtarı Sistemi (License Key Engine):**
  - Uygulamanın izinsiz kopyalanmasını önlemek için formatlı lisans anahtarı doğrulaması (Örn: `AKAD-XXXX-YYYY-ZZZZ`).
  - Cihaza özel donanım parmak izi (Hardware ID / Machine GUID) veya kriptografik offline imza kontrolü.
  - Lisans durumu (Deneme Sürümü, Standart Lisans, Süre Sonu) takibi.

### Adım 10: Kullanıcı İstatistikleri & Token/Maliyet Takip Paneli
- [ ] **Token Tüketim Sayacı:**
  - Yapılan her istekte harcanan Girdi (Prompt) ve Çıktı (Completion) token miktarının kaydedilmesi.
- [ ] **Maliyet ve Bütçe Monitörü:**
  - Harcanan tokenların tahmini USD ve TL karşılığının anlık gösterilmesi (450 TL bakiye takip çubuğu).
- [ ] **Akademik Üretkenlik İstatistikleri:**
  - Analiz edilen toplam PDF sayısı, üretilen taslak kelime sayısı, sorulan soru adedi.
  - Günlük/Haftalık kullanım grafiği (Dashboard).

### Adım 11: Bulutsuz ve Sıfır Maliyetli RAG & Kütüphane Senkronizasyonu (Decentralized / P2P)
- [ ] **Sorun / Amaç:** Bulut depolama (AWS/S3) ve mükerrer yapay zeka maliyeti ödemeden, bir kullanıcının analiz ettiği makaleleri diğer kullanıcıların kütüphanesine zahmetsizce aktarmak.
- [ ] **Taşınabilir Kütüphane Paketi (.akpack / Zero-AI Sync):**
  - Bir kullanıcının analiz ettiği makalenin PDF'i + hazır künyesi + önceden üretilmiş vektörleri tek bir sıkıştırılmış pakete dönüştürülür.
  - İkinci kullanıcı bu paketi içe aktardığında, **hiçbir yapay zeka/token harcaması yapmadan ve bulut masrafı olmadan** kütüphaneyi ve ChromaDB'yi anında hazır bulur.
- [ ] **Doğrudan Cihazdan Cihaza Paylaşım:**
  - Aynı yerel ağdaki (LAN / Laboratuvar) veya P2P bağlantı üzerinden kütüphane paylaşımı.
  - GitHub veya ortak klasör üzerinden "Ortak Akademik Dizin" senkronizasyon seçeneği.

### Adım 12: Yönetici Paneli (Admin Dashboard) — GitHub-Merkezli Mimari
- [ ] **Yaklaşım:** Firebase, Supabase veya Vercel gibi harici hizmetlere bağımlılık oluşturmamak için tüm telemetri, lisans ve istatistik verileri doğrudan **GitHub Private Repo** üzerinde saklanır. Admin paneli bu verileri GitHub API üzerinden okuyup görselleştiren ayrı bir masaüstü uygulamasıdır.
- [ ] **Veri Akışı (Masaüstü App → GitHub):**
  - Kullanıcının masaüstü uygulaması, zaten yapılan sürüm kontrolü sırasında (açılışta) aynı GitHub API bağlantısı üzerinden `telemetry/{lisans_id}.json` dosyasını günceller.
  - Gönderilen veri: Lisans ID, uygulama sürümü, toplam harcanan token, analiz edilen PDF sayısı, sorulan soru adedi, son görülme tarihi.
  - İnternet yoksa veriler yerel SQLite'ta biriktirilir, bağlantı kurulduğunda toplu gönderilir.
- [ ] **GitHub Token Güvenliği (Fine-Grained Token):**
  - Uygulamaya gömülen token yalnızca `telemetry/` klasörüne yazma ve `licenses/` + `releases/` okuma iznine sahip olacaktır.
  - Kaynak koduna (`src/`) erişim izni verilmez. Token şifreli saklanır.
- [ ] **Admin Panel (Ayrı Masaüstü .exe):**
  - Yöneticinin (sizin) kişisel GitHub token'ı ile tam erişim sağlayan ayrı bir uygulama.
  - `telemetry/*.json` dosyalarını toplayarak dashboard, kullanıcı listesi ve grafik oluşturur.
  - `licenses/registry.json` üzerinden lisans anahtarı üretme, iptal etme, süre uzatma ve tür seçimi yapar.
- [ ] **Dashboard Modülleri:**
  - 📊 Toplam kayıtlı ve aktif kullanıcı sayısı, günlük/haftalık/aylık token tüketim grafiği.
  - 👤 Kullanıcı bazlı detay: Token harcama, PDF sayısı, sürüm, son giriş tarihi, lisans durumu.
  - 🔑 Lisans Üretici: Tek tıkla `AKAD-XXXX-YYYY-ZZZZ` formatında anahtar üretme, tür seçimi (Deneme / Standart / Premium / Süresiz).
  - ⚙️ Sistem: Anlık aktif sürüm bilgisi, yeni Release yayınlama kısayolu.
