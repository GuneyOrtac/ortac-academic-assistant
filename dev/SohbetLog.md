# Sohbet Logları ve Karar Defteri

Bu doküman, yapay zeka asistanı ile yapılan toplantılarda alınan tüm kritik kararları, mimari tercihleri ve arkasındaki mantığı (reasoning) detaylı olarak saklamak için oluşturulmuştur.

---

## Oturum Tarihi: 27 Eylül 2026
**Gündem:** Yerel modellerden API mimarisine geçiş, maliyet/performans analizi ve Arayüz (UI) mimarisi seçimi.

### 1. Yerel Modellerden (Qwen) Bulut API'ye Geçiş Kararı
Bilgisayar donanımını (RAM/GPU) yormamak, fan sesini önlemek ve çok daha "akıllı" modellere erişmek amacıyla projede yerel modellerin kullanılması fikrinden vazgeçilmiştir. Bunun yerine, 1000 TL (yaklaşık 30 Dolar) gibi bir bütçe ile aylarca hizmet alınabilecek Google Gemini ve DeepSeek API'lerinin entegre edilmesine karar verilmiştir.

### 2. Üç (3) Katmanlı Agentic Model Yönlendirmesi (Routing)
Bütçeyi optimize etmek ve hızı artırmak için, tek bir LLM kullanmak yerine işlemin zorluğuna göre 3 farklı API modelinin kullanıldığı "Agentic Routing" mimarisi tasarlanmıştır:
*   **Aşama 1 (Hazırlık ve Angarya): `Gemini 1.5 Flash`**
    *   **Kullanım Alanı:** Gelen PDF'lerin türünü tespit etme, çöp kısımlarını (kaynakça vs.) temizleme ve 4-5 cümlelik özet çıkarma.
    *   **Nedeni:** Çok hızlıdır, devasa bağlam (context) alabilir ve 1000 TL'ye yaklaşık 250 Milyon token işleyebilecek kadar ucuzdur.
*   **Aşama 2 (Kütüphane Taraması ve RAG): `DeepSeek V4 Pro` (veya güncel V4.1 Flash)**
    *   **Kullanım Alanı:** 1 Milyon token hafızası ile çok sayıda makaleyi (Örn: 50 makale) aynı anda okuyup, aralarındaki yöntemsel farkları analiz etme ve tablo çıkarma.
    *   **Nedeni:** Büyük doküman analizlerinde GPT-4 seviyesinde zeka gösterip, fiyatının onun 30'da biri olması.
*   **Aşama 3 (Akademik Danışman & Derin Sentez): `DeepSeek-R1 (Reasoner)`**
    *   **Kullanım Alanı:** Süzülen ve RAG tarafından bulunan en kritik metinlerin (2-3 sayfa) mantıksal çıkarımını yapma, zor matematiksel formülleri açıklama ("Bana Öğret" modülü) ve halüsinasyonsuz makale taslağı (OpenDraft) yazma.
    *   **Nedeni:** OpenAI'ın o1 modeline rakip olarak üretilmiş, adım adım "düşünme (chain-of-thought)" yeteneğine sahip en ağır zeka modelidir.

### 3. Vaka Analizi: Maliyet ve Bütçe Simülasyonu
Bu yeni mimarinin maliyetini test etmek için 50 makalelik sıfırdan bir senaryo (okuma, tasnif, RAG araması, tablo çıkarma ve taslak yazdırma) oluşturulmuştur:
*   Teorik olarak yaklaşık **1 Milyon Token** veri işlenen böyle ağır bir akademik sürecin API maliyeti sadece **0.56 Dolar ile 1 Dolar (19-35 TL)** arasında hesaplanmıştır.
*   Kullanıcı deneyimi: Hatalı promptlar veya tekrar eden context sebepleriyle bu maliyetin pratikte 10 katına (350 TL) çıkması bile, masaüstünde harcanacak elektrik ve donanım eforuna veya aylık aboneliklere (ChatGPT Plus vb.) kıyasla çok avantajlı bulunmuştur.

### 4. API Optimizasyon Taktikleri (Gizli Tasarruflar)
Bütçeyi daha da verimli kullanmak için iki strateji sisteme gömülecektir:
*   **Context Caching:** DeepSeek'in aynı PDF veya metinlerin tekrar sorulması durumunda sağladığı %90-%98 arası "Ön bellek" indirimi.
*   **Off-Peak (Zaman Ayarlı) İndirim:** DeepSeek'in Türkiye saatiyle **13:00 - 04:00 arası ve tüm hafta sonu** sunduğu %50'lik gece indirimi. Ağır RAG taramaları için sisteme "zamanlama/erteleme" uyarısı yapan otonom bir yapı eklenecektir.

