"""
agents/analysis_agent.py
─────────────────────────
AnalysisAgent: Runs category analysis + generates AI summary.
Python logic first, Gemini for natural language output.
"""

from agents.base_agent import BaseAgent
from analysis.analyzer import (
    get_category_breakdown,
    compare_months,
    get_highest_category,
    detect_weekend_pattern,
    detect_anomalies,
    compute_summary_stats,
)
from utils.gemini import generate_insight, build_analysis_prompt


class AnalysisAgent(BaseAgent):
    name = "AnalysisAgent"

    def run(self, context: dict) -> dict:
        """
        context keys:
          - username        (str)
          - current_month   (str)  "2025-05"
          - expenses        (list) current month expenses
          - prev_expenses   (list) previous month expenses
          - budget          (float)
          - memory_context  (str)  from MemoryAgent
        """
        username      = context.get("username", "User")
        month         = context.get("current_month", "")
        expenses      = context.get("expenses", [])
        prev_expenses = context.get("prev_expenses", [])
        budget        = context.get("budget", 0.0)
        memory_ctx    = context.get("memory_context", "")

        self.log(f"Analyzing {len(expenses)} expenses for {month}")

        # ── Pure Python Analysis ──────────────────────────────
        stats       = compute_summary_stats(expenses, budget, month)
        breakdown   = stats["breakdown"]
        prev_break  = get_category_breakdown(prev_expenses)
        comparison  = compare_months(breakdown, prev_break)
        weekend     = stats["weekend_pattern"]
        anomalies   = stats["anomalies"]
        top_cat     = stats["top_category"]

        # ── Rule-Based Fallback Summary ───────────────────────
        fallback_lines = []
        if breakdown:
            fallback_lines.append(
                f"Your highest spending category is {top_cat['category']} (₹{top_cat['amount']:,.0f})."
            )
        if weekend["is_weekend_spender"]:
            fallback_lines.append(
                f"You spend {weekend['weekend_ratio']}× more on weekends "
                f"(₹{weekend['weekend_avg']}/day) than weekdays."
            )
        for item in comparison[:2]:
            if abs(item["change_pct"]) > 10:
                direction = "increased" if item["change_pct"] > 0 else "decreased"
                fallback_lines.append(
                    f"{item['category']} expenses {direction} by {abs(item['change_pct']):.0f}% this month."
                )
        if budget > 0 and stats["total"] > budget:
            fallback_lines.append(
                f"⚠️ You've exceeded your budget of ₹{budget:,.0f} by ₹{stats['total'] - budget:,.0f}."
            )
        fallback_text = " ".join(fallback_lines) or "Start adding expenses to see AI insights!"

        # ── Gemini NL Summary ─────────────────────────────────
        prompt  = build_analysis_prompt(username, month, breakdown, prev_break, stats["total"], budget, memory_ctx)
        ai_text = generate_insight(prompt, fallback=fallback_text)

        return {
            "summary":     ai_text,
            "stats":       stats,
            "comparison":  comparison,
            "anomalies":   anomalies,
            "breakdown":   breakdown,
            "top_category": top_cat,
        }
