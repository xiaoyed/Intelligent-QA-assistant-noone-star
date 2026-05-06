from dataclasses import dataclass, field

@dataclass
class RuntimeConfig:
    api_key: str = ""
    base_url: str = "https://api.moonshot.cn/v1"
    model: str = "moonshot-v1-8k"
    configured: bool = False

_runtime_config = RuntimeConfig()

def get_config() -> RuntimeConfig:
    return _runtime_config

def set_config(api_key: str, base_url: str, model: str) -> None:
    _runtime_config.api_key = api_key
    _runtime_config.base_url = base_url or "https://api.moonshot.cn/v1"
    _runtime_config.model = model or "moonshot-v1-8k"
    _runtime_config.configured = True

def is_configured() -> bool:
    return _runtime_config.configured and bool(_runtime_config.api_key)
