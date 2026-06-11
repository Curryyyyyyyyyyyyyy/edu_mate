import { useEffect, useState } from 'react'
import { getStudentCourseScores } from '../../../api/scores'
import type { StudentCourseScoresData, ScoreRecord } from '../../../types/api'

interface Props {
  courseId: string
}

export default function ScoresTab({ courseId }: Props) {
  const [data, setData] = useState<StudentCourseScoresData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getStudentCourseScores(courseId)
      .then((res) => {
        if (!cancelled && res.success) setData(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-lg bg-slate-100" />
        <div className="h-5 w-1/3 rounded bg-slate-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-3xl">📊</p>
        <p className="mt-2 text-sm text-slate-500">暂无成绩数据</p>
      </div>
    )
  }

  return (
    <div>
      {/* 总成绩卡片 */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">课程总成绩</p>
            <p className="mt-1 text-3xl font-bold text-slate-800">
              {data.total_score}
              <span className="ml-1 text-lg font-normal text-slate-400">分</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">排名</p>
            <p className="mt-1 text-2xl font-semibold text-blue-600">
              {data.rank} <span className="text-sm font-normal text-slate-400">/ {data.total_students}</span>
            </p>
          </div>
        </div>

        {/* 排名进度条 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>排名百分比</span>
            <span>{data.total_students > 0 ? `前 ${Math.round(data.rank / data.total_students * 100)}%` : '-'}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${data.total_students > 0 ? Math.min(100, Math.round((1 - data.rank / data.total_students) * 100)) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 成绩明细 */}
      <h3 className="mb-3 text-sm font-medium text-slate-700">
        📋 成绩明细（共 {data.records.length} 条）
      </h3>

      {data.records.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-8 text-center">
          <p className="text-sm text-slate-400">暂无成绩记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.records.map((record) => (
            <ScoreRecordItem key={record.assignment_id} record={record} />
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreRecordItem({ record }: { record: ScoreRecord }) {
  const [expanded, setExpanded] = useState(false)
  const rate = record.full_score > 0 ? (record.score / record.full_score * 100) : 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-slate-800">{record.assignment_title}</h4>
          <p className="mt-0.5 text-sm text-slate-500">
            {record.section_title ? `${record.section_title} · ` : ''}
            批改于 {new Date(record.graded_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 ml-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              rate >= 80 ? 'bg-green-50 text-green-600' :
              rate >= 60 ? 'bg-yellow-50 text-yellow-600' :
              'bg-red-50 text-red-600'
            }`}
          >
            {record.score}/{record.full_score}
          </span>
          <span className="text-xs text-slate-400">
            {expanded ? '收起 ▲' : '详情 ▼'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 text-sm">
          {/* AI 批改信息 */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">AI 评分</p>
              <p className="mt-0.5 font-medium text-slate-700">
                {record.ai_score != null ? `${record.ai_score} / ${record.full_score}` : '-'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">得分率</p>
              <p className={`mt-0.5 font-medium ${
                rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {rate.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* 扣分项 */}
          {record.deductions && record.deductions.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-slate-500">扣分项</p>
              <div className="space-y-1">
                {record.deductions.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-red-50 px-2 py-1 text-xs">
                    <span className="text-red-700">{d.point}</span>
                    <span className="font-medium text-red-500">-{d.minus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 总评 */}
          {record.suggestions && record.suggestions.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-slate-500">AI 建议</p>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-slate-600">
                {record.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 教师评语 */}
          {record.teacher_comment && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <p className="mb-1 text-xs font-medium text-blue-600">👨‍🏫 教师评语</p>
              <p className="text-xs text-slate-700">{record.teacher_comment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
