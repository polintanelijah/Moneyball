import io
import pandas as pd
import requests

def spotrac_spike():
    url = 'https://www.spotrac.com/nfl/kansas-city-chiefs/cap/'
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        print(f"Executing spike on {url}...\n")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        html_data = io.StringIO(response.text)
        tables = pd.read_html(html_data)
        
        # Table 0 is the primary active roster
        df = tables[0]
        
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(-1)
            
        # Normalize whitespace in column names
        df.columns = df.columns.str.replace(r'\s+', ' ', regex=True).str.strip()
        
        # Dynamically find the Player column (e.g., 'Player (53)')
        player_col = [c for c in df.columns if 'Player' in c][0]
        
        # Select target columns
        target_cols = [player_col, 'Pos', 'Base P5 Salary', 'Cap Hit', 'Dead Cap']
        spike_df = df[target_cols].dropna(subset=[player_col]).head(5).copy()
        
        # Rename columns to match SQLite schema conventions
        spike_df = spike_df.rename(columns={
            player_col: 'Player',
            'Base P5 Salary': 'Base Salary'
        })
        
        # Clean player names (strip numbers/ranks that might be attached)
        spike_df['Player'] = spike_df['Player'].str.split('\n').str[0].str.strip()
        
        print("Spike successful. Financial data ready for SQLite insertion:")
        print(spike_df.to_string(index=False))
        
    except Exception as e:
        print(f"Spike failed: {e}")

if __name__ == "__main__":
    spotrac_spike()