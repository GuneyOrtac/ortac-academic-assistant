"""
ORTAC Akademik Asistan - Kullanıcı Odaklı Kaldırma ve Temizlik Motoru (Uninstaller Cleanup Engine)
"""
import os
import sys
import shutil
import json
import argparse
from pathlib import Path

def get_installed_data_dir() -> Path:
    """Settings veya ortam değişkeninden aktif veri yolunu döner."""
    env_data = os.environ.get("AKADEMIK_ASISTAN_DATA") or os.environ.get("AKADEMIK_DATA_DIR")
    if env_data and os.path.exists(env_data):
        return Path(env_data).resolve()
    
    # Varsayılan konumu kontrol et
    default_path = Path("veri").resolve()
    return default_path

def execute_uninstaller_cleanup(mode: str = "keep", target_data_dir: Path = None, target_app_dir: Path = None):
    """
    mode='keep': Kütüphaneyi koru (Yalnızca program ve geçici önbellekleri sil)
    mode='wipe': Tam temizlik yap (Kütüphane, ChromaDB, modeller ve ayarları sıfır kalıntıyla sil)
    """
    data_dir = target_data_dir or get_installed_data_dir()
    results = {
        "mode": mode,
        "processes_killed": [],
        "deleted_paths": [],
        "preserved_paths": []
    }

    # 1. Arka Plan Süreçlerini Kapat (Windows)
    if sys.platform == "win32":
        for proc in ["backend-server.exe", "akademik-asistan.exe"]:
            exit_code = os.system(f"taskkill /F /IM {proc} >nul 2>&1")
            if exit_code == 0:
                results["processes_killed"].append(proc)

    # 2. Mod Tercihine Göre Veri Dizinini Yönet
    if mode == "wipe":
        if data_dir and data_dir.exists():
            shutil.rmtree(data_dir, ignore_errors=True)
            results["deleted_paths"].append(str(data_dir))
    else:  # mode == "keep"
        if data_dir and data_dir.exists():
            results["preserved_paths"].append(str(data_dir))

    # 3. Geçici Önbellekleri Temizle
    if target_app_dir and target_app_dir.exists():
        shutil.rmtree(target_app_dir, ignore_errors=True)
        results["deleted_paths"].append(str(target_app_dir))

    appdata_local = os.environ.get("LOCALAPPDATA")
    if appdata_local and not target_data_dir:
        updater_dir = Path(appdata_local) / "akademik-asistan-updater"
        if updater_dir.exists():
            shutil.rmtree(updater_dir, ignore_errors=True)
            results["deleted_paths"].append(str(updater_dir))

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ORTAC Akademik Asistan Kaldırma Temizleyicisi")
    parser.add_argument("--mode", choices=["keep", "wipe"], default="keep", help="keep: Verileri koru, wipe: Tam temizlik")
    args = parser.parse_args()

    res = execute_uninstaller_cleanup(mode=args.mode)
    print(json.dumps(res, indent=2, ensure_ascii=False))
