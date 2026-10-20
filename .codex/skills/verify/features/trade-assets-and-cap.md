# Edit trade and view cap

Users add players on either side, see immediate cap changes, and remove assets before submitting.

## Sub-features

- `trade-add-a`: send Amon-Ra St. Brown from Detroit.
- `trade-add-b`: send Patrick Surtain II from Denver.
- `trade-cap`: both projected cap figures update after each addition.
- `trade-remove`: removing a player updates both sides again.
- `trade-enabled`: Analyze becomes available once an asset is present.

## How to get to it (user POV)

Select Detroit and Denver, then choose players from **Add Player to Trade**. Use the remove button beside a selected player to revise the trade.

## Driving it with Chrome CDP

Preconditions: both teams are selected in the verification-owned Chrome page.

- Run `node .codex/skills/verify/scripts/verify.mjs all`.
- The driver chooses the first player in each team selector through browser select events. It checks Detroit's projected cap at `$23.26M` after sending Amon-Ra, then `$16.55M` after receiving Surtain; Denver moves to `$0.34M`, then `$7.05M`. See `03-player-a.png` and `04-two-sided-trade.png`.
- It clicks `Remove Amon-Ra St. Brown from Team A`, verifies Detroit `$11.69M` and Denver `$11.91M`, and captures `05-removed-player.png`.

## Gotchas

- These figures come from hard-coded mock cap hits. They do not include dead money, retained bonuses, or real-time salary cap data.
- The player dropdown resets to its blank option after an addition; confirm the selected-player card and cap figures, not the dropdown value.
