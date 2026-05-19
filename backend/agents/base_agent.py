"""
agents/base_agent.py
─────────────────────
BaseAgent class all agents inherit from.
Provides logging, error handling, and a standard run() interface.
"""

import time
from typing import Any


class BaseAgent:
    """
    Abstract base for all SpendWise AI agents.
    Each agent implements run(context) and returns a result dict.
    """

    name: str = "BaseAgent"

    def run(self, context: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent logic.
        Subclasses must override this method.
        """
        raise NotImplementedError(f"{self.name}.run() must be implemented")

    def safe_run(self, context: dict[str, Any]) -> dict[str, Any]:
        """
        Wrapper around run() that catches exceptions and returns
        a structured error response instead of crashing.
        """
        start = time.perf_counter()
        try:
            result = self.run(context)
            elapsed = round(time.perf_counter() - start, 3)
            return {**result, "_agent": self.name, "_elapsed_s": elapsed, "_error": None}
        except Exception as e:
            elapsed = round(time.perf_counter() - start, 3)
            print(f"[{self.name}] ERROR: {e}")
            return {
                "_agent":    self.name,
                "_elapsed_s": elapsed,
                "_error":    str(e),
            }

    def log(self, msg: str) -> None:
        print(f"[{self.name}] {msg}")
