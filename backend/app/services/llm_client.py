import os
import httpx
import json

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "smollm2")

class LLMClient:
    def __init__(self):
        self.base_url = OLLAMA_URL
        self.model = OLLAMA_MODEL
    async def generate(self, prompt: str) -> str:
        print(f"Generating with model: {self.model}")
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt},
            )
            print(f"Response status code: {response.status_code}")
            
            # Handle streaming response
            try:
                full_response = ""
                # Split response by newlines to handle multiple JSON objects
                json_responses = response.text.strip().split('\n')
                
                for json_str in json_responses:
                    if not json_str:  # Skip empty lines
                        continue
                    try:
                        resp_obj = json.loads(json_str)
                        if isinstance(resp_obj, dict):
                            if "error" in resp_obj:
                                print(f"Error from model: {resp_obj['error']}")
                                return f"Error: {resp_obj['error']}"
                            elif "response" in resp_obj:
                                full_response += resp_obj["response"]
                    except json.JSONDecodeError as je:
                        print(f"Failed to parse JSON object: {json_str}")
                        continue
                
                return full_response if full_response else "Error: No valid response received"
                
            except Exception as e:
                print(f"Error processing response: {e}")
                print(f"Raw response: {response.text}")
                return "Error: Unable to process model response"