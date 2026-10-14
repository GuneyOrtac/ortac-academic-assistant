import requests
import json
import os
import time
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage

keys = {
    "User_Provided_Key_1": "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",
    "User_Provided_Key_2": "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"
}

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

payload = {
  "messages": [
    {
      "content": [
        {
          "type": "text",
          "text": "Hello, are you working? Respond with yes."
        }
      ],
      "role": "user"
    }
  ],
  "model": "meta/llama-3.2-90b-vision-instruct",
  "max_tokens": 64,
  "stream": False
}

for name, key in keys.items():
    print(f"\n--- Testing {name} with direct requests API ---")
    headers = {
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    start = time.time()
    try:
        response = requests.post(invoke_url, headers=headers, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", response.json()['choices'][0]['message']['content'])
        else:
            print("Error Response:", response.text)
    except Exception as e:
        print(f"Error: {e}")
    print(f"Time taken: {time.time()-start:.2f}s")
        
    print(f"\n--- Testing {name} with Langchain ChatNVIDIA ---")
    start = time.time()
    try:
        os.environ["NVIDIA_API_KEY"] = key
        # Using a timeout or similar if supported, but let's hope it's not a generic hang.
        llm = ChatNVIDIA(model="meta/llama-3.2-90b-vision-instruct", api_key=key, client_kwargs={"timeout": 10})
        res = llm.invoke([HumanMessage(content="Hello, are you working? Please answer in 3 words.")])
        print("Langchain Response:", res.content)
    except Exception as e:
        print(f"Langchain Error: {e}")
    print(f"Time taken: {time.time()-start:.2f}s")
