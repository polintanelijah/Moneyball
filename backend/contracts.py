import os
from pathlib import Path


STORE_PATH = Path(os.getenv("CONTRACT_STORE_PATH", Path(__file__).resolve().parent.parent / "data" / "chroma_db"))
COLLECTION_NAME = "player_financial_reality"


def find_contracts(players, store_path=STORE_PATH):
    import chromadb

    if not Path(store_path).exists():
        raise FileNotFoundError(f"Contract vector store is missing at {store_path}")

    collection = chromadb.PersistentClient(path=str(store_path)).get_collection(COLLECTION_NAME)
    contracts = []
    for player in players:
        query = f"Contract for {player.name} ({player.position})"
        for field, value in (("gsis_id", player.id), ("player", player.name)):
            result = collection.query(
                query_texts=[query], where={field: value}, n_results=1,
                include=["documents"],
            )
            documents = result["documents"][0]
            if documents:
                contracts.append(documents[0])
                break
        else:
            contracts.append(f"No matching contract record for {player.name} ({player.position}).")
    return contracts
