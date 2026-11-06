# FastAPI + Ollama backend

This is a small local API that sends trade data from the React frontend to
Ollama. It uses `llama3.1:8b` by default, which is a model suitable
for an 16 GB Dell.

## One-time setup

1. Download and install Ollama from <https://ollama.com/>.
2. Download the model:

   ```bash
   ollama pull llama3.1:8b
   ```

3. From the `backend` directory, create an environment and install packages:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

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

Open the URL shown by Vite, choose two teams and at least one player, then click
**Analyze Trade Viability**.