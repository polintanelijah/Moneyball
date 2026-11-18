# NFL GM Simulator

The React frontend loads teams and players through the FastAPI backend, then
sends a proposed trade to a local Ollama model for analysis. The checked-in
SQLite database contains a 2026 NFL roster snapshot. Salary cap data is not
included, so the app marks cap figures as unavailable instead of estimating them.

The roster came from [nflverse's 2026 season roster CSV](https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv),
retrieved November 10, 2026. It includes active, reserve, inactive, and practice
squad players, and excludes players marked cut, retired, or traded. nflverse data
is [licensed CC BY 4.0](https://github.com/nflverse/nflverse-data). To import
new roster rows, run `python3 data/import_roster.py` from the project root. The script
also accepts `--file path/to/roster.csv` for a local copy.

See [backend/readme.md](backend/readme.md) for setup and run instructions.
