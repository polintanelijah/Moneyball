import argparse
from pathlib import Path

import chromadb
import pandas as pd

from backend.contracts import COLLECTION_NAME, STORE_PATH


SOURCE = "https://github.com/nflverse/nflverse-data/releases/download/contracts/historical_contracts.parquet"


def contract_document(row):
    def amount(value):
        return f"${value:,.2f} million" if pd.notna(value) else "unknown"

    years = int(row.years)
    return (
        f"Player: {row.player}. Position: {row.position}. Signing team: {row.team}. "
        f"Signed: {int(row.year_signed)}. Contract length: {years} {'year' if years == 1 else 'years'}. "
        f"Total value: {amount(row.value)}. APY: {amount(row.apy)}. "
        f"Total guaranteed: {amount(row.guaranteed)}."
    )


def build_vector_store(source=SOURCE, store_path=STORE_PATH):
    frame = pd.read_parquet(source)
    required = {"player", "position", "team", "is_active", "year_signed", "years", "value", "apy", "guaranteed", "gsis_id"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Contract source is missing columns: {', '.join(sorted(missing))}")

    frame = frame.loc[frame["is_active"].eq(True) & frame["player"].notna() & frame["year_signed"].notna() & frame["years"].notna()]
    if frame.empty:
        raise ValueError("Contract source has no active contracts")

    Path(store_path).mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(store_path))
    try:
        client.delete_collection(COLLECTION_NAME)
    except chromadb.errors.NotFoundError:
        pass
    collection = client.create_collection(COLLECTION_NAME)

    documents, metadatas, ids = [], [], []
    for index, row in enumerate(frame.itertuples(index=False)):
        metadata = {"player": str(row.player), "year_signed": int(row.year_signed)}
        if pd.notna(row.gsis_id):
            metadata["gsis_id"] = str(row.gsis_id)
        documents.append(contract_document(row))
        metadatas.append(metadata)
        ids.append(f"contract_{index}")
        if len(ids) == 100:
            collection.add(ids=ids, documents=documents, metadatas=metadatas)
            documents, metadatas, ids = [], [], []

    if ids:
        collection.add(ids=ids, documents=documents, metadatas=metadatas)
    return collection.count()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the local contract vector store")
    parser.add_argument("--source", default=SOURCE, help="Contract Parquet file or URL")
    parser.add_argument("--store", type=Path, default=STORE_PATH, help="Chroma directory")
    args = parser.parse_args()
    print(f"Indexed {build_vector_store(args.source, args.store)} active contracts in {args.store}")
