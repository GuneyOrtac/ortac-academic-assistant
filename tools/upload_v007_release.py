import os
import sys
import subprocess
import requests
from pathlib import Path

# Windows console encoding fix
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def get_git_token():
    """Git Credential Manager'dan token çeker."""
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

def create_or_get_release(repo, tag, token):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ORTAC-Academic-Assistant-Publisher"
    }
    
    url = f"https://api.github.com/repos/{repo}/releases/tags/{tag}"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        rel = res.json()
        print(f"[*] Mevcut Release bulundu: ID={rel['id']}, URL={rel['html_url']}")
        return rel
    
    print(f"[*] Release {tag} bulunamadı, oluşturuluyor...")
    create_url = f"https://api.github.com/repos/{repo}/releases"
    body = {
        "tag_name": tag,
        "target_commitish": "main",
        "name": f"ORTAC Geo|Science Akademik Asistan {tag}",
        "body": """## 🚀 ORTAC Geo|Science Akademik Asistan v0.0.7 - Akıllı Literatür Radarı & OpenDraft Word Desteği

Bu sürüm, kullanıcı geri bildirimleri doğrultusunda **OpenDraft Word (.docx) dışa aktarma motorunu**, **akıllı filtreli küresel literatür taramasını**, **sohbet üzerinden doğal dille makale arama yeteneğini** ve **karanlık/aydınlık tema kontrast iyileştirmelerini** sisteme dahil eder.

---

### 🌟 Yenilikler ve Öne Çıkan Geliştirmeler:

1. **📄 OpenDraft Word (.docx) Dışa Aktarma Motoru:**
   - Taslak metinleri, başlık hiyerarşisi, kalın/italik biçimlendirmeler ve standart akademik kenar boşluklarıyla (2.5 cm) doğrudan Word belgesine dönüştürülür.
   - Eksik atıf içeren iddialı cümleler Word dokümanında otomatik olarak **sarı fosforlu vurgu** ile işaretlenir (`[DİKKAT: EKSİK ATIF / KAYNAK GEREKLİ]`).
   - Arayüze tek tıkla çalışan **"Word Olarak İndir"** aksiyon butonu eklendi.

2. **🔍 Akıllı Literatür Radarı & Filtreleme (OpenAlex Motoru):**
   - **Kapsam Filtresi:** `Tümü`, `🇹🇷 Yerli (TR Kurumları / TR Dizin)` ve `🌍 Uluslararası / Yabancı` yayınları ayrıştırabilme.
   - **Yıl Filtresi:** Min / Max yıl aralıklarına göre yayınları filtreleme (Örn: Son 5 yıl, 2020-2026).
   - **Açık Erişim & Sıralama:** Yalnızca indirilebilir açık erişimli tam metinleri filtreleme ve atıf sayısı / yenilik sırasına göre listeleme.

3. **💬 Sohbet (Chat) Üzerinden Doğal Dille Literatür Taraması:**
   - Sohbet kutusuna *"jeotermal enerji ile ilgili son 5 yıldaki yerli makaleleri tara"* yazıldığında, sistem konuyu ve filtreleri otomatik algılar.
   - Bulunan makaleler doğrudan sohbet içinde listelenir ve tek tıkla **"Kütüphaneme Ekle"** butonuyla indirilip ChromaDB vektör tabanına indekslenebilir.

4. **🎨 Ayarlar Sekmesi Metin Kontrastı Düzeltmesi:**
   - Ayarlar panelinde koyu ve açık temalarda okunması zor olan beyaz/silik metinler yüksek kontrastlı ve okunabilir renk paletine uyarlandı.

5. **⚡ Model Seçim Rehberliği & Performans Koruması:**
   - Kurulum sihirbazında donanım profilleri CPU ve harici NVIDIA GPU gereksinimlerine göre netleştirildi. CPU sistemlerde aşırı gecikmeye sebep olan konfigürasyonlara karşı uyarılar eklendi.

6. **🧪 11 Aşamalı Clean-Room & Frozen Binary Doğrulaması:**
   - `AkademikAsistan_Backend.exe` donmuş ikili dosyası, sıfır Python ortamında simüle edilerek `%100 PASS` kalitesiyle doğrulanmıştır.

---

### 📦 İndirme Seçenekleri (Assets):
1. **`ORTAC.Akademik.Asistan.Setup.0.0.7.exe` (Windows Kurulum Sihirbazı - ÖNERİLEN):**
   - Masaüstü kısayolu oluşturur, arka planda FastAPI backend'ini ve ChromaDB motorunu otomatik yönetir.
2. **`Akademik Asistan-0.0.7-win.zip` (Taşınabilir / Portable Sürüm):**
   - Kurulum gerektirmeden arşivden çıkartılıp doğrudan çalıştırılabilir.
""",
        "draft": False,
        "prerelease": False
    }
    create_res = requests.post(create_url, headers=headers, json=body)
    create_res.raise_for_status()
    rel = create_res.json()
    print(f"[+] Yeni Release oluşturuldu: ID={rel['id']}, URL={rel['html_url']}")
    return rel

