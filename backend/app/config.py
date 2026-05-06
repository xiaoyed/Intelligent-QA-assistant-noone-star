from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "轨道交通智能问答助手"
    embedding_model: str = "bge-m3"
    chunk_size: int = 384
    chunk_overlap: int = 50
    top_k: int = 8
    demo_mode: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
