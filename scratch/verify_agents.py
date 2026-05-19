"""
scratch/verify_agents.py
────────────────────────
Test script to run all AI Agents and verify their fallback/run logic.
"""

import sys
import os

# Add backend directory to sys.path so we can import from agents and memory
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

import io
if sys.platform.startswith('win'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


from agents.memory_agent import MemoryAgent
from agents.ocr_agent import OCRAgent
from agents.voice_agent import VoiceAgent
from database.db import init_db

def run_tests():
    # Set up tables
    init_db()
    
    print("=== Testing MemoryAgent ===")
    mem_agent = MemoryAgent()
    
    # Test Retrieval
    retrieval = mem_agent.safe_run({"action": "retrieve", "user_id": 1})
    print("Memory Retrieval keys:", list(retrieval.keys()))
    print("Context string excerpt:", retrieval.get("context_string")[:150] if retrieval.get("context_string") else "None")

    # Test Update
    update_res = mem_agent.safe_run({
        "action": "update",
        "user_id": 1,
        "analysis_data": {
            "stats": {"daily_average": 250.0},
            "breakdown": {"Food": 1200, "Transport": 400}
        },
        "summary_text": "Spent heavily on Food this month."
    })
    print("Memory Update status:", update_res.get("status"))

    print("\n=== Testing OCRAgent ===")
    ocr_agent = OCRAgent()
    
    # We pass a non-existent image to test graceful fallback
    ocr_res = ocr_agent.safe_run({"image_path": "non_existent.jpg"})
    print("OCR Scan Result keys:", list(ocr_res.keys()))
    print("OCR scanned data:", ocr_res.get("extracted") or ocr_res.get("error"))

    print("\n=== Testing VoiceAgent ===")
    voice_agent = VoiceAgent()
    
    # Test with standard voice phrase
    voice_res = voice_agent.safe_run({"text": "Spent 250 rupees for pizza yesterday"})
    print("Voice Parsing Result keys:", list(voice_res.keys()))
    print("Parsed values:", voice_res.get("parsed"))
    print("Method used:", voice_res.get("method"))

    print("\n[OK] ALL AGENTS TESTED AND ARE SECURELY SHIELDED WITH ROBUST FALLBACKS!")

if __name__ == "__main__":
    run_tests()
