import os
import json
import httpx

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434"
).rstrip("/")


async def analyze_trade(payload):

    # Convert the incoming data into a valid Ollama request
    if isinstance(payload, dict) and "model" in payload and "messages" in payload:
        request_payload = {
            **payload,
            "stream": False
        }
    else:
        prompt = (
            payload
            if isinstance(payload, str)
            else json.dumps(payload)
        )

        request_payload = {
            "model": "llama3.2:1b",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert NFL general manager. "
                        "Evaluate trades based on player value, "
                        "team needs, salary cap implications, "
                        "and fairness. Provide a detailed analysis "
                        "with a clear final recommendation."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "stream": False,
            "options": {
                "num_predict": 512
            }
        }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=request_payload
            )

            response.raise_for_status()
            data = response.json()

            return data["message"]["content"]

    except httpx.ConnectError as e:
        return f"Could not reach Ollama: {e}"

    except httpx.TimeoutException:
        return "Could not reach Ollama: Request timed out."

    except httpx.HTTPStatusError as e:
        print(
            f"Ollama error {e.response.status_code}: "
            f"{e.response.text}",
            flush=True
        )

        return (
            f"Error: Ollama returned HTTP "
            f"{e.response.status_code}: {e.response.text}"
        )
async def analyze_trade_stream(prompt):
    if isinstance(prompt, dict) and "messages" in prompt:
        payload = {
            **prompt,
            "model": prompt.get("model", "llama3.2:1b"),
            "stream": True
        }
    else:
        payload = {
            "model": "llama3.2:1b",
            "messages": [
                {
                    "role": "user",
                    "content": prompt if isinstance(prompt, str)
                               else json.dumps(prompt)
                }
            ],
            "stream": True
        }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json=payload
            ) as response:

                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    data = json.loads(line)

                    if data.get("error"):
                        yield f"Error: {data['error']}"
                        return

                    token = data.get("message", {}).get("content", "")

                    if token:
                        yield token

    except httpx.ConnectError as e:
        yield f"Could not reach Ollama: {e}"

    except httpx.TimeoutException:
        yield "Could not reach Ollama: Request timed out."

    except httpx.HTTPStatusError as e:
        yield f"Error: Ollama returned HTTP {e.response.status_code}"