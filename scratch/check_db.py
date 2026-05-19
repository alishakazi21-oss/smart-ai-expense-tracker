import sqlite3
import os

db_path = 'backend/expenses.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Print list of all tables
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print("Tables found in DB:", [row[0] for row in c.fetchall()])
    
    for table in ['users', 'expenses', 'budget', 'memory', 'ai_summaries', 'recurring_expenses']:
        c.execute(f"PRAGMA table_info({table})")
        cols = c.fetchall()
        print(f"Table {table}: {[col[1] for col in cols]}")
    
    conn.close()
