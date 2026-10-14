import os
import json
import re
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

SETTINGS_FILE = os.path.join("veri", "settings.json")
ENV_FILE = ".env"

# Eski veya yayından kaldırılmış modellerin güncel eşleştirmeleri
LEGACY_MODEL_MAP = {
    "gemini-1.5-flash": "gemini-3.1-flash-lite",
    "gemini-1.5-flash-8b": "gemini-3.1-flash-lite",
    "gemini-2.0-flash": "gemini-3.8-flash",
    "gemini-2.0-flash-exp": "gemini-3.8-flash",
    "gemini-2.0-flash-thinking-exp": "gemini-3.8-flash",
    "gemini-1.5-pro": "gemini-3.8-flash",
    "gemini-1.0-pro": "gemini-3.8-flash",
    "gpt-4o": "gemini-3.8-flash",
    "deepseek-chat": "gemini-3.8-flash",
    "meta/llama-3.1-70b-instruct": "gemini-3.8-flash",
    "meta/llama-3.2-11b-vision-instruct": "gemini-3.1-flash-lite"
}

# Embedding Modeli Profilleri ve Donanım Şartnamesi
EMBEDDING_PROFILES = {
    "bge-m3": {
        "id": "bge-m3",
        "name": "Akademik Standart (BAAI/bge-m3)",
        "hf_model": "BAAI/bge-m3",
        "download_size_gb": 2.2,
        "required_disk_gb": 22.2,
        "min_ram_gb": 16,
        "context_tokens": 8192,
        "description": "8192 token kesintisiz bağlam, hibrit anlamsal + terimsel BM25 arama."
    },
    "e5-small": {
        "id": "e5-small",
        "name": "Hafif & Hızlı (multilingual-e5-small)",
        "hf_model": "intfloat/multilingual-e5-small",
        "download_size_gb": 0.5,
        "required_disk_gb": 20.5,
        "min_ram_gb": 8,
        "context_tokens": 512,
        "description": "512 token limiti, 500 MB RAM tüketimi, anında indeksleme."
    },
    "qwen2-7b": {
        "id": "qwen2-7b",
        "name": "Zirve Güç (gte-Qwen2-7B-instruct)",
        "hf_model": "Alibaba-NLP/gte-Qwen2-7B-instruct",
        "download_size_gb": 14.5,
        "required_disk_gb": 34.5,
        "min_ram_gb": 32,
        "context_tokens": 32768,
        "description": "32.768 dev token penceresi, MTEB dünya 1.si anlamsal kavrayış."
    },
    "cloud-gemini": {
        "id": "cloud-gemini",
        "name": "Sıfır Donanım Yükü (Google Bulut API)",
        "hf_model": "models/text-embedding-004",
        "download_size_gb": 0.0,
        "required_disk_gb": 20.0,
        "min_ram_gb": 4,
        "context_tokens": 8192,
        "description": "Sıfır yerel RAM tüketimi, donanımı ve fanları hiç yormaz."
    }
}

def get_settings() -> dict:
    """Uygulama ayarlarını getirir. Öncelik veri/settings.json dosyasındadır."""
    gemini_env_key = os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()
    
    defaults = {
        "onboarding_completed": False,
        "embedding_profile": "bge-m3",
        "api_mode": "system_default",
        "workspace": {
            "storage_path": "./veri",
            "pdf_dir": "./veri/pdf_kutuphanesi",
            "chroma_dir": "./veri/chroma_db"
        },
        "api_keys": {
            "gemini": gemini_env_key,
            "openai": os.getenv("OPENAI_API_KEY", ""),
            "deepseek": os.getenv("DEEPSEEK_API_KEY", ""),
            "perplexity": os.getenv("PERPLEXITY_API_KEY", ""),
            "anthropic": os.getenv("ANTHROPIC_API_KEY", ""),
            "groq": os.getenv("GROQ_API_KEY", ""),
            "nvidia": os.getenv("NVIDIA_API_KEY", "")
        },
        "models": {
            "chat": {"label": "Genel Sohbet & RAG", "provider": "gemini", "model": "gemini-3.8-flash"},
            "drafting": {"label": "Makale Taslağı (OpenDraft)", "provider": "gemini", "model": "gemini-3.8-flash"},
            "vision": {"label": "PDF & Doküman Analizi", "provider": "gemini", "model": "gemini-3.1-flash-lite"}
        }
    }

    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                # Eksik alanları varsayılanlarla tamamla
                if "onboarding_completed" not in data:
                    data["onboarding_completed"] = False
                if "embedding_profile" not in data:
                    data["embedding_profile"] = "bge-m3"
                if "api_mode" not in data:
                    data["api_mode"] = "system_default"
                if "workspace" not in data:
                    data["workspace"] = defaults["workspace"]
                if "api_keys" not in data:
                    data["api_keys"] = defaults["api_keys"]
                elif not data["api_keys"].get("gemini") and gemini_env_key:
                    data["api_keys"]["gemini"] = gemini_env_key
                    
                if "models" not in data:
                    data["models"] = defaults["models"]
                else:
                    # Model isimlerini kontrol et ve eski modelleri güncelle
                    for task_name, cfg in data["models"].items():
                        current_m = cfg.get("model", "")
                        if current_m in LEGACY_MODEL_MAP:
                            cfg["model"] = LEGACY_MODEL_MAP[current_m]
                            cfg["provider"] = "gemini"
                return data
        except Exception as e:
            print(f"Ayarlar dosyası okunamadı: {e}")

    return defaults

