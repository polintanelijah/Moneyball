# Analyze trade

Users submit their selected trade and watch the model's verdict arrive incrementally.

## Sub-features

- `analysis-submit`: clicking Analyze sends a trade request through the frontend proxy.
- `analysis-stream`: the panel enters Streaming while Ollama generates text.
- `analysis-complete`: the panel reaches Complete with a substantive rendered verdict.
- `analysis-no-console-errors`: the browser records no JavaScript exceptions or console errors.

## How to get to it (user POV)

Select Detroit and Denver, add at least one player, then choose **Analyze Trade Viability**.

## Driving it with Chrome CDP

Preconditions: Ollama serves `llama3.2:1b`; the verification-owned API and UI are healthy.

- Run `node .codex/skills/verify/scripts/verify.mjs all`.
- The driver clicks `#analyze-trade`, captures `06-streaming.png`, waits for `#verdict-status` to read `Complete`, and captures `07-complete.png`.
- It records the `/api/trade` HTTP response and rendered verdict in `report.json`. Compare the prose to the WR-for-CB swap and the displayed numbers; report false positions, trade directions, or cap claims as a feature failure. The backend and Chrome logs remain beside the screenshots.

## Gotchas

- Local model generation can take over a minute. Wait for the status, not a fixed delay.
- A passing response proves the live Ollama path, but the underlying player/cap numbers remain mock data.
- If a live model fails, report that failure. Do not replace it with a stubbed verdict.
