# Edit trade and view cap

Users add players on either side, see whether cap figures are available, and remove assets before submitting.

## Sub-features

- `trade-add-a`: send a player from Detroit.
- `trade-add-b`: send a player from Denver.
- `trade-cap`: both projected cap figures say unavailable while cap data is missing.
- `trade-remove`: removing a player updates both sides again.
- `trade-enabled`: Analyze becomes available once an asset is present.

## How to get to it (user POV)

Select Detroit and Denver, then choose players from **Add Player to Trade**. Use the remove button beside a selected player to revise the trade.

## Driving it with Chrome CDP

Preconditions: both teams are selected in the verification-owned Chrome page.

- Run `node .codex/skills/verify/scripts/verify.mjs all`.
- The driver chooses the first player in each team selector through browser select events. It checks both projected cap figures say `Unavailable`. See `03-player-a.png` and `04-two-sided-trade.png`.
- It removes the Detroit player, checks the asset disappears, and captures `05-removed-player.png`. It then switches Team A to Seattle and checks the roster changes.

## Gotchas

- The database has no contract rows or team cap space figures. The UI must not display invented dollar amounts.
- The player dropdown resets to its blank option after an addition; confirm the selected-player card and cap figures, not the dropdown value.
