import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app import ai

print("model:", os.getenv("MODEL_ID", "openai-gpt-oss-20b"))
print(repr(ai.call_model("Reply with the single word: ok", "ping")))