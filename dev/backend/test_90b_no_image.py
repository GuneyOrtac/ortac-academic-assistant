import requests
import json
import time

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

headers = {
    "Authorization": "Bearer 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",
    "Accept": "application/json",
}

payload = {
  "messages": [
    {
      "role": "user",
      "content": "Hello, answer in 1 word."
    }
  ],
  "model": "meta/llama-3.2-90b-vision-instruct",
  "max_tokens": 10
}

print("Running 90b-vision test without image...")
start = time.time()
try:
    response = requests.post(invoke_url, headers=headers, json=payload, timeout=30)
    print(f"Time taken: {time.time()-start:.2f}s")
    print("Status:", response.status_code)
    try:
        print("Response:", response.json()['choices'][0]['message']['content'])
    except Exception:
        print("Raw Response:", response.text)
except Exception as e:
    print(f"Error: {e}")
