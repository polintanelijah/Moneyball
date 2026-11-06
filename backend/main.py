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

"""
# Set up scoring system to help determine trade viability
POSITION_MULTS = {
    "QB": 2.2,
    "EDGE": 1.4,
    "WR": 1.35,
    "OT": 1.3,
    "LT": 1.3,
    "RT": 1.3,
    "OG": 1.3,
    "LG": 1.3,
    "RG": 1.3,
    "C": 1.3,
    "CB": 1.25,
    "DT": 1.1,
    "S": 1.0,
    "FB": 0.5,
    "RB": 1.2,
    "K": 0.4,
    "P": 0.3
}

def calc_value(players): # Calculate weighted value of players
    total = 0
    for p in players:
        mult = POSITION_MULTS.get(p.position, 1.0)
        capWorth = p.capHit / 1000000 # Convert cap hit to millions of dollars
        total += capWorth * mult # Increasing total value
    return total # Return total value calculated


def eval_trade(request): # Evaluate trade based on weighted values of players for each team
    teamAVal = calc_value(request.teamAPlayers) # Weighted value of team a players
    teamBVal = calc_value(request.teamBPlayers) # Weighted value of team b players

    if teamAVal > 0 and teamBVal == 0: # Unfair trade, someone is giving up nothing
        return "Rejected", f"{request.teamB.name} is giving up zero assets in return."
    if teamBVal > 0 and teamAVal == 0: # Unfair trade, someone is giving up nothing
        return "REJECTED", f"{request.teamA.name} is giving up zero assets in return."

    ratio = max(teamAVal, teamBVal) / min(teamAVal, teamBVal) # Calculate trade ratio

    if ratio > 1.5: # If trade is unfair, reject
        return "REJECTED", "The trade assets are too lopsided in positional value and financial scope, and the trade is thus unfair."

    return "ACCEPTED", "The trade assets are reasonably balanced in positional value and financial scope." # Else, the trade is accepted

"""



@app.post("/trade")
async def trade(request: TradeRequest):
    
    """print("\n" + "=" * 50)
    print("DEBUG: RECEIVED TRADE REQUEST DATA")
    print(f"Team A ({request.teamA.name}): {[p.name for p in request.teamAPlayers]}")
    print(f"Team B ({request.teamB.name}): {[p.name for p in request.teamBPlayers]}")
    print("=" * 50)"""

    #verdict, reason = eval_trade(request)
    
    prompt = build_trade_prompt(request)

    """print("DEBUG: PROMPT SENT TO OLLAMA:")
    print(prompt)
    print("=" * 50 + "\n")"""
   

    return StreamingResponse(
    analyze_trade_stream(prompt),
    media_type="text/plain"
)