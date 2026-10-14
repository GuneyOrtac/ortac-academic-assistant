import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def test_nvidia_direct():
    api_key = os.getenv("NVIDIA_API_KEY")
    print("API Key:", api_key[:10] + "...")
    
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Test chat with function calling
    payload = {
        "model": "meta/llama-3.2-90b-vision-instruct",
        "messages": [
            {"role": "user", "content": "What's the weather like in Istanbul?"}
        ],
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get the current weather in a given location",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA"
                            }
                        },
                        "required": ["location"]
                    }
                }
            }
        ],
        "tool_choice": "auto"
    }
    
    print("Sending request to NVIDIA API...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print("Status Code:", response.status_code)
        
        if response.status_code == 200:
            data = response.json()
            message = data['choices'][0]['message']
            print("\nResponse Message:")
            print(json.dumps(message, indent=2))
            
            if 'tool_calls' in message and message['tool_calls']:
                print("\nSUCCESS: API key works and function calling is supported!")
            else:
                print("\nSUCCESS: API key works, but no tool calls were made by the model (might be model specific).")
        else:
            print("\nFAILED: API request returned an error.")
            print(response.text)
            
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_nvidia_direct()
