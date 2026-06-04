import { useEffect, useState, type FormEvent } from 'react'
import {
  getAssignments,
  getAssignmentDetail,
  submitAssignment,
  getMySubmission,
} from '../../../api/studentAssignments'
import type {
  StudentAssignmentItem,
  StudentAssignmentDetail,
  MySubmissionData,
} from '../../../types/api'

interface Props {
  courseId: string
}

export default function AssignmentsTab({ courseId }: Props) {
  const [items, setItems] = useState<StudentAssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<StudentAssignmentDetail | null>(null)
  const [submission, setSubmission] = useState<MySubmissionData | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getAssignments(courseId, {
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
  }, [courseId, filterStatus])

  const openDetail = async (assignmentId: string) => {
    setError('')
    setSuccessMsg('')
    setContent('')
    try {
      const [dRes, sRes] = await Promise.all([
        getAssignmentDetail(courseId, assignmentId),
        getMySubmission(courseId, assignmentId).catch(() => ({
          success: true,
          data: null,
        })),
      ])
      if (dRes.success) setSelected(dRes.data)
      if (sRes.success && sRes.data) setSubmission(sRes.data)
      else setSubmission(null)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected || !content.trim()) {
      setError('请输入作业内容')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await submitAssignment(courseId, selected.id, content.trim())
      if (res.success) {
        setSubmission({
          id: res.data.id,
          assignment_id: res.data.assignment_id,
          submit_type: res.data.submit_type,
          file_url: null,
          submitted_at: res.data.submitted_at,
          status: res.data.status,
          score: null,
          ai_score: null,
          comments: null,
          deductions: [],
          suggestions: [],
          teacher_comment: null,
          graded_at: null,
        })
        setSuccessMsg('作业提交成功！')
        setContent('')
        // 刷新列表
        getAssignments(courseId, {
          status: filterStatus || undefined,
        })
          .then((res) => {
            if (res.success) setItems(res.data.items)
          })
          .catch(() => {})
      }
    } catch {
      setError('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 详情视图
  if (selected) {
    const isClosed = selected.status === 'closed'
    const isSubmitted = submission !== null

    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="mb-4 text-sm text-blue-600 hover:text-blue-700"
        >
          ← 返回作业列表
        </button>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                {selected.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {selected.section_title ? `${selected.section_title} · ` : ''}
                截止：{new Date(selected.due_at).toLocaleString('zh-CN')} · 满分：
                {selected.full_score}
              </p>
            </div>
            <div className="flex gap-2">
              {isSubmitted && (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                  已提交
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isClosed
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {isClosed ? '已关闭' : '进行中'}
              </span>
            </div>
          </div>

          {selected.description && (
            <div className="mb-6">
              <h3 className="mb-1 text-sm font-medium text-slate-700">
                📄 作业要求
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {selected.description}
              </p>
            </div>
          )}

          {selected.attachment_url && (
            <div className="mb-6">
              <a
                href={selected.attachment_url}
                className="text-sm text-blue-600 hover:underline"
              >
                📎 下载附件
              </a>
            </div>
          )}

          {/* 已提交状态 */}
          {isSubmitted && (
            <div className="mb-6 rounded-lg bg-green-50 p-4">
              <p className="font-medium text-green-700">✅ 作业已提交</p>
              <p className="mt-1 text-sm text-green-600">
                提交时间：
                {new Date(submission.submitted_at).toLocaleString('zh-CN')}
              </p>
              {submission.score != null && (
                <div className="mt-2 rounded bg-white p-3">
                  <p className="text-sm font-medium text-slate-700">
                    得分：{submission.score}/{selected.full_score}
                  </p>
                  {submission.comments && (
                    <p className="mt-1 text-sm text-slate-600">
                      {submission.comments}
                    </p>
                  )}
                  {submission.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500">
                        修改建议：
                      </p>
                      <ul className="list-inside list-disc text-xs text-slate-500">
                        {submission.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 提交表单 */}
          {!isClosed && !isSubmitted && (
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-100 pt-4"
            >
              <h3 className="mb-3 text-sm font-medium text-slate-700">
                ✏️ 提交作业
              </h3>

              {error && (
                <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-600">
                  {successMsg}
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入你的作业内容..."
                rows={8}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交作业'}
              </button>
            </form>
          )}

          {isClosed && !isSubmitted && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                该作业已关闭，不再接受提交。
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 列表视图
  return (
    <div>
      {/* 筛选 */}
      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部状态</option>
          <option value="open">进行中</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

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
          <p className="mt-2 text-sm text-slate-500">暂无作业</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => openDetail(item.id)}
              className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-800">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.section_title ? `${item.section_title} · ` : ''}
                    截止：{new Date(item.due_at).toLocaleString('zh-CN')} · 满分：
                    {item.full_score}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.submitted && (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                      已提交
                    </span>
                  )}
                  {item.score != null && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                      {item.score}分
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
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
