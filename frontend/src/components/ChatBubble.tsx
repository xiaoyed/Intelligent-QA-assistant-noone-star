import type { ChatMessage } from '../types'

interface Props {
  message: ChatMessage
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      )}

      <div className={`max-w-[78%] ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 leading-relaxed ${
          isUser
            ? 'bg-slate-900 text-white rounded-br-md'
            : 'bg-white border border-slate-200 rounded-bl-md shadow-sm'
        }`}>
          <div className={`text-sm whitespace-pre-wrap break-words ${isUser ? 'text-white/90' : 'text-slate-700'}`}>
            {message.content}
          </div>
        </div>

        {message.reasoning_steps && message.reasoning_steps.length > 0 && (
          <div className="mt-2.5 ml-1">
            <details className="group">
              <summary className="text-xs font-medium text-amber-600 cursor-pointer hover:text-amber-700 transition-colors flex items-center gap-1 select-none">
                <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                CoT 推理过程
              </summary>
              <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl space-y-2.5">
                {message.reasoning_steps.map((step, i) => (
                  <div key={i} className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">
                    {step}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 ml-1">
            <details className="group">
              <summary className="text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-500 transition-colors flex items-center gap-1 select-none">
                <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                引用来源 ({message.sources.length})
              </summary>
              <div className="mt-1.5 space-y-1">
                {message.sources.map((src, i) => (
                  <div key={i} className="text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-medium text-slate-600">{src.doc_name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-400">{src.chapter}</span>
                    </div>
                    <p className="text-slate-400 line-clamp-2">{src.content_snippet}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {message.response_time_ms && !isUser && (
          <p className="text-xs text-slate-300 mt-1 ml-1">
            {message.response_time_ms >= 1000
              ? `${(message.response_time_ms / 1000).toFixed(1)}s`
              : `${Math.round(message.response_time_ms)}ms`}
          </p>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-slate-300 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  )
}
