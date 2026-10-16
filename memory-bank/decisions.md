# Mimari Kararlar Defteri (Decisions)

Bu dosya, projede alınan kritik kararları ve arkasındaki mantığı saklar.  
Her yeni karar en üste eklenir (yeni → eski).

---

## Karar: Kullanıcı Odaklı & Sıfır Kalıntılı Kaldırma Mimarisi (Ekim 2026)
**Karar:** 
1. **İki Seçenekli Karar Penceresi:** Kullanıcı programı kaldırmak istediğinde NSIS üzerinden nazik bir karar kartı sunulur:
   - *[EVET] Kütüphanemi ve Vektörlerimi Koru (Önerilen):* Sadece program binary'leri ve geçici önbellekler silinir; kullanıcının PDF arşivi ve ChromaDB veritabanı `{HedefSürücü}\AkademikAsistan\veri` altında güvenle saklanır.
   - *[HAYIR] Tam Temizlik (Sıfır Kalıntı):* Program, kütüphane, ChromaDB, HF modelleri, `%APPDATA%`, registry ve kısayollar tek bayt kalmayacak şekilde tamamen yok edilir.
2. **Süreç Kapatma Otomasyonu:** Kaldırma sihirbazı başlatıldığında açık olan `backend-server.exe` ve `akademik-asistan.exe` süreçleri `customUnInit` ile otomatik sonlandırılır.
3. **Temiz Oda QG-10 Doğrulaması:** Her iki senaryonun da disk üzerindeki davranışı otomatik temiz oda test matrisine (`tools/run_sandbox_test.py`) bağlanmıştır.

---

## Karar: Çoklu Model RAG Boyut İzolasyonu & Qwen2-7B Güvenli Yükleme (Ekim 2026)
**Karar:** 
1. **ChromaDB Boyut İzolasyonu:** Farklı vektör boyutlarına sahip modeller (`bge-m3`: 1024, `qwen2-7b`: 3584, `e5-small`: 384, `cloud-gemini`: 768) için dinamik `makale_kutuphanesi_{profil}` koleksiyon adı zorunlu kılındı.
2. **Qwen2-7B Güvenli Çalışma Parametresi:** HuggingFace `gte-Qwen2-7B-instruct` modeli çağrılırken `trust_remote_code=False` standardı getirildi.
3. **Çift Önbellek Taraması:** Modeller önce hedef sürücüdeki `veri/modeller/hf` dizininde, bulunamazsa kullanıcının sistem önbelleğinde (`~/.cache/huggingface/hub`) aranarak 28 GB'lık mükerrer indirmeler engellendi.
4. **Cloud-Gemini API Koruması:** `cloud-gemini`'nin yerel bir model olmadığı, Google API anahtarı gerektirdiği kontrol altına alındı; anahtar yoksa veya çevrimdışıysa kullanıcıya yerel modelleri seçmesi yönünde net rehberlik verildi.
**Gerekçe:** 
- `gte-Qwen2-7B-instruct` uzaktan kod çalıştırmada eski transformers'a dayalı `modeling_qwen.py` indirdiği için `'Qwen2Config' object has no attribute 'rope_theta'` hatası veriyordu. `trust_remote_code=False` ile transformers'ın yerel `Qwen2Model` motoru hatasız devreye girer.
- Tek bir koleksiyon adı kullanıldığında model değiştiren kullanıcı `InvalidDimensionException` ile karşılaşıyor ve RAG kütüphanesi çöküyordu.

---

## Karar: Temiz Oda Sanal Test İstasyonu & Devre Kesici (Clean-Room & HITL) (Ekim 2026)
**Karar:** Kodlar asla kullanıcının bilgisayarı üzerinde kobay olarak test edilmeyecek. Dağıtım öncesi geçici bir sanal alanda 7 Kalite Kapısı (`tools/run_sandbox_test.py`) çalıştırılacak.
**Gerekçe:** Kullanıcı sisteminde kalıntı bırakmamak, bozuk sürümlerin GitHub'a gitmesini engellemek ve yapay zekânın kısır döngüye girmesini (infinite loop) önlemek.
**Devre Kesici Kuralı:** Bir hata üst üste 2 kez çözülemezse veya mimari bir tercih gerekirse sistem otonom denemeyi derhal durdurup kullanıcıya karar kartı sunar (`tools/circuit_breaker.py`).

