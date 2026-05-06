import os
import asyncio
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.chat import UploadResponse, DocumentListResponse, DocumentInfo
from app.services.knowledge_service import (
    add_document, update_document_status, list_documents, delete_document
)
from app.services.document_parser import parse_docx, parse_pdf, parse_txt
from app.services.chunker import chunk_text
from app.db.chroma_client import get_collection
from app.config import settings

router = APIRouter()
ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 20 * 1024 * 1024

@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail=f"不支持的文件类型: {ext}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail="文件大小超过20MB限制")

    doc_id = add_document(
        filename=file.filename or "unknown",
        file_size=len(content),
        file_type=ext.lstrip("."),
    )

    asyncio.create_task(_process_document(doc_id, content, ext))
    return UploadResponse(doc_id=doc_id, status="processing")

async def _process_document(doc_id: str, content: bytes, ext: str):
    try:
        if ext == ".docx":
            text = parse_docx(content)
        elif ext == ".pdf":
            text = parse_pdf(content)
        else:
            text = parse_txt(content)
    except Exception:
        update_document_status(doc_id, "error")
        return

    if not text.strip():
        update_document_status(doc_id, "error")
        return

    doc_name = _get_doc_name(doc_id)
    chunks = chunk_text(text, doc_id, doc_name)

    if not chunks:
        update_document_status(doc_id, "error")
        return

    collection = get_collection()
    ids = [f"{doc_id}_{c['metadata']['chunk_index']}" for c in chunks]
    documents = [c["content"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]

    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
    )

    update_document_status(doc_id, "ready", chunk_count=len(chunks))

def _get_doc_name(doc_id: str) -> str:
    docs = list_documents()
    for d in docs:
        if d["id"] == doc_id:
            return d["filename"]
    return "未知文档"

@router.get("/documents", response_model=DocumentListResponse)
async def get_documents():
    docs = list_documents()
    return DocumentListResponse(
        documents=[DocumentInfo(**d) for d in docs]
    )

@router.delete("/documents/{doc_id}")
async def remove_document(doc_id: str):
    delete_document(doc_id)
    return {"success": True}

@router.post("/reprocess/{doc_id}")
async def reprocess_document(doc_id: str):
    return {"doc_id": doc_id, "status": "未找到文件，请重新上传"}

@router.get("/documents/{doc_id}/content")
async def get_document_content(doc_id: str):
    collection = get_collection()
    try:
        results = collection.get(where={"doc_id": doc_id})
    except Exception:
        return {"doc_id": doc_id, "content": "", "filename": "未知"}

    if not results or not results.get("ids"):
        return {"doc_id": doc_id, "content": "", "filename": "未知"}

    docs = list_documents()
    filename = next((d["filename"] for d in docs if d["id"] == doc_id), "未知文档")

    documents = results.get("documents") or []
    metadatas = results.get("metadatas") or []

    chunks_with_index = []
    for i, (doc_text, meta) in enumerate(zip(documents, metadatas)):
        if not meta:
            meta = {}
        chunks_with_index.append((meta.get("chunk_index", i), doc_text))

    chunks_with_index.sort(key=lambda x: x[0])
    content = "\n\n".join(c[1] for c in chunks_with_index)

    return {"doc_id": doc_id, "filename": filename, "content": content}
