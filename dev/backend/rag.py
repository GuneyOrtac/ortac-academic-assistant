import os
import pymupdf as fitz
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import model_factory

COLLECTION_NAME = "makale_kutuphanesi"

_embeddings = None
_vectorstore = None

def reset_rag_engine():
    """Embedding veya veritabanı dizini değiştiğinde önbelleği temizler."""
    global _embeddings, _vectorstore
    _embeddings = None
    _vectorstore = None

def get_chroma_dir():
    """ChromaDB veritabanı dizinini ayarlardan dinamik alır."""
    try:
        settings = model_factory.get_settings()
        chroma_dir = settings.get("workspace", {}).get("chroma_dir")
        if chroma_dir:
            return chroma_dir
    except Exception:
        pass
    return os.path.join("veri", "chroma_db")

def get_embeddings():
    """Seçili modele göre embedding nesnesini döner (Singleton)."""
    global _embeddings
    if _embeddings is None:
        os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
        settings = model_factory.get_settings()
        profile_key = settings.get("embedding_profile", "bge-m3")
        profile_info = model_factory.EMBEDDING_PROFILES.get(profile_key, model_factory.EMBEDDING_PROFILES["bge-m3"])
        
        # Bulut Google API seçildiyse
        if profile_key == "cloud-gemini":
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            api_key = model_factory.get_gemini_api_key()
            _embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=api_key
            )
        else:
            model_name = profile_info["hf_model"]
            try:
                _embeddings = HuggingFaceEmbeddings(
                    model_name=model_name,
                    model_kwargs={"local_files_only": True}
                )
            except Exception:
                _embeddings = HuggingFaceEmbeddings(
                    model_name=model_name
                )
    return _embeddings

def get_vectorstore():
    """ChromaDB veritabanı bağlantısını döndürür (Singleton)."""
    global _vectorstore
    if _vectorstore is None:
        chroma_dir = get_chroma_dir()
        os.makedirs(chroma_dir, exist_ok=True)
        _vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=get_embeddings(),
            persist_directory=chroma_dir
        )
    return _vectorstore

def pdf_metnini_cikar(pdf_yolu: str) -> str:
    """PDF dosyasından tüm metni çıkarır."""
    doc = fitz.open(pdf_yolu)
    tam_metin = ""
    for page in doc:
        tam_metin += page.get_text()
    doc.close()
    return tam_metin

def pdf_vektorleri_sil(dosya_adi: str):
    """ChromaDB'den belirli bir PDF dosyasına ait vektörleri siler."""
    vectorstore = get_vectorstore()
    try:
        results = vectorstore.get(where={"dosya_adi": dosya_adi})
        if results and results.get("ids") and len(results["ids"]) > 0:
            vectorstore.delete(ids=results["ids"])
            return len(results["ids"])
    except Exception as e:
        print(f"Silme hatası: {e}")
    return 0

def pdf_vektorlestir_ve_kaydet(pdf_yolu: str, dosya_adi: str, metadata: dict):
    """PDF metnini chunk'lara böler ve ChromaDB'ye kaydeder."""
    # 1. Metni Çıkar
    tam_metin = pdf_metnini_cikar(pdf_yolu)
    
    if not tam_metin.strip():
        raise ValueError(f"{dosya_adi} metin içermiyor veya okunamadı.")

    # 2. Metni Parçalara Ayır (Chunking - Modele Göre Dinamik)
    settings = model_factory.get_settings()
    profile_key = settings.get("embedding_profile", "bge-m3")
    if profile_key in ["bge-m3", "qwen2-7b"]:
        c_size, c_overlap = 1800, 300
    else:
        c_size, c_overlap = 1000, 200

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=c_size,
        chunk_overlap=c_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_text(tam_metin)

    # 3. Document Objeleri Oluştur
    documents = []
    for chunk in chunks:
        doc_metadata = {
            "dosya_adi": dosya_adi,
            "eser_turu": metadata.get("eser_turu", "Belirtilmemiş"),
            "yazar": metadata.get("yazar", "Belirtilmemiş"),
            "yil": metadata.get("yil", "Belirtilmemiş"),
            "baslik": metadata.get("baslik", "Belirtilmemiş")
        }
        documents.append(Document(page_content=chunk, metadata=doc_metadata))
    
    # 4. ChromaDB'ye Kaydet
    vectorstore = get_vectorstore()
    vectorstore.add_documents(documents)
    
    return len(chunks)

def benzer_metinleri_getir(sorgu: str, k: int = 3):
    """Kütüphanede semantik arama yapar ve en benzer metin parçalarını döndürür."""
    vectorstore = get_vectorstore()
    sonuclar = vectorstore.similarity_search(sorgu, k=k)
    return sonuclar
