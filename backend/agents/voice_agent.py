"""
agents/voice_agent.py
─────────────────────
VoiceAgent: Parses raw spoken or text phrases like "Add ₹250 for pizza"
into structured transaction properties: amount, title, category, date.
Uses regex + keyword mapping, falling back to Gemini for advanced NLP phrasing.
"""

import re
import json
from datetime import datetime
from agents.base_agent import BaseAgent
from utils.gemini import generate_insight, _GEMINI_AVAILABLE

class VoiceAgent(BaseAgent):
    name = "VoiceAgent"

    def run(self, context: dict) -> dict:
        """
        context keys:
          - text    (str) "Add ₹250 for pizza", "spent 1200 on books today"
        """
        text = context.get("text", "").strip()
        if not text:
            return {"error": "No voice entry text provided."}

        self.log(f"Parsing voice entry: '{text}'")

        # ── Route 1: Gemini Intelligent parsing ─────────────────────────
        if _GEMINI_AVAILABLE:
            self.log("Using Google Gemini to parse voice text")
            prompt = f"""
            You are a voice parsing agent for SpendWise. The user spoke this phrase: "{text}"
            
            Extract:
            1. Amount: numeric float value (no currency symbols).
            2. Title: description of the expense.
            3. Category: must be exactly one of: Food, Transport, Shopping, Entertainment, Health, Bills, Education, Other.
            4. Date: in YYYY-MM-DD format (use today's date if not specified).

            Output ONLY a valid JSON object matching this schema:
            {{
              "amount": 250.00,
              "title": "Pizza",
              "category": "Food",
              "date": "2026-05-19"
            }}
            Do not wrap inside markdown code blocks, return ONLY raw JSON.
            """
            try:
                ai_response = generate_insight(prompt)
                
                # Clean markdown blocks
                if ai_response.startswith("```"):
                    ai_response = re.sub(r"^```(?:json)?\n", "", ai_response)
                    ai_response = re.sub(r"\n```$", "", ai_response)
                    ai_response = ai_response.strip()

                parsed = json.loads(ai_response)
                self.log(f"Gemini successfully parsed: {parsed}")
                return {
                    "success": True,
                    "parsed": parsed,
                    "method": "gemini-nlp"
                }
            except Exception as ex:
                self.log(f"Gemini parsing failed. Falling back to rule-based parser. Error: {ex}")

        # ── Route 2: Smart Rule-Based Fallback ──────────────────────────
        self.log("Using rule-based fallback parser")
        parsed_data = self.parse_text_rules(text)
        return {
            "success": True,
            "parsed": parsed_data,
            "method": "regex-rules"
        }

    def parse_text_rules(self, text: str) -> dict:
        """Rule-based text parsing using regex and keyword lists."""
        # Find amounts (looks for numbers following rs, re, rupees, ₹, or just isolated floats/ints)
        amount = 0.0
        amount_match = re.search(r"(?:rs\.?|rupees|₹)?\s*(\d+(?:\.\d{1,2})?)", text, re.IGNORECASE)
        if amount_match:
            amount = float(amount_match.group(1))
        else:
            # Try any isolated numbers
            numbers = re.findall(r"\b\d+(?:\.\d{1,2})?\b", text)
            if numbers:
                amount = float(numbers[0])

        # Find title/note: looks for "for [title]" or "on [title]" or fallback
        title = "Voice Expense"
        title_match = re.search(r"\b(?:for|on|at|buy|bought)\s+([a-zA-Z0-9\s]+)", text, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).strip()
            # Remove any trailing "today", "yesterday", "tomorrow"
            title = re.sub(r"\b(today|yesterday|tomorrow|this week)\b.*", "", title, flags=re.IGNORECASE).strip()

        # Find category by keywords
        title_lower = title.lower()
        text_lower = text.lower()
        category = "Other"

        category_keywords = {
            "Food": ["pizza", "burger", "cafe", "coffee", "restaurant", "food", "dinner", "lunch", "breakfast", "starbucks", "swiggy", "zomato", "groceries", "grocery"],
            "Transport": ["uber", "taxi", "cab", "metro", "bus", "fuel", "petrol", "auto", "ola", "train", "flight"],
            "Shopping": ["store", "mall", "clothing", "shirt", "shoe", "amazon", "walmart", "myntra", "clothes", "gadget", "phone", "electronics"],
            "Entertainment": ["movie", "cinema", "netflix", "game", "show", "club", "party", "pub", "bar", "concert"],
            "Bills": ["rent", "electricity", "water", "bill", "phone", "wifi", "recharge", "subscription", "broadband"],
            "Education": ["book", "course", "college", "tuition", "school", "fees", "stationery", "udemy", "coursera"],
            "Health": ["doctor", "medicine", "pharmacy", "hospital", "gym", "workout", "dental", "clinic"]
        }

        # Check title first, then entire prompt
        found_cat = False
        for cat, keywords in category_keywords.items():
            if any(w in title_lower for w in keywords):
                category = cat
                found_cat = True
                break
        
        if not found_cat:
            for cat, keywords in category_keywords.items():
                if any(w in text_lower for w in keywords):
                    category = cat
                    break

        return {
            "amount": amount or 100.0,
            "title": title.capitalize(),
            "category": category,
            "date": datetime.today().strftime("%Y-%m-%d")
        }
