# Moneyball verification map

This map is the maintained source for the current user-facing web app. Run `node .codex/skills/verify/scripts/verify.mjs all` from the repo root and inspect every result in its timestamped `artifacts/verify/` directory.

## Baseline

- Vite runs at `http://127.0.0.1:5173`, the managed API at `http://127.0.0.1:8000`, and Ollama serves `llama3.2:1b` at `http://127.0.0.1:11434`.
- Only the helper's temporary Chrome profile is driven. Refuse occupied app ports so another session is never shared.
- The UI loads the 2026 roster from SQLite through `GET /api/catalog`. The contract table is empty, so cap figures are unavailable.
- `catalog` mode checks the team and trade asset journeys without Ollama. `all` mode checks all four journeys and requires Ollama.

## Features

- [Choose teams](team-selection.md): team selectors, roster availability, and disabled analysis state.
- [Edit trade and view cap](trade-assets-and-cap.md): add and remove players on both sides and verify missing cap data is visible.
- [Analyze trade](trade-analysis.md): submit through the real API, see streamed output, and finish with a live Ollama verdict.
- [Handle analysis failure](failure-state.md): see a useful error when the API cannot reach Ollama.

Each feature file describes its user entry point, exact controls, proof screenshot, and current limitations. Do not report one feature as covered by another feature's screenshot.
