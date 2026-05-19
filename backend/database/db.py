"""
database/db.py
──────────────
SQLite connection helper and schema initializer for SpendWise AI.
All tables (users, expenses, budget, memory, ai_summaries,
recurring_expenses) are created here on first run.
"""

import sqlite3
import os
from contextlib import contextmanager

# ── Path Resolution ───────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # /backend
DB_PATH  = os.path.join(BASE_DIR, "expenses.db")


def get_db() -> sqlite3.Connection:
    """Return a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # better concurrency
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def db_session():
    """Context manager that auto-commits or rolls back."""
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── Schema ────────────────────────────────────────────────────
SCHEMA = """
-- ── Core Tables ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    title     TEXT    NOT NULL,
    amount    REAL    NOT NULL,
    category  TEXT    NOT NULL,
    date      TEXT    NOT NULL,
    note      TEXT    DEFAULT '',
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS budget (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER UNIQUE NOT NULL,
    monthly_budget REAL    NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- ── AI Extension Tables ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    key        TEXT    NOT NULL,   -- e.g. "top_category", "weekend_spender"
    value      TEXT    NOT NULL,   -- plain text or JSON string
    updated_at TEXT    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, key) ON CONFLICT REPLACE,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_summaries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    month      TEXT    NOT NULL,   -- "2025-05"
    summary    TEXT    NOT NULL,   -- AI-generated analysis text
    tips       TEXT    DEFAULT '',
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month) ON CONFLICT REPLACE,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS recurring_expenses (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    title            TEXT    NOT NULL,
    estimated_amount REAL,
    category         TEXT,
    day_of_month     INTEGER,      -- e.g. 5 means rent due on 5th
    FOREIGN KEY(user_id) REFERENCES users(id)
);
"""


def init_db():
    """Create all tables if they don't exist. Safe to call on every startup."""
    with db_session() as conn:
        conn.executescript(SCHEMA)
    print(f"[DB] Initialized: {DB_PATH}")


def rows_to_dicts(rows) -> list[dict]:
    """Convert sqlite3.Row list to plain dict list."""
    return [dict(r) for r in rows]
