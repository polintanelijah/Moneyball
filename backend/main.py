from fastapi import FastAPI, HTTPException
import httpx

from schemas import TradeRequest
from prompt import build_trade_prompt
from ollama import analyze_trade

app = FastAPI(title="NFL GM Simulator API")


@app.get("/")
def home():
    return {"message": "NFL GM Simulator backend is running"}


@app.post("/api/trade")
async def trade(request: TradeRequest):
    prompt = build_trade_prompt(request)

    try:
        analysis = await analyze_trade(prompt)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not reach Ollama. Make sure Ollama is running.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        detail = "Ollama could not analyze the trade."
        try:
            detail = exc.response.json().get("error", detail)
        except ValueError:
            pass
        raise HTTPException(status_code=502, detail=detail) from exc

    return {"analysis": analysis}
