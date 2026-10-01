import os

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")


async def analyze_trade(prompt: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {
                "role": "system",
                "content": "You are an NFL trade analysis assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json=payload,
        )
        response.raise_for_status()

        data = response.json()
        return data["message"]["content"]