---

## Karar: Uygulama İçi Canlı Akış Güncelleyicisi (Ekim 2026)
**Karar:** Güncelleme sırasında tarayıcı açıp kullanıcıya manuel indirme linki vermek (`webbrowser.open`) terk edildi; uygulama içi akışkan arka plan indiricisine geçildi.
**Gerekçe:** Masaüstü kullanıcı deneyiminde tarayıcıya yönlendirme amatör bir his uyandırır. Kullanıcı tek tıkla arayüzde ilerlemeyi (% ve MB) görmeli ve indirme bitince kurulum sihirbazı otomatik açılmalıdır.
**Sonuç:** FastAPI arka plan iş parçacığı (`requests.get(stream=True)`), `/api/guncelleme-durum` sorgulama ve `os.startfile()` ile doğrudan çalıştırma.

---

## Karar: Model Versiyon Standardizasyonu & Hedef Sürücüye İzolasyon (Ekim 2026)
**Karar:** `gemini-2.5-flash` Google tarafından kapatıldığı için (404), Sohbet & RAG için `gemini-3.5-flash`, PDF analiz/künye için `gemini-3.5-flash-lite` standardına geçildi.
**İzolasyon Kararı:** Yerel modeller ve Hugging Face önbellekleri için `HF_HOME` ve `TORCH_HOME` ortam değişkenleri kullanıcının seçtiği hedef sürücüdeki `veri/modeller/hf` dizinine kilitlendi; `C:\Users\` altına sızıntı yapılması kesin olarak engellendi.

---

## Karar: GitHub Releases Hızlı Dağıtım Hattı (Ekim 2026)
**Karar:** 450 MB'lık büyük binary paketlerinin yüklenmesinde PowerShell `HttpClient` yerine Python `requests` ve katı `Content-Length` başlığı kullanan `tools/upload_release_fast.py` geliştirildi.
**Gerekçe:** PowerShell'in `chunked transfer encoding` yapması GitHub API'sinde takılmalara yol açıyordu. Python akışı ~2.5 MB/s hızında ve canlı yüzde göstergesiyle hatasız yükleme sağladı.

---

## Karar: Masaüstü Dağıtım Formatı (Ekim 2026)
**Karar:** Python FastAPI arka yüzü PyInstaller ile tek bir klasörde (`backend-server.exe`) derlenip Electron extraResources içine gömüldü.
**Gerekçe:** Kullanıcının bilgisayarında Python, pip veya kütüphane kurulu olmasına gerek kalmadan tek tıkla çalışan bağımsız masaüstü yazılımı.
**Sonuç:** `ORTAC.Akademik.Asistan.Setup.0.0.3.exe` (NSIS) ve taşınabilir zip.

---

## Karar: Yerel Model → Bulut API Geçişi (Eylül 2026)
**Karar:** Ağır yerel modeller yerine hibrit yapı (Hafif yerel embedding + Bulut Gemini/DeepSeek API) benimsendi.
**Gerekçe:** Donanım yorgunluğu ve fan gürültüsünü engellemek, yüksek bağlam penceresinden faydalanmak.

---

## Karar: Admin Dashboard → GitHub-Merkezli
**Karar:** Firebase/Supabase/Vercel yerine GitHub Private Repo kullanılacak.
**Gerekçe:** Ek servis maliyeti yok, sıfır kurulum, tek platform.
**Veri Akışı:** Desktop App → GitHub API → telemetry/{lisans_id}.json

---

## Karar: .akpack ile Sıfır Maliyetli Senkronizasyon
**Karar:** Bulut depolama yerine taşınabilir .akpack paketi.
**İçerik:** PDF + künye + ChromaDB vektörleri (tek arşivde).
**Gerekçe:** İkinci kullanıcı hiç token harcamadan hazır indeks kullanır.

---

## Karar: LiteLLM Caching ile %90 Tasarruf
**Karar:** LiteLLM kütüphanesi + Redis ile API cache sistemi kurulacak.
**Gerekçe:** Aynı PDF metni + aynı soru için ikinci kez API çağrısı yapılmaz.