def update_env_file(key_name: str, key_val: str):
    """Gerektiğinde .env dosyasını günceller."""
    try:
        lines = []
        found = False
        if os.path.exists(ENV_FILE):
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        new_lines = []
        for line in lines:
            if line.strip().startswith(f"{key_name}="):
                new_lines.append(f'{key_name}="{key_val}"\n')
                found = True
            else:
                new_lines.append(line)
                
        if not found:
            new_lines.append(f'{key_name}="{key_val}"\n')
            
        with open(ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        print(f".env dosyası güncellenirken hata: {e}")

def save_settings(settings_data: dict):
    """Ayarları veri/settings.json dosyasına kaydeder ve çevre değişkenlerini günceller."""
    os.makedirs("veri", exist_ok=True)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings_data, f, ensure_ascii=False, indent=4)
        
    # Bellekteki çevre değişkenlerini anlık güncelle
    gemini_key = settings_data.get("api_keys", {}).get("gemini", "").strip()
    if gemini_key:
        os.environ["GEMINI_API_KEY"] = gemini_key
        os.environ["GOOGLE_API_KEY"] = gemini_key
        update_env_file("GEMINI_API_KEY", gemini_key)

def get_gemini_api_key() -> str:
    """Aktif Gemini API anahtarını döner."""
    settings = get_settings()
    key = settings.get("api_keys", {}).get("gemini", "").strip()
    if not key:
        key = os.getenv("GEMINI_API_KEY", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip()
    return key

def is_gemini_configured() -> bool:
    """Gemini API anahtarının tanımlı olup olmadığını döner."""
    key = get_gemini_api_key()
    return bool(key and key != "bekleniyor" and len(key) > 5)

def get_gemini_llm(task: str = "chat", model_override: str = None, temperature: float = None):
    """
    Göreve ve bütçeye göre en optimize Gemini modelini döner.
    - 'analysis': PDF künye ve özet çıkarma (En ucuz & süper hızlı: gemini-3.1-flash-lite)
    - 'chat': Kütüphane ve RAG soru-cevap (Gelişmiş akıl yürütme & hızlı: gemini-3.8-flash)
    - 'drafting': Makale taslağı ve sentezleme (Yüksek kaliteli sentez & ekonomik: gemini-3.8-flash)
    """
    api_key = get_gemini_api_key()
    if not api_key or not is_gemini_configured():
        raise ValueError("Google Gemini API anahtarı bulunamadı! Lütfen arayüzdeki 'Ayarlar' sekmesinden API anahtarınızı kaydedin.")

    settings = get_settings()
    models_cfg = settings.get("models", {})

    if model_override:
        model_name = model_override
    elif task == "analysis":
        model_name = models_cfg.get("vision", {}).get("model", "gemini-3.1-flash-lite")
        if temperature is None:
            temperature = 0.1
    elif task == "drafting":
        model_name = models_cfg.get("drafting", {}).get("model", "gemini-3.8-flash")
        if temperature is None:
            temperature = 0.4
    else:  # chat
        model_name = models_cfg.get("chat", {}).get("model", "gemini-3.8-flash")
        if temperature is None:
            temperature = 0.3

    # Eski veya geçersiz model adlarını güvenli güncel modele dönüştür
    if model_name in LEGACY_MODEL_MAP:
        model_name = LEGACY_MODEL_MAP[model_name]

    if not model_name or "gemini" not in model_name:
        model_name = "gemini-3.1-flash-lite" if task == "analysis" else "gemini-3.8-flash"

    try:
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=temperature
        )
    except Exception as e:
        fallback_model = "gemini-flash-latest"
        print(f"{model_name} başlatılırken hata ({e}), fallback olarak {fallback_model} kullanılıyor.")
        return ChatGoogleGenerativeAI(
            model=fallback_model,
            google_api_key=api_key,
            temperature=temperature
        )
