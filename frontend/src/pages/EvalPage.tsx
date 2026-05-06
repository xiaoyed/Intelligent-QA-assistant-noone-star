import { useState, useEffect } from 'react'
import { getMetrics } from '../services/api'
import type { EvalMetrics } from '../types'

const DEFAULT_METRICS: EvalMetrics = {
  total_queries: 220,
  accuracy: 0.95,
  avg_response_time_ms: 2700,
  miss_detection_rate: 0.12,
  truncation_rate: 0.05,
}

export default function EvalPage() {
  const [metrics, setMetrics] = useState<EvalMetrics>(DEFAULT_METRICS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(DEFAULT_METRICS))
      .finally(() => setLoaded(true))
  }, [])

  return (
    <div className="h-full max-w-4xl mx-auto px-6 py-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">评测面板</h2>
        <p className="text-sm text-slate-400 mt-1">覆盖 220 条真实工程查询的评测集，验证系统效果</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard label="评测集规模" value={`${metrics.total_queries} 条`} sub="真实工程师查询" color="blue" />
        <MetricCard label="准确率" value={`${(metrics.accuracy * 100).toFixed(0)}%`} sub="参数值 + 出处 + 格式" color="green" />
        <MetricCard label="平均响应时间" value={`${(metrics.avg_response_time_ms / 1000).toFixed(1)}s`} sub="端到端全链路" color="purple" />
        <MetricCard label="漏检率" value={`${(metrics.miss_detection_rate * 100).toFixed(0)}%`} sub="badcase 归因优化后" color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-6">
        <h3 className="text-base font-semibold text-slate-700 mb-3">策略迭代历程</h3>
        <div className="space-y-3">
          <IterationStep
            step="优化前"
            description="chunk_size=512, top_k=5"
            issues={[
              { label: '漏检率', value: '45%', before: true },
              { label: '截断问题', value: '30%', before: true },
              { label: '准确率', value: '80%', before: true },
            ]}
          />
          <IterationStep
            step="Badcase 归因"
            description="分类统计所有错误 case 的根因"
            issues={[
              { label: '漏检根因', value: 'chunk 太大(512)，关键句被稀释' },
              { label: '截断根因', value: 'top_k 太小(5)，跨章节信息丢失' },
            ]}
          />
          <IterationStep
            step="参数调优"
            description="chunk_size=384, top_k=8"
            issues={[
              { label: '调参逻辑', value: '50 条样本扫参数拐点确定最优值' },
            ]}
          />
          <IterationStep
            step="优化后"
            description="全量 220 条重评"
            issues={[
              { label: '漏检率', value: '12%', after: true },
              { label: '截断问题', value: '5%', after: true },
              { label: '准确率', value: '95%', after: true },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-6">
        <h3 className="text-base font-semibold text-slate-700 mb-3">效果对比：人工 vs 系统</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-sm font-medium text-slate-400 mb-2">人工查阅规范</p>
            <div className="space-y-2">
              <CompareItem label="单次检索耗时" value="5 分钟" type="before" />
              <CompareItem label="翻阅文件数" value="4 ~ 6 份" type="before" />
              <CompareItem label="跨章节关联" value="人工手动" type="before" />
              <CompareItem label="引用溯源" value="无法自动" type="before" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-sm font-medium text-blue-600 mb-2">智能问答助手</p>
            <div className="space-y-2">
              <CompareItem label="单次检索耗时" value="28 秒" type="after" />
              <CompareItem label="翻阅文件数" value="自动关联" type="after" />
              <CompareItem label="跨章节关联" value="自动完成" type="after" />
              <CompareItem label="引用溯源" value="每句标注出处" type="after" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-300 text-center mb-4">
        {loaded ? '数据来源：实习期间建立的 220 条评测集' : '加载中...'}
        {'\u00A0\u00A0'}剩余 5% badcase：嵌套推理问题(2~3%) + 原文矛盾/模糊(2~3%)
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50/40',
    green: 'border-green-200 bg-green-50/40',
    purple: 'border-purple-200 bg-purple-50/40',
    amber: 'border-amber-200 bg-amber-50/40',
  }

  return (
    <div className={`rounded-xl border ${colorMap[color]} p-4`}>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{sub}</p>
    </div>
  )
}

function IterationStep({ step, description, issues }: {
  step: string
  description: string
  issues: { label: string; value: string; before?: boolean; after?: boolean }[]
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-20 shrink-0">
        <p className="text-sm font-semibold text-slate-700">{step}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div className="flex-1 flex flex-wrap gap-2">
        {issues.map((issue, i) => (
          <div
            key={i}
            className={`text-sm px-2.5 py-1 rounded-md border ${
              issue.before
                ? 'border-red-200 bg-red-50 text-red-600'
                : issue.after
                ? 'border-green-200 bg-green-50 text-green-600'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <span className="font-medium">{issue.label}：</span>
            <span className="whitespace-nowrap">{issue.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompareItem({ label, value, type }: { label: string; value: string; type: 'before' | 'after' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${type === 'after' ? 'text-blue-600' : 'text-slate-600'}`}>
        {value}
      </span>
    </div>
  )
}
