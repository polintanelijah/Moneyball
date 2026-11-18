# Live verdict review

The browser driver completed all interactions, but the generated trade analysis fails factual review.

- The selected trade sends Aamaris Brown (DB) from Detroit to Denver and Adam Prentice (RB) from Denver to Detroit. The UI shows both cap hits as unavailable in `04-two-sided-trade.png`.
- The contract store returns APY of $0.25 million for Brown and $1.22 million for Prentice. In `report.json` and `07-complete.png`, the verdict calls those same values immediate cap hits. APY does not establish a current-year cap hit.
- The verdict says Brown's skills benefit Detroit and Prentice boosts Denver's offense, although those teams are sending the players away.

The stream and UI completed without browser exceptions. The model output is not reliable for this trade, so the live analysis feature does not pass semantic verification.
