---
name: verify
description: Drive the Moneyball NFL GM Simulator web UI and FastAPI/Ollama trade flow, check every current user feature, and retain screenshot evidence. Use after UI, API, roster, cap display, or streaming changes, or when asked to prove the app works.
---

# Verify the NFL GM Simulator

Read [features/README.md](features/README.md) and its four feature recipes before claiming full coverage. This app currently uses four mock teams and nine mock players. The displayed cap calculation uses cap hits only; this skill proves the current UI behavior, not real contracts or dead-money accounting.

## Launch

From the repository root, ensure `node_modules` exists (`npm ci` if absent) and `backend/.venv/bin/uvicorn` exists (`python3 -m venv backend/.venv` and `backend/.venv/bin/pip install -r backend/requirements.txt` if absent). Start Ollama and install `llama3.2:1b` if needed. The SQLite file is not used by this UI path, so no database seed is required.

Run `node .codex/skills/verify/scripts/verify.mjs all`. The helper starts the FastAPI backend on `127.0.0.1:8000`, Vite on `127.0.0.1:5173`, and a temporary headless Google Chrome profile. It waits for both servers and the installed Ollama model before driving anything. It refuses to run when either app port is already occupied; do not take over an existing session.

## Doctor

When startup or a browser action looks wrong, run `node .codex/skills/verify/scripts/verify.mjs doctor` while the helper is running. This read-only check confirms the Ollama model, the app's API identity, and the Vite page. The full run also checks that the server processes it started remain alive and records their PIDs in `report.json`.

## Drive

The helper uses Chrome DevTools Protocol to operate the visible form controls `#team-a-team`, `#team-b-team`, `#team-a-player`, `#team-b-player`, the remove button's accessible name, and `#analyze-trade`. Native select events choose dropdown options; mouse input clicks buttons. It does not call React state setters or test-only endpoints. It covers team choice, player addition/removal, displayed cap changes, live Ollama generation, and a visible Ollama connection failure. Run `npm test`, `backend/.venv/bin/python -m unittest discover -s backend -p 'test_*.py' -q`, `npm run lint`, and `npm run build` as code checks alongside the browser run.

## Evidence

The helper creates `artifacts/verify/<timestamp>/report.json`, ordered PNG screenshots, and separate backend, Vite, and Chrome logs. The images show the action sequence from empty form through team/player choices, cap recalculation, streaming, completed verdict, and error state. `report.json` records the observed checks, browser errors, API response statuses, and the live verdict text. Inspect screenshots and logs before reporting success. Compare the live verdict with the selected players' names, positions, sending/receiving teams, and displayed cap figures; record any contradiction in a review file beside the report and do not call the analysis feature verified if one appears. A `pass` report means the automated interaction checks completed, not that model prose is factually sound. It does not prove unused SQLite contracts, dead money, or RAG features. If an expected precondition fails, report the failed journey and cause rather than substituting a mocked success.

The live verdict must use the installed Ollama model. The error-state journey redirects only the verification-owned backend to an unreachable Ollama URL after the live verdict, exercising the production error boundary. Keep the screenshots and report after cleanup.

## Cleanup

The helper stops only the backend, Vite, and Chrome processes it started and removes only its temporary Chrome profile in `finally`. It does not stop the user's Ollama service. On a failed run, confirm the helper finished cleanup before retrying; use the PIDs in the run report and logs to identify any orphan. Never kill by process name or delete the evidence directory.

## Helpers

`scripts/verify.mjs` is the executable driver. Invoke it exactly as shown above with `all` for proof or `doctor` for a read-only health check. It requires Node 20+ and the installed Google Chrome application at `/Applications/Google Chrome.app`.
