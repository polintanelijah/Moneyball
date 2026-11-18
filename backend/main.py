import json
import logging

from anyio import to_thread
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from schemas import TradeRequest
from prompt import build_trade_prompt
from ollama import stream_trade
from catalog import load_catalog
from contracts import find_contracts

app = FastAPI(title="NFL GM Simulator API")


@app.get("/")
def home():
    return {"message": "NFL GM Simulator backend is running"}


@app.get("/api/catalog")
def catalog():
    return load_catalog()


@app.post("/api/trade")
async def trade(request: TradeRequest):
    async def events():
        try:
            players = request.teamAPlayers + request.teamBPlayers
            contracts = await to_thread.run_sync(find_contracts, players)
        except Exception as exc:
            if not isinstance(exc, FileNotFoundError):
                logging.exception("Contract lookup failed")
            yield json.dumps({"type": "error", "message": f"Contract lookup failed: {exc}"}) + "\n"
            return

        prompt = build_trade_prompt(request, contracts)
        async for event in stream_trade(prompt):
            yield json.dumps(event) + "\n"

    return StreamingResponse(
        events(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
