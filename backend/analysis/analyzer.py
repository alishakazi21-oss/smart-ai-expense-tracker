"""
analysis/analyzer.py
────────────────────
Pure Python data analysis functions.
No AI required — these produce structured data that agents then
optionally pass to Gemini for natural-language summaries.
"""

from datetime import datetime, date, timedelta
from collections import defaultdict
from typing import Any


# ── Category Breakdown ────────────────────────────────────────
def get_category_breakdown(expenses: list[dict]) -> dict[str, float]:
    """Sum expenses by category. Returns {category: total_amount}."""
    breakdown: dict[str, float] = defaultdict(float)
    for exp in expenses:
        breakdown[exp["category"]] += float(exp["amount"])
    return dict(sorted(breakdown.items(), key=lambda x: x[1], reverse=True))


# ── Month Comparison ──────────────────────────────────────────
def compare_months(
    current: dict[str, float],
    previous: dict[str, float],
) -> list[dict]:
    """
    Compare current vs previous month by category.
    Returns list of {category, current, previous, change_pct, trend}.
    """
    all_categories = set(current) | set(previous)
    results = []
    for cat in all_categories:
        curr_amt = current.get(cat, 0.0)
        prev_amt = previous.get(cat, 0.0)
        if prev_amt > 0:
            change_pct = round((curr_amt - prev_amt) / prev_amt * 100, 1)
        elif curr_amt > 0:
            change_pct = 100.0  # brand new spending
        else:
            change_pct = 0.0
        results.append({
            "category":   cat,
            "current":    round(curr_amt, 2),
            "previous":   round(prev_amt, 2),
            "change_pct": change_pct,
            "trend":      "up" if change_pct > 5 else "down" if change_pct < -5 else "stable",
        })
    return sorted(results, key=lambda x: abs(x["change_pct"]), reverse=True)


# ── Highest Spending Category ─────────────────────────────────
def get_highest_category(breakdown: dict[str, float]) -> dict:
    """Return the category with the highest spend."""
    if not breakdown:
        return {"category": "None", "amount": 0.0}
    top_cat = max(breakdown, key=breakdown.get)
    return {"category": top_cat, "amount": round(breakdown[top_cat], 2)}


# ── Weekend vs Weekday Pattern ────────────────────────────────
def detect_weekend_pattern(expenses: list[dict]) -> dict:
    """
    Compare average daily spending on weekends vs weekdays.
    Returns {weekend_avg, weekday_avg, weekend_ratio, is_weekend_spender}.
    """
    weekend_total, weekday_total = 0.0, 0.0
    weekend_days: set[str] = set()
    weekday_days: set[str] = set()

    for exp in expenses:
        try:
            d = datetime.strptime(exp["date"], "%Y-%m-%d").date()
            is_weekend = d.weekday() >= 5  # Sat=5, Sun=6
            if is_weekend:
                weekend_total += float(exp["amount"])
                weekend_days.add(exp["date"])
            else:
                weekday_total += float(exp["amount"])
                weekday_days.add(exp["date"])
        except (ValueError, KeyError):
            continue

    weekend_avg = weekend_total / len(weekend_days) if weekend_days else 0
    weekday_avg = weekday_total / len(weekday_days) if weekday_days else 0
    ratio = round(weekend_avg / weekday_avg, 2) if weekday_avg > 0 else 1.0

    return {
        "weekend_avg":        round(weekend_avg, 2),
        "weekday_avg":        round(weekday_avg, 2),
        "weekend_ratio":      ratio,
        "is_weekend_spender": ratio > 1.3,
        "weekend_total":      round(weekend_total, 2),
        "weekday_total":      round(weekday_total, 2),
    }


# ── Daily Spending Trend ──────────────────────────────────────
def get_daily_spending(expenses: list[dict]) -> list[dict]:
    """Group expenses by date → sorted list of {date, total}."""
    daily: dict[str, float] = defaultdict(float)
    for exp in expenses:
        daily[exp["date"]] += float(exp["amount"])
    return [
        {"date": d, "total": round(t, 2)}
        for d, t in sorted(daily.items())
    ]


# ── Spending Anomaly Detection ────────────────────────────────
def detect_anomalies(
    expenses: list[dict],
    threshold_multiplier: float = 2.5,
) -> list[dict]:
    """
    Flag expenses whose amount is > threshold_multiplier × category average.
    Returns list of flagged expense dicts with 'reason' added.
    """
    # Calculate per-category average
    cat_amounts: dict[str, list[float]] = defaultdict(list)
    for exp in expenses:
        cat_amounts[exp["category"]].append(float(exp["amount"]))

    cat_avg = {
        cat: sum(amts) / len(amts)
        for cat, amts in cat_amounts.items()
    }

    flagged = []
    for exp in expenses:
        avg = cat_avg.get(exp["category"], 0)
        if avg > 0 and float(exp["amount"]) > avg * threshold_multiplier:
            flagged.append({
                **exp,
                "reason": (
                    f"Amount ₹{exp['amount']} is "
                    f"{exp['amount']/avg:.1f}× higher than your average "
                    f"{exp['category']} spend of ₹{avg:.0f}"
                ),
            })
    return flagged


# ── Unnecessary Spending Finder ───────────────────────────────
DISCRETIONARY_CATEGORIES = {"Entertainment", "Shopping", "Food"}

def find_high_discretionary(
    breakdown: dict[str, float],
    budget: float,
) -> list[dict]:
    """
    Find discretionary categories eating >20% of budget.
    Returns list of {category, amount, budget_pct, avg}.
    """
    results = []
    for cat in DISCRETIONARY_CATEGORIES:
        amt = breakdown.get(cat, 0)
        if budget > 0 and amt / budget > 0.20:
            results.append({
                "category":   cat,
                "amount":     round(amt, 2),
                "budget_pct": round(amt / budget * 100, 1),
                "avg":        round(amt * 0.7, 2),  # target: reduce by 30%
            })
    return sorted(results, key=lambda x: x["amount"], reverse=True)


# ── Summary Stats ─────────────────────────────────────────────
def compute_summary_stats(
    expenses: list[dict],
    budget: float,
    month: str,
) -> dict[str, Any]:
    """Aggregate all stats in one call for efficiency."""
    total     = sum(float(e["amount"]) for e in expenses)
    breakdown = get_category_breakdown(expenses)
    top       = get_highest_category(breakdown)
    weekend   = detect_weekend_pattern(expenses)
    daily     = get_daily_spending(expenses)
    anomalies = detect_anomalies(expenses)

    return {
        "month":      month,
        "total":      round(total, 2),
        "budget":     budget,
        "remaining":  round(budget - total, 2),
        "count":      len(expenses),
        "breakdown":  breakdown,
        "top_category": top,
        "weekend_pattern": weekend,
        "daily_trend": daily,
        "anomalies":  anomalies,
    }
