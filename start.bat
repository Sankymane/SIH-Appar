@echo off
REM =============================================================================
REM AICTE-APAAR National Platform (SIH 26263) - Windows Startup Script
REM =============================================================================

cd /d "%~dp0"

echo ======================================================================
echo  Starting AICTE-APAAR Student Data Management ^& Verification Platform
echo ======================================================================

REM 1. Seed database if not already present
echo [1/3] Checking AICTE institutional database ^& synthetic edge-case data...
python -m backend.app.seed_data

REM 2. Install frontend dependencies if missing
if not exist "frontend\node_modules\" (
    echo [2/3] Installing frontend dependencies...
    cd frontend && npm install && cd ..
) else (
    echo [2/3] Frontend dependencies verified.
)

REM 3. Launch Backend & Frontend servers
echo [3/3] Launching Full-Stack Services...
echo       - Backend API ^& Docs : http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)
echo       - Frontend Portal    : http://127.0.0.1:5173
echo ======================================================================

start "AICTE-APAAR Backend" /D "%~dp0" cmd /k python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
start "AICTE-APAAR Frontend" /D "%~dp0frontend" cmd /k npm run dev -- --host 127.0.0.1 --port 5173

echo Services have been launched in separate terminal windows.
pause
