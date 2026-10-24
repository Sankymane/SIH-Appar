"""
Enrollment Integrity & Anomaly Detection (L1-L5), merged from the sih2 module.

get_registry() returns one shared, read-only copy of the Central APAAR Registry
(data/apaar_central_registry.json) for the single-student validation path.
The batch pipeline builds its own registry per run so runs never affect each other.
"""
from functools import lru_cache
from pathlib import Path

from .registry import MockApaarRegistry

DATA_DIR = Path(__file__).resolve().parent / "data"


@lru_cache(maxsize=1)
def get_registry() -> MockApaarRegistry:
    return MockApaarRegistry(str(DATA_DIR / "apaar_central_registry.json"))
