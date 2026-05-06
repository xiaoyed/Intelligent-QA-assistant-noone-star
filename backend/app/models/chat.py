from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QuestionRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None

class SourceInfo(BaseModel):
    doc_name: str
    chapter: str
    content_snippet: str
    chunk_index: int

class AnswerResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceInfo]
    reasoning_steps: Optional[List[str]] = None
    response_time_ms: float

class DocumentInfo(BaseModel):
    id: str
    filename: str
    file_size: int
    file_type: str
    status: str
    chunk_count: int
    uploaded_at: str
    processed_at: Optional[str] = None

class ChunkInfo(BaseModel):
    id: str
    doc_id: str
    content: str
    chapter: str
    chunk_index: int

class EvalMetrics(BaseModel):
    total_queries: int
    accuracy: float
    avg_response_time_ms: float
    miss_detection_rate: float
    truncation_rate: float

class UploadResponse(BaseModel):
    doc_id: str
    status: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
