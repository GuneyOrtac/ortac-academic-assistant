# Aktif Bağlam (Active Context)
> **Son Güncelleme:** 16 Ekim 2026 (Gece Seansı Sonu)  
> **Durum:** Temel Altyapı Hazır, Temiz Oda Test Motoru Doğrulandı, Yarınki Seans İçin Zemin Kuruldu.

---

## 📌 1. Mevcut Durum Özeti & Kazanımlar

Bu seansta masaüstü uygulamasının paketlenmesi, dağıtımı, canlı güncellenmesi ve test güvenliği üzerine kapsamlı bir atılım gerçekleştirildi:

1. **Adım 8 (Masaüstü Paketleme & Otomatik Dağıtım) Tamamlandı:**
   - Electron sarmalayıcısı (`product/adim-8/electron-builder-uygulama`) ile FastAPI backend'i PyInstaller ile derlenerek `backend-server.exe` olarak Electron extraResources altına gömüldü.
   - NSIS tek tıkla kurulum sihirbazı (`ORTAC.Akademik.Asistan.Setup.0.0.3.exe` - 455 MB) ve taşınabilir zip (`ORTAC.Akademik.Asistan.0.0.3-win.zip` - 392 MB) üretildi.
   - GitHub Releases API üzerinden resmi `v0.0.1`, `v0.0.2` ve `v0.0.3` sürümleri canlıya alındı.

2. **Uygulama İçi Canlı Akış Güncelleyicisi (In-App Streaming Updater):**
   - Kullanıcıyı tarayıcı indirme sayfasına yönlendirme (`webbrowser.open`) yaklaşımı terk edildi.
   - Backend üzerinde arka plan iş parçacığı (`_download_and_launch_installer`) ve `/api/guncelleme-durum` endpoint'i yazıldı.
   - Arayüzde (`SettingsTab.tsx`) canlı `%` ve `MB / Toplam MB` ilerleme çubuğu eklendi.
   - İndirme bittiğinde Windows API'si (`os.startfile`) ile kurulum dosyası otomatik başlatılır hale getirildi.

3. **Hızlı GitHub Dağıtım Boru Hattı:**
   - PowerShell `HttpClient`'ın büyük dosyalarda (450+ MB) `chunked` transfer takılma sorunu çözüldü.
   - Python `requests` ve katı `Content-Length` başlığı kullanan `tools/upload_release_fast.py` ile GitHub Releases yüklemeleri ~2.5 MB/s hızla canlı yüzde göstergesiyle stabilize edildi.

