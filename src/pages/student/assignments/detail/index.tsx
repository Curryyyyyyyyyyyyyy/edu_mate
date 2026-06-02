import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  getAssignmentDetail,
  submitAssignment,
  getMySubmission,
} from '../../../../api/studentAssignments'
import type { StudentAssignmentDetail, MySubmissionData } from '../../../../types/api'

export default function StudentAssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<StudentAssignmentDetail | null>(null)
  const [submission, setSubmission] = useState<MySubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!assignmentId) return
      setLoading(true)
      try {
        const [dRes, sRes] = await Promise.all([
          getAssignmentDetail(assignmentId),
          getMySubmission(assignmentId).catch(() => ({ success: true, data: null })),
        ])
        if (dRes.success) setDetail(dRes.data)
        if (sRes.success && sRes.data) setSubmission(sRes.data)
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assignmentId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('请输入作业内容')
      return
    }
    if (!assignmentId) return
    setError('')
    setSubmitting(true)
    try {
      const res = await submitAssignment(assignmentId, content.trim())
      if (res.success) {
        setSubmission({
          id: res.data.id,
          assignment_id: res.data.assignment_id,
          submit_type: res.data.submit_type,
          file_url: null,
          submitted_at: res.data.submitted_at,
          status: res.data.status,
        })
        setSuccessMsg('作业提交成功！')
        setContent('')
      }
    } catch {
      setError('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-2/3 rounded bg-slate-200" />
          <div className="h-5 w-1/2 rounded bg-slate-100" />
          <div className="h-32 rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-slate-500">作业不存在</p>
      </div>
    )
  }

  const isClosed = detail.status === 'closed'
  const isSubmitted = submission !== null

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate('/student/assignments')}
        className="mb-4 text-sm text-blue-600 hover:text-blue-700"
      >
        ← 返回作业列表
      </button>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{detail.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {detail.course} · 截止：{new Date(detail.due_at).toLocaleString('zh-CN')}
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

        {detail.description && (
          <div className="mb-6">
            <h3 className="mb-1 text-sm font-medium text-slate-700">📄 作业要求</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {detail.description}
            </p>
          </div>
        )}

        {detail.attachment_url && (
          <div className="mb-6">
            <h3 className="mb-1 text-sm font-medium text-slate-700">📎 附件</h3>
            <a
              href={detail.attachment_url}
              className="text-sm text-blue-600 hover:underline"
            >
              下载附件
            </a>
          </div>
        )}

        {/* 已提交状态 */}
        {isSubmitted && (
          <div className="mb-6 rounded-lg bg-green-50 p-4">
            <p className="font-medium text-green-700">✅ 作业已提交</p>
            <p className="mt-1 text-sm text-green-600">
              提交时间：{new Date(submission.submitted_at).toLocaleString('zh-CN')}
            </p>
            <p className="text-sm text-green-600">
              提交方式：{submission.submit_type === 'text' ? '文本' : '文件'}
            </p>
          </div>
        )}

        {/* 提交表单 */}
        {!isClosed && !isSubmitted && (
          <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4">
            <h3 className="mb-3 text-sm font-medium text-slate-700">✏️ 提交作业</h3>

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
            <span className="ml-3 text-xs text-slate-400">支持文本提交</span>
          </form>
        )}

        {isClosed && !isSubmitted && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">该作业已关闭，不再接受提交。</p>
          </div>
        )}
      </div>
    </div>
  )
}
