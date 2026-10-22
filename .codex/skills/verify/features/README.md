# Moneyball verification map

This map is the maintained source for the current user-facing web app. Run `node .codex/skills/verify/scripts/verify.mjs all` from the repo root and inspect every result in its timestamped `artifacts/verify/` directory.

## Baseline

- Vite runs at `http://127.0.0.1:5173`, the managed API at `http://127.0.0.1:8000`, and Ollama serves `llama3.2:1b` at `http://127.0.0.1:11434`.
- Only the helper's temporary Chrome profile is driven. Refuse occupied app ports so another session is never shared.
- Roster and cap values are frontend mock data; the SQLite player and contract tables are not involved.
- A passing browser run requires all four journeys below and no browser exceptions or console errors.

## Features

- [Choose teams](team-selection.md): team selectors, roster availability, and disabled analysis state.
- [Edit trade and view cap](trade-assets-and-cap.md): add and remove players on both sides and verify projected cap changes.
- [Analyze trade](trade-analysis.md): submit through the real API, see streamed output, and finish with a live Ollama verdict.
- [Handle analysis failure](failure-state.md): see a useful error when the API cannot reach Ollama.

Each feature file describes its user entry point, exact controls, proof screenshot, and current limitations. Do not report one feature as covered by another feature's screenshot.
