"""
memory/memory_store.py
───────────────────────
SQLite-backed persistent memory for user financial habits.
Stores key-value pairs per user. ChromaDB can be swapped in later.
"""

import json
from datetime import datetime
from database.db import get_db


# ── Write ─────────────────────────────────────────────────────
def store_memory(user_id: int, key: str, value: str | dict) -> None:
    """Upsert a memory entry for a user."""
    if isinstance(value, dict):
        value = json.dumps(value)
    conn = get_db()
    conn.execute(
        """INSERT INTO memory (user_id, key, value, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at""",
        (user_id, key, value, datetime.now().isoformat()),
    )
    conn.commit()
    conn.close()


# ── Read ──────────────────────────────────────────────────────
def get_memory(user_id: int) -> dict[str, str]:
    """Retrieve all memories for a user as {key: value}."""
    conn = get_db()
    rows = conn.execute(
        "SELECT key, value FROM memory WHERE user_id = ?", (user_id,)
    ).fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}


def get_memory_value(user_id: int, key: str) -> str | None:
    """Retrieve a single memory value."""
    conn = get_db()
    row = conn.execute(
        "SELECT value FROM memory WHERE user_id = ? AND key = ?", (user_id, key)
    ).fetchone()
    conn.close()
    return row["value"] if row else None


# ── Context String for AI Prompts ─────────────────────────────
def get_context_string(user_id: int) -> str:
    """Format all memories as a readable string for AI prompts."""
    memories = get_memory(user_id)
    if not memories:
        return ""
    lines = []
    label_map = {
        "top_category":      "Highest spending category",
        "weekend_spender":   "Weekend spending habit",
        "monthly_goal":      "Monthly savings goal",
        "last_summary":      "Last month's AI summary",
        "rent_day":          "Recurring rent/bill day",
        "budget_notes":      "Budget notes",
        "avg_daily_spend":   "Typical daily spend",
    }
    for key, val in memories.items():
        label = label_map.get(key, key.replace("_", " ").title())
        lines.append(f"- {label}: {val}")
    return "\n".join(lines)


# ── Auto-Update from Analysis ─────────────────────────────────
def update_patterns_from_analysis(
    user_id: int,
    breakdown: dict[str, float],
    weekend_data: dict,
    daily_avg: float,
    summary_text: str = "",
) -> None:
    """
    Automatically detect and store spending patterns.
    Called after every analysis run.
    """
    # Top category
    if breakdown:
        top_cat = max(breakdown, key=breakdown.get)
        store_memory(user_id, "top_category", top_cat)

    # Weekend pattern
    if weekend_data.get("is_weekend_spender"):
        store_memory(user_id, "weekend_spender",
                     f"Spends {weekend_data['weekend_ratio']}× more on weekends "
                     f"(avg ₹{weekend_data['weekend_avg']}/day vs ₹{weekend_data['weekday_avg']}/day on weekdays)")
    else:
        store_memory(user_id, "weekend_spender", "Consistent spending throughout the week")

    # Daily average
    if daily_avg > 0:
        store_memory(user_id, "avg_daily_spend", f"₹{daily_avg:.0f}/day")

    # Last summary
    if summary_text:
        store_memory(user_id, "last_summary", summary_text[:500])
