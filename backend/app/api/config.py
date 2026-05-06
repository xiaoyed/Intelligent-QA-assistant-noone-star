from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.config_service import set_config, is_configured, get_config
from app.db.kimi_client import test_connection

router = APIRouter()

class ConfigRequest(BaseModel):
    api_key: str
    base_url: str = "https://api.moonshot.cn/v1"
    model: str = "moonshot-v1-8k"

class ConfigResponse(BaseModel):
    configured: bool
    api_key_masked: str
    base_url: str
    model: str

@router.post("/save", response_model=ConfigResponse)
async def save_config(req: ConfigRequest):
    if not req.api_key.strip():
        raise HTTPException(status_code=400, detail="API Key不能为空")

    valid = await test_connection(req.api_key, req.base_url)
    if not valid:
        raise HTTPException(status_code=400, detail="API连接失败，请检查API Key和Base URL是否正确")

    set_config(req.api_key, req.base_url, req.model)

    cfg = get_config()
    masked = cfg.api_key[:8] + "..." + cfg.api_key[-4:] if len(cfg.api_key) > 12 else "***"
    return ConfigResponse(
        configured=True,
        api_key_masked=masked,
        base_url=cfg.base_url,
        model=cfg.model,
    )

@router.get("/status", response_model=ConfigResponse)
async def config_status():
    cfg = get_config()
    masked = cfg.api_key[:8] + "..." + cfg.api_key[-4:] if cfg.configured and len(cfg.api_key) > 12 else ""
    return ConfigResponse(
        configured=cfg.configured,
        api_key_masked=masked,
        base_url=cfg.base_url,
        model=cfg.model,
    )

@router.post("/reset")
async def reset_config():
    from app.services.config_service import _runtime_config, RuntimeConfig
    import app.services.config_service as cs
    cs._runtime_config = RuntimeConfig()
    return {"status": "reset"}
