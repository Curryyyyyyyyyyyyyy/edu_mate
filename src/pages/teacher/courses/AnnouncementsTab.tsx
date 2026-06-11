/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent } from 'react'
import {
  createAnnouncement,
  deleteAnnouncement,
  getTeacherAnnouncement,
  getTeacherAnnouncements,
  updateAnnouncement,
} from '../../../api/announcements'
import type { AnnouncementDetail, TeacherAnnouncementItem } from '../../../types/api'

interface Props {
  courseId: string
}

type TeacherAnnouncementDetail = AnnouncementDetail & {
  read_count?: number
  total_students?: number
}

const emptyForm = { title: '', content: '', is_pinned: false }

export default function AnnouncementsTab({ courseId }: Props) {
  const [items, setItems] = useState<TeacherAnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detail, setDetail] = useState<TeacherAnnouncementDetail | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getTeacherAnnouncements(courseId)
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .catch(() => {
        if (!cancelled) setError('公告列表加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, refreshKey])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const loadDetail = async (noticeId: string) => {
    const res = await getTeacherAnnouncement(courseId, noticeId)
    if (res.success) setDetail(res.data)
    return res
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('请填写公告标题和内容')
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      if (editingId) {
        await updateAnnouncement(courseId, editingId, {
          title: form.title.trim(),
          content: form.content.trim(),
          is_pinned: form.is_pinned,
        })
        setMessage('公告已更新')
        await loadDetail(editingId)
      } else {
        await createAnnouncement(courseId, {
          title: form.title.trim(),
          content: form.content.trim(),
          is_pinned: form.is_pinned,
        })
        setMessage('公告已发布')
      }
      resetForm()
      setRefreshKey((key) => key + 1)
    } catch {
      setError(editingId ? '公告更新失败' : '公告发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = async (item: TeacherAnnouncementItem) => {
    setMessage('')
    setError('')
    try {
      const res = await loadDetail(item.id)
      if (res.success) {
        setForm({
          title: res.data.title,
          content: res.data.content,
          is_pinned: res.data.is_pinned,
        })
        setEditingId(item.id)
      }
    } catch {
      setError('公告详情加载失败，暂时不能编辑')
    }
  }

  const openDetail = async (item: TeacherAnnouncementItem) => {
    setError('')
    try {
      await loadDetail(item.id)
    } catch {
      setError('公告详情加载失败')
    }
  }

  const togglePinned = async (item: TeacherAnnouncementItem) => {
    try {
      await updateAnnouncement(courseId, item.id, { is_pinned: !item.is_pinned })
      if (detail?.id === item.id) await loadDetail(item.id)
      setRefreshKey((key) => key + 1)
    } catch {
      setError('置顶状态更新失败')
    }
  }

  const handleDelete = async (item: TeacherAnnouncementItem) => {
    if (!confirm(`确定删除公告“${item.title}”吗？`)) return
    try {
      await deleteAnnouncement(courseId, item.id)
      if (detail?.id === item.id) setDetail(null)
      if (editingId === item.id) resetForm()
      setRefreshKey((key) => key + 1)
    } catch {
      setError('公告删除失败')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        {(error || message) && (
          <div className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {error || message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">{editingId ? '编辑公告' : '发布公告'}</h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700">
                取消编辑
              </button>
            )}
          </div>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="公告标题"
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <textarea
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            placeholder="公告内容"
            rows={4}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(event) => setForm((prev) => ({ ...prev, is_pinned: event.target.checked }))}
              />
              置顶公告
            </label>
            <button disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '提交中...' : editingId ? '保存公告' : '发布公告'}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">暂无公告</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      {item.is_pinned && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">置顶</span>}
                      <button onClick={() => openDetail(item)} className="truncate text-left font-medium text-slate-800 hover:text-blue-700">
                        {item.title}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      阅读 {item.read_count}/{item.total_students} · {new Date(item.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => togglePinned(item)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                      {item.is_pinned ? '取消置顶' : '置顶'}
                    </button>
                    <button onClick={() => startEdit(item)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">编辑</button>
                    <button onClick={() => handleDelete(item)} className="rounded border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-800">公告详情</h2>
        {detail ? (
          <div>
            <div className="mb-2 flex items-center gap-2">
              {detail.is_pinned && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">置顶</span>}
              <h3 className="font-medium text-slate-800">{detail.title}</h3>
            </div>
            <p className="mb-2 text-xs text-slate-400">{new Date(detail.created_at).toLocaleString('zh-CN')}</p>
            <p className="text-sm text-slate-500">
              阅读 {detail.read_count ?? 0}/{detail.total_students ?? 0}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{detail.content}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">选择一条公告查看内容。</p>
        )}
      </aside>
    </div>
  )
}
