export interface QuestionRequest {
  question: string
  conversation_id?: string
}

export interface SourceInfo {
  doc_name: string
  chapter: string
  content_snippet: string
  chunk_index: number
}

export interface AnswerResponse {
  question: string
  answer: string
  sources: SourceInfo[]
  reasoning_steps?: string[]
  response_time_ms: number
}

export interface DocumentInfo {
  id: string
  filename: string
  file_size: number
  file_type: string
  status: string
  chunk_count: number
  uploaded_at: string
  processed_at: string | null
}

export interface ChunkInfo {
  id: string
  doc_id: string
  content: string
  chapter: string
  chunk_index: number
}

export interface EvalMetrics {
  total_queries: number
  accuracy: number
  avg_response_time_ms: number
  miss_detection_rate: number
  truncation_rate: number
}

export interface HealthStatus {
  status: string
  llm_available: boolean
  configured?: boolean
  llm_source?: string | null
  mode: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceInfo[]
  reasoning_steps?: string[]
  response_time_ms?: number
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}
