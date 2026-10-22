from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from ollama import analyze_trade_stream
from schemas import TradeRequest
from prompt import build_trade_prompt
from ollama import analyze_trade

app = FastAPI()


@app.get("/")
def home():
    return {"message": "NFL GM Simulator backend is running"}


@app.post("/trade")
async def trade(request: TradeRequest):

    prompt = build_trade_prompt(request)

    return StreamingResponse(
    analyze_trade_stream(prompt),
    media_type="text/plain"
)