import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  getTeacherAssignmentDetail,
  getSubmissions,
  updateAssignment,
} from '../../../../api/teacherAssignments'
import type { TeacherAssignmentDetail, TeacherSubmissionItem } from '../../../../types/api'

export default function TeacherAssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<TeacherAssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<TeacherSubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [editDueAt, setEditDueAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!assignmentId) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    Promise.all([
      getTeacherAssignmentDetail(assignmentId),
      getSubmissions(assignmentId),
    ])
      .then(([dRes, sRes]) => {
        if (cancelled) return
        if (dRes.success) {
          setDetail(dRes.data)
          setEditDesc(dRes.data.description)
          setEditDueAt(dRes.data.due_at.slice(0, 16))
        }
        if (sRes.success) setSubmissions(sRes.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [assignmentId, refreshKey])

  const handleSave = async () => {
    if (!assignmentId || !detail) return
    setSaving(true)
    try {
      await updateAssignment(assignmentId, {
        description: editDesc,
        due_at: new Date(editDueAt).toISOString(),
      })
      setEditing(false)
      setRefreshKey((k) => k + 1)
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
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
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-slate-500">作业不存在</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => navigate('/teacher/assignments')}
        className="mb-4 text-sm text-blue-600 hover:text-blue-700"
      >
        ← 返回作业列表
      </button>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{detail.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {detail.course} · 截止：{new Date(detail.due_at).toLocaleString('zh-CN')} ·{' '}
              {detail.status === 'open' ? '进行中' : '已关闭'} ·{' '}
              已提交 {detail.submission_count} 人
            </p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              editing
                ? 'border border-red-200 bg-red-50 text-red-600'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {editing ? '取消编辑' : '编辑'}
          </button>
        </div>

        {/* 编辑模式 */}
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">作业要求</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">截止时间</label>
              <input
                type="datetime-local"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        ) : (
          <>
            {detail.description && (
              <div className="mb-4">
                <h3 className="mb-1 text-sm font-medium text-slate-700">📄 作业要求</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {detail.description}
                </p>
              </div>
            )}
            {detail.reference_answer && (
              <div className="mb-4">
                <h3 className="mb-1 text-sm font-medium text-slate-700">💡 参考答案</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600">
                  {detail.reference_answer}
                </p>
              </div>
            )}
            {detail.rubric && (
              <div className="mb-4">
                <h3 className="mb-1 text-sm font-medium text-slate-700">📏 评分标准</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600">{detail.rubric}</p>
              </div>
            )}
          </>
        )}

        {/* 操作按钮 */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => navigate(`/teacher/grading?assignment_id=${detail.id}`)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            ✅ AI 批改
          </button>
          <button
            onClick={() => navigate(`/teacher/analyze?assignment_id=${detail.id}`)}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            🔍 查重比对
          </button>
        </div>
      </div>

      {/* 提交列表 */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          📥 学生提交（{submissions.length}）
        </h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-400">暂无提交</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.student_name}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(s.submitted_at).toLocaleString('zh-CN')} ·{' '}
                    {s.submit_type === 'text' ? '文本提交' : '文件提交'}
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                  已提交
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
