import os
import time
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage

key = "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"
os.environ["NVIDIA_API_KEY"] = key

print("Testing vision model (llama-3.2-90b-vision-instruct) via Langchain...")
start = time.time()
try:
    llm = ChatNVIDIA(model="meta/llama-3.2-90b-vision-instruct", api_key=key)
    res = llm.invoke([HumanMessage(content="Hello, answer in 1 word.")])
    print(f"Time taken: {time.time()-start:.2f}s")
    print("Response:", res.content)
except Exception as e:
    print(f"Error: {e}")
