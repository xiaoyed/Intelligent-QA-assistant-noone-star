import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
import os

COLLECTION_NAME = "engineering_standards"
PERSIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chroma")

_client = None

def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        os.makedirs(PERSIST_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client

def get_collection():
    client = get_client()
    return client.get_or_create_collection(name=COLLECTION_NAME)
