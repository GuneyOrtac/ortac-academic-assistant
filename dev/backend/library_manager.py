import os
import json
import shutil
import re

import model_factory

def get_library_dir():
    """Kütüphane dizinini ayarlar dosyasından dinamik olarak getirir."""
    try:
        settings = model_factory.get_settings()
        pdf_dir = settings.get("workspace", {}).get("pdf_dir")
        if pdf_dir:
            return pdf_dir
    except Exception:
        pass
    return os.path.join("veri", "pdf_kutuphanesi")

def get_library_db():
    """Kütüphane JSON veritabanı dosyasının tam yolunu döner."""
    return os.path.join(get_library_dir(), "library.json")

def init_library():
    """Kütüphane klasörünü ve veritabanını başlatır."""
    lib_dir = get_library_dir()
    lib_db = get_library_db()
    if not os.path.exists(lib_dir):
        os.makedirs(lib_dir, exist_ok=True)
    if not os.path.exists(lib_db):
        with open(lib_db, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=4)

def load_library():
    """Kütüphanedeki tüm makaleleri döndürür."""
    init_library()
    lib_db = get_library_db()
    with open(lib_db, "r", encoding="utf-8") as f:
        return json.load(f)

def save_library(data):
    """Kütüphane listesini JSON dosyasına kaydeder."""
    init_library()
    lib_db = get_library_db()
    with open(lib_db, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def sanitize_filename(name):
    """Dosya isimleri için güvenli bir string oluşturur."""
    name = str(name).strip()
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = name.replace(" ", "_")
    return name[:50]

def add_to_library(temp_pdf_path, metadata):
    """
    Geçici PDF dosyasını okuyup, metadata verilerine göre yeniden adlandırarak 
    kalıcı pdf_kutuphanesi dizinine kopyalar ve library.json'a kaydeder.
    """
    init_library()
    library = load_library()
    
    # 1. Dosya adını oluştur: Yazar_Yil_Baslik.pdf
    yazar = sanitize_filename(metadata.get("yazar", "Bilinmeyen_Yazar").split(",")[0])
    yil = sanitize_filename(metadata.get("yil", "Tarihsiz"))
    baslik = sanitize_filename(metadata.get("baslik", "Isimsiz_Makale"))
    
    yeni_dosya_adi = f"{yazar}_{yil}_{baslik}.pdf"
    lib_dir = get_library_dir()
    hedef_yol = os.path.join(lib_dir, yeni_dosya_adi)
    
    # Dosya varsa üzerine yazmaması için isim sonuna ek koy
    sayac = 1
    while os.path.exists(hedef_yol):
        yeni_dosya_adi = f"{yazar}_{yil}_{baslik}_{sayac}.pdf"
        hedef_yol = os.path.join(lib_dir, yeni_dosya_adi)
        sayac += 1
        
    # 2. Dosyayı kopyala
    shutil.copy2(temp_pdf_path, hedef_yol)
    
    # 3. APA Formatında Kaynakça oluştur (Basit yaklaşım)
    kaynakca = metadata.get("kaynakca", "")
    if not kaynakca:
        kaynakca = f"{metadata.get('yazar', 'Bilinmeyen Yazar')} ({metadata.get('yil', 'Tarihsiz')}). {metadata.get('baslik', 'İsimsiz Makale')}. {metadata.get('dergi', 'Yayınlanmamış')}."
    
    # 4. Kütüphaneye ekle
    yeni_kayit = {
        "id": yeni_dosya_adi,
        "dosya_adi": yeni_dosya_adi,
        "tam_yol": hedef_yol,
        "meta": metadata,
        "kaynakca_apa": kaynakca
    }
    
    library.append(yeni_kayit)
    save_library(library)
    
    return yeni_kayit

def delete_from_library(file_id):
    """Kütüphaneden PDF dosyasını ve JSON kaydını siler."""
    library = load_library()
    
    # İlgili kaydı bul
    hedef_kayit = next((item for item in library if item["id"] == file_id), None)
    
    if hedef_kayit:
        # Fiziksel dosyayı sil
        if os.path.exists(hedef_kayit["tam_yol"]):
            try:
                os.remove(hedef_kayit["tam_yol"])
            except:
                pass
                
        # JSON'dan çıkar ve kaydet
        yeni_library = [item for item in library if item["id"] != file_id]
        save_library(yeni_library)
        return True
        
    return False
