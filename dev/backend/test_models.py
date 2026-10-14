import os
from langchain_nvidia_ai_endpoints import ChatNVIDIA

key = "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"
os.environ["NVIDIA_API_KEY"] = key

try:
    models = ChatNVIDIA.get_available_models()
    print("Available Models:")
    for m in models:
        if '3.2' in m.id or 'vision' in m.id or 'llama' in m.id:
            print(m.id)
except Exception as e:
    print(f"Error fetching models: {e}")
