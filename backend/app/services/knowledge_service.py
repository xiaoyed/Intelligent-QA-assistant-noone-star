import os
import uuid
import json
import time
from datetime import datetime
from app.db.chroma_client import get_collection
from app.config import settings

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "documents.json")

def _load_meta() -> dict:
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def _save_meta(meta: dict):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

def add_document(filename: str, file_size: int, file_type: str) -> str:
    doc_id = str(uuid.uuid4())[:8]
    meta = _load_meta()
    meta[doc_id] = {
        "id": doc_id,
        "filename": filename,
        "file_size": file_size,
        "file_type": file_type,
        "status": "processing",
        "chunk_count": 0,
        "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "processed_at": None,
    }
    _save_meta(meta)
    return doc_id

def update_document_status(doc_id: str, status: str, chunk_count: int = 0):
    meta = _load_meta()
    if doc_id in meta:
        meta[doc_id]["status"] = status
        meta[doc_id]["chunk_count"] = chunk_count
        if status == "ready":
            meta[doc_id]["processed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        _save_meta(meta)

def list_documents() -> list[dict]:
    meta = _load_meta()
    return sorted(meta.values(), key=lambda d: d["uploaded_at"], reverse=True)

def delete_document(doc_id: str):
    meta = _load_meta()
    if doc_id in meta:
        del meta[doc_id]
        _save_meta(meta)

    try:
        collection = get_collection()
        collection.delete(where={"doc_id": doc_id})
    except Exception:
        pass
