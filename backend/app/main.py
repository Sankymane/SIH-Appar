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
    audit,
    student_routes,
    stakeholder_routes
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AICTE-APAAR National Student Data Management & Verification API",
    description="Full-Stack Backend System solving SIH Problem Statement 26263: Automated Permanent Academic Account Registry (APAAR) Integration for AICTE-Approved Institutions.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for local development and production frontends (Render & Vercel)
raw_allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
if raw_allowed_origins.strip():
    allowed_origins = [origin.strip() for origin in raw_allowed_origins.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*",
    ]

# Regex pattern matching any Vercel deployment URL (*.vercel.app)
origin_regex = r"^https:\/\/.*\.vercel\.app$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-seed database with AICTE colleges, Sankalp Mane ABC record, and synthetic edge-case student records on startup
@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seeder notice: {e}")

# Register API Routers under /api/v1
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(student_routes.router, prefix="/api/v1")
app.include_router(stakeholder_routes.router, prefix="/api/v1")
app.include_router(institutions.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(verification.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "aicte-apaar-backend", "version": "2.0.0"}

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
            "version": "2.0.0",
            "problem_statement": "SIH 26263",
            "documentation": "/docs"
        }
