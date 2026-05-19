"""
prediction/predictor.py
────────────────────────
Monthly spending prediction using daily average calculations.
"""

import calendar
from datetime import datetime, date
from typing import Any


def calculate_daily_average(expenses: list[dict], reference_date: date | None = None) -> float:
    """Average daily spending based on days elapsed this month."""
    if not expenses:
        return 0.0
    ref = reference_date or date.today()
    days_elapsed = max(ref.day, 1)
    total = sum(float(e["amount"]) for e in expenses)
    return round(total / days_elapsed, 2)


def predict_month_end(daily_avg: float, reference_date: date | None = None) -> float:
    """Project total spending at current daily rate."""
    ref = reference_date or date.today()
    days_in_month = calendar.monthrange(ref.year, ref.month)[1]
    return round(daily_avg * days_in_month, 2)


def days_until_exceeded(budget: float, total_spent: float, daily_avg: float) -> int | None:
    """Days until budget runs out. Returns None if budget is 0."""
    remaining = budget - total_spent
    if remaining <= 0:
        return 0
    if daily_avg <= 0 or budget <= 0:
        return None
    return int(remaining / daily_avg)


def category_forecast(breakdown: dict[str, float], reference_date: date | None = None) -> dict[str, float]:
    """Extrapolate each category's spend to end of month."""
    ref = reference_date or date.today()
    days_in_month = calendar.monthrange(ref.year, ref.month)[1]
    scale = days_in_month / max(ref.day, 1)
    return {cat: round(amt * scale, 2) for cat, amt in breakdown.items()}


def generate_prediction_alerts(
    projected_total: float,
    budget: float,
    days_exceeded: int | None,
    top_category: str,
    daily_avg: float,
) -> list[str]:
    """Human-readable alert strings — works without Gemini."""
    alerts: list[str] = []
    ref = date.today()
    days_left = calendar.monthrange(ref.year, ref.month)[1] - ref.day

    if budget > 0:
        overshoot_pct = ((projected_total - budget) / budget) * 100
        if projected_total > budget:
            alerts.append(
                f"⚠️ Projected month-end spending ₹{projected_total:,.0f} "
                f"exceeds budget by ₹{projected_total - budget:,.0f} ({overshoot_pct:+.0f}%)."
            )
        elif overshoot_pct > -10:
            alerts.append(f"🔶 Close to budget limit. Only ₹{budget - projected_total:,.0f} buffer left.")
        else:
            alerts.append(f"✅ On track! Projected to finish ₹{budget - projected_total:,.0f} under budget.")

    if days_exceeded is not None and days_exceeded < days_left:
        alerts.append(
            f"🚨 At ₹{daily_avg:,.0f}/day, budget exhausted in {days_exceeded} day(s)."
        )

    if top_category and top_category != "None":
        alerts.append(f"📊 {top_category} is your biggest expense driver this month.")

    return alerts


def build_prediction(expenses: list[dict], breakdown: dict[str, float], budget: float, top_cat: str) -> dict[str, Any]:
    """Return full prediction package for frontend and AI agents."""
    ref = date.today()
    days_in_month  = calendar.monthrange(ref.year, ref.month)[1]
    days_elapsed   = ref.day
    days_remaining = days_in_month - days_elapsed

    daily_avg       = calculate_daily_average(expenses, ref)
    projected_total = predict_month_end(daily_avg, ref)
    total_spent     = round(sum(float(e["amount"]) for e in expenses), 2)
    days_exc        = days_until_exceeded(budget, total_spent, daily_avg)
    cat_forecast    = category_forecast(breakdown, ref)
    alerts          = generate_prediction_alerts(projected_total, budget, days_exc, top_cat, daily_avg)

    return {
        "daily_average":       daily_avg,
        "projected_total":     projected_total,
        "total_spent":         total_spent,
        "budget":              budget,
        "days_elapsed":        days_elapsed,
        "days_remaining":      days_remaining,
        "days_until_exceeded": days_exc,
        "category_forecast":   cat_forecast,
        "alerts":              alerts,
        "on_track":            projected_total <= budget if budget > 0 else True,
    }
