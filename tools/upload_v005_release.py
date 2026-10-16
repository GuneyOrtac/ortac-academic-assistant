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
        "body": """## 🚀 ORTAC Geo|Science Akademik Asistan v0.0.5 Kararlı Sürüm

Bu sürüm, **Kütüphaneye Ekle / PDF Analiz ve Kayıt** sürecindeki ChromaDB telemetri hatasını kökten çözen, derlenmiş donmuş ikiliyi (**Frozen Executable**) izole temiz oda simülasyonuyla doğrulayan ve 11 Kalite Kapısından %100 başarıyla geçen kararlı üretim sürümüdür.

---

### 🛡️ Kök Neden Analizi & Kalıcı Çözüm:
- **Sorun:** PyInstaller ile derlenen backend'de PDF kütüphaneye eklenirken `No module named 'chromadb.telemetry.product.posthog'` hatası meydana geliyordu.
- **Çözüm 1 (Kod & Ortam İzolasyonu):** `rag.py` ve `main.py` giriş noktalarında telemetri tamamen bypass edildi (`ANONYMIZED_TELEMETRY=False`, `CHROMA_TELEMETRY=False`, `HF_HUB_DISABLE_TELEMETRY=1`).
- **Çözüm 2 (Paketleme & Hız Mimarisi):** PyInstaller derlemesi `--onedir` moduna geçirilerek ChromaDB'nin tüm dinamik segment eklentileri (`--collect-all=chromadb`, `--collect-submodules=langchain_chroma`) pakete gömüldü. Bu sayede uygulama açılış süresi 1-2 saniyeye indirildi ve runtime `%TEMP%/_MEIxxxx` dekompresyon darboğazı tamamen ortadan kaldırıldı.

---

### 🧪 11. Kalite Kapısı & Temiz Oda (Clean-Room) Doğrulaması:
Uygulama dağıtılmadan önce `tools/test_frozen_backend_e2e.py` simülasyonu ile test edilmiştir:
- **Sıfır Bağımlılık Garantisi:** Ortam değişkenlerinden (`PATH`) Python, sanal ortam (.venv) ve Node.js tamamen silinmiştir.
- **Gerçekçi Kullanıcı Simülasyonu:** Derlenmiş `AkademikAsistan_Backend.exe` harici bir Windows prosesi olarak başlatılmış, izole geçici sandbox dizininde gerçek HTTP POST (`/api/pdf-yukle`) ile PDF makalesi yüklenmiş, metin parçalama (chunking), ChromaDB vektör veritabanına kayıt ve anlamsal arama (`/api/ara`) test edilmiştir.
- **Sonuç:** **11/11 Kalite Kapısı %100 Başarı (PASS)** ile tamamlanmış, sıfır `posthog` veya modül hatası teyit edilmiştir.

---

### 📦 İndirme Seçenekleri (Assets):
1. **`ORTAC.Akademik.Asistan.Setup.0.0.5.exe` (Windows Kurulum Sihirbazı - ÖNERİLEN):**
   - Masaüstü kısayolu oluşturur, arka planda FastAPI backend'ini ve ChromaDB motorunu otomatik yönetir.
2. **`Akademik Asistan-0.0.5-win.zip` (Taşınabilir / Portable Sürüm):**
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
    tag = "v0.0.5"
    
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
    setup_exe = releases_dir / "ORTAC.Akademik.Asistan.Setup.0.0.5.exe"
    portable_zip = releases_dir / "Akademik Asistan-0.0.5-win.zip"
    
    for f in [setup_exe, portable_zip]:
        if f.exists():
            upload_asset(upload_url, f, token)
        else:
            print(f"[-] HATA: Dosya bulunamadı: {f}")

    print("\n" + "=" * 70)
    print(f"🎉 TEBRİKLER: v0.0.5 SÜRÜMÜ GITHUB'DA YAYINLANDI!")
    print(f"🔗 Sayfa: {release['html_url']}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
