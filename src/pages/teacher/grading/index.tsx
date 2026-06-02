import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import {
  getSubmissions,
  gradeSubmissions,
  confirmGrade,
  getGradingReport,
} from '../../../api/teacherAssignments'
import type {
  TeacherSubmissionItem,
  GradeResultItem,
  GradingReportData,
} from '../../../types/api'

export default function TeacherGradingPage() {
  const [searchParams] = useSearchParams()
  const assignmentId = searchParams.get('assignment_id') || ''

  const [submissions, setSubmissions] = useState<TeacherSubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [results, setResults] = useState<GradeResultItem[]>([])
  const [report, setReport] = useState<GradingReportData | null>(null)
  const [error, setError] = useState('')

  // 评分调整
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustScore, setAdjustScore] = useState('')
  const [adjustComment, setAdjustComment] = useState('')

  useEffect(() => {
    if (!assignmentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getSubmissions(assignmentId)
      .then((res) => {
        if (!cancelled && res.success) setSubmissions(res.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [assignmentId])

  const handleBatchGrade = async () => {
    if (!assignmentId || submissions.length === 0) return
    setError('')
    setGrading(true)
    try {
      const res = await gradeSubmissions(
        assignmentId,
        submissions.map((s) => s.id),
      )
      if (res.success) {
        setResults(res.data.results)
        const rRes = await getGradingReport(assignmentId)
        if (rRes.success) setReport(rRes.data)
      }
    } catch {
      setError('AI 批改失败，请重试')
    } finally {
      setGrading(false)
    }
  }

  const handleConfirm = async (submissionId: string) => {
    const score = Number(adjustScore) || 0
    await confirmGrade(submissionId, score, true, adjustComment || undefined)
    setResults((prev) =>
      prev.map((r) =>
        r.submission_id === submissionId
          ? { ...r, confirmed: true }
          : r,
      ),
    )
    setAdjustingId(null)
    setAdjustScore('')
    setAdjustComment('')
  }

  if (!assignmentId) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-2 text-sm text-slate-500">请从作业管理页面选择一份作业进行批改</p>
          <Link
            to="/teacher/assignments"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            前往作业管理 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">✅ AI 批改</h1>
        <p className="mt-1 text-sm text-slate-500">对学生的作业提交进行 AI 自动批改</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 提交列表 */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 rounded bg-slate-100" />
          <div className="h-12 rounded bg-slate-100" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-2 text-sm text-slate-500">暂无学生提交</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">共 {submissions.length} 份提交</p>
            <button
              onClick={handleBatchGrade}
              disabled={grading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {grading ? 'AI 批改中...' : '🤖 批量 AI 批改'}
            </button>
          </div>

          {/* 批改报告摘要 */}
          {report && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-800">📊 批改报告</h3>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-green-600">平均分</p>
                  <p className="text-lg font-bold text-green-800">{report.average_score}</p>
                </div>
                <div>
                  <p className="text-xs text-green-600">已批改</p>
                  <p className="text-lg font-bold text-green-800">{report.graded_count} 份</p>
                </div>
                <div>
                  <p className="text-xs text-green-600">常见错误</p>
                  <p className="text-sm text-green-800">
                    {report.common_mistakes.slice(0, 2).join('、')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600">薄弱知识点</p>
                  <p className="text-sm text-green-800">
                    {report.weak_points.slice(0, 2).join('、')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 批改结果 */}
          <div className="space-y-3">
            {results.length > 0
              ? results.map((r) => (
                  <div
                    key={r.submission_id}
                    className={`rounded-lg border bg-white p-4 ${
                      r.confirmed ? 'border-green-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-800">
                            {r.student_name}
                          </h4>
                          <span className="text-xs text-slate-400">
                            {r.student_id}
                          </span>
                          {r.confirmed && (
                            <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600">
                              已确认
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-blue-600">
                            {r.ai_score}
                          </span>
                          <span className="text-sm text-slate-400">/ 100</span>
                        </div>

                        <p className="mt-1 text-sm text-slate-600">{r.comments}</p>

                        {r.deductions.length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {r.deductions.map((d, i) => (
                              <p key={i} className="text-xs text-red-500">
                                -{d.minus} {d.point}
                              </p>
                            ))}
                          </div>
                        )}

                        {r.suggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-slate-500">修改建议：</p>
                            <ul className="mt-1 list-inside list-disc space-y-0.5">
                              {r.suggestions.map((s, i) => (
                                <li key={i} className="text-xs text-slate-500">
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {adjustingId === r.submission_id ? (
                          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                            <input
                              type="number"
                              value={adjustScore}
                              onChange={(e) => setAdjustScore(e.target.value)}
                              placeholder="最终分数"
                              className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                            />
                            <textarea
                              value={adjustComment}
                              onChange={(e) => setAdjustComment(e.target.value)}
                              placeholder="教师评语"
                              rows={2}
                              className="w-40 rounded border border-slate-300 px-2 py-1 text-xs"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleConfirm(r.submission_id)}
                                className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                              >
                                确认
                              </button>
                              <button
                                onClick={() => setAdjustingId(null)}
                                className="rounded border px-2 py-1 text-xs"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAdjustingId(r.submission_id)
                              setAdjustScore(String(r.ai_score))
                            }}
                            className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            {r.confirmed ? '已确认' : '确认/调整'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              : submissions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {s.student_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        提交于 {new Date(s.submitted_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">待批改</span>
                  </div>
                ))}
          </div>
        </>
      )}
    </div>
  )
}
