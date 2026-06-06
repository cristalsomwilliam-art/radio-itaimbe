import sqlite3

def update_db():
    conn = sqlite3.connect('owncast-data/owncast.db')
    cursor = conn.cursor()
    new_url = 'https://www.radioitaimbe.com.br/api/owncast-webhook?secret=itaimbe_owncast_secret_879'
    cursor.execute("UPDATE webhooks SET url = ? WHERE id = 1;", (new_url,))
    conn.commit()
    print("Webhook URL updated successfully in SQLite database!")
    # Verify
    row = cursor.execute("SELECT * FROM webhooks WHERE id = 1;").fetchone()
    print("Updated row:", row)
    conn.close()

if __name__ == '__main__':
    update_db()
