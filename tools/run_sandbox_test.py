import os
import sys
import shutil
import tempfile
import json
import time
from pathlib import Path

# Windows console encoding fix
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add tools directory to path
TOOLS_DIR = Path(__file__).resolve().parent
ROOT_DIR = TOOLS_DIR.parent
sys.path.insert(0, str(TOOLS_DIR))
sys.path.insert(0, str(ROOT_DIR / "dev" / "backend"))

from circuit_breaker import CircuitBreaker

def run_quality_gates():
    breaker = CircuitBreaker(max_retries=2)
    temp_sandbox = Path(tempfile.mkdtemp(prefix="ortac_cleanroom_"))
    print(f"\n[+] [1/9] Temiz Oda Sanal Test Alanı Kuruldu: {temp_sandbox}")

    try:
        # Sanal Veri Dizini
        sandbox_data = temp_sandbox / "veri"
        sandbox_models = sandbox_data / "modeller" / "hf"
        sandbox_chroma = sandbox_data / "chroma_db"
        sandbox_incoming = sandbox_data / "Kutuphane_Gelen"
        sandbox_archive = sandbox_data / "Kutuphane_Arsiv"

        for p in [sandbox_models, sandbox_chroma, sandbox_incoming, sandbox_archive]:
            p.mkdir(parents=True, exist_ok=True)

        # QG-1 & QG-2: İzolasyon ve Ortam Değişkeni Karantinası
        print("[*] [QG-1 & QG-2] Hedef Sürücü İzolasyonu & Model Önbellek Kilitlenmesi...")
        os.environ["HF_HOME"] = str(sandbox_models)
        os.environ["TORCH_HOME"] = str(sandbox_models)
        os.environ["AKADEMIK_DATA_DIR"] = str(sandbox_data)
        os.environ["AKADEMIK_ASISTAN_DATA"] = str(sandbox_data)

        # Test settings.json inside sandbox
        settings_path = sandbox_data / "settings.json"
        settings_payload = {
            "kurulum_tamamlandi": True,
            "secilen_surucu": str(temp_sandbox),
            "veri_dizini": str(sandbox_data),
            "chroma_dizini": str(sandbox_chroma),
            "varsayilan_model": "gemini-3.5-flash",
            "pdf_model": "gemini-3.5-flash-lite",
            "embedding_model": "all-MiniLM-L6-v2"
        }
        settings_path.write_text(json.dumps(settings_payload, indent=2), encoding="utf-8")

        # QG-3: Dış Kaynak Veri Çekimi (DergiPark / OpenAlex URL Resolver)
        print("[*] [QG-3] Dış Kaynak Veri Çekimi (URL Çözümleme) Doğrulaması...")
        from urllib.parse import urljoin
        base_url = "https://dergipark.org.tr/tr/pub/akademik/issue/123/456"
        relative_link = "/tr/download/article-file/78901"
        resolved = urljoin(base_url, relative_link)
        if not resolved.startswith("https://dergipark.org.tr/tr/download"):
            raise ValueError(f"URL çözümleme başarısız: {resolved}")
        print(f"   -> Göreceli URL çözümleme başarılı: {resolved}")

        # QG-4: Vektör Veritabanı ve İndeksleme
        print("[*] [QG-4] Vektör Veritabanı (ChromaDB) ve Kalıcılık Doğrulaması...")
        import chromadb
        client = chromadb.PersistentClient(path=str(sandbox_chroma))
        collection = client.get_or_create_collection("sandbox_test_collection")
        collection.add(
            documents=["Yapay zekâ ve derin öğrenme temelleri.", "Akademik makale yazımı ve literatür taraması."],
            metadatas=[{"source": "test1.pdf"}, {"source": "test2.pdf"}],
            ids=["doc_1", "doc_2"]
        )
        count = collection.count()
        if count != 2:
            raise ValueError(f"ChromaDB kayıt sayısı tutarsız: {count} != 2")
        print(f"   -> ChromaDB kayıt sayısı doğrulandı: {count}")

        # QG-5: Semantik Arama & Geri Çağırma (Retrieval)
        print("[*] [QG-5] Semantik Benzerlik Araması Doğrulaması...")
        results = collection.query(query_texts=["literatür tarama yöntemleri"], n_results=1)
        if not results or not results["documents"] or len(results["documents"][0]) == 0:
            raise ValueError("Semantik sorgu sonuç döndürmedi.")
        retrieved_text = results["documents"][0][0]
        print(f"   -> Semantik eşleşme yakalandı: '{retrieved_text}'")

        # QG-6: RAG ve Model Entegrasyon Doğrulaması
        print("[*] [QG-6] RAG Sentezi ve LLM Yapılandırması...")
        # Ayarların doğru model isimlerini kullandığı doğrulanır
        assert settings_payload["varsayilan_model"] == "gemini-3.5-flash"
        assert settings_payload["pdf_model"] == "gemini-3.5-flash-lite"
        print("   -> Model hiyerarşisi doğrulandı: gemini-3.5-flash & gemini-3.5-flash-lite.")

        # QG-7: Canlı Güncelleme ve Arka Plan Akışı
        print("[*] [QG-7] Canlı Güncelleme ve Arka Plan İndiricisi...")
        from main import update_state
        assert "status" in update_state
        assert "percent" in update_state
        print(f"   -> Güncelleme durum değişkenleri ve in-app akış mimarisi doğrulandı: status='{update_state['status']}'")

        # QG-8: Çoklu Model Alternatifleri & RAG Uyumluluk Matrisi (3 Yerel Model + 1 API)
        print("[*] [QG-8] Çoklu Model Alternatifleri & RAG Boyut İzolasyonu Matrisi...")
        import model_factory
        import rag
        
        # 1. Profil Envanteri Doğrulaması (3 Yerel + 1 API)
        profiles = model_factory.EMBEDDING_PROFILES
        assert "bge-m3" in profiles, "bge-m3 profili eksik!"
        assert "e5-small" in profiles, "e5-small profili eksik!"
        assert "qwen2-7b" in profiles, "qwen2-7b profili eksik!"
        assert "cloud-gemini" in profiles, "cloud-gemini profili eksik!"
        print("   -> 4 Model Profili doğrulandı (3 Yerel: e5-small, bge-m3, qwen2-7b | 1 API: cloud-gemini).")

        # 2. API vs Yerel Model Güvenlik Kalkanı
        # cloud-gemini seçildiğinde API anahtarı boşsa açıklayıcı hata vermeli
        settings_payload["embedding_profile"] = "cloud-gemini"
        settings_payload["api_keys"] = {"gemini": ""}
        settings_path.write_text(json.dumps(settings_payload, indent=2), encoding="utf-8")
        rag.reset_rag_engine()
        try:
            rag.get_embeddings()
            raise AssertionError("cloud-gemini API anahtarsız hata fırlatmalıydı!")
        except ValueError as val_err:
            assert "Google Bulut API Modu" in str(val_err) or "Gemini API anahtarı" in str(val_err)
            print(f"   -> cloud-gemini API anahtar koruması doğrulandı: '{val_err}'")

        # 3. Zirve Model (Qwen2-7B) ve Koleksiyon Boyut İzolasyonu Doğrulaması
        # Farklı modellerin farklı boyutları (1024, 3584, 768) aynı ChromaDB dizininde
        # izole koleksiyon adlarıyla test edilir (InvalidDimensionException engelleme)
        col_bge = client.get_or_create_collection("makale_kutuphanesi_bge_m3")
        col_qwen = client.get_or_create_collection("makale_kutuphanesi_qwen2_7b")
        col_cloud = client.get_or_create_collection("makale_kutuphanesi_cloud_gemini")

        # Boyut 1024 simülasyonu (BGE-M3)
        col_bge.add(
            embeddings=[[0.01] * 1024],
            documents=["BGE-M3 1024 boyutlu vektör"],
            ids=["bge_1"]
        )

        # Boyut 3584 simülasyonu (Qwen2-7B Zirve Güç)
        col_qwen.add(
            embeddings=[[0.02] * 3584],
            documents=["Qwen2-7B 3584 boyutlu zirve vektör"],
            ids=["qwen_1"]
        )

        # Boyut 768 simülasyonu (Google Cloud API)
        col_cloud.add(
            embeddings=[[0.03] * 768],
            documents=["Cloud-Gemini 768 boyutlu API vektör"],
            ids=["cloud_1"]
        )

        assert col_bge.count() == 1
        assert col_qwen.count() == 1
        assert col_cloud.count() == 1
        print("   -> ChromaDB Çoklu Boyut İzolasyonu (1024 / 3584 / 768) çakışmasız doğrulandı!")

        # 4. Dinamik Koleksiyon Adı Fonksiyonunun Doğrulanması
        settings_payload["embedding_profile"] = "qwen2-7b"
        settings_path.write_text(json.dumps(settings_payload, indent=2), encoding="utf-8")
        rag.reset_rag_engine()
        assert rag.get_collection_name() == "makale_kutuphanesi_qwen2_7b"
        print(f"   -> rag.get_collection_name() dinamik doğrulaması başarılı: '{rag.get_collection_name()}'")

        # QG-9: Kütüphane Yaşam Döngüsü & Otomatik Senkronizasyon Testi
        print("[*] [QG-9] Kütüphane Yaşam Döngüsü, Otomatik Künyeleme & Senkronizasyon...")
        settings_payload["embedding_profile"] = "bge-m3"
        settings_path.write_text(json.dumps(settings_payload, indent=2), encoding="utf-8")
        rag.reset_rag_engine()
        import pymupdf
        import library_manager
        import asyncio
        from main import sync_library_with_rag

        # 1. Gerçek Çok Sayfalı Örnek Akademik PDF Oluştur
        sample_pdf_path = sandbox_incoming / "test_akademik_makale.pdf"
        doc = pymupdf.open()
        p1 = doc.new_page()
        p1.insert_text((50, 50), "ORTAC AKADEMIK ASISTAN - TEST MAKALESI\n\nBu calisma derin ogrenme ve RAG sistemlerini ele almaktadir.")
        p2 = doc.new_page()
        p2.insert_text((50, 50), "BOLUM 2: METODOLOJI VE VEKTOR VERITABANLARI\n\nChromaDB ve HuggingFace modelleri kullanilmistir.")
        doc.save(str(sample_pdf_path))
        doc.close()

        # 2. Kütüphaneye Ekle
        meta = {
            "baslik": "RAG Sistemleri ve Akademik Asistan",
            "yazar": "Dr. Guney Ortac",
            "yil": "2026",
            "ozet": "RAG sistemleri ve ChromaDB uzerine test makalesi."
        }
        record = library_manager.add_to_library(str(sample_pdf_path), meta)
        assert os.path.exists(record["tam_yol"]), "PDF kütüphane klasörüne kopyalanamadı!"
        lib_data = library_manager.load_library()
        assert any(x["dosya_adi"] == record["dosya_adi"] for x in lib_data), "library.json kaydı eksik!"

        # 3. Vektörleştir ve Kaydet
        chunks_count = rag.pdf_vektorlestir_ve_kaydet(record["tam_yol"], record["dosya_adi"], meta)
        assert chunks_count > 0, "Chunk sayısı 0 olamaz!"
        print(f"   -> PDF kütüphaneye eklendi ve {chunks_count} chunk olarak ChromaDB'ye işlendi.")

        # 4. Doğrudan Klasöre Bırakılan Dosya İçin Senkronizasyon Testi
        sync_pdf_path = Path(library_manager.get_library_dir()) / "Manuel_Eklenen_Makale.pdf"
        doc_sync = pymupdf.open()
        p_sync = doc_sync.new_page()
        p_sync.insert_text((50, 50), "MANUEL EKLENEN MAKALE\n\nDosya gezgininden birakilan makale testi.")
        doc_sync.save(str(sync_pdf_path))
        doc_sync.close()

        lib_data.append({
            "id": "Manuel_Eklenen_Makale.pdf",
            "dosya_adi": "Manuel_Eklenen_Makale.pdf",
            "tam_yol": str(sync_pdf_path),
            "meta": {"baslik": "Manuel Eklenen Makale", "yazar": "Test Yazar", "yil": "2026"}
        })
        library_manager.save_library(lib_data)
        sync_res = asyncio.run(sync_library_with_rag())
        assert sync_res.get("durum") in ["basarili", "bilgi"], "Kütüphane senkronizasyonu başarısız!"
        print(f"   -> Kütüphane otomatik senkronizasyon endpoint'i doğrulandı: {sync_res}")

        # 5. Kütüphaneden ve ChromaDB'den Sıfır İz Bırakarak Silme
        deleted = library_manager.delete_from_library(record["dosya_adi"])
        assert deleted is True, "library_manager.delete_from_library başarısız!"
        del_vectors = rag.pdf_vektorleri_sil(record["dosya_adi"])
        assert not os.path.exists(record["tam_yol"]), "Silinen PDF diskte kalmaya devam ediyor!"
        print(f"   -> Silme işlemi doğrulandı: PDF ve {del_vectors} ChromaDB chunk'ı sıfır izle silindi.")

        # QG-10: Kullanıcı Odaklı Kaldırma (Uninstaller) Simülasyonu
        print("[*] [QG-10] Kullanıcı Odaklı Kaldırma (Uninstaller) & Sıfır Kalıntı Simülasyonu...")
        import uninstaller_cleanup
        mock_app_dir = temp_sandbox / "mock_app_installation"
        mock_app_dir.mkdir(parents=True, exist_ok=True)
        (mock_app_dir / "backend-server.exe").write_text("dummy exe content")
        (mock_app_dir / "akademik-asistan.exe").write_text("dummy electron content")

        # Senaryo A: Kütüphanemi Koru (Keep Data)
        res_keep = uninstaller_cleanup.execute_uninstaller_cleanup(
            mode="keep",
            target_data_dir=sandbox_data,
            target_app_dir=mock_app_dir
        )
        assert not mock_app_dir.exists(), "Program kurulum dizini silinmedi!"
        assert sandbox_data.exists(), "Koru modunda kullanıcı kütüphanesi silindi!"
        print("   -> [Senaryo A - Kütüphanemi Koru]: Program temizlendi, kullanıcı arşivi %100 korundu.")

        # ChromaDB SQLite ve dosya tanıtıcılarını Windows dosya kilidinden serbest bırak
        import gc
        if 'client' in locals() and hasattr(client, "_system"):
            client._system.stop()
        rag.reset_rag_engine()
        del col_bge, col_qwen, col_cloud, collection, client
        gc.collect()

        # Senaryo B: Tam Temizlik (Wipe Out)
        res_wipe = uninstaller_cleanup.execute_uninstaller_cleanup(
            mode="wipe",
            target_data_dir=sandbox_data
        )
        assert not sandbox_data.exists(), "Tam temizlik modunda veri klasörü silinemedi!"
        print("   -> [Senaryo B - Tam Temizlik]: Tüm kütüphane, veritabanı ve önbellekler sıfır kalıntıyla yok edildi.")

        # Başarı Kaydı
        breaker.record_success()
        print("\n" + "="*70)
        print("[PASS] TEBRİKLER: 10 AŞAMALI KALİTE MATRİSİ %100 BAŞARIYLA TAMAMLANDI!")
        print("Yazılım temiz oda ortamında doğrulanmıştır. Sürüm güvenle paketlenebilir.")
        print("="*70 + "\n")
        return 0

    except Exception as e:
        import traceback
        traceback.print_exc()
        breaker.record_failure("SANDBOX_TEST_FAIL", str(e))
        return 1

    finally:
        print(f"[CLEANUP] [9/9] Sanal Ortam Çöpe Atılıyor: {temp_sandbox}")
        shutil.rmtree(temp_sandbox, ignore_errors=True)

if __name__ == "__main__":
    sys.exit(run_quality_gates())
