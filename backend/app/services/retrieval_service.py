from app.db.chroma_client import get_collection
from app.config import settings

async def retrieve_chunks(query: str, top_k: int | None = None) -> list[dict]:
    if top_k is None:
        top_k = settings.top_k

    collection = get_collection()

    results = collection.query(
        query_texts=[query],
        n_results=top_k,
    )

    chunks = []
    ids = results.get("ids") or []
    documents = results.get("documents") or []
    metadatas = results.get("metadatas") or []

    if ids and ids[0]:
        for i in range(len(ids[0])):
            meta = metadatas[0][i] if metadatas and metadatas[0] else {}
            chunks.append({
                "id": ids[0][i],
                "content": documents[0][i] if documents and documents[0] else "",
                "doc_name": meta.get("doc_name", "未知文档"),
                "chapter": meta.get("chapter", "未知章节"),
                "chunk_index": meta.get("chunk_index", 0),
            })
    return chunks
