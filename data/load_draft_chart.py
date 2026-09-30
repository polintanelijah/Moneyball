import pandas as pd
import sqlite3

def load_draft_chart():
    # URL to the open-source nflverse draft values dataset
    url = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/draft_values.csv"
    
    try:
        print("Fetching draft pick valuation charts from nflverse...")
        df = pd.read_csv(url)
        
        # The dataset contains multiple charts; select the ones needed for the GM Simulator
        df = df[['pick', 'johnson', 'hill', 'otc']].copy()
        
        # Rename columns to match your init_db.py SQLite schema
        df = df.rename(columns={
            'pick': 'pick_number',
            'johnson': 'jimmy_johnson_value',
            'hill': 'rich_hill_value',
            'otc': 'fitz_spiel_value'
        })
        
        # Drop rows missing a pick number to maintain database integrity
        df = df.dropna(subset=['pick_number'])
        
        conn = sqlite3.connect('moneyball.db')
        cursor = conn.cursor()
        
        # Clear existing data in case the script is run multiple times
        cursor.execute("DELETE FROM draft_charts")
        
        # Append the cleaned DataFrame into the existing schema
        df.to_sql('draft_charts', conn, if_exists='append', index=False)
        conn.commit()
        conn.close()
        
        print(f"Successfully loaded {len(df)} draft pick valuations into SQLite.")
        
    except Exception as e:
        print(f"Failed to load draft charts: {e}")

if __name__ == "__main__":
    load_draft_chart()