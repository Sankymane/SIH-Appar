# =============================================================================
# AICTE-APAAR National Platform (SIH 26263) - Windows PowerShell Startup Script
# =============================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " Starting AICTE-APAAR Student Data Management & Verification Platform " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Seed database if not already present
Write-Host "[1/3] Checking AICTE institutional database & synthetic edge-case data..." -ForegroundColor Yellow
python -m backend.app.seed_data

# 2. Check frontend dependencies
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[2/3] Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
} else {
    Write-Host "[2/3] Frontend dependencies verified." -ForegroundColor Green
}

# 3. Launch Backend & Frontend servers
Write-Host "[3/3] Launching Full-Stack Services..." -ForegroundColor Yellow
Write-Host "      - Backend API & Docs : http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)" -ForegroundColor White
Write-Host "      - Frontend Portal    : http://127.0.0.1:5173" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host "Services have been launched in separate PowerShell windows." -ForegroundColor Green
