# NFL GM Simulator (Team Moneyball)

This repository contains the CSE 5914 Capstone project for Team Moneyball. The codebase is structured as a monorepo to separate engineering tasks across three distinct functional layers: Frontend (React), Backend (FastAPI + Ollama), and Data (Python/SQLite).

*Note: As of Timebox 3, the data layer has been upgraded from mock data to real historical NFL contracts, integrated with a persistent ChromaDB vector store for LLM RAG.*

---

## Project Architecture

- **`frontend/`**: React + Vite application handling the presentation layer, trade ledger, and user interface.
- **`backend/`**: FastAPI + LlamaIndex orchestration layer managing local Ollama LLM requests, cap math, and trade logic. (See `backend/readme.md` for setup and run instructions).
- **`data/`**: Python ETL pipeline for extracting, transforming, and loading NFL contract and performance data into SQLite and ChromaDB.

---

## Data Team Workflow 

All database generation and embedding scripts live in the `data/` directory. To run these scripts without conflicting with global system packages, you must use an isolated Python virtual environment.

### 1. Environment Setup
Navigate to the data directory and initialize the virtual environment:
```bash
cd data
python3 -m venv venv
source venv/bin/activate