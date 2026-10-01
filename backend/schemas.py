from pydantic import BaseModel


class Team(BaseModel):
    id: str
    name: str
    capSpace: int


class Player(BaseModel):
    id: str
    name: str
    team: str
    position: str
    capHit: int


class TradeRequest(BaseModel):
    teamA: Team
    teamB: Team
    teamAPlayers: list[Player]
    teamBPlayers: list[Player]
