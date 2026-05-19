"""
agents/prediction_agent.py
───────────────────────────
PredictionAgent: Forecasts month-end spending + generates alerts.
"""

from agents.base_agent import BaseAgent
from prediction.predictor import build_prediction
from analysis.analyzer import get_category_breakdown, get_highest_category
from utils.gemini import generate_insight, build_prediction_prompt
import calendar
from datetime import date


class PredictionAgent(BaseAgent):
    name = "PredictionAgent"

    def run(self, context: dict) -> dict:
        """
        context keys:
          - username    (str)
          - expenses    (list) current month expenses
          - budget      (float)
        """
        username = context.get("username", "User")
        expenses = context.get("expenses", [])
        budget   = context.get("budget", 0.0)

        self.log(f"Predicting for {username} with {len(expenses)} expenses")

        breakdown = get_category_breakdown(expenses)
        top_cat   = get_highest_category(breakdown)

        prediction = build_prediction(expenses, breakdown, budget, top_cat["category"])

        # ── Gemini-enhanced narrative ─────────────────────────
        ref        = date.today()
        days_left  = calendar.monthrange(ref.year, ref.month)[1] - ref.day
        fallback   = prediction["alerts"][0] if prediction["alerts"] else "Keep tracking your expenses!"

        prompt = build_prediction_prompt(
            username,
            prediction["daily_average"],
            prediction["projected_total"],
            budget,
            days_left,
            top_cat["category"],
        )
        ai_narrative = generate_insight(prompt, fallback=fallback)

        return {
            **prediction,
            "narrative":   ai_narrative,
            "top_category": top_cat,
        }
