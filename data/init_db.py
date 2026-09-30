import sqlite3

def setup_database():
    conn = sqlite3.connect('moneyball.db')
    cursor = conn.cursor()
    
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS players (
            player_id TEXT PRIMARY KEY,
            name TEXT,
            position TEXT,
            team TEXT
        );
        
        CREATE TABLE IF NOT EXISTS contracts (
            player_id TEXT,
            year INTEGER,
            base_salary REAL,
            cap_hit REAL,
            dead_money REAL,
            contract_length INTEGER,
            FOREIGN KEY(player_id) REFERENCES players(player_id)
        );
        
        CREATE TABLE IF NOT EXISTS picks (
            pick_id TEXT PRIMARY KEY,
            team TEXT,
            year INTEGER,
            round INTEGER,
            pick_number INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS draft_charts (
            pick_number INTEGER PRIMARY KEY,
            jimmy_johnson_value REAL,
            rich_hill_value REAL,
            fitz_spiel_value REAL
        );
    ''')
    conn.commit()
    conn.close()
    print("Database schema successfully generated.")

if __name__ == "__main__":
    setup_database()