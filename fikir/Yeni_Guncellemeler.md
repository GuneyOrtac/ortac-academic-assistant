# Yeni Güncellemeler ve Geliştirme Yol Haritası

Bu doküman, Akademik Asistan projesinin basit bir PDF kütüphanesinden, kendi kendine öğrenen tam otonom bir **Akademik Çalışma Arkadaşına** dönüşmesi için planlanan aşamaları ve vizyonu detaylandırmaktadır. Bu dosya, projeyi geliştirirken rehberimiz (roadmap) olacaktır.

---

## 🏗️ Birleştirilmiş Ana Mimariler ve Modüller (Çakışmalardan Arındırılmış)

### 1. Otonom Avcı Modülü (OpenAlex API & PASA Atıf Ağı)
Sistem, kullanıcının verdiği bir araştırma sorusu üzerinden bağımsız bir araştırma yürütür.
* **Akıllı Tarama ve Atıf Ağı:** OpenAlex veritabanı üzerinden konuya dair güncel makaleler bulunur. PASA projesinin mantığıyla, bulunan kaynakların referans (atıf) ağları otonom bir şekilde genişletilerek en alakalı kök referanslar seçilir. (GPT Researcher gibi web tarayıcılar yerine doğrudan akademik veritabanına odaklanılır.)
* **Açık Erişim (Open Access) Otomasyonu:** Ücretsiz PDF bağlantısı olanlar otomatik olarak indirilir ve kütüphaneye (`Kutuphane_Gelen`) alınır.

### 2. Tekil ve Güçlü PDF Ayrıştırıcı (Parser) Hattı
* **Yapılandırılmış Okuma (Resophy + Paper-Reader Birleşimi):** İndirilen PDF'ler tek bir aşamada okunur. Bu okuma esnasında metinler Markdown formatına çevrilir, tablolar korunur ve matematiksel formüller değişkenleriyle birlikte LaTeX formatında özel olarak indekslenir. İki ayrı okuma motoru kullanmak yerine birleştirilmiş (unified) bir ayrıştırıcı kullanılır.

### 3. Agentic RAG ve "Eksik Kaynaklar" Takip Sistemi
* **Karşılaştırmalı RAG (ScholarLens Mantığı):** Veritabanı arama motorumuz tekil bir makaleyi değil, birden fazla makaleyi aynı anda çekip birbiriyle kıyaslayabilen Ajan (Agentic) tabanlı bir RAG mimarisine sahip olacaktır. (Görsel okuma yeteneği olan Multi-Modal RAG ise 2. faza bırakılmıştır.)
* **İstek Listesi:** Algoritma, araştırma için "çok kritik" olduğunu tespit ettiği ancak erişime kapalı olan (paywall) makaleleri arayüzde özel bir **"Eksik / Bekleyen Kaynaklar"** sekmesine ekler. Kullanıcı bu eksik PDF'leri manuel indirip sisteme yüklediğinde kaynaklar RAG havuzuna dahil edilir.

### 4. Akademik Danışman (Tutor) Modülü
* **"Bana Öğret" Özelliği:** Kullanıcı bir makaleyi seçip "Bana Öğret" modunu başlatır.
* **Formül ve Mantık Açıklama:** Chat ekranı bir Tez Danışmanı gibi davranır. Ayrıştırıcı hattının çıkardığı matematiksel formülleri ve yazarın metodolojik tercihlerini doğrudan makalenin bağlamıyla izah eder.

