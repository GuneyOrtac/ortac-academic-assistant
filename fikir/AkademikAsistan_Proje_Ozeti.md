# Akademik Asistan Projesi

Bu proje, araştırmacıların ve öğrencilerin akademik okuma, düzenleme ve yazma süreçlerini yerel bilgisayarlarında (offline ve gizlilik odaklı) hızlandırmak amacıyla tasarlanmış yapay zeka (LLM) destekli bir asistan ve kütüphane sistemidir.

## 🚀 Mevcut Özellikler ve Son Güncellemeler

### 1. Akıllı Kütüphane Yönetimi
* **Otomatik Tasnif:** `Kutuphane_Gelen` klasörüne atılan PDF dosyaları yapay zeka (Qwen 14B) tarafından incelenir.
* **Eser Analizi:** Belgenin türü (Makale, Kitap, Yüksek Lisans Tezi, Doktora Tezi) otomatik tespit edilir.
* **Türkçe Özet ve Etiketleme:** İngilizce veya karmaşık kaynaklar olsa bile eser için 4-5 cümlelik kapsamlı Türkçe özet ve anahtar kelimeler üretilir.
* **APA 7 Formatında Arşivleme:** Dosya adları yazar ve yayın yılına göre akademik formata (örn: `Yilmaz_2024_Makine.pdf`) çevrilerek `Kutuphane_Arsiv` klasörüne taşınır.

### 2. Tam Metin RAG (Gelişmiş Vektör Arama) - *YENİ*
Sizden gelen harika bir fikir üzerine mimari güncellendi! Artık eserlerin sadece ilk sayfaları değil, **PDF'in tamamı** okunarak RAG (Retrieval-Augmented Generation) vektör veritabanına (ChromaDB) aktarılıyor. 
Böylece makale yazarken, sistem tüm kütüphanenizin içeriğini tarayıp, doğrudan metinlerin içinden bilimsel kaynak göstererek size yanıt verebilecek.

### 3. Modern Arayüz ve Donanım İzleme
* React tabanlı premium ve modern bir tasarıma sahiptir. Eserler şık kartlar halinde, renk kodlu etiketlerle sunulur.
* Sisteminizin (özellikle RTX 2060 SUPER) anlık bellek ve GPU kullanımlarını canlı olarak izleyebilirsiniz.

---
*Bu doküman sistemin güncel durumunu özetlemek üzere oluşturulmuştur.*
