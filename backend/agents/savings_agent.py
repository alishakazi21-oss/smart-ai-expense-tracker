"""
agents/savings_agent.py
────────────────────────
SavingsAdvisorAgent: Detects unnecessary spending, generates savings tips.
Rule-based logic + optional Gemini personalization.
"""

from agents.base_agent import BaseAgent
from analysis.analyzer import find_high_discretionary, get_category_breakdown
from utils.gemini import generate_insight, build_savings_prompt


# Suggested reduction targets per category (rule-based)
REDUCTION_TARGETS = {
    "Food":          0.20,   # reduce by 20%
    "Entertainment": 0.30,
    "Shopping":      0.25,
    "Transport":     0.15,
    "Other":         0.20,
}


class SavingsAdvisorAgent(BaseAgent):
    name = "SavingsAdvisorAgent"

    def run(self, context: dict) -> dict:
        """
        context keys:
          - username    (str)
          - expenses    (list)
          - budget      (float)
        """
        username = context.get("username", "User")
        expenses = context.get("expenses", [])
        budget   = context.get("budget", 0.0)

        self.log(f"Generating savings advice for {username}")

        breakdown    = get_category_breakdown(expenses)
        total_spent  = sum(float(e["amount"]) for e in expenses)
        high_cats    = find_high_discretionary(breakdown, budget)

        # ── Rule-based tips ───────────────────────────────────
        rule_tips: list[str] = []
        potential_savings = 0.0

        for item in high_cats:
            cat     = item["category"]
            amt     = item["amount"]
            target  = REDUCTION_TARGETS.get(cat, 0.20)
            saving  = round(amt * target, 0)
            potential_savings += saving
            rule_tips.append(
                f"Reduce {cat} spending by {int(target*100)}% to save ₹{saving:,.0f}/month."
            )

        # Generic tips if no high categories found
        if not rule_tips:
            rule_tips = [
                "Set a daily spending limit and track it every evening.",
                "Cook at home 2 more days per week to reduce food costs.",
                "Review your subscriptions — cancel ones you rarely use.",
            ]

        fallback = "\n".join(f"{i+1}. {t}" for i, t in enumerate(rule_tips))

        # ── Gemini personalized tips ──────────────────────────
        prompt   = build_savings_prompt(username, high_cats, budget, total_spent)
        ai_tips  = generate_insight(prompt, fallback=fallback)

        return {
            "tips":              ai_tips,
            "rule_tips":         rule_tips,
            "high_categories":   high_cats,
            "potential_savings": round(potential_savings, 2),
            "total_spent":       round(total_spent, 2),
            "budget":            budget,
        }
