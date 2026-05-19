import sqlite3
import os

db_path = 'backend/expenses.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Migrating database...")

# Migrate expenses
try:
    c.execute("ALTER TABLE expenses ADD COLUMN user_id INTEGER DEFAULT 1")
    print("Added user_id to expenses")
except sqlite3.OperationalError:
    print("user_id already exists in expenses")

# Migrate budget
try:
    # budget table needs user_id to be UNIQUE in the new app
    # Simplest way is to recreate it if it doesn't have it
    c.execute("PRAGMA table_info(budget)")
    cols = [col[1] for col in c.fetchall()]
    if 'user_id' not in cols:
        c.execute("CREATE TABLE budget_new (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE NOT NULL, monthly_budget REAL NOT NULL DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))")
        c.execute("INSERT INTO budget_new (user_id, monthly_budget) SELECT 1, monthly_budget FROM budget")
        c.execute("DROP TABLE budget")
        c.execute("ALTER TABLE budget_new RENAME TO budget")
        print("Recreated budget table with user_id")
    else:
        print("user_id already exists in budget")
except Exception as e:
    print(f"Error migrating budget: {e}")

conn.commit()
conn.close()
print("Migration complete.")
