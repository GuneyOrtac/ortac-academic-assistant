from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import fitz  # PyMuPDF
import model_factory
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from fastapi.responses import FileResponse
import rag
import chat_engine
import draft_engine
import openalex_engine
from mcp_manager import mcp_engine

# Çevresel değişkenleri (.env) yükle
load_dotenv()

app = FastAPI(
    title="Akademik Asistan API",
    description="Yapay Zeka Destekli Masaüstü Akademik Asistan Backend Motoru",
    version="0.0.1"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini'nin döneceği JSON yapısını Pydantic ile garantiliyoruz
class PdfMetadata(BaseModel):
    eser_turu: str = Field(description="Makale, Kitap, Yüksek Lisans Tezi, Doktora Tezi vb.")
    yazar: str = Field(description="Yazar veya yazarlar (Örn: Yılmaz & Kaya)")
    yil: str = Field(description="Yayın yılı (Örn: 2024)")
    baslik: str = Field(description="Eserin tam başlığı")
    dil: str = Field(description="Orijinal Dili (Örn: Türkçe, İngilizce)")
    dergi: str = Field(description="Yayınlandığı dergi veya kurum (yoksa 'Belirtilmemiş')")
    turkce_ozet: str = Field(description="Eserin ana konusunu anlatan 4-5 cümlelik kapsamlı Türkçe özet")
    anahtar_kelimeler: list[str] = Field(description="Eserle ilgili en önemli 3-5 anahtar kelime")

parser = JsonOutputParser(pydantic_object=PdfMetadata)

@app.get("/")
async def root():
    return {"mesaj": "Akademik Asistan Motoru Çalışıyor!", "durum": "Aktif"}

@app.get("/api/sistem-kontrol")
async def check_system():
    try:
        # ChromaDB bağlantısını test et
        rag.get_vectorstore()
        db_status = "Aktif"
    except Exception as e:
        db_status = f"Hata: {str(e)}"
        
    gemini_status = "Bağlı" if model_factory.is_gemini_configured() else "Eksik"
    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    deepseek_status = "Bağlı" if deepseek_key and deepseek_key != "bekleniyor" else "Eksik"
        
    return {
        "gemini_api": gemini_status,
        "deepseek_api": deepseek_status,
        "veritabani": db_status
    }

@app.post("/api/pdf-yukle")
async def upload_pdf(file: UploadFile = File(...)):
    """PDF'i okur, Gemini ile analiz edip künyesini/özetini çıkarır ve vektör veritabanına kaydeder."""
    if not model_factory.is_gemini_configured():
        raise HTTPException(status_code=500, detail="Google Gemini API Anahtarı eksik! Lütfen Ayarlar sekmesinden API anahtarınızı kaydedin.")

    # 1. Dosyayı geçici olarak kaydet
    temp_path = f"temp_{file.filename}"
    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)
        
    try:
        # 2. PyMuPDF ile PDF'i aç ve ilk 3 sayfayı oku (Künye genelde buradadır)
        doc = fitz.open(temp_path)
        ilk_sayfalar_metni = ""
        for page_num in range(min(3, len(doc))):
            ilk_sayfalar_metni += doc[page_num].get_text()
            
        # 3. Gemini'ye verilecek komut (Prompt)
        prompt = PromptTemplate(
            template="""Aşağıdaki akademik belgenin ilk sayfalarından alınan karmaşık metni incele.
            Bu metinden yola çıkarak eserin künyesini ve özetini istenen JSON formatında çıkar.
            Eğer metin İngilizce veya başka bir dilde ise, özet ve başlıkları MUTLAKA Türkçe'ye çevirerek yaz.
            
            METİN:
            {text}
            
            FORMAT KURALLARI:
            {format_instructions}""",
            input_variables=["text"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        # 4. Zinciri kur ve çalıştır
        analysis_llm = model_factory.get_gemini_llm(task="analysis")
        chain = prompt | analysis_llm | parser
        metadata_sonuc = chain.invoke({"text": ilk_sayfalar_metni})
        
        doc.close()
        
        # 5. Kütüphaneye Kaydet (İsimlendirip klasöre atar ve library.json'a yazar)
        import library_manager
        kutuphane_kaydi = library_manager.add_to_library(temp_path, metadata_sonuc)
        
        # 6. RAG Entegrasyonu: Tüm PDF'i ChromaDB'ye vektörleştirerek kaydet
        chunk_sayisi = rag.pdf_vektorlestir_ve_kaydet(
            pdf_yolu=kutuphane_kaydi["tam_yol"],
            dosya_adi=kutuphane_kaydi["dosya_adi"],
            metadata=metadata_sonuc
        )
        
        # Temizlik (Geçici dosyayı sil)
        os.remove(temp_path)
        
        return {
            "mesaj": "Analiz ve vektörizasyon başarılı!", 
            "dosya": kutuphane_kaydi["dosya_adi"],
            "veri": metadata_sonuc,
            "vektor_chunk_sayisi": chunk_sayisi
        }
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

class SearchRequest(BaseModel):
    sorgu: str
    k: int = 3

@app.get("/api/kutuphane")
async def get_library():
    import library_manager
    try:
        return library_manager.load_library()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/kutuphane/{file_id}")
async def delete_library_item(file_id: str):
    import library_manager
    try:
        # 1. Kütüphane listesinden ve diskten sil
        silindi = library_manager.delete_from_library(file_id)
        if silindi:
            # 2. Vektör DB'den sil
            silinen_vektor = rag.pdf_vektorleri_sil(file_id)
            return {"mesaj": f"{file_id} başarıyla silindi.", "vektor": silinen_vektor}
        else:
            raise HTTPException(status_code=404, detail="Dosya bulunamadı.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pdf/{file_id}")
async def get_pdf(file_id: str):
    import library_manager
    file_path = os.path.join(library_manager.get_library_dir(), file_id)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf")
    raise HTTPException(status_code=404, detail="PDF bulunamadı.")

@app.post("/api/ara")
async def semantic_search(request: SearchRequest):
    """Kütüphanede (ChromaDB) anlamsal (semantic) arama yapar."""
    try:
        sonuclar = rag.benzer_metinleri_getir(request.sorgu, k=request.k)
        
        formatli_sonuclar = []
        for doc in sonuclar:
            formatli_sonuclar.append({
                "metin": doc.page_content,
                "kaynak": doc.metadata.get("dosya_adi", "Bilinmiyor"),
                "yazar": doc.metadata.get("yazar", "Bilinmiyor"),
                "yil": doc.metadata.get("yil", "Bilinmiyor"),
                "baslik": doc.metadata.get("baslik", "Bilinmiyor")
            })
            
        return {
            "sorgu": request.sorgu,
            "bulunan_sonuc_sayisi": len(formatli_sonuclar),
            "sonuclar": formatli_sonuclar
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arama hatası: {str(e)}")

class ChatRequest(BaseModel):
    soru: str
    secili_pdfler: list[str] = []
    aktif_sekme: str = "Bilinmiyor"
    draft_icerik: str = ""

@app.post("/api/sohbet")
async def chat_with_docs(request: ChatRequest):
    """Kütüphanedeki PDF'leri kaynak göstererek soruya cevap verir."""
    try:
        sonuc = chat_engine.sohbet_yanitla(request.soru, request.secili_pdfler, request.aktif_sekme, request.draft_icerik)
        return sonuc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sohbet hatası: {str(e)}")

class DraftRequest(BaseModel):
    konu: str

@app.post("/api/taslak-olustur")
async def generate_draft(request: DraftRequest):
    """Verilen konuda makale taslağı oluşturur ve Word (.docx) olarak döndürür."""
    try:
        # Geçici bir dosya adı oluştur
        dosya_adi = f"taslak_{hash(request.konu)}.docx"
        sonuc = draft_engine.taslak_ve_word_olustur(request.konu, dosya_adi)
        
        # Dosyayı kullanıcıya indirilebilir olarak dönüyoruz
        return FileResponse(
            path=dosya_adi, 
            filename="Makale_Taslagi.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Taslak oluşturma hatası: {str(e)}")

class SearchOpenAlexRequest(BaseModel):
    sorgu: str
    limit: int = 5
    page: int = 1
    sort_by: str = "relevance"
    min_year: int = None

@app.post("/api/literatur-tara")
async def search_literature(request: SearchOpenAlexRequest):
    """OpenAlex üzerinde açık erişim makaleleri tarar."""
    try:
        results = openalex_engine.search_articles(request.sorgu, request.limit, request.page, request.sort_by, request.min_year)
        return {"mesaj": "Arama başarılı", "sonuclar": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DownloadPDFRequest(BaseModel):
    url: str
    title: str

@app.post("/api/pdf-indir-ve-ekle")
async def download_and_add_pdf(request: DownloadPDFRequest):
    """Verilen URL'den PDF indirir ve kütüphaneye analiz edip ekler."""
    import tempfile
    import requests
    import shutil
    
    # 1. URL'den indir
    try:
        download_url = request.url.strip()
        if "arxiv.org/abs/" in download_url:
            download_url = download_url.replace("arxiv.org/abs/", "arxiv.org/pdf/")
            if not download_url.endswith(".pdf"):
                download_url += ".pdf"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        response = requests.get(download_url, headers=headers, timeout=30.0, allow_redirects=True)
        response.raise_for_status()
        
        # İçerik tipini kontrol et (HTML döndüyse meta etiketinden PDF linki aramayı dene)
        content_type = response.headers.get("Content-Type", "")
        if "application/pdf" not in content_type and not response.content.startswith(b"%PDF"):
            import re
            pdf_match = re.search(r'<meta\s+name=["\']citation_pdf_url["\']\s+content=["\']([^"\']+)["\']', response.text, re.IGNORECASE)
            if pdf_match:
                alt_url = pdf_match.group(1)
                alt_resp = requests.get(alt_url, headers=headers, timeout=30.0, allow_redirects=True)
                if alt_resp.status_code == 200 and (alt_resp.content.startswith(b"%PDF") or "application/pdf" in alt_resp.headers.get("Content-Type", "")):
                    response = alt_resp

        content_type = response.headers.get("Content-Type", "")
        if "application/pdf" not in content_type and not response.content.startswith(b"%PDF"):
            raise ValueError("Bu bağlantı doğrudan bir PDF vermiyor (Erişim sayfası olabilir). Lütfen tarayıcı üzerinden manuel indirip 'Kütüphane' sekmesinden yükleyin.")
            
        # Geçici dosyaya kaydet
        fd, temp_path = tempfile.mkstemp(suffix=".pdf")
        with os.fdopen(fd, 'wb') as f:
            f.write(response.content)
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"İndirme başarısız: {str(e)}")
        
    try:
        # 2. PyMuPDF ile PDF'i açıp ilk 3 sayfayı oku
        doc = fitz.open(temp_path)
        ilk_sayfalar_metni = ""
        for page_num in range(min(3, len(doc))):
            ilk_sayfalar_metni += doc[page_num].get_text()
            
        # 3. Gemini Prompt
        prompt = PromptTemplate(
            template="""Aşağıdaki akademik belgenin ilk sayfalarından alınan karmaşık metni incele.
            Bu metinden yola çıkarak eserin künyesini ve özetini istenen JSON formatında çıkar.
            Eğer metin İngilizce veya başka bir dilde ise, özet ve başlıkları MUTLAKA Türkçe'ye çevirerek yaz.
            
            METİN:
            {text}
            
            FORMAT KURALLARI:
            {format_instructions}""",
            input_variables=["text"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        try:
            analysis_llm = model_factory.get_gemini_llm(task="analysis")
            chain = prompt | analysis_llm | parser
            metadata_sonuc = chain.invoke({"text": ilk_sayfalar_metni})
        except Exception as llm_err:
            print(f"Otomatik LLM analizi başarısız ({llm_err}), OpenAlex başlığı kullanılıyor.")
            metadata_sonuc = {
                "baslik": request.title,
                "yazar": "Açık Erişim",
                "yil": "2024",
                "ozet": ilk_sayfalar_metni[:400].strip() if ilk_sayfalar_metni else "Açık erişim akademik makale."
            }
        doc.close()
        
        # OpenAlex başlığını fallback olarak ekle
        if not metadata_sonuc.get("baslik"):
            metadata_sonuc["baslik"] = request.title
            
        # 4. Kütüphaneye Kaydet
        import library_manager
        kutuphane_kaydi = library_manager.add_to_library(temp_path, metadata_sonuc)
        
        # 5. Vektörleştir
        chunk_sayisi = rag.pdf_vektorlestir_ve_kaydet(
            pdf_yolu=kutuphane_kaydi["tam_yol"],
            dosya_adi=kutuphane_kaydi["dosya_adi"],
            metadata=metadata_sonuc
        )
        
        os.remove(temp_path)
        return {
            "mesaj": "Makale başarıyla kütüphanenize eklendi ve analiz edildi!",
            "dosya": kutuphane_kaydi["dosya_adi"]
        }
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Analiz veya kayıt hatası: {str(e)}")

class MCPConnectRequest(BaseModel):
    server_name: str

@app.post("/api/mcp-baglan")
async def connect_mcp(request: MCPConnectRequest):
    """Dış MCP sunucusuna bağlanır (Zotero, MATLAB vb.)"""
    return mcp_engine.connect_server(request.server_name)

@app.get("/api/mcp-araclar")
async def list_mcp_tools():
    """Bağlı MCP sunucularındaki aktif araçları listeler."""
    return mcp_engine.list_connected_tools()

# --- Ayarlar (Settings) ---
class SettingsUpdate(BaseModel):
    api_keys: dict
    models: dict

@app.get("/api/ayarlar")
async def read_settings():
    return model_factory.get_settings()

@app.post("/api/ayarlar")
async def update_settings(settings: SettingsUpdate):
    model_factory.save_settings(settings.dict())
    return {"mesaj": "Ayarlar başarıyla kaydedildi"}

# --- Kurulum ve Sistem Bilgisi (Onboarding & Hardware Diagnostic) ---
import shutil
import psutil

class OnboardingRequest(BaseModel):
    model_profile: str
    storage_path: str
    api_mode: str = "system_default"
    custom_api_key: str = ""

@app.get("/api/sistem-bilgisi")
async def get_system_hardware_info():
    """Kullanıcının RAM ve disk bölümlerini algılar ve model profillerini döner."""
    try:
        mem = psutil.virtual_memory()
        total_ram_gb = round(mem.total / (1024**3), 1)
        avail_ram_gb = round(mem.available / (1024**3), 1)
    except Exception:
        total_ram_gb = 16.0
        avail_ram_gb = 8.0

    drives = []
    try:
        partitions = psutil.disk_partitions(all=False)
        for p in partitions:
            if 'cdrom' in p.opts or not p.fstype:
                continue
            try:
                usage = psutil.disk_usage(p.mountpoint)
                total_gb = round(usage.total / (1024**3), 1)
                free_gb = round(usage.free / (1024**3), 1)
                used_gb = round(usage.used / (1024**3), 1)
                drives.append({
                    "device": p.device,
                    "mountpoint": p.mountpoint,
                    "total_gb": total_gb,
                    "free_gb": free_gb,
                    "used_gb": used_gb,
                    "usage_pct": round(usage.percent, 1)
                })
            except Exception:
                continue
    except Exception as e:
        print(f"Disk bölümleri okunurken hata: {e}")

    settings = model_factory.get_settings()
    return {
        "donanim": {
            "toplam_ram_gb": total_ram_gb,
            "bos_ram_gb": avail_ram_gb,
            "cpu_cekirdek": os.cpu_count() or 8
        },
        "suruculer": drives,
        "profiller": model_factory.EMBEDDING_PROFILES,
        "onboarding_tamamlandi": settings.get("onboarding_completed", False),
        "mevcut_ayarlar": settings
    }

@app.post("/api/kurulum-tamamla")
async def complete_onboarding(request: OnboardingRequest):
    """
    Model seçimi, dizin kontrolü (+20 GB RAG payı) ve API tercihini kaydederek kurulumu tamamlar.
    """
    profile = model_factory.EMBEDDING_PROFILES.get(request.model_profile)
    if not profile:
        raise HTTPException(status_code=400, detail="Geçersiz model profili seçildi.")

    required_disk_gb = profile["required_disk_gb"]

    # 1. Seçilen dizinin disk boşluğunu kontrol et
    clean_path = request.storage_path.strip()
    if not clean_path:
        clean_path = os.path.abspath("./veri")

    try:
        # Sürücü kökünü veya mevcut yolu kontrol et
        test_path = clean_path if os.path.exists(clean_path) else os.path.splitdrive(clean_path)[0] + "\\"
        usage = shutil.disk_usage(test_path)
        free_disk_gb = round(usage.free / (1024**3), 1)
        
        if free_disk_gb < required_disk_gb:
            raise HTTPException(
                status_code=400,
                detail=f"Yetersiz Disk Alanı! Seçtiğiniz {profile['name']} ({profile['download_size_gb']} GB) ve RAG kütüphanesi (20 GB) için en az {required_disk_gb} GB boş alan gereklidir. Seçilen sürücüde yalnızca {free_disk_gb} GB boş alan var. Lütfen başka bir sürücü seçin."
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Disk kontrolünde uyarı: {e}")

    # 2. Dizinleri oluştur
    pdf_dir = os.path.join(clean_path, "pdf_kutuphanesi")
    chroma_dir = os.path.join(clean_path, "chroma_db")
    try:
        os.makedirs(pdf_dir, exist_ok=True)
        os.makedirs(chroma_dir, exist_ok=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dizin oluşturulamadı: {str(e)}")

    # 3. Ayarları kaydet
    settings = model_factory.get_settings()
    settings["onboarding_completed"] = True
    settings["embedding_profile"] = request.model_profile
    settings["api_mode"] = request.api_mode
    settings["workspace"] = {
        "storage_path": clean_path,
        "pdf_dir": pdf_dir,
        "chroma_dir": chroma_dir
    }

    if request.api_mode == "custom_key" and request.custom_api_key.strip():
        settings["api_keys"]["gemini"] = request.custom_api_key.strip()

    model_factory.save_settings(settings)
    rag.reset_rag_engine()

    return {
        "durum": "basarili",
        "mesaj": "Kurulum başarıyla tamamlandı. Çalışma alanı hazır!",
        "ayarlar": settings
    }

@app.post("/api/kurulum-sifirla")
async def reset_onboarding():
    """Kurulum sihirbazını test için yeniden açar."""
    settings = model_factory.get_settings()
    settings["onboarding_completed"] = False
    model_factory.save_settings(settings)
    return {"mesaj": "Kurulum durumu sıfırlandı."}

GITHUB_REPO = "GuneyOrtac/ortac-academic-assistant"
CURRENT_VERSION = "0.0.1"

@app.get("/api/guncelleme-kontrol")
async def check_github_update():
    """GitHub Releases üzerinden en son sürümü ve değişiklikleri denetler."""
    import requests
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
        headers = {"User-Agent": "AcademicAssistant-Updater"}
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            remote_tag = data.get("tag_name", f"v{CURRENT_VERSION}").lstrip("v")
            
            # Semver karşılaştırması
            is_newer = False
            try:
                r_parts = [int(p) for p in remote_tag.split(".")]
                l_parts = [int(p) for p in CURRENT_VERSION.split(".")]
                is_newer = r_parts > l_parts
            except Exception:
                is_newer = remote_tag != CURRENT_VERSION

            return {
                "guncel_mi": not is_newer,
                "mevcut_surum": CURRENT_VERSION,
                "son_surum": remote_tag,
                "yayin_tarihi": data.get("published_at", ""),
                "surum_notlari": data.get("body", "Yeni sürüm yayınlandı."),
                "indir_url": data.get("html_url", f"https://github.com/{GITHUB_REPO}/releases"),
                "release_adi": data.get("name", f"Akademik Asistan v{remote_tag}")
            }
        else:
            return {
                "guncel_mi": True,
                "mevcut_surum": CURRENT_VERSION,
                "son_surum": CURRENT_VERSION,
                "mesaj": "GitHub'da sürüm denetlendi. Sistem güncel."
            }
    except Exception as e:
        return {
            "guncel_mi": True,
            "mevcut_surum": CURRENT_VERSION,
            "son_surum": CURRENT_VERSION,
            "hata": str(e)
        }

@app.post("/api/guncelleme-uygula")
async def apply_github_update():
    """Doğrudan GitHub'dan en güncel kodları (git pull) çeker."""
    import subprocess
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    try:
        res = subprocess.run(
            ["git", "pull", "origin", "main"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=30
        )
        output = (res.stdout or "") + (res.stderr or "")
        return {
            "durum": "basarili" if res.returncode == 0 else "hata",
            "cikti": output,
            "mesaj": "GitHub üzerinden en son güncellemeler başarıyla çekildi!" if res.returncode == 0 else "Güncelleme sırasında hata oluştu."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Güncelleme uygulanamadı: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Backend'i ayağa kaldırıyoruz
    uvicorn.run(app, host="127.0.0.1", port=8000)

