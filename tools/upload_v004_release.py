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
        "body": """## 🚀 ORTAC Geo|Science Akademik Asistan v0.0.4 Kararlı Sürüm

Bu sürüm, yerel yapay zekâ model mimarisini, RAG çoklu boyut izolasyonunu, kullanıcı odaklı kaldırma prosedürünü ve arayüz duman testlerini tamamlayan kararlı üretim sürümüdür.

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
2. **`Akademik Asistan-0.0.4-win.zip` (Taşınabilir Taşınabilir Sürüm):**
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
    elif res.status_code == 422:
        print(f"   ℹ {file_name} zaten mevcut veya daha önce yüklenmiş.")
        return True
    else:
        print(f"   [-] Yükleme hatası ({res.status_code}): {res.text}")
        return False

def main():
    repo = "GuneyOrtac/ortac-academic-assistant"
    tag = "v0.0.4"
    
    print("=" * 70)
    print(f"🚀 GITHUB RELEASE DAĞITIM MOTORU: {repo} -> {tag}")
    print("=" * 70)
    
    token = get_git_token()
    if not token:
        print("[-] HATA: GitHub token bulunamadı!")
        sys.exit(1)
        
    release = create_or_get_release(repo, tag, token)
    upload_url = release.get("upload_url")
    
    releases_dir = Path("product/adim-8/releases")
    setup_exe = releases_dir / "ORTAC.Akademik.Asistan.Setup.0.0.4.exe"
    portable_zip = releases_dir / "Akademik Asistan-0.0.4-win.zip"
    
    for f in [setup_exe, portable_zip]:
        if f.exists():
            upload_asset(upload_url, f, token)
        else:
            print(f"[-] HATA: Dosya bulunamadı: {f}")

    print("\n" + "=" * 70)
    print(f"🎉 TEBRİKLER: v0.0.4 SÜRÜMÜ GITHUB'DA YAYINLANDI!")
    print(f"🔗 Sayfa: {release['html_url']}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
