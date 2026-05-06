import httpx
from app.services.config_service import get_config, is_configured

async def test_connection(api_key: str, base_url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{base_url}/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            return resp.status_code == 200
    except Exception:
        return False

async def generate_response(prompt: str) -> str:
    cfg = get_config()
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{cfg.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {cfg.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": cfg.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 1024,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

async def check_kimi_available() -> bool:
    if not is_configured():
        return False
    cfg = get_config()
    return await test_connection(cfg.api_key, cfg.base_url)
