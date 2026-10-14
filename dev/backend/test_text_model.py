import os
import time
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage

key = "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"
os.environ["NVIDIA_API_KEY"] = key

print("Testing text-only model (llama-3.1-8b-instruct)...")
start = time.time()
try:
    llm = ChatNVIDIA(model="meta/llama-3.1-8b-instruct", api_key=key, client_kwargs={"timeout": 15})
    res = llm.invoke([HumanMessage(content="Hello, answer in 1 word.")])
    print(f"Time taken: {time.time()-start:.2f}s")
    print("Response:", res.content)
except Exception as e:
    print(f"Error: {e}")
