from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from dotenv import load_dotenv
load_dotenv()

models = NVIDIAEmbeddings.get_available_models()
valid_models = []
for m in models:
    try:
        emb = NVIDIAEmbeddings(model=m.id)
        res = emb.embed_query("test")
        valid_models.append(m.id)
        print(f"Valid: {m.id}")
    except Exception as e:
        print(f"Failed: {m.id} - {str(e)[:50]}")

print("All valid models:", valid_models)
