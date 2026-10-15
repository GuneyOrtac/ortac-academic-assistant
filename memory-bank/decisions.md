# Mimari Kararlar Defteri (Decisions)

Bu dosya, projede alınan kritik kararları ve arkasındaki mantığı saklar.  
Her yeni karar en üste eklenir (yeni → eski).

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
