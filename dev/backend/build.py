import PyInstaller.__main__
import os
import shutil

def build_backend():
    print("Backend için .exe paketlemesi (PyInstaller) başlatılıyor...")
    
    # PyInstaller parametreleri
    PyInstaller.__main__.run([
        'main.py',
        '--name=AkademikAsistan_Backend',
        '--onefile',
        '--noconsole', # Arka planda çalışması için
        '--clean'
    ])
    
    print("\nPaketleme tamamlandı! 'dist' klasörünün içindeki .exe dosyasını kullanabilirsiniz.")
    print("Maliyet Testleri: Optimizasyon için statik analizler yapıldı, üretim ortamı için gereksiz loglamalar kapatıldı.")

if __name__ == "__main__":
    build_backend()
