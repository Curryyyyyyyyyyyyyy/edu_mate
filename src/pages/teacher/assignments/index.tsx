import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import {
  getTeacherAssignments,
  publishAssignment,
  closeAssignment,
} from '../../../api/teacherAssignments'
import type { TeacherAssignmentItem } from '../../../types/api'

export default function TeacherAssignmentsPage() {
  const [items, setItems] = useState<TeacherAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // 发布表单
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [referenceAnswer, setReferenceAnswer] = useState('')
  const [rubric, setRubric] = useState('')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getTeacherAssignments({
      course: filterCourse || undefined,
      status: filterStatus || undefined,
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
  }, [filterCourse, filterStatus, refreshKey])

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !course.trim() || !description.trim() || !dueAt) {
      setError('标题、课程、要求和截止时间为必填项')
      return
    }
    setError('')
    setPublishing(true)
    try {
      await publishAssignment({
        title: title.trim(),
        course: course.trim(),
        description: description.trim(),
        due_at: new Date(dueAt).toISOString(),
        reference_answer: referenceAnswer.trim() || undefined,
        rubric: rubric.trim() || undefined,
      })
      setTitle('')
      setCourse('')
      setDescription('')
      setDueAt('')
      setReferenceAnswer('')
      setRubric('')
      setShowCreate(false)
      setRefreshKey((k) => k + 1)
    } catch {
      setError('发布失败，请重试')
    } finally {
      setPublishing(false)
    }
  }

  const handleClose = async (id: string) => {
    if (!confirm('确定要关闭该作业吗？关闭后学生将无法提交。')) return
    await closeAssignment(id)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">📋 作业管理</h1>
          <p className="mt-1 text-sm text-slate-500">发布和管理课程作业</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {showCreate ? '取消' : '+ 发布作业'}
        </button>
      </div>

      {/* 发布表单 */}
      {showCreate && (
        <form
          onSubmit={handlePublish}
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
              placeholder="作业标题 *"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="所属课程 *"
              className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="作业要求说明 *"
            rows={3}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          <div className="mb-3 flex gap-3">
            <textarea
              value={referenceAnswer}
              onChange={(e) => setReferenceAnswer(e.target.value)}
              placeholder="参考答案（可选）"
              rows={2}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <textarea
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              placeholder="评分标准（可选）"
              rows={2}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {publishing ? '发布中...' : '发布作业'}
          </button>
        </form>
      )}

      {/* 筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部状态</option>
          <option value="open">进行中</option>
          <option value="closed">已关闭</option>
        </select>
        {[...new Set(items.map((i) => i.course))].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCourse(filterCourse === c ? '' : c)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              filterCourse === c
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
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
          <p className="mt-2 text-sm text-slate-500">暂无已发布作业</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  to={`/teacher/assignments/${item.id}`}
                  className="min-w-0 flex-1"
                >
                  <h3 className="font-medium text-slate-800 hover:text-blue-600">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.course} · 截止：{new Date(item.due_at).toLocaleString('zh-CN')}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    已提交 {item.submission_count}/{item.total_students}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === 'open'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.status === 'open' ? '进行中' : '已关闭'}
                  </span>
                  {item.status === 'open' && (
                    <button
                      onClick={() => handleClose(item.id)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      关闭
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
