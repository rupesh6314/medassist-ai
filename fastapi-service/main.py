import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

from routers.health_router import router as health_router
from routers.parser_router import router as parser_router
from routers.explainer_router import router as explainer_router
from routers.diabetes_router import router as diabetes_router
from routers.cbc_router import router as cbc_router
from routers.heart_router import router as heart_router
from routers.kidney_router import router as kidney_router
from routers.liver_router import router as liver_router
from routers.diet_router import router as diet_router, load_local_ifct_foods
from routers.risk_router import router as risk_router
from routers.pdf_export_router import router as pdf_export_router
from services.model_status_service import ModelStatusService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload AI models and IFCT food dataset in background
    asyncio.create_task(ModelStatusService.preload_models())
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, load_local_ifct_foods)
    yield

app = FastAPI(
    title="MedAssist AI - FastAPI Service",
    description="Python backend microservice for MedAssist AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware - Restrict to configured origins
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
is_production = os.getenv("ENVIRONMENT", "").lower() == "production" or os.getenv("NODE_ENV", "").lower() == "production"

if is_production and (not raw_origins or "*" in raw_origins):
    raise RuntimeError("FATAL SECURITY CONFIGURATION: In production, ALLOWED_ORIGINS must be explicitly set to a trusted origin list (wildcard '*' is forbidden).")

if not raw_origins:
    raw_origins = "http://localhost:5173,http://localhost:3000,http://localhost:5000,http://127.0.0.1:5173,http://127.0.0.1:5000"

allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(parser_router)
app.include_router(explainer_router)
app.include_router(diabetes_router)
app.include_router(cbc_router)
app.include_router(heart_router)
app.include_router(kidney_router)
app.include_router(liver_router)
app.include_router(diet_router)
app.include_router(risk_router)
app.include_router(pdf_export_router)

@app.get("/")
@app.head("/")
def root_endpoint():
    return {
        "service": "MedAssist AI - FastAPI Microservice",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, timeout_keep_alive=30)

