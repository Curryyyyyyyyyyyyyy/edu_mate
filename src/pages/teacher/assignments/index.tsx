import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  closeAssignment,
  getTeacherAssignments,
} from '../../../api/teacherAssignments'
import type { TeacherAssignmentItem } from '../../../types/api'

type AssignmentStatusFilter = '' | 'open' | 'closed'

const statusOptions: Array<{ label: string; value: AssignmentStatusFilter }> = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'open' },
  { label: '已关闭', value: 'closed' },
]

function getErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { detail?: string; message?: string } } })
    ?.response?.data

  return data?.detail || data?.message || fallback
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TeacherAssignmentsPage() {
  const [items, setItems] = useState<TeacherAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [pageError, setPageError] = useState('')
  const [closingId, setClosingId] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState<AssignmentStatusFilter>('')

  useEffect(() => {
    let cancelled = false

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setPageError('')
    getTeacherAssignments({
      course: filterCourse || undefined,
      status: filterStatus || undefined,
    })
      .then((res) => {
        if (!cancelled && res.success) {
          setItems(res.data.items)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setItems([])
          setPageError(getErrorMessage(error, '作业列表加载失败，请稍后重试'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filterCourse, filterStatus, refreshKey])

  const statusCounts = useMemo(() => {
    return items.length
  }, [items])

  const courseOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.course))).filter(Boolean),
    [items],
  )

  const handleClose = async (id: string) => {
    const confirmed = confirm('确定关闭该作业吗？关闭后学生将无法继续提交。')
    if (!confirmed) return

    setClosingId(id)
    setPageError('')
    try {
      await closeAssignment(id)
      setRefreshKey((key) => key + 1)
    } catch (error: unknown) {
      setPageError(getErrorMessage(error, '关闭作业失败，请稍后重试'))
    } finally {
      setClosingId('')
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">作业管理</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              查看已发布作业、跟踪提交进度，并快速进入批改与查重流程。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              刷新
            </button>
            <Link
              to="/teacher/assignments/create"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              发布作业
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {statusOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setFilterStatus(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterStatus === option.value
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            value={filterCourse}
            onChange={(event) => setFilterCourse(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 lg:w-56"
          >
            <option value="">全部课程</option>
            {courseOptions.map((courseName) => (
              <option key={courseName} value={courseName}>
                {courseName}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
          当前共 {statusCounts} 份作业
        </div>

        {pageError && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{pageError}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="rounded-md bg-white px-3 py-1.5 font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              重试
            </button>
          </div>
        )}
      </section>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 h-5 w-2/3 rounded bg-slate-200" />
              <div className="mb-3 h-4 w-1/2 rounded bg-slate-100" />
              <div className="h-10 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-slate-800">暂无匹配作业</h2>
          <p className="mt-2 text-sm text-slate-500">
            可以调整筛选条件，或发布一份新的课程作业。
          </p>
          <Link
            to="/teacher/assignments/create"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            发布作业
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const progress =
              item.total_students > 0
                ? Math.round((item.submission_count / item.total_students) * 100)
                : 0

            return (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {item.course}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          item.status === 'open'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                            : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                        }`}
                      >
                        {item.status === 'open' ? '进行中' : '已关闭'}
                      </span>
                    </div>

                    <Link
                      to={`/teacher/assignments/${item.id}`}
                      className="block text-lg font-semibold text-slate-950 transition-colors hover:text-blue-700"
                    >
                      {item.title}
                    </Link>

                    <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                      <p>截止时间：{formatDateTime(item.due_at)}</p>
                      <p>
                        提交进度：{item.submission_count}/{item.total_students}
                      </p>
                    </div>

                    <div className="mt-4 max-w-xl">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                        <span>提交完成率</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                    <Link
                      to={`/teacher/assignments/${item.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      查看详情
                    </Link>
                    <Link
                      to={`/teacher/grading?assignment_id=${item.id}`}
                      className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      AI 批改
                    </Link>
                    {item.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleClose(item.id)}
                        disabled={closingId === item.id}
                        className="rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {closingId === item.id ? '关闭中...' : '关闭作业'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
