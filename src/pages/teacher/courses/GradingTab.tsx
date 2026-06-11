/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { getTeacherAssignments, getSubmissions, gradeSubmissions, confirmGrade, getGradingReport } from '../../../api/teacherAssignments'
import type { TeacherAssignmentItem, TeacherSubmissionItem, GradeResultItem, GradeFailedItem, GradingReportData } from '../../../types/api'

interface Props { courseId: string }

function getSubmissionText(submission?: TeacherSubmissionItem) {
  return submission?.content || submission?.extracted_text || ''
}

function getFileName(url: string) {
  const name = url.split('?')[0]?.split('/').pop()
  if (!name) return '提交附件'
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

function SubmissionContent({ submission }: { submission?: TeacherSubmissionItem }) {
  const text = getSubmissionText(submission)
  const fileName = submission?.file_url ? getFileName(submission.file_url) : ''

  return (
    <div className="mt-3 space-y-2">
      {text ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1 text-xs font-medium text-slate-500">提交内容</p>
          <p className="max-h-32 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-700">{text}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
          暂无可预览的提交文本
        </div>
      )}
      {submission?.file_url && (
        <div className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{fileName}</p>
            <p className="text-xs text-slate-500">提交附件</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <a href={submission.file_url} target="_blank" rel="noreferrer" className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              预览
            </a>
            <a href={submission.file_url} download={fileName} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium !text-white hover:bg-blue-700">
              下载附件
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GradingTab({ courseId }: Props) {
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([])
  const [selectedAsgId, setSelectedAsgId] = useState('')
  const [loadingAsg, setLoadingAsg] = useState(true)

  const [submissions, setSubmissions] = useState<TeacherSubmissionItem[]>([])
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [grading, setGrading] = useState(false)
  const [results, setResults] = useState<GradeResultItem[]>([])
  const [failedResults, setFailedResults] = useState<GradeFailedItem[]>([])
  const [report, setReport] = useState<GradingReportData | null>(null)
  const [error, setError] = useState('')

  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [adjustScore, setAdjustScore] = useState('')
  const [adjustComment, setAdjustComment] = useState('')

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedAsgId),
    [assignments, selectedAsgId],
  )
  const fullScore = selectedAssignment?.full_score ?? 0
  const selectableSubmissions = useMemo(
    () => submissions.filter((item) => !item.graded && !item.confirmed),
    [submissions],
  )
  const selectableSubmissionIds = useMemo(
    () => selectableSubmissions.map((item) => item.id),
    [selectableSubmissions],
  )

  const refreshSubmissionsAndReport = async () => {
    if (!selectedAsgId) return
    const [sRes, rRes] = await Promise.all([
      getSubmissions(courseId, selectedAsgId),
      getGradingReport(courseId, selectedAsgId).catch(() => null),
    ])
    if (sRes.success) {
      setSubmissions(sRes.data.items)
      setSelectedSubmissionIds((prev) => prev.filter((id) => {
        const item = sRes.data.items.find((submission) => submission.id === id)
        return item && !item.graded && !item.confirmed
      }))
    }
    if (rRes?.success) setReport(rRes.data)
  }

  useEffect(() => {
    let cancelled = false
    setLoadingAsg(true)
    getTeacherAssignments(courseId)
      .then((res) => { if (!cancelled && res.success) setAssignments(res.data.items) })
      .finally(() => { if (!cancelled) setLoadingAsg(false) })
    return () => { cancelled = true }
  }, [courseId])

  useEffect(() => {
    if (!selectedAsgId) return
    let cancelled = false
    setLoading(true)
    setResults([])
    setFailedResults([])
    setReport(null)
    setSelectedSubmissionIds([])
    Promise.all([
      getSubmissions(courseId, selectedAsgId),
      getGradingReport(courseId, selectedAsgId).catch(() => null),
    ]).then(([sRes, rRes]) => {
      if (cancelled) return
      if (sRes.success) {
        setSubmissions(sRes.data.items)
        setSelectedSubmissionIds(sRes.data.items.filter((item) => !item.graded && !item.confirmed).map((item) => item.id))
      }
      if (rRes?.success) setReport(rRes.data)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, selectedAsgId])

  const toggleSubmission = (id: string) => {
    if (!selectableSubmissionIds.includes(id)) return
    setSelectedSubmissionIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelectedSubmissionIds((prev) => prev.length === selectableSubmissionIds.length ? [] : selectableSubmissionIds)
  }

  const handleBatchGrade = async () => {
    if (!selectedAsgId) return
    if (selectedSubmissionIds.length === 0) {
      setError('请至少选择一份提交再批改')
      return
    }
    setError('')
    setFailedResults([])
    setGrading(true)
    try {
      const res = await gradeSubmissions(courseId, selectedAsgId, selectedSubmissionIds)
      if (res.success) {
        setResults(res.data.results)
        setFailedResults(res.data.failed ?? [])
        setSelectedSubmissionIds((prev) => {
          const gradedIds = new Set(res.data.results.map((item) => item.submission_id))
          return prev.filter((id) => !gradedIds.has(id))
        })
        if (res.data.results.length === 0 && (res.data.failed?.length ?? 0) > 0) {
          setError('本次没有成功批改的作业，请查看失败原因')
        } else if ((res.data.failed?.length ?? 0) > 0) {
          setError(`部分作业未能批改：成功 ${res.data.results.length} 份，失败 ${res.data.failed?.length ?? 0} 份`)
        }
        await refreshSubmissionsAndReport()
      } else {
        setError(res.message || 'AI 批改失败，请重试')
      }
    } catch (err) {
      const message = err instanceof Error && err.message.includes('timeout')
        ? 'AI 批改超时，请减少一次批改的份数后重试'
        : 'AI 批改失败，请重试'
      setError(message)
    } finally {
      setGrading(false)
    }
  }

  const handleConfirm = async (submissionId: string) => {
    const score = Number(adjustScore)
    if (!Number.isFinite(score) || score < 0 || score > fullScore) {
      setError(`分数必须在 0 到 ${fullScore} 之间`)
      return
    }
    setError('')
    await confirmGrade(courseId, selectedAsgId, submissionId, score, true, adjustComment.trim() || undefined)
    setResults((prev) => prev.map((r) => r.submission_id === submissionId ? { ...r, ai_score: score, confirmed: true } : r))
    setAdjustingId(null)
    setAdjustScore('')
    setAdjustComment('')
    await refreshSubmissionsAndReport()
  }

  return (
    <div>
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">选择要批改的作业</label>
        {loadingAsg ? (
          <div className="h-10 animate-pulse rounded bg-slate-100" />
        ) : (
          <select value={selectedAsgId} onChange={(e) => setSelectedAsgId(e.target.value)} className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            <option value="">-- 选择作业 --</option>
            {assignments.map((a) => (<option key={a.id} value={a.id}>{a.title}（{a.submission_count} 份提交，满分 {a.full_score}）</option>))}
          </select>
        )}
      </div>

      {!selectedAsgId ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">📋</p><p className="mt-2 text-sm text-slate-500">请先选择一份作业</p></div>
      ) : (
        <>
          {grading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-xl">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />
                <p className="mt-3 text-sm font-medium text-slate-800">AI 正在批改作业</p>
                <p className="mt-1 text-xs text-slate-500">已提交 {selectedSubmissionIds.length} 份，批改完成后会自动刷新结果</p>
              </div>
            </div>
          )}
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          {failedResults.length > 0 && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="mb-2 text-sm font-medium text-red-700">未能批改的提交</p>
              <div className="space-y-1">
                {failedResults.map((item) => (
                  <p key={item.submission_id} className="text-xs text-red-600">
                    {item.student_name || item.submission_id}：{item.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-3">{[1, 2].map((i) => (<div key={i} className="h-12 rounded bg-slate-100" />))}</div>
          ) : submissions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">📄</p><p className="mt-2 text-sm text-slate-500">暂无学生提交</p></div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <input type="checkbox" checked={selectableSubmissionIds.length > 0 && selectedSubmissionIds.length === selectableSubmissionIds.length} onChange={toggleAll} disabled={selectableSubmissionIds.length === 0} className="h-4 w-4 rounded border-slate-300 disabled:opacity-50" />
                  共 {submissions.length} 份提交，可选 {selectableSubmissionIds.length} 份，已选 {selectedSubmissionIds.length} 份
                </label>
                <button onClick={handleBatchGrade} disabled={grading || selectedSubmissionIds.length === 0 || selectableSubmissionIds.length === 0} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {grading ? 'AI 批改中...' : '批量 AI 批改'}
                </button>
              </div>

              {report && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-green-800">批改报告</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div><p className="text-xs text-green-600">平均分</p><p className="text-lg font-bold text-green-800">{report.average_score}</p></div>
                    <div><p className="text-xs text-green-600">已批改</p><p className="text-lg font-bold text-green-800">{report.graded_count} 份</p></div>
                    <div><p className="text-xs text-green-600">常见错误</p><p className="text-sm text-green-800">{report.common_mistakes.slice(0, 2).join('、') || '暂无'}</p></div>
                    <div><p className="text-xs text-green-600">薄弱点</p><p className="text-sm text-green-800">{report.weak_points.slice(0, 2).join('、') || '暂无'}</p></div>
                  </div>
                  {(report.teaching_suggestions?.length ?? 0) > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-green-700">教学建议</p>
                      <ul className="list-inside list-disc space-y-1">{report.teaching_suggestions?.map((item, index) => <li key={index} className="text-sm text-green-800">{item}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {results.length > 0 ? results.map((r) => {
                  const submission = submissions.find((item) => item.id === r.submission_id)
                  return (
                  <div key={r.submission_id} className={`rounded-lg border bg-white p-4 ${r.confirmed ? 'border-green-200' : 'border-slate-200'}`}>
                    <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <label className="mb-2 flex items-center gap-2">
                          <input type="checkbox" checked={false} disabled className="h-4 w-4 rounded border-slate-300 opacity-50" />
                          <span className="font-medium text-slate-800">{r.student_name}</span>
                          {r.confirmed && <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600">已确认</span>}
                        </label>
                        <div className="mt-2 flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-blue-600">{r.ai_score}</span>
                          <span className="text-sm text-slate-400">/ {fullScore}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{r.comments}</p>
                        {r.deductions.length > 0 && <div className="mt-2 space-y-0.5">{r.deductions.map((d, i) => (<p key={i} className="text-xs text-red-500">-{d.minus} {d.point}</p>))}</div>}
                        {r.suggestions?.length > 0 && (
                          <div className="mt-2 rounded bg-blue-50 px-3 py-2">
                            <p className="mb-1 text-xs font-medium text-blue-700">改进建议</p>
                            <ul className="list-inside list-disc space-y-1">{r.suggestions.map((item, index) => <li key={index} className="text-xs text-blue-700">{item}</li>)}</ul>
                          </div>
                        )}
                        <SubmissionContent submission={submission} />
                      </div>
                      <div className="w-full lg:w-80 lg:shrink-0">
                        {adjustingId === r.submission_id ? (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-700">确认批改结果</p>
                              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">满分 {fullScore}</span>
                            </div>
                            <div className="space-y-3">
                              <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">最终分数</span>
                                <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
                                  <input type="number" value={adjustScore} onChange={(e) => setAdjustScore(e.target.value)} min="0" max={fullScore} placeholder={`0-${fullScore}`} className="min-w-0 flex-1 border-0 px-3 py-2 text-sm text-slate-800 outline-none" />
                                  <span className="border-l border-slate-200 px-3 py-2 text-sm text-slate-400">/ {fullScore}</span>
                                </div>
                              </label>
                              <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">教师评语</span>
                                <textarea value={adjustComment} onChange={(e) => setAdjustComment(e.target.value)} placeholder="补充给学生的反馈，可选" rows={3} className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100" />
                              </label>
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button onClick={() => setAdjustingId(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">取消</button>
                              <button onClick={() => handleConfirm(r.submission_id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">确认分数</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setAdjustingId(r.submission_id); setAdjustScore(String(r.ai_score)); setAdjustComment('') }} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                            {r.confirmed ? '已确认' : '确认/调整'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                }) : submissions.map((s) => (
                  <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <label className="flex min-w-0 items-start gap-3">
                        <input type="checkbox" checked={selectedSubmissionIds.includes(s.id)} onChange={() => toggleSubmission(s.id)} disabled={Boolean(s.graded || s.confirmed)} className="mt-0.5 h-4 w-4 rounded border-slate-300 disabled:opacity-50" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-slate-700">{s.student_name}</span>
                          <span className="text-xs text-slate-400">提交于 {new Date(s.submitted_at).toLocaleString('zh-CN')} · {s.submit_type === 'file' ? '文件提交' : '文本提交'}</span>
                        </span>
                      </label>
                      <span className="shrink-0 text-xs text-slate-400">{s.confirmed ? `已确认：${s.score}/${fullScore}` : s.graded ? '已批改' : '待批改'}</span>
                    </div>
                    <SubmissionContent submission={s} />
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