### 5. Arayüz ve Sunucu Mimarisi Kararı
Arayüz (UI) için iki farklı yol tartışılmıştır:
1.  *Masaüstü Uygulaması (Tauri/Electron):* Web arayüzü sunar ama sunucu çalıştırma gerektirmez. PDF'ler ve vektör DB (Chroma) tamamen yerel PC'de %100 gizlilikle kalır. Sadece API şifresi ortak paylaşılarak yakınlarla maliyet bölüşülebilir.
2.  *Bulut Web Uygulaması (Supabase + Vercel):* Ortak bir kütüphane/laboratuvar ortamı sunar ancak depolama sınırları (örn. Supabase'in 1 GB ücretsiz alanı) aşıldığında ekstra sunucu (VPS) maliyeti doğurur.
*   **Final Kararı (Geliştirme Yaklaşımı - MVP):** Mimari dağıtım (Masaüstü mü, Bulut mu?) süreçlerinin zorluğuna girmeden önce, sistemin çekirdeğinin çalışırlığını test etmek için **terminalde çalışan, "Minimum Viable Product (MVP)" bir Python motoru** kodlanması kararlaştırılmıştır. Arayüz daha sonra bu motorun üzerine inşa edilecektir.

---

## Oturum Tarihi: 12 Ekim 2026
**Gündem:** Gemini API geçişinin tamamlanması, Masaüstü (.exe) ve GitHub Otomatik Güncelleme Mimarisi, Lisanslama ve Sıfır Maliyetli Kütüphane Senkronizasyonu.

### 1. Gemini API Geçişi ve Model Doğrulaması
*   Önceki oturumda yarıda kalan NVIDIA bağımlılıkları temizlendi.
*   Google Gemini API'de eski modellerin (`1.5-flash`, `2.0-flash`) 404 verdiği ve Pro modellerin kota aştığı tespit edildi.
*   Sistemin ana motoru **`gemini-3.8-flash`** (Sohbet ve Makale Taslağı) ve **`gemini-3.1-flash-lite`** (PDF Künye Analizi) olarak güncellendi.
*   450 TL'lik mevcut prepaid bakiyenin Flash modelleriyle on milyonlarca token işleyebileceği doğrulandı.

### 2. Masaüstü (.exe) ve GitHub Releases Güncelleme Mimarisi
*   Uygulamanın Electron ile yerel bir masaüstü yazılımına dönüştürülmesi kararlaştırıldı.
*   Uygulama açılışında arka planda GitHub Releases API sorgulanacak; yeni sürüm varsa arayüzü engellemeden sağ üstte bir bildirim ikonu yanacak.
*   Kullanıcı bildirime tıkladığında GitHub Release açıklaması (Changelog / Neler Yeni?) şık bir modalda listelenecek ve kullanıcı onayıyla indirilecektir.
*   Kullanıcının kütüphane dosyaları (`veri/`) güncelleme sırasında kesinlikle korunacaktır.

### 3. Kimlik Doğrulama, Lisanslama ve Token Takibi
*   **Kimlik & Lisans:** Kullanıcı adı/şifre girişi ve donanım kimliğiyle (HWID) eşleşen offline/online lisans anahtarı doğrulama sistemi planlandı.
*   **Token & Bütçe Monitörü:** Kullanıcının yaptığı her istekte tüketilen girdi/çıktı tokenları toplanarak anlık harcama ve TL bakiye takip paneli eklenecektir.

### 4. Bulutsuz ve Sıfır Maliyetli Kütüphane Senkronizasyonu (.akpack)
*   **Temel Fikir:** Bir makale bir kullanıcı tarafından analiz edildiğinde (künye ve HuggingFace embedding vektörleri üretildiğinde), bu veriler bir "Kütüphane Paketi" olarak dışa aktarılabilir.
*   İkinci bir kullanıcı bu paketi içeri aldığında hiçbir yapay zeka token ücreti ve pahalı bulut depolama maliyeti ödemeden hazır indeksi anında kullanabilecektir.
*   Paylaşım P2P (yerel ağ) veya taşınabilir `.akpack` dosyaları üzerinden gerçekleştirilecektir.

### 5. Yönetici Paneli (Admin Dashboard) Mimarisi — GitHub-Merkezli
*   Firebase, Supabase veya Vercel gibi üçüncü parti hizmetlerle uğraşmamak için tüm telemetri ve lisans verileri doğrudan **GitHub Private Repo** üzerinde saklanması kararlaştırıldı.
*   Masaüstü uygulaması zaten sürüm kontrolü için GitHub API'ye bağlandığından, aynı bağlantı sırasında `telemetry/{lisans_id}.json` dosyasını güncelleyecek. Böylece ek bir servis veya sunucu gerekmeyecek.
*   Admin Paneli, bu verileri GitHub'dan çekip görselleştiren (dashboard, kullanıcı listesi, lisans üretici) **ayrı bir masaüstü uygulaması** olarak geliştirilecek.
*   Sonuç: Tek platform (GitHub) üzerinde güncelleme dağıtımı, telemetri toplama, lisans yönetimi ve kaynak kod barındırma — hepsi sıfır ek maliyetle.



