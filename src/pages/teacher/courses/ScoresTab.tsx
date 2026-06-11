/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { getTeacherCourseScores, getTeacherStudentScores } from '../../../api/scores'
import type { ScoreRecord, TeacherScoresData, TeacherStudentScoresData } from '../../../types/api'

interface Props { courseId: string }

type SortBy = 'total_score' | 'name'
type SortOrder = 'asc' | 'desc'

const distributionLabels: Record<keyof TeacherScoresData['score_distribution'], string> = {
  '90_100': '90-100',
  '80_89': '80-89',
  '70_79': '70-79',
  '60_69': '60-69',
  below_60: '60 以下',
}

function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined) return '-'
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function formatRate(rate: number | null | undefined) {
  if (rate === null || rate === undefined) return '-'
  const percent = rate * 100
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`
}

export default function ScoresTab({ courseId }: Props) {
  const [data, setData] = useState<TeacherScoresData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('total_score')
  const [order, setOrder] = useState<SortOrder>('desc')

  const [studentDetail, setStudentDetail] = useState<TeacherStudentScoresData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getTeacherCourseScores(courseId, { sort_by: sortBy, order })
      .then((res) => {
        if (!cancelled && res.success) setData(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('成绩数据加载失败，请稍后重试。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [courseId, sortBy, order])

  const maxDistribution = useMemo(() => {
    if (!data) return 0
    return Math.max(...Object.values(data.score_distribution), 0)
  }, [data])

  const openStudentDetail = async (studentId: string) => {
    setDetailLoading(true)
    setDetailError('')
    setStudentDetail(null)
    try {
      const res = await getTeacherStudentScores(courseId, studentId)
      if (res.success) setStudentDetail(res.data)
      else setDetailError(res.message || '学生成绩详情加载失败。')
    } catch {
      setDetailError('学生成绩详情加载失败，请稍后重试。')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">课程成绩</h2>
          <p className="mt-0.5 text-sm text-slate-500">{data?.course_name || '查看班级成绩统计与学生排行'}</p>
        </div>
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            <option value="total_score">按总分</option>
            <option value="name">按姓名</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value as SortOrder)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg border border-slate-200 bg-white" />)}
          </div>
          <div className="h-56 animate-pulse rounded-lg border border-slate-200 bg-white" />
        </div>
      ) : !data ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-500">暂无成绩数据。</p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="平均分" value={formatScore(data.statistics.average_score)} />
            <StatCard label="最高分" value={formatScore(data.statistics.max_score)} />
            <StatCard label="最低分" value={formatScore(data.statistics.min_score)} />
            <StatCard label="及格率" value={formatRate(data.statistics.pass_rate)} />
            <StatCard label="优秀率" value={formatRate(data.statistics.excellent_rate)} />
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.4fr)]">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">分数分布</h3>
                <span className="text-xs text-slate-400">共 {data.total} 人</span>
              </div>
              <div className="space-y-3">
                {(Object.keys(distributionLabels) as (keyof TeacherScoresData['score_distribution'])[]).map((key) => {
                  const count = data.score_distribution[key]
                  const width = maxDistribution > 0 ? Math.max(4, Math.round((count / maxDistribution) * 100)) : 0
                  return (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>{distributionLabels[key]}</span>
                        <span>{count} 人</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-800">学生成绩排行</h3>
                <span className="text-xs text-slate-400">{sortBy === 'total_score' ? '按总分排序' : '按姓名排序'} · {order === 'desc' ? '降序' : '升序'}</span>
              </div>
              {data.items.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">暂无已评分学生。</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">排名</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">学生</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">班级</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">已评分</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">总分</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.items.map((student) => (
                        <tr key={student.student_id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500">#{student.rank}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{student.student_name}</td>
                          <td className="px-4 py-3 text-slate-500">{student.class_name || '-'}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{student.graded_assignments}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatScore(student.total_score)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openStudentDetail(student.student_id)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">详情</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {(detailLoading || detailError || studentDetail) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">学生成绩详情</h3>
              {studentDetail && (
                <p className="mt-1 text-xs text-slate-500">
                  {studentDetail.student_name} · 排名 {studentDetail.rank ? `#${studentDetail.rank}` : '-'} · 总分 {formatScore(studentDetail.total_score)}
                </p>
              )}
            </div>
            <button onClick={() => { setStudentDetail(null); setDetailError('') }} className="rounded border px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">关闭</button>
          </div>

          {detailLoading ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : detailError ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{detailError}</div>
          ) : studentDetail && studentDetail.records.length === 0 ? (
            <div className="rounded bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">该学生暂无成绩记录。</div>
          ) : studentDetail && (
            <div className="space-y-3">
              {studentDetail.records.map((record) => <ScoreRecordCard key={record.assignment_id} record={record} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function ScoreRecordCard({ record }: { record: ScoreRecord }) {
  const rate = record.full_score > 0 ? Math.min(100, Math.round((record.score / record.full_score) * 100)) : 0

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {record.section_title && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{record.section_title}</span>}
            <h4 className="font-medium text-slate-800">{record.assignment_title}</h4>
          </div>
          <p className="text-xs text-slate-400">评分时间：{record.graded_at ? new Date(record.graded_at).toLocaleString('zh-CN') : '-'}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-blue-600">{formatScore(record.score)} / {formatScore(record.full_score)}</p>
          {record.ai_score !== null && <p className="text-xs text-slate-400">AI 评分 {formatScore(record.ai_score)}</p>}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${rate}%` }} />
      </div>
      {record.teacher_comment && <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-sm text-slate-600">教师评语：{record.teacher_comment}</p>}
      {record.deductions && record.deductions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-red-500">扣分项</p>
          <div className="space-y-1">
            {record.deductions.map((deduction, index) => (
              <p key={`${deduction.point}-${index}`} className="text-xs text-slate-600">-{deduction.minus}：{deduction.point}</p>
            ))}
          </div>
        </div>
      )}
      {record.suggestions && record.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-slate-500">改进建议</p>
          <div className="flex flex-wrap gap-1.5">
            {record.suggestions.map((suggestion, index) => <span key={`${suggestion}-${index}`} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{suggestion}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}
