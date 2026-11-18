# FastAPI + Ollama backend

This is a small local API that sends trade data from the React frontend to
Ollama. It uses `llama3.2:1b` by default. Set `OLLAMA_MODEL` to use another installed model.

`POST /api/trade` streams newline-delimited JSON events (`application/x-ndjson`).
Each `delta` event contains a `content` fragment; the stream ends with a `done`
event or an `error` event with a `message`. The frontend displays fragments as
they arrive and keeps partial text visible if an error occurs.

`GET /api/catalog` returns all 32 franchises and the players in
`data/moneyball.db`. Player cap hits appear only when the `contracts` table has
a row for the current calendar year. The database currently has no contract or
team cap space figures, so those values return as `null`.

Trade analysis also reads active contract terms from a local Chroma collection.
The source is the [nflverse contracts release](https://github.com/nflverse/nflverse-data/releases/tag/contracts),
which reports total value, APY, and guarantees in millions of dollars. These
figures are distinct from a player's current-year cap hit. A missing player match
leaves those terms unknown. If the store is absent, `/api/trade` returns an NDJSON
`error` event instead of an ungrounded analysis.

## One-time setup

1. Download and install Ollama from <https://ollama.com/>.
2. Download the model:

   ```bash
   ollama pull llama3.2:1b
   ```

3. From the `backend` directory, create an environment and install packages:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. From the project root, install the one-time data dependency and build the
   contract index. This downloads the nflverse Parquet release and Chroma's
   default embedding model on the first run:

   ```bash
   backend/.venv/bin/pip install -r data/requirements.txt
   backend/.venv/bin/python -m data.build_chroma_db
   ```

   For a downloaded release, pass `--source path/to/historical_contracts.parquet`.
   The index is stored in `data/chroma_db` and can be rebuilt with the same command.
   Set `CONTRACT_STORE_PATH` for a different directory.

## Run

Keep Ollama running, then start the API from the `backend` directory:

```bash
source .venv/bin/activate
uvicorn main:app --reload
```

In a second terminal, start the frontend from the project root:

```bash
npm install
npm run dev
```

Open the URL shown by Vite, click **Get Started!**, choose two teams and at least one player, then click
**Analyze Trade Viability**.
