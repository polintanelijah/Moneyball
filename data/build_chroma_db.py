import sqlite3
import chromadb

def build_vector_store():
    db_path = './chroma_db'
    print(f"Initializing persistent ChromaDB client at {db_path}...")
    
    chroma_client = chromadb.PersistentClient(path=db_path)
    
    # Reset collection if it already exists
    try:
        chroma_client.delete_collection("player_financial_reality")
    except Exception:  # Catch any error if the collection doesn't exist yet
        pass
        
    collection = chroma_client.create_collection(name="player_financial_reality")
    
    print("Fetching active/recent contracts from SQLite...")
    conn = sqlite3.connect('moneyball.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT player, position, team, value, apy, guaranteed, year_signed
            FROM otc_contracts 
            WHERE year_signed >= 2022
            ORDER BY year_signed DESC
            LIMIT 1000
        """)
        
        rows = cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        
        documents = []
        metadatas = []
        ids = []
        
        for i, row in enumerate(rows):
            data = dict(zip(columns, row))
            player_name = str(data.get('player') or f"Unknown_{i}")
            team = str(data.get('team') or "FA")
            pos = str(data.get('position') or "N/A")
            val = float(data.get('value') or 0)
            apy = float(data.get('apy') or 0)
            guar = float(data.get('guaranteed') or 0)
            year = data.get('year_signed') or "N/A"
            
            chunk = (
                f"Player: {player_name}. Position: {pos}. Team: {team}. Signed: {year}. "
                f"Contract Reality: Total value of ${val:,.0f} with an APY of ${apy:,.0f} "
                f"and ${guar:,.0f} total guaranteed money."
            )
            
            documents.append(chunk)
            metadatas.append({
                "player": player_name,
                "team": team,
                "position": pos,
                "apy": apy
            })
            ids.append(f"contract_{i}_{player_name.replace(' ', '_')}")
            
        print(f"Embedding and indexing {len(documents)} player chunks into ChromaDB...")
        
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        print("Vector store build complete! ./chroma_db is populated.")
        
    except Exception as e:
        print(f"Error building ChromaDB: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    build_vector_store()