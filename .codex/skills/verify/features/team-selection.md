# Choose teams

Users select two NFL franchises and see the players available to trade for each side.

## Sub-features

- `teams-empty`: the empty form renders and Analyze is disabled.
- `teams-select`: all 32 franchises appear; Detroit, Denver, and Seattle can be selected.
- `teams-rosters`: each chosen team reveals its player selector.
- `teams-no-assets`: Analyze remains disabled until a player is added.

## How to get to it (user POV)

Open the simulator, click **Get Started!**, and use the two **Select Franchise** dropdowns under Team A and Team B.

## Driving it with Chrome CDP

Preconditions: the helper launched the app and doctor confirms both servers and Ollama.

- Run `node .codex/skills/verify/scripts/verify.mjs all`.
- The driver captures `01-empty.png`, checks 32 choices, then selects Detroit in `#team-a-team` and Denver in `#team-b-team` through browser select events.
- It checks the player dropdowns `#team-a-player` and `#team-b-player` exist and Analyze remains disabled; `02-teams.png` proves the result.

## Gotchas

- The driver checks that both selected teams have more than 40 player options. The API test checks that all 32 teams have players.
- A responsive API root alone does not prove Ollama is usable; doctor checks the installed model.
