import { useEffect, useState, type FormEvent } from 'react'
import {
  getQuestions,
  getQuestion,
  createQuestion,
} from '../../../api/questions'
import type { QuestionItem, QuestionVisibility, QuestionStatus } from '../../../types/api'

interface Props {
  courseId: string
}

export default function QuestionsTab({ courseId }: Props) {
  const [items, setItems] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState<QuestionStatus | ''>('')

  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getQuestions(courseId, {
      status: filterStatus || undefined,
      visibility: 'public',
    })
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, refreshKey, filterStatus])

  if (selectedId) {
    return (
      <QuestionDetailView
        courseId={courseId}
        questionId={selectedId}
        onBack={() => {
          setSelectedId(null)
          setRefreshKey((k) => k + 1)
        }}
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">共 {items.length} 个问题</p>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as QuestionStatus | '')}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs transition-colors focus:border-blue-400 focus:outline-none"
          >
            <option value="">全部</option>
            <option value="unanswered">未回答</option>
            <option value="answered">已回答</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {showCreate ? '取消' : '＋ 提问'}
        </button>
      </div>

      {showCreate && (
        <CreateQuestionForm
          courseId={courseId}
          onCreated={() => {
            setShowCreate(false)
            setRefreshKey((k) => k + 1)
          }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-3xl">❓</p>
          <p className="mt-2 text-sm text-slate-500">暂无问答，点击上方按钮提问</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-800">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.asked_by.name} · {new Date(item.created_at).toLocaleDateString('zh-CN')}
                    {item.section_title ? ` · ${item.section_title}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.visibility === 'private' && (
                    <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-600">
                      私密
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === 'answered'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}
                  >
                    {item.status === 'answered' ? '已回答' : '待回答'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 创建问题表单 ──

function CreateQuestionForm({
  courseId,
  onCreated,
}: {
  courseId: string
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<QuestionVisibility>('public')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('问题标题不能为空')
      return
    }
    setError('')
    setCreating(true)
    try {
      await createQuestion(courseId, {
        title: title.trim(),
        content: content.trim() || undefined,
        visibility,
      })
      onCreated()
    } catch {
      setError('提问失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
      {error && (
        <div className="mb-3 rounded bg-red-100 px-3 py-1.5 text-sm text-red-600">{error}</div>
      )}
      <div className="mb-3 flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="问题标题 *"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as QuestionVisibility)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none"
        >
          <option value="public">公开</option>
          <option value="private">私密</option>
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="补充描述（可选）"
        rows={3}
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <p className="mb-3 text-xs text-slate-400">
        💡 私密问题仅你和老师可见
      </p>
      <button
        type="submit"
        disabled={creating}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {creating ? '提交中...' : '提交问题'}
      </button>
    </form>
  )
}

// ── 问题详情视图 ──

function QuestionDetailView({
  courseId,
  questionId,
  onBack,
}: {
  courseId: string
  questionId: string
  onBack: () => void
}) {
  const [question, setQuestion] = useState<QuestionItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getQuestion(courseId, questionId)
      .then((res) => {
        if (!cancelled && res.success) setQuestion(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, questionId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-1/4 rounded bg-slate-200" />
        <div className="h-32 rounded bg-slate-100" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">问题不存在</p>
        <button onClick={onBack} className="mt-2 text-sm text-blue-600 hover:underline">返回列表</button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
      >
        <svg className="mr-1 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回问题列表
      </button>

      {/* 问题内容 */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{question.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {question.asked_by.name} · {new Date(question.created_at).toLocaleString('zh-CN')}
              {question.section_title ? ` · ${question.section_title}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {question.visibility === 'private' && (
              <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-600">
                私密
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                question.status === 'answered'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-orange-50 text-orange-600'
              }`}
            >
              {question.status === 'answered' ? '已回答' : '待回答'}
            </span>
          </div>
        </div>

        {question.content && (
          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {question.content}
          </div>
        )}
      </div>

      {/* 回答 */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-slate-700">💡 老师回答</h3>
        {question.answer ? (
          <div className="rounded-lg border border-green-100 bg-green-50/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {question.answer.answered_by.name}
              </span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                教师
              </span>
              <span className="text-xs text-slate-400">
                {new Date(question.answer.answered_at).toLocaleString('zh-CN')}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {question.answer.content}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-400">老师暂未回答，请耐心等待</p>
          </div>
        )}
      </div>
    </div>
  )
}
