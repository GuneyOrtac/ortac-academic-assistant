import os
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("NVIDIA_API_KEY")

try:
    print("Testing 11b model with Langchain...")
    llm = ChatNVIDIA(model="meta/llama-3.2-11b-vision-instruct", api_key=key)
    res = llm.invoke([HumanMessage(content="Hello, respond with OK.")])
    print(res.content)
except Exception as e:
    print(f"Error: {e}")
