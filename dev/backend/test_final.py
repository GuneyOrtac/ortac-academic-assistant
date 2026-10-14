import requests
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
  "model": "meta/llama-3.2-11b-vision-instruct",
  "frequency_penalty": 0,
  "max_tokens": 512,
  "presence_penalty": 0,
  "stream": stream,
  "temperature": 1,
  "top_p": 1
}

print("Running user's final test script...")
start = time.time()
try:
    response = requests.post(invoke_url, headers=headers, json=payload, stream=stream, timeout=60)
    print(f"Time taken: {time.time()-start:.2f}s")
    if stream:
        for line in response.iter_lines():
            if line:
                print(line.decode("utf-8"))
    else:
        print(response.json())
except Exception as e:
    print(f"Error: {e}")