### 5. Makale Taslak Üretimi ve Referans Yönetimi (Mendeley & Zotero)
* **Sıfır Halüsinasyon (OpenDraft Güvenilirliği):** Taslaklar yazılırken asla uydurma referans kullanılmaz. Her cümlenin sonuna yazar/yıl formatında kesin atıf (APA 7) eklenir.
* **Microsoft Word (.docx) Çıktısı Alabilme:** Üretilen tüm metinler, makale taslakları ve sentezler arayüzdeki bir butonla doğrudan biçimlendirilmiş (başlıklar, paragraflar) bir Word dosyası (.docx) olarak indirilebilecektir.
* **Sarı Vurgu (Highlight) ile Atıf İşaretleme:** Word çıktısı alınırken, kullanıcının Mendeley/Zotero ile sonradan manuel ekleyeceği atıf yerleri (örneğin `[Atıf Eklenecek: Yılmaz 2023]`) Word dosyasında otomatik olarak **sarı arka planla vurgulanmış** halde gelir. Böylece araştırmacı metni okurken atıf eklenecek yerleri gözden kaçırmaz.
* **Seçmeli Dışa Aktarım (Mendeley / Zotero):** Kullanıcı arayüzüne (UI) dinamik bir seçim (toggle/buton) eklenecektir. Kullanıcı kendi tercihine göre üretilen kaynakçayı ve künyeleri doğrudan Mendeley veya Zotero formatında dışa aktarabilecektir. Her iki altyapı da desteklenecektir.

### 6. Manuel Kaynak Yükleme ve Akıllı Künye Çıkarımı
* **Yerel/Türkçe Literatür Desteği:** OpenAlex veya diğer uluslararası veritabanlarında indekslenmeyen yerel/Türkçe makaleler, araştırmacı tarafından arayüzdeki "Makale/PDF Ekle" butonu ile sisteme manuel olarak yüklenebilecektir.
* **Yapay Zeka Destekli Metadata (Künye) Çıkarımı:** Yüklenen PDF'in ilk sayfaları ayrıştırıcı (parser) tarafından okunarak Yazar, Yıl, Makale Başlığı, Dergi Adı gibi künye bilgileri yapay zeka modeli tarafından otomatik olarak tespit edilecektir.
* **Kullanıcı Onayı (Human-in-the-Loop):** Çıkarılan meta-veriler doğrudan sisteme yazılmaz; önce arayüzde kullanıcının onayına sunulur. Araştırmacı gerekirse ufak düzeltmeler yaptıktan sonra "Onayla" butonuna basar. Böylece yerel makale hem RAG havuzuna dahil olur hem de Zotero/Mendeley senkronizasyonu için sıfır hatayla hazır hale gelir.

---

## 📦 Altyapı ve Sistem Gereksinimleri (DevOps)

