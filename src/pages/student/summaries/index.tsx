import { useEffect, useState, type FormEvent } from 'react'
import {
  getSummaries,
  createSummary,
  deleteSummary,
  getSummary,
} from '../../../api/summaries'
import type { SummaryListItem, SummaryDetail } from '../../../types/api'

export default function StudentSummariesPage() {
  const [items, setItems] = useState<SummaryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  // 创建表单
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [summaryType, setSummaryType] = useState<string>('structured')

  // 展开详情
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getSummaries()
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !sourceText.trim()) {
      setError('标题和内容不能为空')
      return
    }
    setError('')
    setCreating(true)
    try {
      await createSummary({
        title: title.trim(),
        course: course.trim() || undefined,
        source_text: sourceText.trim(),
        summary_type: summaryType as 'structured' | 'brief' | 'review',
      })
      setTitle('')
      setCourse('')
      setSourceText('')
      setShowCreate(false)
      setRefreshKey((k) => k + 1)
    } catch {
      setError('创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条总结吗？')) return
    await deleteSummary(id)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">📊 知识总结</h1>
          <p className="mt-1 text-sm text-slate-500">对课堂笔记和资料进行 AI 结构化总结</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {showCreate ? '取消' : '+ 新建总结'}
        </button>
      </div>

      {/* 创建表单 */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-blue-200 bg-blue-50/30 p-4"
        >
          {error && (
            <div className="mb-3 rounded bg-red-100 px-3 py-1.5 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="mb-3 flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="总结标题 *"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="课程名称（可选）"
              className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={summaryType}
              onChange={(e) => setSummaryType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="structured">结构化总结</option>
              <option value="brief">简要摘要</option>
              <option value="review">复习清单</option>
            </select>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="请输入待总结的课堂笔记、资料片段或知识主题 *"
            rows={5}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? '生成中...' : '生成总结'}
          </button>
        </form>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-2 text-sm text-slate-500">暂无知识总结，点击上方按钮创建</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300"
            >
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <div>
                  <h3 className="font-medium text-slate-800">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.course || '未分类'} ·{' '}
                    {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {expandedId === item.id ? '收起 ▲' : '展开 ▼'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    className="rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </div>
              {expandedId === item.id && (
                <ExpandedSummary id={item.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpandedSummary({ id }: { id: string }) {
  const [detail, setDetail] = useState<SummaryDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getSummary(id)
      .then((res) => {
        if (!cancelled && res.success) setDetail(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  const s = detail?.summary
  if (!s) return null

  return (
    <div className="border-t border-slate-100 px-4 py-4">
      <div className="space-y-4 text-sm">
        {s.overview && (
          <div>
            <p className="mb-1 font-medium text-slate-700">📖 概述</p>
            <p className="leading-relaxed text-slate-600">{s.overview}</p>
          </div>
        )}
        {s.key_points && s.key_points.length > 0 && (
          <div>
            <p className="mb-1 font-medium text-slate-700">✅ 要点</p>
            <ul className="list-inside list-disc space-y-0.5 text-slate-600">
              {s.key_points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {s.difficult_points && s.difficult_points.length > 0 && (
          <div>
            <p className="mb-1 font-medium text-slate-700">⚠️ 难点</p>
            <ul className="list-inside list-disc space-y-0.5 text-slate-600">
              {s.difficult_points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {s.review_tips && s.review_tips.length > 0 && (
          <div>
            <p className="mb-1 font-medium text-slate-700">💡 复习建议</p>
            <ul className="list-inside list-disc space-y-0.5 text-slate-600">
              {s.review_tips.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
