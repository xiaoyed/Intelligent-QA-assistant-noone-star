import { useState, useEffect, useRef } from 'react'
import { uploadDocument, listDocuments, deleteDocument, getDocumentContent } from '../services/api'
import { useKnowledgeStore } from '../store/knowledgeStore'

interface UploadItem {
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
}

export default function KnowledgePage() {
  const { documents, isLoading, setDocuments, setLoading } = useKnowledgeStore()
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewDoc, setViewDoc] = useState<{ filename: string; content: string } | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const docs = await listDocuments()
      setDocuments(docs)
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const items: UploadItem[] = Array.from(files).map((file) => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }))
    setUploadItems((prev) => [...prev, ...items])

    for (let i = 0; i < items.length; i++) {
      const idx = uploadItems.length + i
      try {
        await uploadDocument(items[i].file, (pct) => {
          setUploadItems((prev) => {
            const updated = [...prev]
            if (updated[idx]) {
              updated[idx] = { ...updated[idx], progress: pct }
            }
            return updated
          })
        })
        setUploadItems((prev) => {
          const updated = [...prev]
          if (updated[idx]) {
            updated[idx] = { ...updated[idx], status: 'done' }
          }
          return updated
        })
      } catch {
        setUploadItems((prev) => {
          const updated = [...prev]
          if (updated[idx]) {
            updated[idx] = { ...updated[idx], status: 'error' }
          }
          return updated
        })
      }
    }

    setUploadItems((prev) => prev.filter((item) => item.status === 'uploading'))
    await loadDocuments()
  }

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId)
      await loadDocuments()
    } catch {
      console.error('删除失败')
    }
  }

  const handleView = async (docId: string, filename: string) => {
    try {
      const result = await getDocumentContent(docId)
      setViewDoc({ filename: result.filename, content: result.content })
    } catch {
      console.error('加载文档内容失败')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      ready: { label: '已完成', className: 'bg-green-50 text-green-700' },
      processing: { label: '处理中', className: 'bg-blue-50 text-blue-700' },
      error: { label: '失败', className: 'bg-red-50 text-red-700' },
    }
    const info = map[status] || { label: status, className: 'bg-slate-50 text-slate-600' }
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.className}`}>
        {info.label}
      </span>
    )
  }

  return (
    <div className="h-full max-w-5xl mx-auto flex flex-col px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">知识库管理</h2>
          <p className="text-sm text-slate-400 mt-0.5">上传工程规范文档，系统自动清洗并建立语义索引</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          上传文档
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {uploadItems.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploadItems.map((item, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{item.file.name}</p>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === 'error' ? 'bg-red-400' : item.status === 'done' ? 'bg-green-400' : 'bg-primary-500'
                    }`}
                    style={{ width: `${item.status === 'error' ? 100 : item.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {item.status === 'error' ? '失败' : item.status === 'done' ? '✓' : `${item.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">文件名</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">大小</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">类型</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">状态</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">语义块数</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">上传时间</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-slate-400">暂无文档，点击上传按钮添加规范文件</p>
                    <p className="text-xs text-slate-300">支持 PDF、Word、TXT 格式</p>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 font-medium">{doc.filename}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatSize(doc.file_size)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 uppercase">{doc.file_type}</td>
                  <td className="px-4 py-3">{statusBadge(doc.status)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{doc.chunk_count}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{doc.uploaded_at}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(doc.id, doc.filename)}
                        className="text-xs text-primary-500 hover:text-primary-700 transition-colors"
                      >
                        查看
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">{viewDoc.filename}</h3>
              <button onClick={() => setViewDoc(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                {viewDoc.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
