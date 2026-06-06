import sqlite3

def check():
    conn = sqlite3.connect('local/owncast-data/owncast.db')
    cursor = conn.cursor()
    tables = [t[0] for t in cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
    print("Tables:", tables)
    for table in tables:
        if 'webhook' in table.lower():
            print(f"\n--- Table: {table} ---")
            try:
                rows = cursor.execute(f"SELECT * FROM {table};").fetchall()
                print("Rows:", rows)
            except Exception as e:
                print("Error:", e)

if __name__ == '__main__':
    check()
