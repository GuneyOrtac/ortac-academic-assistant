# Burada Kaldık (Token Tasarrufu ve Optimizasyon)

Bu doküman, geliştirme sürecinde "Token Tasarrufu" konusunda kaldığımız yeri ve bir sonraki adımda üzerine düşünülecek/kodlanacak kısımları hatırlatmak için oluşturulmuştur.

## 🧠 Token Tasarrufu İçin Önerilen Stratejiler
1. **"Sadece İlgili Kısmı Getir" (Top-K Filtresi):** Kullanıcı soru sorduğunda makalenin/PDF'in tamamı LLM'e (Yapay Zekaya) gönderilmez. ChromaDB vektör veritabanı, PDF içinden sadece soruyla eşleşen en alakalı 3-4 paragrafı bularak modele iletir. (Binlerce token yerine yüzlerce token harcanır.)
2. **PDF Çöp Filtresi (Boilerplate Removal):** PDF ayrıştırılırken "Kaynaklar (References)", dergi üst/alt bilgileri ve yazar iletişim adresleri gibi LLM için değersiz kısımlar otomatik olarak kesilip atılır. Bu işlem, RAG boyutunu anında %20-%30 oranında düşürür.
3. **Agentic API Model Yönlendirmesi (Model Routing):** Sistem, donanım yükünü sıfırlamak, maliyeti düşürmek ve verimi maksimize etmek için 3 katmanlı bir bulut (API) mimarisi kullanır:
   * **Aşama 1 (Angarya ve Veri Hazırlığı):** `Gemini 1.5 Flash` kullanılır. Dosya adlandırma, PDF'ten metin/çöp ayıklama ve basit özetleme gibi işlemler için idealdir (Çok ucuz, devasa bağlam).
   * **Aşama 2 (Kütüphane Taraması - RAG):** `DeepSeek V4 Pro` (veya Flash versiyonları) kullanılır. Devasa hafızası (1M Token) sayesinde çok sayıda makaleyi aynı anda yükleyip aralarındaki ilişkileri taramak ve geniş bağlam oluşturmak için üstündür.
   * **Aşama 3 (Akademik Danışman & Derin Sentez):** `DeepSeek-R1 (Reasoner)` kullanılır. V4 Pro'nun elediği ve odaklandığı kritik metinler bu modele verilir. Zor bir formülü açıklama, mantıksal çıkarım ve sıfır halüsinasyonlu makale taslağı (OpenDraft) yazımı için derin düşünme yeteneği sergiler.
4. **Context Caching (Bağlam Ön Belleğe Alma):** Araştırma sırasında aynı makale dizisi veya promptlar tekrar tekrar yapay zekaya gönderildiğinde, API sağlayıcısı (DeepSeek) metni ön belleğe alır ve %90-%98 arası otomatik "Cache Hit" indirimi uygular.
5. **Zaman Ayarlı Otonom Planlama (Off-Peak İndirimi):** DeepSeek API, yoğun olmayan (Off-Peak) saatlerde %50 indirimli çalışır. Sistem arayüzüne, yüksek maliyetli/büyük işleri (örneğin 50 makalenin tek seferde analizi) Türkiye saatiyle yoğun saatler dışında (13:00 - 04:00 arası veya hafta sonları) çalıştıracak şekilde planlama (zamanlama) yapan akıllı bir bütçe uyarısı eklenecektir.


