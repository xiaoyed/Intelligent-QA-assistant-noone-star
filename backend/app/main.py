from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import chat, knowledge, eval, config
from app.demo.seed import seed_demo_data

async def seed_data_async():
    try:
        seed_demo_data()
    except Exception as e:
        print(f"Seed data failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(seed_data_async())
    yield

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(eval.router, prefix="/api/eval", tags=["eval"])
app.include_router(config.router, prefix="/api/config", tags=["config"])

@app.get("/api/health")
async def health_check():
    from app.services.config_service import is_configured
    from app.db.kimi_client import check_kimi_available

    configured = is_configured()
    llm_available = await check_kimi_available() if configured else False

    return {
        "status": "ok",
        "llm_available": llm_available,
        "configured": configured,
        "llm_source": "Kimi API" if llm_available else None,
        "mode": "live" if llm_available else "demo",
    }
