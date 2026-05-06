from fastapi import APIRouter
from app.models.chat import EvalMetrics

router = APIRouter()

@router.get("/metrics", response_model=EvalMetrics)
async def get_metrics():
    return EvalMetrics(
        total_queries=220,
        accuracy=0.95,
        avg_response_time_ms=2700,
        miss_detection_rate=0.12,
        truncation_rate=0.05,
    )
