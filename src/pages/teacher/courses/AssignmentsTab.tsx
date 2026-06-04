import { useEffect, useState } from 'react'
import { getTeacherAssignments, getTeacherAssignmentDetail, closeAssignment } from '../../../api/teacherAssignments'
import type { TeacherAssignmentItem, TeacherAssignmentDetail } from '../../../types/api'

interface Props { courseId: string }

export default function AssignmentsTab({ courseId }: Props) {
  const [items, setItems] = useState<TeacherAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<TeacherAssignmentDetail | null>(null)
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getTeacherAssignments(courseId, { status: filterStatus || undefined })
      .then((res) => { if (!cancelled && res.success) setItems(res.data.items) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, filterStatus, refreshKey])

  const openDetail = async (asgId: string) => {
    try {
      const res = await getTeacherAssignmentDetail(courseId, asgId)
      if (res.success) setSelected(res.data)
    } catch { /* ignore */ }
  }

  const handleClose = async (asgId: string) => {
    if (!confirm('确定关闭该作业吗？关闭后学生将无法继续提交。')) return
    try { await closeAssignment(courseId, asgId); setRefreshKey((k) => k + 1) } catch { /* ignore */ }
  }

  if (selected) {
    const progress = selected.total_students > 0 ? Math.round((selected.submission_count / selected.total_students) * 100) : 0
    return (
      <div>
        <button onClick={() => setSelected(null)} className="mb-4 text-sm text-blue-600 hover:text-blue-700">← 返回作业列表</button>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{selected.title}</h1>
              <p className="mt-1 text-sm text-slate-500">
                截止：{new Date(selected.due_at).toLocaleString('zh-CN')} · 满分：{selected.full_score} · {selected.status === 'open' ? '进行中' : '已关闭'}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${selected.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {selected.status === 'open' ? '进行中' : '已关闭'}
            </span>
          </div>

          {selected.description && (
            <div className="mb-4"><h3 className="mb-1 text-sm font-medium text-slate-700">📄 作业要求</h3><p className="whitespace-pre-wrap text-sm text-slate-600">{selected.description}</p></div>
          )}
          {selected.reference_answer && (
            <div className="mb-4"><h3 className="mb-1 text-sm font-medium text-slate-700">📌 参考答案</h3><p className="whitespace-pre-wrap text-sm text-slate-600">{selected.reference_answer}</p></div>
          )}
          {selected.rubric && (
            <div className="mb-4"><h3 className="mb-1 text-sm font-medium text-slate-700">📏 评分标准</h3><p className="text-sm text-slate-600">{selected.rubric}</p></div>
          )}

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">📊 提交进度</p>
              <p className="text-sm text-slate-600">{selected.submission_count}/{selected.total_students} · {progress}%</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
          <option value="">全部状态</option>
          <option value="open">进行中</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"><div className="mb-2 h-5 w-3/4 rounded bg-slate-200" /><div className="h-4 w-1/2 rounded bg-slate-100" /></div>))}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">📭</p><p className="mt-2 text-sm text-slate-500">暂无作业</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const progress = item.total_students > 0 ? Math.round((item.submission_count / item.total_students) * 100) : 0
            return (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.section_title && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.section_title}</span>}
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${item.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.status === 'open' ? '进行中' : '已关闭'}
                      </span>
                    </div>
                    <button onClick={() => openDetail(item.id)} className="text-left font-medium text-slate-800 hover:text-blue-700">{item.title}</button>
                    <div className="mt-1 flex gap-4 text-xs text-slate-500">
                      <span>截止：{new Date(item.due_at).toLocaleString('zh-CN')}</span>
                      <span>提交：{item.submission_count}/{item.total_students}</span>
                      <span>满分：{item.full_score}</span>
                    </div>
                    <div className="mt-2 max-w-md">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => openDetail(item.id)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">详情</button>
                    {item.status === 'open' && (
                      <button onClick={() => handleClose(item.id)} className="rounded border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">关闭</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