def upload_asset(upload_url_template, file_path, token):
    headers = {
        "Authorization": f"token {token}",
        "User-Agent": "ORTAC-Academic-Assistant-Publisher",
        "Content-Type": "application/octet-stream"
    }
    
    file_path = Path(file_path)
    file_name = file_path.name
    file_size = file_path.stat().st_size
    
    upload_url = upload_url_template.replace("{?name,label}", f"?name={file_name}")
    print(f"\n[*] Varlık Yükleniyor: {file_name} ({file_size / (1024*1024):.1f} MB)...")
    
    with open(file_path, "rb") as f:
        res = requests.post(
            upload_url,
            headers={**headers, "Content-Length": str(file_size)},
            data=f
        )
    
    if res.status_code == 201:
        print(f"   ✓ {file_name} başarıyla yüklendi!")
        return True
    else:
        print(f"   [-] Yükleme hatası ({res.status_code}): {res.text}")
        return False

def delete_existing_asset(repo, asset_id, token):
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ORTAC-Academic-Assistant-Publisher"
    }
    url = f"https://api.github.com/repos/{repo}/releases/assets/{asset_id}"
    res = requests.delete(url, headers=headers)
    if res.status_code in [204, 200]:
        print(f"   [x] Eski varlık (ID: {asset_id}) GitHub'dan başarıyla silindi.")
        return True
    return False

def main():
    repo = "GuneyOrtac/ortac-academic-assistant"
    tag = "v0.0.7"
    
    print("=" * 70)
    print(f"🚀 GITHUB RELEASE DAĞITIM MOTORU: {repo} -> {tag}")
    print("=" * 70)
    
    token = get_git_token()
    if not token:
        print("[-] HATA: GitHub token bulunamadı!")
        sys.exit(1)
        
    release = create_or_get_release(repo, tag, token)
    upload_url = release.get("upload_url")
    
    existing_assets = release.get("assets", [])
    if existing_assets:
        print(f"[*] Mevcut {len(existing_assets)} adet varlık tespit edildi. Eski derlemeler temizleniyor...")
        for a in existing_assets:
            print(f"   -> Siliniyor: {a['name']} (ID: {a['id']})")
            delete_existing_asset(repo, a['id'], token)

    releases_dir = Path("product/adim-8/releases")
    setup_exe = releases_dir / "ORTAC.Akademik.Asistan.Setup.0.0.7.exe"
    portable_zip = releases_dir / "Akademik Asistan-0.0.7-win.zip"
    
    for f in [setup_exe, portable_zip]:
        if f.exists():
            upload_asset(upload_url, f, token)
        else:
            print(f"[-] HATA: Dosya bulunamadı: {f}")

    print("\n" + "=" * 70)
    print(f"🎉 TEBRİKLER: v0.0.7 SÜRÜMÜ GITHUB'DA YAYINLANDI!")
    print(f"🔗 Sayfa: {release['html_url']}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
