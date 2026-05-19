"""
agents/memory_agent.py
──────────────────────
MemoryAgent: Orchestrates retrieval and storage of user financial memories.
Communicates with the SQLite memory store to build AI context or store habits.
"""

from agents.base_agent import BaseAgent
from memory.memory_store import (
    get_memory,
    get_context_string,
    store_memory,
    update_patterns_from_analysis
)

class MemoryAgent(BaseAgent):
    name = "MemoryAgent"

    def run(self, context: dict) -> dict:
        """
        context keys:
          - action          (str) "retrieve" or "update"
          - user_id         (int)
          - analysis_data   (dict) optional, for "update" action
          - summary_text    (str) optional, for "update" action
        """
        action = context.get("action", "retrieve")
        user_id = context.get("user_id")

        if not user_id:
            return {"error": "User ID is required for MemoryAgent", "context_string": ""}

        if action == "retrieve":
            self.log(f"Retrieving memory context for user {user_id}")
            memories = get_memory(user_id)
            context_str = get_context_string(user_id)
            return {
                "memories": memories,
                "context_string": context_str
            }

        elif action == "update":
            self.log(f"Updating memory patterns for user {user_id}")
            analysis = context.get("analysis_data", {})
            summary = context.get("summary_text", "")

            # Extract details to update memory patterns
            stats = analysis.get("stats", {})
            breakdown = analysis.get("breakdown", {})
            weekend_data = stats.get("weekend_pattern", {})
            daily_avg = stats.get("daily_average", 0.0) or analysis.get("daily_average", 0.0)

            update_patterns_from_analysis(
                user_id=user_id,
                breakdown=breakdown,
                weekend_data=weekend_data,
                daily_avg=daily_avg,
                summary_text=summary
            )

            # Store any explicit manual monthly goals or budgets if provided
            if "monthly_goal" in context:
                store_memory(user_id, "monthly_goal", context["monthly_goal"])
            if "rent_day" in context:
                store_memory(user_id, "rent_day", str(context["rent_day"]))

            return {
                "status": "success",
                "memories": get_memory(user_id)
            }

        else:
            return {"error": f"Unknown action: {action}"}
