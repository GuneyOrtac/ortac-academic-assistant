import os
import requests

def call_deepseek_api(prompt: str, system_prompt: str = "Sen yetkin bir akademik asistansın.") -> str:
    """DeepSeek API'sini çağırır (3 Katmanlı API modeli optimizasyonu için)."""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key or api_key == "bekleniyor":
        raise ValueError("DeepSeek API anahtarı bulunamadı. Lütfen .env dosyasını güncelleyin.")
        
    # DeepSeek'in Chat Completions API endpointi (OpenAI formatıyla uyumlu)
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2 # Akademik kesinlik için düşük sıcaklık
    }
    
    response = requests.post(url, headers=headers, json=data, timeout=30.0)
    response.raise_for_status()
    
    return response.json()["choices"][0]["message"]["content"]
