import pandas as pd
import json
import os
import io

def scrape_and_cache_pfr():
    # Point to the local HTML file you just saved
    local_html_path = 'pfr_fantasy_2023.html'
    
    if not os.path.exists(local_html_path):
        print(f"Error: {local_html_path} not found. Please save the webpage to your data folder.")
        return

    try:
        print("Reading local PFR HTML file...")
        
        # Open and read the local HTML file
        with open(local_html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        # Wrap the raw HTML text in StringIO for pandas 2.0+ compatibility
        html_data = io.StringIO(html_content)
        tables = pd.read_html(html_data)
        
        df = tables[0]
        
        # Flatten multi-level headers
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(-1)
            
        # Drop redundant header rows
        df = df[df['Player'] != 'Player'].copy()
        top_100 = df.head(100).copy()
        
        # Clean player names (removing pro-bowl asterisks)
        top_100['Player'] = top_100['Player'].str.replace(r'[*+]+$', '', regex=True)
        
        # Select the target columns
        player_records = top_100[['Player', 'Tm', 'FantPos', 'Age', 'G']].to_dict(orient='records')
        
        # Save to the frontend public folder
        output_path = '../frontend/public/pfr_top_100_cache.json'
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(player_records, f, indent=4)
            
        print(f"Successfully cached 100 players to {os.path.abspath(output_path)}")
        
    except Exception as e:
        print(f"Parsing failed: {e}")

if __name__ == "__main__":
    scrape_and_cache_pfr()