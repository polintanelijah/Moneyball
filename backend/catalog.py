import sqlite3
from datetime import date
from pathlib import Path


DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "moneyball.db"

TEAM_NAMES = {
    "ARI": "Arizona Cardinals", "ATL": "Atlanta Falcons", "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills", "CAR": "Carolina Panthers", "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos", "DET": "Detroit Lions", "GB": "Green Bay Packers",
    "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs", "LAC": "Los Angeles Chargers", "LAR": "Los Angeles Rams",
    "LV": "Las Vegas Raiders", "MIA": "Miami Dolphins", "MIN": "Minnesota Vikings",
    "NE": "New England Patriots", "NO": "New Orleans Saints", "NYG": "New York Giants",
    "NYJ": "New York Jets", "PHI": "Philadelphia Eagles", "PIT": "Pittsburgh Steelers",
    "SEA": "Seattle Seahawks", "SF": "San Francisco 49ers", "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans", "WAS": "Washington Commanders",
}


def load_catalog(db_path=DATABASE_PATH, year=None):
    year = year or date.today().year
    with sqlite3.connect(f"file:{Path(db_path).resolve()}?mode=ro", uri=True) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT p.player_id, p.name, p.position, p.team, c.cap_hit
            FROM players AS p
            LEFT JOIN contracts AS c ON c.rowid = (
                SELECT rowid FROM contracts
                WHERE player_id = p.player_id AND year = ?
                ORDER BY rowid DESC LIMIT 1
            )
            ORDER BY p.name, p.player_id
            """,
            (year,),
        ).fetchall()

    players = [
        {
            "id": row["player_id"],
            "name": row["name"],
            "team": row["team"],
            "position": row["position"],
            "capHit": row["cap_hit"],
        }
        for row in rows
        if row["team"] in TEAM_NAMES
    ]
    teams = [
        {"id": code, "name": name, "capSpace": None}
        for code, name in sorted(TEAM_NAMES.items(), key=lambda item: item[1])
    ]
    return {"teams": teams, "players": players}
