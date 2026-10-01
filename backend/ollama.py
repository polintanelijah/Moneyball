import httpx


async def analyze_trade(prompt):

    payload = {
        "model": "llama3.2",
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

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            "http://localhost:11434/api/chat",
            json=payload
        )

        data = response.json()

        return data["message"]["content"]
