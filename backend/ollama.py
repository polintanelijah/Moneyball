import os
import json

import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")


async def stream_trade(prompt: str):
    payload = {
        "model": OLLAMA_MODEL,
        "stream": True,
        "messages": [
            {
                "role": "system",
                "content": "You are an NFL trade analysis assistant."
            },
            {
                "role": "user",
                "content": prompt
            }

        ],
        "options": {
            "temperature": 0.0
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as response:
                if response.is_error:
                    await response.aread()
                    response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    event = json.loads(line)
                    if not isinstance(event, dict):
                        raise ValueError("Invalid Ollama response")
                    if event.get("error"):
                        yield {"type": "error", "message": str(event["error"])}
                        return

                    message = event.get("message") or {}
                    if not isinstance(message, dict):
                        raise ValueError("Invalid Ollama response")
                    content = message.get("content", "")
                    if not isinstance(content, str):
                        raise ValueError("Invalid Ollama response")
                    if content:
                        yield {"type": "delta", "content": content}
                    if event.get("done"):
                        yield {"type": "done"}
                        return

                yield {"type": "error", "message": "Ollama ended the response before completing the analysis."}
    except httpx.HTTPStatusError as exc:
        detail = "Ollama could not analyze the trade."
        try:
            body = exc.response.json()
            if isinstance(body, dict):
                detail = body.get("error", detail)
        except ValueError:
            pass
        yield {"type": "error", "message": detail}
    except httpx.RequestError:
        yield {"type": "error", "message": "Could not reach Ollama. Make sure Ollama is running."}
    except (ValueError, TypeError):
        yield {"type": "error", "message": "Ollama returned an invalid streaming response."}
