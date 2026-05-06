import { create } from 'zustand'
import type { DocumentInfo } from '../types'

interface KnowledgeState {
  documents: DocumentInfo[]
  isLoading: boolean
  setDocuments: (docs: DocumentInfo[]) => void
  setLoading: (loading: boolean) => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  documents: [],
  isLoading: false,
  setDocuments: (docs) => set({ documents: docs }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
