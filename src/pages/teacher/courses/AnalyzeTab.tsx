import { useEffect, useState } from 'react'
import { getTeacherAssignments, getSubmissions, analyzeSubmissions, getAnalyzeReport } from '../../../api/teacherAssignments'
import type { TeacherAssignmentItem, TeacherSubmissionItem, AnalyzeReportData, SuspiciousPair, ComparisonDetail } from '../../../types/api'

interface Props { courseId: string }

export default function AnalyzeTab({ courseId }: Props) {
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([])
  const [selectedAsgId, setSelectedAsgId] = useState('')
  const [loadingAsg, setLoadingAsg] = useState(true)

  const [submissions, setSubmissions] = useState<TeacherSubmissionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport] = useState<AnalyzeReportData | null>(null)
  const [threshold, setThreshold] = useState('0.8')
  const [dimensions, setDimensions] = useState<string[]>(['structure', 'concept', 'expression', 'conclusion'])
  const [error, setError] = useState('')
  const [subTab, setSubTab] = useState<'overview' | 'suspicious' | 'comparison'>('overview')

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
    setReport(null)
    Promise.all([
      getSubmissions(courseId, selectedAsgId),
      getAnalyzeReport(courseId, selectedAsgId).catch(() => null),
    ]).then(([sRes, rRes]) => {
      if (cancelled) return
      if (sRes.success) setSubmissions(sRes.data.items)
      if (rRes?.success) setReport(rRes.data)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, selectedAsgId])

  const handleAnalyze = async () => {
    if (!selectedAsgId || submissions.length === 0) return
    setError('')
    setAnalyzing(true)
    try {
      const res = await analyzeSubmissions(courseId, selectedAsgId, submissions.map((s) => s.id), Number(threshold) || 0.8, dimensions)
      if (res.success) setReport(res.data)
    } catch { setError('分析失败，请重试') }
    finally { setAnalyzing(false) }
  }

  const toggleDimension = (dim: string) => {
    setDimensions((prev) => prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim])
  }

  return (
    <div>
      {/* 选择作业 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">选择要分析的作业</label>
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

          {/* 配置 */}
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">相似度阈值</label>
                <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} min="0" max="1" step="0.05" className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">比对维度</label>
                <div className="flex flex-wrap gap-1.5">
                  {[{ key: 'structure', label: '结构' }, { key: 'concept', label: '概念' }, { key: 'expression', label: '表达' }, { key: 'conclusion', label: '结论' }].map((d) => (
                    <button key={d.key} onClick={() => toggleDimension(d.key)} className={`rounded-full px-3 py-1 text-xs transition-colors ${dimensions.includes(d.key) ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{d.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleAnalyze} disabled={analyzing || submissions.length === 0} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              {analyzing ? '分析中...' : '🔍 开始分析'}
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">{[1, 2].map((i) => (<div key={i} className="h-12 rounded bg-slate-100" />))}</div>
          ) : !report ? (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">🔍</p><p className="mt-2 text-sm text-slate-500">点击"开始分析"进行查重与比对</p></div>
          ) : (
            <div>
              <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
                {(['overview', 'suspicious', 'comparison'] as const).map((key) => (
                  <button key={key} onClick={() => setSubTab(key)} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${subTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {key === 'overview' ? '📊 总览' : key === 'suspicious' ? `⚠️ 可疑对 (${report.suspicious_pairs?.length || 0})` : `📋 比对 (${report.comparison_details?.length || 0})`}
                  </button>
                ))}
              </div>

              {subTab === 'overview' && (
                <div className="space-y-4">
                  {report.common_issues?.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">⚠️ 共同问题</h3>
                      <ul className="list-inside list-disc space-y-1">{report.common_issues.map((issue, i) => (<li key={i} className="text-sm text-slate-600">{issue}</li>))}</ul>
                    </div>
                  )}
                  {report.teaching_suggestions?.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">💡 教学建议</h3>
                      <ul className="list-inside list-disc space-y-1">{report.teaching_suggestions.map((sug, i) => (<li key={i} className="text-sm text-slate-600">{sug}</li>))}</ul>
                    </div>
                  )}
                </div>
              )}

              {subTab === 'suspicious' && (
                <div className="space-y-3">
                  {report.suspicious_pairs?.length > 0 ? (report.suspicious_pairs as SuspiciousPair[]).map((pair, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="font-medium text-slate-800">{pair.student_a} ↔ {pair.student_b}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-orange-600">{(pair.similarity * 100).toFixed(0)}%</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pair.risk_level === 'high' ? 'bg-red-50 text-red-600' : pair.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                            {pair.risk_level === 'high' ? '高风险' : pair.risk_level === 'medium' ? '中风险' : '低风险'}
                          </span>
                        </div>
                      </div>
                      {pair.similar_segments?.length > 0 && (
                        <div className="mb-2"><p className="text-xs font-medium text-slate-500">相似片段：</p><ul className="list-inside list-disc">{pair.similar_segments.map((seg, j) => (<li key={j} className="text-sm text-slate-600">{seg}</li>))}</ul></div>
                      )}
                      {pair.ai_reason && <p className="rounded bg-slate-50 px-3 py-2 text-sm text-slate-600">🤖 AI 分析：{pair.ai_reason}</p>}
                    </div>
                  )) : (
                    <div className="rounded-lg border border-slate-200 bg-white px-6 py-8 text-center"><p className="text-3xl">✅</p><p className="mt-2 text-sm text-slate-500">未发现高度相似的可疑对</p></div>
                  )}
                </div>
              )}

              {subTab === 'comparison' && (
                <div className="space-y-3">
                  {report.comparison_details?.length > 0 ? (report.comparison_details as ComparisonDetail[]).map((detail, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                      <h4 className="mb-3 font-medium text-slate-800">{detail.student_name}</h4>
                      {detail.strengths?.length > 0 && (<div className="mb-2"><p className="text-xs font-medium text-green-600">✅ 优点</p><ul className="list-inside list-disc">{detail.strengths.map((s, j) => (<li key={j} className="text-sm text-slate-600">{s}</li>))}</ul></div>)}
                      {detail.weaknesses?.length > 0 && (<div className="mb-2"><p className="text-xs font-medium text-red-500">⚠️ 不足</p><ul className="list-inside list-disc">{detail.weaknesses.map((w, j) => (<li key={j} className="text-sm text-slate-600">{w}</li>))}</ul></div>)}
                      {detail.dimension_scores && (
                        <div><p className="mb-1 text-xs font-medium text-slate-500">维度评分</p><div className="flex flex-wrap gap-2">{Object.entries(detail.dimension_scores).map(([dim, score]) => (<span key={dim} className="rounded bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{dim}: {score}</span>))}</div></div>
                      )}
                    </div>
                  )) : (<div className="rounded-lg border border-slate-200 bg-white px-6 py-8 text-center"><p className="text-sm text-slate-500">暂无比对详情</p></div>)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
