import axios from 'axios'
import type { AnswerResponse, DocumentInfo, EvalMetrics, HealthStatus } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

export async function checkHealth(): Promise<HealthStatus> {
  const { data } = await api.get('/health')
  return data
}

export async function askQuestion(question: string): Promise<AnswerResponse> {
  const { data } = await api.post('/chat/ask', { question })
  return data
}

export async function uploadDocument(file: File, onProgress?: (pct: number) => void): Promise<{ doc_id: string; status: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/knowledge/upload', formData, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return data
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  const { data } = await api.get('/knowledge/documents')
  return data.documents
}

export async function deleteDocument(docId: string): Promise<void> {
  await api.delete(`/knowledge/documents/${docId}`)
}

export async function getMetrics(): Promise<EvalMetrics> {
  const { data } = await api.get('/eval/metrics')
  return data
}

interface ConfigPayload {
  api_key: string
  base_url: string
  model: string
}

interface ConfigStatus {
  configured: boolean
  api_key_masked: string
  base_url: string
  model: string
}

export async function saveConfig(payload: ConfigPayload): Promise<ConfigStatus> {
  const { data } = await api.post('/config/save', payload)
  return data
}

export async function getConfigStatus(): Promise<ConfigStatus> {
  const { data } = await api.get('/config/status')
  return data
}

export async function resetConfig(): Promise<void> {
  await api.post('/config/reset')
}

interface DocContent {
  doc_id: string
  filename: string
  content: string
}

export async function getDocumentContent(docId: string): Promise<DocContent> {
  const { data } = await api.get(`/knowledge/documents/${docId}/content`)
  return data
}
