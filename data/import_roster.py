import argparse
import csv
import sqlite3
from pathlib import Path
from urllib.request import urlopen


DATABASE_PATH = Path(__file__).with_name("moneyball.db")
ROSTER_URL = "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv"
ROSTER_STATUSES = {"ACT", "DEV", "INA", "RES"}
TEAM_ALIASES = {"LA": "LAR"}


def read_roster(source):
    if source:
        with open(source, newline="", encoding="utf-8-sig") as file:
            return list(csv.DictReader(file))

    with urlopen(ROSTER_URL, timeout=30) as response:
        return list(csv.DictReader(line.decode("utf-8-sig") for line in response))


def import_roster(rows, db_path=DATABASE_PATH):
    players = {}
    for row in rows:
        if row["status"] not in ROSTER_STATUSES or not row["gsis_id"]:
            continue
        team = TEAM_ALIASES.get(row["team"], row["team"])
        if not team or not row["full_name"] or not row["position"]:
            continue
        players[row["gsis_id"]] = (row["gsis_id"], row["full_name"], row["position"], team)

    if not players:
        raise ValueError("The roster contains no selectable players.")

    with sqlite3.connect(db_path) as connection:
        connection.executemany(
            """
            INSERT INTO players (player_id, name, position, team)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(player_id) DO UPDATE SET
                name=excluded.name, position=excluded.position, team=excluded.team
            """,
            players.values(),
        )
    return len(players)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import the 2026 nflverse roster into moneyball.db")
    parser.add_argument("--file", type=Path, help="Use a local roster CSV instead of downloading it")
    args = parser.parse_args()
    print(f"Imported {import_roster(read_roster(args.file))} players into {DATABASE_PATH}")
