import json
import os
from datetime import datetime
from app.db.chroma_client import get_collection
from app.services.chunker import chunk_text
from app.demo.sample_docs import SAMPLE_DOCS

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "documents.json")

def seed_demo_data():
    collection = get_collection()

    try:
        existing = collection.get()
        if existing and existing.get("ids") and len(existing["ids"]) > 0:
            return
    except Exception:
        pass

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    meta = {}

    for i, doc in enumerate(SAMPLE_DOCS):
        doc_id = f"demo_{i:02d}"

        meta[doc_id] = {
            "id": doc_id,
            "filename": doc["filename"],
            "file_size": len(doc["content"].encode("utf-8")),
            "file_type": "txt",
            "status": "ready",
            "chunk_count": 0,
            "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        chunks = chunk_text(doc["content"], doc_id, doc["filename"])
        if not chunks:
            continue

        meta[doc_id]["chunk_count"] = len(chunks)

        ids = [f"{doc_id}_{c['metadata']['chunk_index']}" for c in chunks]
        documents_data = [c["content"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        collection.add(
            ids=ids,
            documents=documents_data,
            metadatas=metadatas,
        )

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return len(SAMPLE_DOCS)
