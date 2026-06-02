import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getAssignments } from '../../../api/studentAssignments'
import type { StudentAssignmentItem } from '../../../types/api'

export default function StudentAssignmentsPage() {
  const [items, setItems] = useState<StudentAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{ course?: string; status?: string }>({})

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getAssignments(filter)
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filter])

  const courses = [...new Set(items.map((i) => i.course))]

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">📝 我的作业</h1>
        <p className="mt-1 text-sm text-slate-500">查看教师发布的作业并及时提交</p>
      </div>

      {/* 筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filter.status || ''}
          onChange={(e) =>
            setFilter((f) => ({ ...f, status: e.target.value || undefined }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部状态</option>
          <option value="open">进行中</option>
          <option value="closed">已关闭</option>
        </select>
        <select
          value={filter.course || ''}
          onChange={(e) =>
            setFilter((f) => ({ ...f, course: e.target.value || undefined }))
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部课程</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* 列表 */}
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
          <p className="text-4xl">📭</p>
          <p className="mt-2 text-sm text-slate-500">暂无作业</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/student/assignments/${item.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-800">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.course} · 截止：{new Date(item.due_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.submitted && (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                      已提交
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === 'open'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.status === 'open' ? '进行中' : '已关闭'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
