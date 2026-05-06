import { create } from 'zustand'
import type { Conversation, ChatMessage } from '../types'

const STORAGE_KEY = 'rail_chat_conversations'
const ACTIVE_KEY = 'rail_chat_active_id'

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch {}
}

function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch { return null }
}

function saveActiveId(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id)
  } catch {}
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function ensureDefault(convs: Conversation[]): Conversation[] {
  if (convs.length === 0) {
    convs.push({
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
  return convs
}

interface ChatState {
  conversations: Conversation[]
  activeId: string | null
  isLoading: boolean
  mode: string
  getActiveConversation: () => Conversation | undefined
  getMessages: () => ChatMessage[]
  createConversation: () => string
  deleteConversation: (id: string) => void
  switchConversation: (id: string) => void
  addMessage: (msg: ChatMessage) => void
  updateConversationTitle: (id: string, title: string) => void
  setLoading: (loading: boolean) => void
  setMode: (mode: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set, get) => {
  const stored = loadConversations()
  const initial = ensureDefault([...stored])
  const activeId = loadActiveId()
  const validActiveId = initial.find(c => c.id === activeId) ? activeId : initial[0].id

  saveConversations(initial)
  saveActiveId(validActiveId!)

  return {
    conversations: initial,
    activeId: validActiveId,
    isLoading: false,
    mode: 'demo',

    getActiveConversation: () => {
      const { conversations, activeId } = get()
      return conversations.find(c => c.id === activeId)
    },

    getMessages: () => {
      const conv = get().getActiveConversation()
      return conv?.messages ?? []
    },

    createConversation: () => {
      const id = generateId()
      const conv: Conversation = {
        id,
        title: '新对话',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set(state => {
        const updated = [conv, ...state.conversations]
        saveConversations(updated)
        saveActiveId(id)
        return { conversations: updated, activeId: id }
      })
      return id
    },

    deleteConversation: (id) => {
      set(state => {
        let updated = state.conversations.filter(c => c.id !== id)
        updated = ensureDefault(updated)
        const newActiveId = state.activeId === id ? updated[0].id : state.activeId
        saveConversations(updated)
        saveActiveId(newActiveId!)
        return { conversations: updated, activeId: newActiveId }
      })
    },

    switchConversation: (id) => {
      if (get().conversations.find(c => c.id === id)) {
        saveActiveId(id)
        set({ activeId: id })
      }
    },

    addMessage: (msg) => {
      set(state => {
        const updated = state.conversations.map(c => {
          if (c.id === state.activeId) {
            const title = c.messages.length === 0 && msg.role === 'user'
              ? msg.content.slice(0, 30) + (msg.content.length > 30 ? '...' : '')
              : c.title
            return {
              ...c,
              title,
              messages: [...c.messages, msg],
              updatedAt: new Date().toISOString(),
            }
          }
          return c
        })
        saveConversations(updated)
        return { conversations: updated }
      })
    },

    updateConversationTitle: (id, title) => {
      set(state => {
        const updated = state.conversations.map(c => {
          if (c.id === id) {
            return { ...c, title, updatedAt: new Date().toISOString() }
          }
          return c
        })
        saveConversations(updated)
        return { conversations: updated }
      })
    },

    setLoading: (loading) => set({ isLoading: loading }),

    setMode: (mode) => set({ mode }),

    clearMessages: () => {
      set(state => {
        const updated = state.conversations.map(c => {
          if (c.id === state.activeId) {
            return { ...c, messages: [], title: '新对话', updatedAt: new Date().toISOString() }
          }
          return c
        })
        saveConversations(updated)
        return { conversations: updated }
      })
    },
  }
})
