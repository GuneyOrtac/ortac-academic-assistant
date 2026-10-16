import PyInstaller.__main__
import os
import shutil

def build_backend():
    print("Backend için .exe paketlemesi (PyInstaller - Endüstri Standardı) başlatılıyor...")
    
    # PyInstaller parametreleri
    args = [
        'main.py',
        '--name=AkademikAsistan_Backend',
        '--onefile',
        '--noconsole', # Arka planda çalışması için
        '--clean',
        # ChromaDB ve LangChain alt modüllerini ve veri dosyalarını otomatik topla
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
    
    print("\nPaketleme tamamlandı! 'dist' klasörünün içindeki .exe dosyasını kullanabilirsiniz.")
    print("Maliyet & Kalite Testleri: ChromaDB alt modülleri ve telemetri bypass koruması pakete gömüldü.")

if __name__ == "__main__":
    build_backend()
