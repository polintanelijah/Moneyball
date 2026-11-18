from pydantic import BaseModel


class Team(BaseModel):
    id: str
    name: str
    capSpace: float | None


class Player(BaseModel):
    id: str
    name: str
    team: str
    position: str
    capHit: float | None


class TradeRequest(BaseModel):
    teamA: Team
    teamB: Team
    teamAPlayers: list[Player]
    teamBPlayers: list[Player]
