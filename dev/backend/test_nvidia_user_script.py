import requests
import json
import time

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
stream = False

headers = {
    "Authorization": "Bearer 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",
    "Accept": "text/event-stream" if stream else "application/json",
}

payload = {
  "messages": [
    {
      "content": [
        {
          "image_url": {
            "url": "https://assets.ngc.nvidia.com/products/api-catalog/phi-3-5-vision/example1a.jpg"
          },
          "type": "image_url"
        },
        {
          "type": "text",
          "text": "Is there a car in this image?"
        }
      ],
      "role": "user"
    }
  ],
  "model": "meta/llama-3.2-90b-vision-instruct",
  "frequency_penalty": 0,
  "max_tokens": 512,
  "presence_penalty": 0,
  "stream": stream,
  "temperature": 1,
  "top_p": 1
}

print("Running test...")
start = time.time()
try:
    response = requests.post(invoke_url, headers=headers, json=payload, stream=stream)
    print(f"Time taken: {time.time()-start:.2f}s")
    if stream:
        for line in response.iter_lines():
            if line:
                print(line.decode("utf-8"))
    else:
        print(response.json())
except Exception as e:
    print(f"Error: {e}")