4. **Model Hiyerarşisi & Sürücü Koruması:**
   - Google tarafından kullanımdan kaldırılan ve 404 veren `gemini-2.5-flash` modelinden `gemini-3.5-flash` (RAG & Sohbet) ve `gemini-3.5-flash-lite` (PDF metadata) modellerine geçildi.
   - Hugging Face önbellekleri (`HF_HOME`, `TORCH_HOME`) kullanıcının seçtiği hedef sürücüye (`veri/modeller/hf`) kilitlendi; `C:\Users\` altına sızıntı önlendi.

---

## 🛡️ 2. Temiz Oda Test Çerçevesi & Devre Kesici (Clean-Room Framework)

Yazılım geliştirme sürecinin kobaysız, hatasız ve kısır döngüsüz yürütülmesi için kurulan evrensel altyapı:

- **Dokümantasyon:** [`CLEAN_ROOM_SANDBOX_TESTING_FRAMEWORK.md`](file:///e:/Makale%20YZ/CLEAN_ROOM_SANDBOX_TESTING_FRAMEWORK.md) kök dizinde tüm projelere uyarlanabilir bir şablon olarak hazırlandı.
- **Devre Kesici (HITL Circuit Breaker):** [`tools/circuit_breaker.py`](file:///e:/Makale%20YZ/tools/circuit_breaker.py) oluşturuldu. Üst üste 2 başarısızlıkta veya mimari kararlarda otonom döngüyü kesip kullanıcıya karar seçeneği sunar.
- **11 Kalite Kapısı Test İstasyonu:** [`tools/run_sandbox_test.py`](file:///e:/Makale%20YZ/tools/run_sandbox_test.py) güncellendi ve çalıştırılarak **%100 PASS (11/11 Başarı)** teyit edildi:
  1. *QG-1 & QG-2:* Hedef sürücü izolasyonu & model önbellek karantinası.
  2. *QG-3:* Dış veri çekimi ve göreceli URL çözümleme (DergiPark / OpenAlex).
  3. *QG-4:* ChromaDB vektör kalıcılığı ve chunk kaydı.
  4. *QG-5:* Semantik geri çağırma (retrieval) doğrulaması.
  5. *QG-6:* Gemini 3.5 model hiyerarşisi yapılandırması.
  6. *QG-7:* Canlı güncelleme ve arka plan stream motoru.
  7. *QG-8:* Çoklu model alternatifleri (3 Yerel Model: `e5-small`, `bge-m3`, `qwen2-7b` + 1 API: `cloud-gemini`) ve ChromaDB vektör boyut izolasyonu (`makale_kutuphanesi_{profil}`).
  8. *QG-9:* Kütüphane yaşam döngüsü, gerçek çok sayfalı PDF oluşturma, künyeleme, chunking, klasör senkronizasyonu (`/api/kutuphane-senkronize`) ve sıfır kalıntıyla silme.
  9. *QG-10:* Kullanıcı odaklı kaldırma (Uninstaller) simülasyonu ("Kütüphanemi Koru" ve "Tam Temizlik - Sıfır Kalıntı").
  10. *QG-11:* Donmuş Binary (Frozen Binary) & Telemetri İzolasyon Koruması: Kod seviyesinde `ANONYMIZED_TELEMETRY=False` / `CHROMA_TELEMETRY=False` kilitleri ve `build.py` içinde PyInstaller `--collect-all=chromadb` ve dinamik import hook'ları.
  11. *Karantina Sonu:* Geçici sanal dizinin tek bayt kalıntı bırakmadan imhası.

### 🔬 ChromaDB Telemetri (PostHog) ve Donmuş Binary Teşhis Bulguları:
- **Kök Neden:** ChromaDB varsayılan olarak arka planda PostHog telemetrisi çalıştırmaya çalışır. PyInstaller kaynak kodları tek bir `.exe` içerisine paketlerken dinamik alt modülleri (`chromadb.telemetry.product.posthog`) derleme dışında bırakıyordu. Bu durum `.venv` içinde fark edilemiyordu çünkü geliştirme ortamında dosyalar diskte vardı.
- **Çözüm (Kod & Test Seviyesi):** `rag.py`, `main.py` ve `run_sandbox_test.py` dosyalarının en başına `os.environ["ANONYMIZED_TELEMETRY"] = "False"` ve `os.environ["CHROMA_TELEMETRY"] = "False"` kilitleri yerleştirildi.
- **Çözüm (Paketleme Seviyesi):** `build.py` dosyası endüstri standardı hook'larla güçlendirildi (`--collect-all=chromadb`, `--collect-submodules=langchain_chroma` ve hidden import'lar eklendi).
- **Sektörel Kıyaslama:** GitHub'daki benzer açık kaynak projeler (Khoj AI, AnythingLLM, Jan.ai) incelenerek kıyaslama analizi [`CLEAN_ROOM_SANDBOX_TESTING_FRAMEWORK.md`](file:///e:/Makale%20YZ/CLEAN_ROOM_SANDBOX_TESTING_FRAMEWORK.md) belgesine işlendi.

---

## 🚀 3. Gerçekleştirilen Aşama & Başarılar (v0.0.4 Tamamlandı & v0.0.5 Hazırlığı)

1. [x] **Temiz Oda 11 Kalite Kapısı Doğrulaması:** `tools/run_sandbox_test.py` çalıştırıldı -> **11/11 PASS (%100 Başarı)**.
2. [x] **Electron UI Başsız Duman Testi (Headless Smoke Test):** `tools/electron_smoke_test.js` geliştirildi ve çalıştırıldı -> React DOM Mount, IPC Preload Bridge ve Renderer stabilitesi **100% PASS**.
3. [x] **Kullanıcı Odaklı Kaldırma (Uninstaller) Mimarisi:** NSIS `uninstaller.nsh` ve `tools/uninstaller_cleanup.py` entegre edildi. Kullanıcıya [EVET] Kütüphanemi Koru / [HAYIR] Tam Temizlik seçenekleri sağlandı.
4. [x] **Ayarlar Sekmesi Model Seçicisi & Güvenli Birleştirme:** `SettingsTab.tsx` içine 4 model profilinin (3 Yerel + 1 Bulut) görsel kartları eklendi. `model_factory.save_settings` mevcut ayarları ezmeden birleştirecek şekilde güçlendirildi.
5. [x] **v0.0.4 Masaüstü Paketleri & Üretim Dağıtımı:**
   - PyInstaller ile backend executable derlendi.
   - `ORTAC.Akademik.Asistan.Setup.0.0.4.exe` (310 MB) ve `Akademik Asistan-0.0.4-win.zip` (392 MB) üretildi.
   - Kullanıcının `F:\AkademikAsistan\resources` hedefindeki kurulu uygulaması verilerine (`F:\AkademikAsistan\veri`) tek bir bayt zarar vermeden v0.0.4'e sıcak yamalandı.