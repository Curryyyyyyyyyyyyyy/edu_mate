/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent } from 'react'
import {
  createDiscussion,
  createDiscussionReply,
  deleteDiscussion,
  deleteDiscussionReply,
  getDiscussion,
  getDiscussions,
  updateDiscussionStatus,
} from '../../../api/discussions'
import { getTeacherSections } from '../../../api/teacherSections'
import type { DiscussionDetail, DiscussionItem, DiscussionStatus, SectionItem } from '../../../types/api'

interface Props {
  courseId: string
}

export default function DiscussionsTab({ courseId }: Props) {
  const [items, setItems] = useState<DiscussionItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [selected, setSelected] = useState<DiscussionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [status, setStatus] = useState<'' | DiscussionStatus>('')
  const [sectionId, setSectionId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [createSectionId, setCreateSectionId] = useState('')
  const [reply, setReply] = useState('')
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
    getDiscussions(courseId, {
      status: status || undefined,
      section_id: sectionId || undefined,
    })
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .catch(() => {
        if (!cancelled) setError('讨论列表加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, status, sectionId, refreshKey])

  const loadDetail = async (discussionId: string) => {
    setError('')
    try {
      const res = await getDiscussion(courseId, discussionId)
      if (res.success) setSelected(res.data)
    } catch {
      setError('讨论详情加载失败')
    }
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('请填写讨论标题和内容')
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await createDiscussion(courseId, {
        title: title.trim(),
        content: content.trim(),
        section_id: createSectionId || undefined,
      })
      setTitle('')
      setContent('')
      setCreateSectionId('')
      setMessage('讨论已创建')
      setRefreshKey((key) => key + 1)
      if (res.success) await loadDetail(res.data.id)
    } catch {
      setError('讨论创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !reply.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createDiscussionReply(courseId, selected.id, reply.trim())
      setReply('')
      await loadDetail(selected.id)
      setRefreshKey((key) => key + 1)
    } catch {
      setError('回复发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (item: DiscussionItem | DiscussionDetail) => {
    const nextStatus: DiscussionStatus = item.status === 'open' ? 'closed' : 'open'
    try {
      await updateDiscussionStatus(courseId, item.id, nextStatus)
      setRefreshKey((key) => key + 1)
      if (selected?.id === item.id) await loadDetail(item.id)
    } catch {
      setError('讨论状态更新失败')
    }
  }

  const removeDiscussion = async (item: DiscussionItem | DiscussionDetail) => {
    if (!confirm(`确定删除讨论“${item.title}”吗？`)) return
    try {
      await deleteDiscussion(courseId, item.id)
      if (selected?.id === item.id) setSelected(null)
      setRefreshKey((key) => key + 1)
    } catch {
      setError('讨论删除失败')
    }
  }

  const removeReply = async (replyId: string) => {
    if (!selected || !confirm('确定删除这条回复吗？')) return
    try {
      await deleteDiscussionReply(courseId, selected.id, replyId)
      await loadDetail(selected.id)
      setRefreshKey((key) => key + 1)
    } catch {
      setError('回复删除失败')
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

        <form onSubmit={handleCreate} className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-800">创建讨论</h2>
          <div className="mb-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="讨论标题"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <select
              value={createSectionId}
              onChange={(event) => setCreateSectionId(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="">不关联小节</option>
              {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select>
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="讨论内容"
            rows={3}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <button disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? '提交中...' : '创建讨论'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(event) => setStatus(event.target.value as '' | DiscussionStatus)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">全部状态</option>
            <option value="open">开放中</option>
            <option value="closed">已关闭</option>
          </select>
          <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">全部小节</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">暂无讨论</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      {item.section_title && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.section_title}</span>}
                      <span className={`rounded px-2 py-0.5 text-xs ${item.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.status === 'open' ? '开放中' : '已关闭'}
                      </span>
                    </div>
                    <button onClick={() => loadDetail(item.id)} className="text-left font-medium text-slate-800 hover:text-blue-700">{item.title}</button>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.created_by.name} · {item.reply_count} 条回复 · {new Date(item.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => toggleStatus(item)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                      {item.status === 'open' ? '关闭' : '开放'}
                    </button>
                    <button onClick={() => removeDiscussion(item)} className="rounded border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-800">讨论详情</h2>
        {selected ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-medium text-slate-800">{selected.title}</h3>
                <button onClick={() => toggleStatus(selected)} className="rounded border px-2 py-1 text-xs text-slate-600">{selected.status === 'open' ? '关闭' : '开放'}</button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.content}</p>
            </div>
            <form onSubmit={handleReply} className="border-t border-slate-100 pt-4">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="回复讨论"
                rows={3}
                className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button disabled={submitting || selected.status === 'closed'} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">发送回复</button>
            </form>
            <div className="space-y-3 border-t border-slate-100 pt-4">
              {selected.replies.items.length === 0 ? (
                <p className="text-sm text-slate-500">暂无回复</p>
              ) : selected.replies.items.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-700">{item.author.name}{item.is_teacher ? '（教师）' : ''}</p>
                    <button onClick={() => removeReply(item.id)} className="text-xs text-red-500">删除</button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-600">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">选择一个讨论查看详情。</p>
        )}
      </aside>
    </div>
  )
}
