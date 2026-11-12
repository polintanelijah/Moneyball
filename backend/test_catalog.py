import sqlite3
import tempfile
import unittest
from pathlib import Path

import httpx

from catalog import load_catalog
from main import app


class CatalogTests(unittest.IsolatedAsyncioTestCase):
    async def test_catalog_endpoint_exposes_all_rostered_teams_and_players(self):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/catalog")

        self.assertEqual(response.status_code, 200)
        catalog = response.json()
        self.assertEqual(len(catalog["teams"]), 32)
        self.assertGreater(len(catalog["players"]), 2000)
        self.assertEqual({player["team"] for player in catalog["players"]},
                         {team["id"] for team in catalog["teams"]})
        self.assertTrue(any(player["team"] == "LAR" for player in catalog["players"]))
        self.assertTrue(all(player["capHit"] is None for player in catalog["players"]))
        self.assertTrue(all(team["capSpace"] is None for team in catalog["teams"]))

    def test_only_current_year_contract_is_shown(self):
        with tempfile.TemporaryDirectory() as directory:
            db_path = Path(directory) / "catalog.db"
            with sqlite3.connect(db_path) as connection:
                connection.execute("CREATE TABLE players (player_id TEXT, name TEXT, position TEXT, team TEXT)")
                connection.execute("CREATE TABLE contracts (player_id TEXT, year INTEGER, cap_hit REAL)")
                connection.execute("INSERT INTO players VALUES ('42', 'Test Player', 'WR', 'DET')")
                connection.executemany("INSERT INTO contracts VALUES ('42', ?, ?)",
                                       [(2025, 1000000), (2026, 2000000)])

            self.assertEqual(load_catalog(db_path, 2026)["players"][0]["capHit"], 2000000)
            self.assertIsNone(load_catalog(db_path, 2027)["players"][0]["capHit"])


if __name__ == "__main__":
    unittest.main()
