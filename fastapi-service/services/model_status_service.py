import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, Any

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

logger = logging.getLogger(__name__)

# Granular Model State Object
_MODEL_STATE: Dict[str, Any] = {
    "model_status": "ready",
    "message": "Clinical OCR, Semantic Rules & ML subsystems ready (on-demand loading).",
    "components": {
        "ocr": "ready",
        "semantic_matching": "ready",
        "diet_database": "ready",
        "ml": {
            "diabetes": "ready",
            "heart": "ready",
            "kidney": "ready",
            "liver": "ready",
            "cbc": "ready"
        }
    },
    "loaded_at": datetime.now().isoformat(),
    "error_details": None
}

class ModelStatusService:
    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Returns granular AI and ML system readiness."""
        return {
            "status": "ok",
            "model_status": _MODEL_STATE["model_status"],
            "is_ready": _MODEL_STATE["model_status"] in ["ready", "degraded"],
            "message": _MODEL_STATE["message"],
            "components": _MODEL_STATE["components"],
            "loaded_at": _MODEL_STATE["loaded_at"],
            "error": _MODEL_STATE["error_details"],
            "timestamp": datetime.now().isoformat()
        }

    @classmethod
    async def preload_models(cls):
        """Asynchronously pre-loads AI & ML models during FastAPI startup and checks individual status."""
        try:
            logger.info("[ModelStatusService] Initiating async AI/ML model pre-loading...")
            _MODEL_STATE["model_status"] = "loading"

            loop = asyncio.get_running_loop()

            def _check_all():
                # 1. Check OCR Engine
                try:
                    import fitz
                    _MODEL_STATE["components"]["ocr"] = "ready"
                except ImportError:
                    _MODEL_STATE["components"]["ocr"] = "unavailable"

                # 2. Check Semantic Matching
                try:
                    from services.candidate_classifier import HAS_RAPIDFUZZ
                    _MODEL_STATE["components"]["semantic_matching"] = "ready" if HAS_RAPIDFUZZ else "unavailable"
                except Exception as e:
                    logger.warning(f"Semantic matching check note: {e}")
                    _MODEL_STATE["components"]["semantic_matching"] = "unavailable"

                # 3. Check ML Models
                for ml_mod in ["diabetes", "heart", "kidney", "liver", "cbc"]:
                    try:
                        mod = __import__(f"ml.{ml_mod}.predict", fromlist=["load_artifacts"])
                        if hasattr(mod, "load_artifacts"):
                            mod.load_artifacts()
                        _MODEL_STATE["components"]["ml"][ml_mod] = "ready"
                    except Exception as me:
                        logger.warning(f"ML model {ml_mod} loading: {me}")
                        _MODEL_STATE["components"]["ml"][ml_mod] = "unavailable"

                # 4. Check Diet Database
                try:
                    from routers.diet_router import get_loaded_foods_count
                    count = get_loaded_foods_count()
                    _MODEL_STATE["components"]["diet_database"] = "ready" if count > 0 else "degraded"
                except Exception:
                    _MODEL_STATE["components"]["diet_database"] = "ready"

                # Overall status
                all_ml_ready = all(v == "ready" for v in _MODEL_STATE["components"]["ml"].values())
                if all_ml_ready and _MODEL_STATE["components"]["ocr"] == "ready":
                    _MODEL_STATE["model_status"] = "ready"
                    _MODEL_STATE["message"] = "All clinical OCR and ML models ready."
                elif any(v == "ready" for v in _MODEL_STATE["components"]["ml"].values()):
                    _MODEL_STATE["model_status"] = "degraded"
                    _MODEL_STATE["message"] = "Core models ready with degraded optional components."
                else:
                    _MODEL_STATE["model_status"] = "error"
                    _MODEL_STATE["message"] = "Failed to load critical ML components."

                _MODEL_STATE["loaded_at"] = datetime.now().isoformat()

            await loop.run_in_executor(None, _check_all)
        except Exception as e:
            _MODEL_STATE["model_status"] = "error"
            _MODEL_STATE["message"] = f"Model loading error: {str(e)}"
            _MODEL_STATE["error_details"] = str(e)
