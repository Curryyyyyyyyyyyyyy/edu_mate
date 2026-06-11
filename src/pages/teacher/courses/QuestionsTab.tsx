/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent } from 'react'
import {
  answerQuestion,
  deleteQuestion,
  getQuestion,
  getQuestions,
  updateQuestionVisibility,
} from '../../../api/questions'
import { getTeacherSections } from '../../../api/teacherSections'
import type {
  QuestionItem,
  QuestionStatus,
  QuestionVisibility,
  SectionItem,
} from '../../../types/api'

interface Props {
  courseId: string
}

export default function QuestionsTab({ courseId }: Props) {
  const [items, setItems] = useState<QuestionItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [selected, setSelected] = useState<QuestionItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [status, setStatus] = useState<'' | QuestionStatus>('')
  const [visibility, setVisibility] = useState<'' | QuestionVisibility>('')
  const [sectionId, setSectionId] = useState('')
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    getTeacherSections(courseId)
      .then((res) => {
        if (!cancelled && res.success) setSections(res.data.items)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [courseId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getQuestions(courseId, {
      status: status || undefined,
      visibility: visibility || undefined,
      section_id: sectionId || undefined,
    })
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .catch(() => {
        if (!cancelled) setError('问题列表加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, status, visibility, sectionId, refreshKey])

  const loadDetail = async (questionId: string) => {
    setError('')
    try {
      const res = await getQuestion(courseId, questionId)
      if (res.success) {
        setSelected(res.data)
        setAnswer(res.data.answer?.content || '')
      }
    } catch {
      setError('问题详情加载失败')
    }
  }

  const handleAnswer = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !answer.trim()) {
      setError('请填写回答内容')
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await answerQuestion(courseId, selected.id, answer.trim())
      setMessage('回答已保存')
      await loadDetail(selected.id)
      setRefreshKey((key) => key + 1)
    } catch {
      setError('回答保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleVisibility = async (item: QuestionItem) => {
    const next: QuestionVisibility = item.visibility === 'public' ? 'private' : 'public'
    try {
      await updateQuestionVisibility(courseId, item.id, next)
      setRefreshKey((key) => key + 1)
      if (selected?.id === item.id) await loadDetail(item.id)
    } catch {
      setError('可见性更新失败')
    }
  }

  const removeQuestion = async (item: QuestionItem) => {
    if (!confirm(`确定删除问题“${item.title}”吗？`)) return
    try {
      await deleteQuestion(courseId, item.id)
      if (selected?.id === item.id) setSelected(null)
      setRefreshKey((key) => key + 1)
    } catch {
      setError('问题删除失败')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-4">
        {(error || message) && (
          <div className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {error || message}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(event) => setStatus(event.target.value as '' | QuestionStatus)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="unanswered">未回答</option>
            <option value="answered">已回答</option>
          </select>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as '' | QuestionVisibility)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">全部可见性</option>
            <option value="public">公开</option>
            <option value="private">私密</option>
          </select>
          <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">全部小节</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">暂无问题</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {item.section_title && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.section_title}</span>}
                      <span className={`rounded px-2 py-0.5 text-xs ${item.status === 'answered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.status === 'answered' ? '已回答' : '未回答'}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.visibility === 'public' ? '公开' : '私密'}</span>
                    </div>
                    <button onClick={() => loadDetail(item.id)} className="text-left font-medium text-slate-800 hover:text-blue-700">{item.title}</button>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.asked_by.name} · {new Date(item.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => toggleVisibility(item)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                      设为{item.visibility === 'public' ? '私密' : '公开'}
                    </button>
                    <button onClick={() => removeQuestion(item)} className="rounded border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-800">问题详情</h2>
        {selected ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className={`rounded px-2 py-0.5 text-xs ${selected.status === 'answered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {selected.status === 'answered' ? '已回答' : '未回答'}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{selected.visibility === 'public' ? '公开' : '私密'}</span>
              </div>
              <h3 className="font-medium text-slate-800">{selected.title}</h3>
              {selected.content && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.content}</p>}
            </div>
            {selected.answer && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="mb-1 text-xs font-medium text-blue-700">当前回答</p>
                <p className="whitespace-pre-wrap text-sm text-blue-900">{selected.answer.content}</p>
              </div>
            )}
            <form onSubmit={handleAnswer} className="border-t border-slate-100 pt-4">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="填写教师回答"
                rows={5}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {submitting ? '保存中...' : selected.status === 'answered' ? '更新回答' : '提交回答'}
              </button>
            </form>
          </div>
        ) : (
          <p className="text-sm text-slate-500">选择一个问题查看并回答。</p>
        )}
      </aside>
    </div>
  )
}
