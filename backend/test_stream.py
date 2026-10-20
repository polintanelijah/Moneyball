import json
import unittest
from unittest.mock import patch

import httpx

import main
import ollama


class TradeStreamTests(unittest.IsolatedAsyncioTestCase):
    async def test_ollama_chunks_are_forwarded_before_completion(self):
        requests = []

        def respond(request):
            requests.append(request)
            return httpx.Response(
                200,
                content=(
                    b'{"message":{"content":"Hello"},"done":false}\n'
                    b'{"message":{"content":" world"},"done":false}\n'
                    b'{"done":true}\n'
                ),
            )

        client_type = httpx.AsyncClient
        transport = httpx.MockTransport(respond)
        with patch.object(ollama.httpx, "AsyncClient", side_effect=lambda **kwargs: client_type(transport=transport, **kwargs)):
            stream = ollama.stream_trade("Test prompt")
            self.assertEqual(await anext(stream), {"type": "delta", "content": "Hello"})
            self.assertEqual(await anext(stream), {"type": "delta", "content": " world"})
            self.assertEqual(await anext(stream), {"type": "done"})
            with self.assertRaises(StopAsyncIteration):
                await anext(stream)

        self.assertTrue(json.loads(requests[0].content)["stream"])

    async def test_ollama_http_error_becomes_stream_error(self):
        client_type = httpx.AsyncClient
        transport = httpx.MockTransport(lambda request: httpx.Response(404, json={"error": "model not found"}))
        with patch.object(ollama.httpx, "AsyncClient", side_effect=lambda **kwargs: client_type(transport=transport, **kwargs)):
            events = [event async for event in ollama.stream_trade("Test prompt")]
        self.assertEqual(events, [{"type": "error", "message": "model not found"}])

    async def test_trade_endpoint_returns_ndjson_events(self):
        async def fake_stream(prompt):
            self.assertIn("Detroit Lions", prompt)
            yield {"type": "delta", "content": "Accept"}
            yield {"type": "done"}

        request = {
            "teamA": {"id": "DET", "name": "Detroit Lions", "capSpace": 10000000},
            "teamB": {"id": "DEN", "name": "Denver Broncos", "capSpace": 8000000},
            "teamAPlayers": [{"id": "1", "name": "Player A", "team": "DET", "position": "WR", "capHit": 1000000}],
            "teamBPlayers": [],
        }
        with patch.object(main, "stream_trade", fake_stream):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://test") as client:
                response = await client.post("/api/trade", json=request)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.headers["content-type"].startswith("application/x-ndjson"))
        self.assertEqual(
            [json.loads(line) for line in response.text.splitlines()],
            [{"type": "delta", "content": "Accept"}, {"type": "done"}],
        )


if __name__ == "__main__":
    unittest.main()
