import sys
from pathlib import Path

# make `backend.app...` importable when running `pytest` from the repo root or backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