### 1. Taşınabilirlik (Portability) ve Docker Paketlemesi
Projenin sadece mevcut bilgisayarda değil; herhangi bir Windows, Mac veya Linux cihazda tek tıkla çalışabilmesi için "Konteyner (Container)" mimarisine geçilecektir.
* **Sabit (Absolute) Yollardan Kurtulma:** Sistemdeki `D:\` veya `E:\` gibi sabit sürücü yolları kaldırılacaktır. PDF kütüphanesi (`Kutuphane_Gelen` vb.), SQLite veritabanı ve ChromaDB vektör dosyaları tamamen projenin ana dizinine göre (relative path) veya `.env` (çevresel değişkenler) üzerinden dinamik hale getirilecektir.
* **Dockerization (Konteynerleştirme):** Frontend (React), Backend (FastAPI) ve VectorDB (ChromaDB) modülleri ortak bir `docker-compose.yml` altyapısında birleştirilecektir. Yeni bir bilgisayara geçildiğinde, karmaşık Python kütüphaneleri veya Node.js kurmak yerine sadece `docker compose up -d` komutuyla tüm sistem saniyeler içinde ayağa kalkacaktır.
* **Uygulama ile Dosyaların (Yedeğin) Birbirinden Ayrılması:** Sistemin motoru (kodları) ile, sizin PDF'leriniz ve yapay zekanın öğrendiği veritabanı tamamen iki ayrı kutuya konacaktır. Program tamamen çökse, silinse veya güncellense bile **hiçbir PDF'iniz veya özetiniz silinmeyecektir**. Flash belleğe atarken sadece "Verilerim" isimli ana klasörü kopyalamanız projenin eksiksiz yedeğini almak için yeterli olacaktır.

### 2. Yedekleme (Backup) Stratejisi ve Ayar Menüsü
Arayüze eklenecek özel bir "Yedekleme Ayarları" menüsü ile sistemin veri güvenliği tamamen kullanıcının anlık kontrolüne bırakılacaktır.
* **Bulut ve Yerel Butonları (Aç-Kapat):** İsteğe bağlı olarak Google Drive/OneDrive gibi bulut klasörlerine otomatik senkronizasyonu veya yerel (.zip) yedeklemeyi açıp kapatan (toggle) butonlar eklenecektir. Kullanıcı isterse sadece bulutta, isterse sadece yerelde, isterse her ikisinde aynı anda çalışabilecektir.
* **Anında Tetikleme (Manuel Yedek):** Kullanıcı istediği anda arayüzdeki "Şimdi Yedekle" butonuna basarak kütüphanesinin ve ChromaDB veritabanının anlık bir kopyasını harici diskine veya bulutuna alabilecektir.

---

## 🖥️ Dış Yazılım Entegrasyonları (MCP ile Masaüstü Kontrolü)
Asistanın sadece kendi içinde çalışan bir yapıdan çıkıp, araştırmacının bilgisayarındaki ağır analiz programlarını otonom olarak kullanabilmesi hedeflenmektedir. Bunun için **Model Context Protocol (MCP)** standartları kullanılacaktır. Doğrudan açık kaynaklı ve güvenilir hazır sunucular (servers) sisteme dahil edilecektir:

*   **Coğrafi Bilgi Sistemleri (GIS) Entegrasyonu:**
    *   **Hedef:** Doğal dil ile harita katmanlarını analiz ettirmek ve mekansal (spatial) işlemler yaptırmak.
    *   **Kullanılacak Hazır MCP Sunucuları:**
        *   **`mahdin75/gis-mcp`**: Açık kaynaklı Python kütüphanelerini (GeoPandas, Shapely, Rasterio) kullanan, ticari lisans gerektirmeyen ve en güvenilir/bağımsız genel GIS sunucusu.
        *   **`geo2004/MCP-ArcGISPro`**: Doğrudan ArcGIS Pro masaüstü programı kullanan araştırmacılar için, asistan ile ArcGIS arasında köprü kuracak özel bağlantı sunucusu.
*   **MATLAB Entegrasyonu:**
    *   **Hedef:** Yapay zekanın MATLAB çalışma alanını (workspace) okuyup otonom kod çalıştırması, hata ayıklaması ve grafik/matris sonuçlarını analiz etmesi.
    *   **Kullanılacak Hazır MCP Sunucusu:** **`matlab/matlab-mcp-server`** (Bizzat MathWorks tarafından geliştirilen resmi, güncel ve stabil sunucu).
*   **Zotero Entegrasyonu (Arka Plan Yönetimi):**
    *   **Hedef:** Araştırmacının Zotero arayüzünü hiç açmasına gerek kalmadan, asistanın MCP üzerinden Zotero'nun yerel veritabanına (SQLite) veya yerel API'sine (Better BibTeX vb.) bağlanması.
    *   **Kazanım:** Asistan yeni bir makale bulduğunda (OpenAlex üzerinden) veya bir taslak hazırladığında, bu makalenin PDF'ini ve künyesini otonom olarak kullanıcının Zotero kütüphanesindeki ilgili klasöre (collection) doğrudan ekler.

---

## 🌍 İlham Alınan GitHub Projeleri (Referanslar)
* **PASA (Bytedance):** Otonom atıf ağı analizi ve referans seçimi.
* **Resophy & paper-reader-skill:** PDF'lerin Markdown, tablo ve formül destekli ayrıştırılması.
* **ScholarLens:** Agentic RAG ile karşılaştırmalı makale sentezi.
* **OpenDraft:** Sıfır halüsinasyon ve kesin atıf kontrolü.
* **Mendeley / Zotero:** Profesyonel referans yönetimi çıktı sistemleri (.ris / .bib).
