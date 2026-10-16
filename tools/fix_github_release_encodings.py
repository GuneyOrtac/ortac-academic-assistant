import sys
import subprocess
import requests
import json

# Windows console encoding fix
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def get_git_token():
    p = subprocess.Popen(
        ["git", "credential", "fill"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, _ = p.communicate(input="protocol=https\nhost=github.com\n\n")
    for line in stdout.splitlines():
        if line.startswith("password="):
            return line[len("password="):].strip()
    return None

RELEASES_DATA = {
    "v0.0.4": {
        "id": 414932051,
        "name": "ORTAC Geo|Science Akademik Asistan v0.0.4",
        "body": """## 🚀 ORTAC Geo|Science Akademik Asistan v0.0.4 Kararlı Sürüm

Bu sürüm; yerel yapay zekâ model mimarisini, RAG çoklu boyut izolasyonunu, kullanıcı odaklı kaldırma prosedürünü ve arayüz duman testlerini tamamlayan kararlı üretim sürümüdür.

---

### ✨ Önemli Yenilikler & Düzeltmeler:

1. **Zirve Güç Modeli (gte-Qwen2-7B-instruct) Desteği:**
   - 3584 boyutlu en yüksek başarımlı yerel model için `trust_remote_code=False` standardına geçildi; `rope_theta` çökmesi tamamen çözüldü.
   - Bilgisayarınızda önceden indirilen 28 GB'lık HuggingFace önbelleği otomatik tanınarak mükerrer indirmeler engellendi.

2. **ChromaDB Çoklu Model Boyut İzolasyonu:**
   - Farklı modeller (`e5-small` [384], `bge-m3` [1024], `qwen2-7b` [3584], `cloud-gemini` [768]) için izole koleksiyon yapısı (`makale_kutuphanesi_{profil}`) kurularak `InvalidDimensionException` engellendi.

3. **Kullanıcı Odaklı Akıllı Kaldırma (Uninstaller) Mimarisi:**
   - Yazılım kaldırılırken kullanıcıya net iki seçenek sunulur:
     - **[EVET]: Kütüphanemi Koru (Önerilen)** - Program dosyaları temizlenir, PDF arşivi ve ChromaDB veritabanı %100 saklanır.
     - **[HAYIR]: Tam Temizlik Yap (Sıfır Kalıntı)** - Tüm kütüphane, modeller ve geçici izler tamamen silinir.

4. **Ayarlar Sekmesinde Görsel Model Kartları:**
   - Kurulum sihirbazını baştan başlatmaya gerek kalmadan, Ayarlar sekmesinden 3 yerel model ve 1 bulut API alternatifi anında seçilebilir ve kaydedilebilir hale getirildi.

5. **Temiz Oda ve Başsız Arayüz (Headless UI) Güvencesi:**
   - 10 Kalite Kapısı ve Electron React DOM bağlama testlerinden %100 başarıyla geçmiştir.

---

### 📦 İndirme Seçenekleri (Assets):
1. **`ORTAC.Akademik.Asistan.Setup.0.0.4.exe` (Windows Kurulum Sihirbazı - ÖNERİLEN):**
   - Masaüstü kısayolu oluşturur, arka planda FastAPI backend'ini otomatik yönetir.
2. **`Akademik.Asistan-0.0.4-win.zip` (Taşınabilir Sürüm):**
   - Kurulum gerektirmeden arşivden çıkartılıp doğrudan çalıştırılabilir.
"""
    },
    "v0.0.3": {
        "id": 414172907,
        "name": "ORTAC Geo|Science Akademik Asistan v0.0.3",
        "body": """## 🚀 ORTAC Geo|Science Akademik Asistan v0.0.3 (Sistem Bütünlüğü & Vektör DB Düzeltmesi)

Bu sürüm; yerel yapay zekâ modeli, hedef sürücü entegrasyonu ve RAG vektör veritabanı bütünlüğünü tam olarak sağlamak üzere yayınlanmıştır:

### 🌟 Önemli Düzeltmeler & Yenilikler:
- **Hedef Sürücü Bütünlüğü:** Kurulumda veya ayarlarda seçilen sürücü (örn. `F:\\AkademikAsistan\\veri\\chroma_db`, `pdf_kutuphanesi`) uygulamanın tüm katmanlarında (Electron, Python Backend, PyInstaller, RAG) mutlak yol olarak tanınır.
- **Sıfır C: Sürücüsü Sızıntısı:** HuggingFace ve Torch yerel model önbellekleri (`HF_HOME`, `TRANSFORMERS_CACHE`, `TORCH_HOME`) zorunlu olarak hedef sürücüdeki `veri/modeller/hf` dizinine kilitlendi.
- **DergiPark & Açık Erişim URL Düzeltmesi:** DergiPark, TÜBİTAK ve OJS makale indirmelerindeki göreli (relative) link yönlendirmeleri tam çözülerek PDF'lerin kütüphaneye ve ChromaDB'ye eksiksiz aktarımı sağlandı.
- **Gemini 3.5 Serisi Optimizasyonu:** Google API değişiklikleri doğrultusunda arka plan yapay zekâ servisleri en güncel `gemini-3.5-flash` ve `gemini-3.5-flash-lite` mimarisine güncellendi.
- **Kütüphane <-> ChromaDB Senkronizasyonu:** Ayarlar sekmesine kütüphanedeki tüm PDF'leri tarayarak veritabanına tek tıkla işleyen senkronizasyon motoru eklendi.
- **Sistem İçi Güncelleme:** Uygulama içindeki Ayarlar > "Güncellemeleri Denetle" ve "Şimdi Güncelle" butonu üzerinden tek tıkla yeni sürüme geçilebilir.
"""
    },
    "v0.0.2": {
        "id": 413954472,
        "name": "ORTAC Geo|Science Akademik Asistan v0.0.2",
        "body": """## 🚀 ORTAC Geo|Science Akademik Asistan v0.0.2 Güncellemesi

Bu sürüm ile birlikte kullanıcı geri bildirimleri doğrultusunda tüm temel modüller güncellenmiştir:

### 🌟 Düzeltmeler & Geliştirmeler:
- **Slider Görselleri ve Yönlendirmeleri:** Ana sayfa afiş görselleri ve "Kütüphaneyi Keşfet", "Aramaya Başla", "Daha Fazla Bilgi" butonları tam işlevsel hale getirildi.
- **OpenAlex & Vektör Veritabanı Entegrasyonu:** Açık erişim makaleler doğrudan PDF formatında indirilerek özet künye analiziyle ChromaDB kütüphanesine otomatik eklenir hale getirildi.
- **Akıllı Yoldaş (Gemini 3.8-Flash):** Yapay zekâ sohbet motoru en güncel Gemini modeliyle donatıldı; varsayılan API havuzu bağlantısı sağlandı.
- **Son Keşifler Bileşeni (Widget):** Ana sayfa açılışında en yeni akademik makaleleri otomatik yükleyecek şekilde bağlandı.
- **Tek Tıkla Kurulum & Güncelleme:** `ORTAC.Akademik.Asistan.Setup.0.0.2.exe` ile hedef dizin (örn. `F:\\AkademikAsistan`) seçilerek mevcut kütüphane korunarak anında güncelleme yapılabilir.
"""
    },
    "v0.0.1": {
        "id": 413134098,
        "name": "ORTAC Geo|Science Akademik Asistan v0.0.1",
        "body": """## 🚀 Akademik Asistan v0.0.1 - İlk Resmi Sürüm

### 🌟 Öne Çıkan Özellikler:
- **%100 Türkçe Kurulum Sihirbazı (Onboarding Wizard):** 4 kademeli hızlı ve rehberli ilk açılış deneyimi.
- **Dinamik Donanım Analizi:** Sistem RAM ve CPU çekirdeklerini otomatik tespit eden performans optimizasyonu.
- **Disk Güvenlik Kilidi:** Seçilen model boyutu + 20 GB RAG kütüphane payı kuralı ile veri kaybını önleyen koruma.
- **Linear & Raycast Koyu Obsidyen Arayüzü:** Koyu minimalist tasarım, sıfır kaydırma (no-scroll) ve kurumsal logo entegrasyonu.
- **Gelişmiş Vektörleme:** BAAI/bge-m3, multilingual-e5-small, gte-Qwen2-7B ve Google Bulut desteği.
- **Açık Erişim Literatür Radarı:** OpenAlex API üzerinden milyonlarca yayını tek tıkla tarama ve yerel kütüphaneye indirme.
- **OpenDraft Makale Motoru:** A4 standartlarında atıflı makale taslağı oluşturma ve Word (.docx) olarak indirme.

---

### 🛡️ Windows Defender SmartScreen Uyarısını Aşma (Tek Seferlik):
Kurulum paketi henüz ücretli bir kurumsal EV sertifikasıyla imzalanmadığından Windows Defender ilk çalıştırmada koruma ekranı gösterebilir:
* Mavi ekranda **'Ek bilgi' (More info)** linkine tıklayın.
* Altta beliren **'Yine de çalıştır' (Run anyway)** butonuna tıklayın.
* *(Alternatif: İndirdiğiniz `.exe` dosyasına sağ tıklayıp **Özellikler** -> En alttaki **'Engellemeyi kaldır'** kutucuğunu işaretleyip **Tamam** diyebilirsiniz.)*
"""
    }
}

def main():
    repo = "GuneyOrtac/ortac-academic-assistant"
    token = get_git_token()
    if not token:
        print("[!] Git token alınamadı!")
        sys.exit(1)

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ORTAC-Release-Fixer",
        "Content-Type": "application/json; charset=utf-8"
    }

    print("[*] GitHub Sürümleri Türkçe Karakter ve Kodlama Düzeltme İşlemi Başlatılıyor...")

    for tag, data in RELEASES_DATA.items():
        rel_id = data["id"]
        patch_url = f"https://api.github.com/repos/{repo}/releases/{rel_id}"
        payload = {
            "name": data["name"],
            "body": data["body"]
        }
        res = requests.patch(patch_url, headers=headers, json=payload)
        if res.status_code == 200:
            print(f"[+] Başarılı: {tag} (ID: {rel_id}) Türkçe açıklamaları ve emojileri güncellendi.")
        else:
            print(f"[!] Hata: {tag} güncellenemedi! HTTP {res.status_code}: {res.text}")

    print("\n[*] Güncellemeler kontrol ediliyor...")
    verify_res = requests.get(f"https://api.github.com/repos/{repo}/releases", headers=headers)
    if verify_res.status_code == 200:
        mojibake_indicators = ["Ã", "Ä", "ğŸ", "ÅŸ", "Ã¼", "Ä°", "Ã§", "Ã¶", "â€"]
        found_issues = 0
        for r in verify_res.json():
            tag = r["tag_name"]
            body = r.get("body", "")
            issues = [ind for ind in mojibake_indicators if ind in body]
            if issues:
                print(f"[!] UYARI: {tag} sürümünde bozuk karakter bulundu: {issues}")
                found_issues += 1
            else:
                print(f"[OK] {tag}: Tertemiz UTF-8 Türkçe metin ve emojiler doğrulandı.")
        
        if found_issues == 0:
            print("\n🎉 Tebrikler! Tüm GitHub sürüm açıklamalarındaki Türkçe karakter ve emoji sorunları %100 düzeltildi.")
    else:
        print(f"[!] Doğrulama hatası: {verify_res.status_code}")

if __name__ == "__main__":
    main()
