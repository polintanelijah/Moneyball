# Choose teams

Users select two NFL franchises and see the players available to trade for each side.

## Sub-features

- `teams-empty`: the empty form renders and Analyze is disabled.
- `teams-select`: Detroit and Denver can be selected independently.
- `teams-rosters`: each chosen team reveals its player selector.
- `teams-no-assets`: Analyze remains disabled until a player is added.

## How to get to it (user POV)

Open the simulator and use the two **Select Franchise** dropdowns under Team A and Team B.

## Driving it with Chrome CDP

Preconditions: the helper launched the app and doctor confirms both servers and Ollama.

- Run `node .codex/skills/verify/scripts/verify.mjs all`.
- The driver captures `01-empty.png`, then selects Detroit in `#team-a-team` and Denver in `#team-b-team` through browser select events.
- It checks the player dropdowns `#team-a-player` and `#team-b-player` exist and Analyze remains disabled; `02-teams.png` proves the result.

## Gotchas

- The interface offers only four mock franchises. This journey does not prove a complete NFL roster.
- A responsive API root alone does not prove Ollama is usable; doctor checks the installed model.
