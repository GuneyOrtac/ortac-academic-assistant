import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("NVIDIA_API_KEY")
url = "https://integrate.api.nvidia.com/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
payload = {
    "model": "meta/llama-3.2-90b-vision-instruct",
    "messages": [{"role": "user", "content": "Hello"}]
}

try:
    print("Testing NVIDIA API with .env key (90b model)...")
    response = requests.post(url, headers=headers, json=payload, timeout=5)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
