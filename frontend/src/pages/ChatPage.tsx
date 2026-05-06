import { useState, useRef, useEffect } from 'react'
import { askQuestion } from '../services/api'
import { useChatStore } from '../store/chatStore'
import type { ChatMessage } from '../types'
import ChatBubble from '../components/ChatBubble'

const DEMO_QUESTIONS = [
  '高速铁路桥梁墩身混凝土最低强度等级是多少？',
  '隧道衬砌的抗渗等级要求是什么？',
  '无砟轨道的轨距允许偏差是多少？',
  '桥梁支座的设计使用年限是多少年？',
]

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [convToDelete, setConvToDelete] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const editValueRef = useRef('')

  const {
    conversations,
    activeId,
    mode,
    getMessages,
    createConversation,
    deleteConversation,
    switchConversation,
    addMessage,
    updateConversationTitle,
  } = useChatStore()

  const messages = getMessages()
  const isDemo = mode !== 'live'
  const activeConv = conversations.find(c => c.id === activeId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      setTimeout(() => editInputRef.current?.focus(), 0)
    }
  }, [editingId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingId) {
        const target = e.target as HTMLElement
        const editingElement = document.querySelector(`[data-editing-id="${editingId}"]`)
        if (editingElement && !editingElement.contains(target)) {
          saveEdit()
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [editingId])

  const saveEdit = () => {
    const value = editValueRef.current
    if (editingId && value.trim()) {
      updateConversationTitle(editingId, value.trim())
    }
    editValueRef.current = ''
    setEditingId(null)
    setEditValue('')
  }

  const handleDoubleClick = (e: React.MouseEvent, convId: string, title: string) => {
    e.stopPropagation()
    editValueRef.current = title
    setEditingId(convId)
    setEditValue(title)
  }

  const handleSubmit = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    addMessage(userMsg)
    setLoading(true)

    try {
      const result = await askQuestion(trimmed)
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toISOString(),
        sources: result.sources,
        reasoning_steps: result.reasoning_steps ?? undefined,
      }
      addMessage(botMsg)
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，服务暂时不可用。请检查后端服务是否正常启动。',
        timestamp: new Date().toISOString(),
      }
      addMessage(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(input)
      setInput('')
    }
  }

  const handleNewConv = () => {
    createConversation()
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const confirmDelete = (id: string) => {
    deleteConversation(id)
    setConvToDelete(null)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className={`fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200 flex flex-col z-10 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-0 border-r-0'
      }`}>
        <div className="p-3 border-b border-slate-100 shrink-0">
          <button
            onClick={handleNewConv}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              data-editing-id={editingId === conv.id ? conv.id : undefined}
              className={`group flex items-center gap-1 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                conv.id === activeId
                  ? 'bg-slate-100'
                  : 'hover:bg-slate-50'
              }`}
              onClick={() => !editingId && switchConversation(conv.id)}
              onDoubleClick={(e) => handleDoubleClick(e, conv.id, conv.title)}
            >
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div className="flex-1 min-w-0">
                {editingId === conv.id ? (
                  <input
                    ref={editInputRef}
                    className="w-full text-sm bg-transparent border-b border-blue-400 outline-none text-slate-800 font-medium px-0 py-0"
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value)
                      editValueRef.current = e.target.value
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                        saveEdit()
                      }
                      if (e.key === 'Escape') {
                        setEditingId(null)
                        setEditValue('')
                      }
                    }}
                  />
                ) : (
                  <>
                    <p className={`text-sm truncate ${conv.id === activeId ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                      {conv.title}
                    </p>
                    <p className="text-xs text-slate-400">{formatTime(conv.updatedAt)}</p>
                  </>
                )}
              </div>
              {editingId !== conv.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setConvToDelete(conv.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 text-center text-xs text-slate-400 shrink-0">
          {conversations.length} 个对话
        </div>
      </aside>

      <div className={`fixed left-0 top-0 bottom-0 z-20 transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-0'}`}>
        {!sidebarOpen && (
          <div className="shrink-0 w-10 flex flex-col items-center pt-3 bg-white border-r border-slate-200 h-full">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="展开对话列表"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <main className={`flex-1 flex flex-col min-w-0 bg-white transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-10'}`}>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
                <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                {activeConv?.title || '轨道交通工程规范智能问答'}
              </h2>
              <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                {isDemo
                  ? 'Demo 演示模式 — 基于 RAG 技术检索工程规范，点击下方示例问题体验知识库检索能力'
                  : '基于 RAG 检索增强生成技术，输入工程问题获取规范参数与设计要求'}
              </p>

              {isDemo && (
                <div className="space-y-4 w-full max-w-md">
                  <div className="grid grid-cols-1 gap-2">
                    {DEMO_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmit(q)}
                        className="text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-all duration-200 group"
                      >
                        <span className="group-hover:translate-x-1 transition-transform inline-block">
                          {q}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-left">
                    <p className="text-sm font-medium text-blue-800 mb-1">想要自由提问？</p>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      点击页面顶部的
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded text-xs font-medium text-blue-700 mx-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        配置 API
                      </span>
                      按钮接入 Kimi 大模型，即可自由提问任何工程问题
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                    <svg className="w-4 h-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isDemo ? 'Demo 模式下可点击上方示例问题体验' : '输入工程问题，如：桥梁墩身混凝土强度等级...'}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all duration-200 pr-12"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => {
                handleSubmit(input)
                setInput('')
              }}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-sm font-medium transition-all duration-200 shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              发送
            </button>
          </div>
          {isDemo && (
            <p className="text-center text-xs text-slate-400 mt-2">
              当前为 Demo 模式，自由提问需配置 API ·
              <span className="text-blue-500 cursor-pointer hover:underline ml-1" onClick={() => {
                const btn = document.querySelector('.flex.items-center.gap-2.px-3.py-1\\.5')
                if (btn instanceof HTMLElement) btn.click()
              }}>
                前往配置
              </span>
            </p>
          )}
        </div>
      </main>

      {convToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConvToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">删除对话</h3>
            <p className="text-sm text-slate-500 mb-5">确定要删除这个对话吗？删除后无法恢复。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConvToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => confirmDelete(convToDelete)}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
