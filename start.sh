#!/usr/bin/env bash
# =============================================================================
# AICTE-APAAR National Platform (SIH 26263) - Startup Script
# =============================================================================

set -e

echo "======================================================================"
echo " Starting AICTE-APAAR Student Data Management & Verification Platform "
echo "======================================================================"

# 1. Activate Python virtual environment
if [ -d ".venv" ]; then
    echo "[1/3] Activating Python virtual environment..."
    source .venv/bin/activate
else
    echo "[!] Virtual environment (.venv) not found. Creating..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
fi

# 2. Seed database if not already present
echo "[2/3] Checking AICTE institutional database & synthetic edge-case data..."
python3 -m backend.app.seed_data

# 3. Start Backend & Frontend servers
echo "[3/3] Launching Full-Stack Services..."
echo "      - Backend API & Docs : http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)"
echo "      - Frontend Portal    : http://127.0.0.1:5173"
echo "======================================================================"

# Launch backend in background
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Launch frontend
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

# Trap Ctrl+C to cleanly kill both background jobs
trap "echo 'Shutting down AICTE-APAAR platform...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
