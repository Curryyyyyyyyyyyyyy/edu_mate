import { useEffect, useState } from 'react'
import { getTeacherAssignments, getSubmissions, gradeSubmissions, confirmGrade, getGradingReport } from '../../../api/teacherAssignments'
import type { TeacherAssignmentItem, TeacherSubmissionItem, GradeResultItem, GradingReportData } from '../../../types/api'

interface Props { courseId: string }

export default function GradingTab({ courseId }: Props) {
  // Step 1: 选择作业
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([])
  const [selectedAsgId, setSelectedAsgId] = useState('')
  const [loadingAsg, setLoadingAsg] = useState(true)

  // Step 2: 批改
  const [submissions, setSubmissions] = useState<TeacherSubmissionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [grading, setGrading] = useState(false)
  const [results, setResults] = useState<GradeResultItem[]>([])
  const [report, setReport] = useState<GradingReportData | null>(null)
  const [error, setError] = useState('')

  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustScore, setAdjustScore] = useState('')
  const [adjustComment, setAdjustComment] = useState('')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingAsg(true)
    getTeacherAssignments(courseId)
      .then((res) => { if (!cancelled && res.success) setAssignments(res.data.items) })
      .finally(() => { if (!cancelled) setLoadingAsg(false) })
    return () => { cancelled = true }
  }, [courseId])

  useEffect(() => {
    if (!selectedAsgId) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setResults([])
    setReport(null)
    getSubmissions(courseId, selectedAsgId)
      .then((res) => { if (!cancelled && res.success) setSubmissions(res.data.items) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, selectedAsgId])

  const handleBatchGrade = async () => {
    if (!selectedAsgId || submissions.length === 0) return
    setError('')
    setGrading(true)
    try {
      const res = await gradeSubmissions(courseId, selectedAsgId, submissions.map((s) => s.id))
      if (res.success) {
        setResults(res.data.results)
        const rRes = await getGradingReport(courseId, selectedAsgId)
        if (rRes.success) setReport(rRes.data)
      }
    } catch { setError('AI 批改失败，请重试') }
    finally { setGrading(false) }
  }

  const handleConfirm = async (submissionId: string) => {
    const score = Number(adjustScore) || 0
    await confirmGrade(courseId, selectedAsgId, submissionId, score, true, adjustComment || undefined)
    setResults((prev) => prev.map((r) => r.submission_id === submissionId ? { ...r, confirmed: true } : r))
    setAdjustingId(null); setAdjustScore(''); setAdjustComment('')
  }

  return (
    <div>
      {/* 选择作业 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">选择要批改的作业</label>
        {loadingAsg ? (
          <div className="h-10 animate-pulse rounded bg-slate-100" />
        ) : (
          <select value={selectedAsgId} onChange={(e) => setSelectedAsgId(e.target.value)} className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            <option value="">-- 选择作业 --</option>
            {assignments.map((a) => (<option key={a.id} value={a.id}>{a.title} ({a.submission_count} 份提交)</option>))}
          </select>
        )}
      </div>

      {!selectedAsgId ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">📋</p><p className="mt-2 text-sm text-slate-500">请先选择一份作业</p></div>
      ) : (
        <>
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          {loading ? (
            <div className="animate-pulse space-y-3">{[1, 2].map((i) => (<div key={i} className="h-12 rounded bg-slate-100" />))}</div>
          ) : submissions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">📭</p><p className="mt-2 text-sm text-slate-500">暂无学生提交</p></div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">共 {submissions.length} 份提交</p>
                <button onClick={handleBatchGrade} disabled={grading} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {grading ? 'AI 批改中...' : '🤖 批量 AI 批改'}
                </button>
              </div>

              {report && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-green-800">📊 批改报告</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div><p className="text-xs text-green-600">平均分</p><p className="text-lg font-bold text-green-800">{report.average_score}</p></div>
                    <div><p className="text-xs text-green-600">已批改</p><p className="text-lg font-bold text-green-800">{report.graded_count} 份</p></div>
                    <div><p className="text-xs text-green-600">常见错误</p><p className="text-sm text-green-800">{report.common_mistakes.slice(0, 2).join('、')}</p></div>
                    <div><p className="text-xs text-green-600">薄弱点</p><p className="text-sm text-green-800">{report.weak_points.slice(0, 2).join('、')}</p></div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {results.length > 0 ? results.map((r) => (
                  <div key={r.submission_id} className={`rounded-lg border bg-white p-4 ${r.confirmed ? 'border-green-200' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-800">{r.student_name}</h4>
                          {r.confirmed && <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600">已确认</span>}
                        </div>
                        <div className="mt-2 flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-blue-600">{r.ai_score}</span>
                          <span className="text-sm text-slate-400">/ 100</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{r.comments}</p>
                        {r.deductions.length > 0 && <div className="mt-2 space-y-0.5">{r.deductions.map((d, i) => (<p key={i} className="text-xs text-red-500">-{d.minus} {d.point}</p>))}</div>}
                      </div>
                      <div className="shrink-0">
                        {adjustingId === r.submission_id ? (
                          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                            <input type="number" value={adjustScore} onChange={(e) => setAdjustScore(e.target.value)} placeholder="分数" className="w-24 rounded border px-2 py-1 text-sm" />
                            <textarea value={adjustComment} onChange={(e) => setAdjustComment(e.target.value)} placeholder="评语" rows={2} className="w-40 rounded border px-2 py-1 text-xs" />
                            <div className="flex gap-1">
                              <button onClick={() => handleConfirm(r.submission_id)} className="rounded bg-green-600 px-2 py-1 text-xs text-white">确认</button>
                              <button onClick={() => setAdjustingId(null)} className="rounded border px-2 py-1 text-xs">取消</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setAdjustingId(r.submission_id); setAdjustScore(String(r.ai_score)) }} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                            {r.confirmed ? '已确认' : '确认/调整'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                    <div><p className="text-sm font-medium text-slate-700">{s.student_name}</p><p className="text-xs text-slate-400">提交于 {new Date(s.submitted_at).toLocaleString('zh-CN')}</p></div>
                    <span className="text-xs text-slate-400">待批改</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
