import pandas as pd
import sqlite3

def load_all_active_contracts():
    print("Fetching real full NFL contract database directly via Pandas (Parquet format)...")
    
    # The correct nflverse contracts release URL using the historical_contracts.parquet file
    url = "https://github.com/nflverse/nflverse-data/releases/download/contracts/historical_contracts.parquet"
    
    try:
        # Load the binary Parquet file directly into a pandas DataFrame over the network
        df = pd.read_parquet(url)
        
        # Connect to the local SQLite database
        conn = sqlite3.connect('moneyball.db')
        
        # Write the entire dataset into the 'otc_contracts' table
        df.to_sql('otc_contracts', conn, if_exists='replace', index=False)
        
        conn.commit()
        conn.close()
        
        print(f"Successfully loaded {len(df)} real contract records into SQLite.")
        
    except Exception as e:
        print(f"Failed to load full contract database: {e}")

if __name__ == "__main__":
    load_all_active_contracts()