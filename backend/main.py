import json

from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from schemas import TradeRequest
from prompt import build_trade_prompt
from ollama import stream_trade

app = FastAPI(title="NFL GM Simulator API")


@app.get("/")
def home():
    return {"message": "NFL GM Simulator backend is running"}


@app.post("/api/trade")
async def trade(request: TradeRequest):
    prompt = build_trade_prompt(request)

    async def events():
        async for event in stream_trade(prompt):
            yield json.dumps(event) + "\n"

    return StreamingResponse(
        events(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
