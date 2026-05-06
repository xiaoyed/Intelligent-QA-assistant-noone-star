import { useState, useEffect } from 'react'
import { saveConfig, getConfigStatus, resetConfig } from '../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfigured: () => void
}

export default function SettingsModal({ isOpen, onClose, onConfigured }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.moonshot.cn/v1')
  const [model, setModel] = useState('moonshot-v1-8k')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<{ configured: boolean; api_key_masked: string; base_url: string; model: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      getConfigStatus().then(setStatus).catch(() => {})
    }
  }, [isOpen])

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const result = await saveConfig({ api_key: apiKey, base_url: baseUrl, model })
      setStatus(result)
      onConfigured()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '保存失败'
      setError(msg.includes('API') ? msg : '连接失败，请检查API Key和Base URL')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    await resetConfig()
    setApiKey('')
    setStatus(null)
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">API 配置</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status?.configured ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-700">已配置</p>
              <p className="text-xs text-green-600 mt-1">API Key: {status.api_key_masked}</p>
              <p className="text-xs text-green-600">Base URL: {status.base_url}</p>
              <p className="text-xs text-green-600">模型: {status.model}</p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              重置配置
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Base URL</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">模型</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
              参考 config.txt 文件获取配置信息
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {saving ? '验证中...' : '保存并验证'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
