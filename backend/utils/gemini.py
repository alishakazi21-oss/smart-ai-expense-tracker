"""
utils/gemini.py
===============
Thin wrapper around Google Gemini 1.5 Flash.
If GEMINI_API_KEY is not set, returns smart rule-based responses
so the app works even without an API key.
"""

import os
import textwrap

_GEMINI_AVAILABLE = False

try:
    import google.generativeai as genai
    _key = os.getenv("GEMINI_API_KEY", "")
    if _key:
        genai.configure(api_key=_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
        _GEMINI_AVAILABLE = True
        print("[Gemini] [OK] Connected to Gemini 1.5 Flash")
    else:
        print("[Gemini] [WARNING] No API key - using rule-based fallback")
except ImportError:
    print("[Gemini] [WARNING] google-generativeai not installed - using fallback")


# == Core Call =================================================
def generate_insight(prompt: str, fallback: str = "") -> str:
    """
    Send a prompt to Gemini and return the text response.
    Falls back to `fallback` string if Gemini is unavailable.
    """
    if not _GEMINI_AVAILABLE:
        return fallback or "AI insights unavailable - add GEMINI_API_KEY to .env"
    try:
        response = _model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return fallback or "Unable to generate AI insight at this time."


# == Prompt Builders ===========================================
def build_analysis_prompt(
    username: str,
    current_month: str,
    category_breakdown: dict,
    prev_breakdown: dict,
    total: float,
    budget: float,
    memory_context: str = "",
) -> str:
    """Build a structured prompt for spending analysis."""
    lines = []
    for cat, amt in category_breakdown.items():
        prev = prev_breakdown.get(cat, 0)
        change = ((amt - prev) / prev * 100) if prev > 0 else None
        change_str = f" ({change:+.0f}% vs last month)" if change is not None else " (new)"
        lines.append(f"  - {cat}: ₹{amt:.0f}{change_str}")

    cat_block = "\n".join(lines) if lines else "  No expenses recorded."
    memory_block = f"\nUser memory/habits:\n{memory_context}" if memory_context else ""

    return textwrap.dedent(f"""
        You are a friendly financial advisor for a student named {username}.
        Analyze their spending for {current_month} and give 3-4 concise, specific insights.
        
        Monthly budget: ₹{budget:.0f}
        Total spent:    ₹{total:.0f}
        
        Spending by category:
        {cat_block}
        {memory_block}
        
        Rules:
        - Be conversational and encouraging, not scary
        - Use rupee symbol ₹
        - Mention specific categories and amounts
        - Keep each insight to 1-2 sentences
        - Output as a numbered list (1. 2. 3.)
        - No markdown headers
    """).strip()


def build_prediction_prompt(
    username: str,
    daily_avg: float,
    projected_total: float,
    budget: float,
    days_remaining: int,
    top_category: str,
) -> str:
    """Build a prompt for month-end spending prediction."""
    return textwrap.dedent(f"""
        You are a financial advisor for student {username}.
        
        Current spending data:
        - Daily average: ₹{daily_avg:.0f}
        - Projected month-end total: ₹{projected_total:.0f}
        - Monthly budget: ₹{budget:.0f}
        - Days remaining in month: {days_remaining}
        - Highest spending category: {top_category}
        
        Give a 2-3 sentence prediction summary. Be specific with numbers.
        Mention if they are on track or at risk of overspending.
        Use rupee symbol ₹. Be encouraging but honest.
    """).strip()


def build_savings_prompt(
    username: str,
    high_categories: list[dict],
    monthly_budget: float,
    total_spent: float,
) -> str:
    """Build a prompt for savings recommendations."""
    cat_lines = "\n".join(
        f"  - {c['category']}: ₹{c['amount']:.0f} (avg ₹{c['avg']:.0f}/month)"
        for c in high_categories
    )
    return textwrap.dedent(f"""
        You are a savings advisor for student {username}.
        
        Monthly budget: ₹{monthly_budget:.0f}, spent: ₹{total_spent:.0f}
        
        High-spending categories:
        {cat_lines}
        
        Give 3 specific, actionable savings tips.
        - Each tip should mention a specific category
        - Estimate monthly savings in ₹ for each tip
        - Keep it practical for a college student
        - Format: numbered list (1. 2. 3.)
        - No markdown formatting, just plain text
    """).strip()
