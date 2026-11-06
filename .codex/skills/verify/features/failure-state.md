# Handle analysis failure

Users receive a visible explanation when the analysis service cannot reach Ollama.

## Sub-features

- `failure-submit`: the same Analyze button starts a new attempt.
- `failure-visible`: the verdict status becomes Error.
- `failure-message`: the panel explains that Ollama is unreachable.

## How to get to it (user POV)

With a trade selected, choose **Analyze Trade Viability** while the backend's model connection is unavailable.

## Driving it with Chrome CDP

Preconditions: the live verdict journey has completed, and the helper owns the backend process.

- Run `node .codex/skills/verify/scripts/verify.mjs all`.
- After the live verdict, the helper restarts only its own backend with `OLLAMA_URL=http://127.0.0.1:1`, then clicks `#analyze-trade` again.
- The driver checks `#verdict-status` reads `Error`, confirms the message says Ollama could not be reached, and captures `08-error.png`.

## Gotchas

- The intentionally unreachable model URL is a controlled failure at the existing Ollama boundary. It does not stop or modify the user's Ollama service.
- An expected backend connection error is not a browser JavaScript exception. Any browser exception or console error still fails the verification run.
