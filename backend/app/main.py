import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .seed_data import seed_database
from .routes import (
    auth_routes,
    institutions,
    students,
    verification,
    analytics,
    reports,
    audit
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AICTE-APAAR National Student Data Management & Verification API",
    description="Full-Stack Backend System solving SIH Problem Statement 26263: Automated Permanent Academic Account Registry (APAAR) Integration for AICTE-Approved Institutions.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for local development and frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-seed database with AICTE colleges and synthetic edge-case student records on startup
@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seeder notice: {e}")

# Register API Routers under /api/v1
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(institutions.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(verification.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "aicte-apaar-backend"}

# Mount frontend production build if available
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "platform": "AICTE-APAAR Student Data Management & Verification Platform",
            "status": "online",
            "version": "1.0.0",
            "problem_statement": "SIH 26263",
            "documentation": "/docs"
        }
