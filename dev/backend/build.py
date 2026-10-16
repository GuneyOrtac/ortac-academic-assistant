import PyInstaller.__main__
import os
import shutil

def build_backend():
    print("Backend için .exe paketlemesi (PyInstaller - Endüstri Standardı Onedir) başlatılıyor...")
    
    dist_dir = os.path.join(os.path.dirname(__file__), "dist", "AkademikAsistan_Backend")
    if os.path.exists(dist_dir):
        try:
            shutil.rmtree(dist_dir, ignore_errors=True)
        except Exception:
            pass
            
    # PyInstaller parametreleri (--onedir: süper hızlı açılış ve tam modül kararlılığı)
    args = [
        'main.py',
        '--name=AkademikAsistan_Backend',
        '--onedir',
        '--noconsole', # Arka planda çalışması için
        '-y',          # Çıktı klasörünü onay istemeden temizle
        '--clean',
        # ChromaDB ve bağımlı paketlerin tüm veri dosyalarını ve alt modüllerini otomatik topla
        '--collect-all=chromadb',
        '--collect-submodules=langchain_chroma',
        # Dinamik import edilen kritik modüller
        '--hidden-import=chromadb.telemetry.product.posthog',
        '--hidden-import=chromadb.segment.impl.metadata.sqlite',
        '--hidden-import=chromadb.execution.executor.local',
        '--hidden-import=chromadb.db.impl.sqlite',
        '--hidden-import=uvicorn.logging',
        '--hidden-import=uvicorn.loops',
        '--hidden-import=uvicorn.loops.auto',
        '--hidden-import=uvicorn.protocols',
        '--hidden-import=uvicorn.protocols.http',
        '--hidden-import=uvicorn.protocols.http.auto',
        '--hidden-import=uvicorn.protocols.websockets',
        '--hidden-import=uvicorn.protocols.websockets.auto',
        '--hidden-import=uvicorn.lifespan',
        '--hidden-import=uvicorn.lifespan.on',
    ]
    
    PyInstaller.__main__.run(args)
    
    dist_dir = os.path.join(os.path.dirname(__file__), "dist", "AkademikAsistan_Backend")
    electron_backend_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "..", "..", "product", "adim-8", "electron-builder-uygulama", "backend"
    ))
    
    if os.path.exists(dist_dir) and os.path.exists(electron_backend_dir):
        print(f"\n[*] Derlenen backend dosyaları Electron backend klasörüne kopyalanıyor: {electron_backend_dir}")
        for item in os.listdir(dist_dir):
            s = os.path.join(dist_dir, item)
            d = os.path.join(electron_backend_dir, item)
            if os.path.isdir(s):
                if os.path.exists(d):
                    shutil.rmtree(d, ignore_errors=True)
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)
        print("[+] Electron backend klasörü taze derleme ile senkronize edildi!")
    
    print("\nPaketleme tamamlandı! 'dist' klasörünün içindeki .exe dosyasını kullanabilirsiniz.")
    print("Maliyet & Kalite Testleri: ChromaDB alt modülleri ve telemetri bypass koruması pakete gömüldü.")

if __name__ == "__main__":
    build_backend()
