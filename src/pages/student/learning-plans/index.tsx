import { useEffect, useState, type FormEvent } from 'react'
import {
  getLearningPlans,
  createLearningPlan,
} from '../../../api/learningPlans'
import type { LearningPlanListItem } from '../../../types/api'

export default function StudentLearningPlansPage() {
  const [items, setItems] = useState<LearningPlanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  // 筛选
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCourse, setFilterCourse] = useState('')

  // 创建表单
  const [course, setCourse] = useState('')
  const [goal, setGoal] = useState('')
  const [examName, setExamName] = useState('')
  const [examScore, setExamScore] = useState('')
  const [examFull, setExamFull] = useState('100')
  const [hwTitle, setHwTitle] = useState('')
  const [hwScore, setHwScore] = useState('')
  const [hwFull, setHwFull] = useState('100')
  const [hwWeakPoints, setHwWeakPoints] = useState('')
  const [availableTime, setAvailableTime] = useState('60')

  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getLearningPlans({
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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!course.trim() || !goal.trim()) {
      setError('课程名称和学习目标不能为空')
      return
    }
    setError('')
    setCreating(true)
    try {
      await createLearningPlan({
        course: course.trim(),
        goal: goal.trim(),
        grade_records: examName
          ? [{ exam_name: examName, score: Number(examScore) || 0, full_score: Number(examFull) || 100 }]
          : [],
        homework_records: hwTitle
          ? [
              {
                title: hwTitle,
                score: Number(hwScore) || 0,
                full_score: Number(hwFull) || 100,
                weak_points: hwWeakPoints
                  .split(/[,，]/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            ]
          : [],
        available_time_per_day: Number(availableTime) || 60,
      })
      setCourse('')
      setGoal('')
      setExamName('')
      setExamScore('')
      setHwTitle('')
      setHwScore('')
      setHwWeakPoints('')
      setShowCreate(false)
      setRefreshKey((k) => k + 1)
    } catch {
      setError('创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">📅 学习计划</h1>
          <p className="mt-1 text-sm text-slate-500">基于学情数据的个性化学习安排</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {showCreate ? '取消' : '+ 生成计划'}
        </button>
      </div>

      {/* 创建表单 */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-blue-200 bg-blue-50/30 p-4"
        >
          {error && (
            <div className="mb-3 rounded bg-red-100 px-3 py-1.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <h3 className="mb-3 text-sm font-semibold text-slate-700">基本信息</h3>
          <div className="mb-3 flex gap-3">
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="课程名称 *"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              value={availableTime}
              onChange={(e) => setAvailableTime(e.target.value)}
              placeholder="每日可用时间（分钟）"
              className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="学习目标 *，例如：两周内提升导数应用题正确率"
            rows={2}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          <h3 className="mb-3 text-sm font-semibold text-slate-700">成绩记录（可选）</h3>
          <div className="mb-3 flex gap-3">
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="考试名称"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              value={examScore}
              onChange={(e) => setExamScore(e.target.value)}
              placeholder="得分"
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              value={examFull}
              onChange={(e) => setExamFull(e.target.value)}
              placeholder="满分"
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <h3 className="mb-3 text-sm font-semibold text-slate-700">作业记录（可选）</h3>
          <div className="mb-1 flex gap-3">
            <input
              type="text"
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
              placeholder="作业标题"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              value={hwScore}
              onChange={(e) => setHwScore(e.target.value)}
              placeholder="得分"
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              value={hwFull}
              onChange={(e) => setHwFull(e.target.value)}
              placeholder="满分"
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <input
            type="text"
            value={hwWeakPoints}
            onChange={(e) => setHwWeakPoints(e.target.value)}
            placeholder="薄弱知识点（逗号分隔）"
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? '生成中...' : '生成学习计划'}
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
          <option value="active">进行中</option>
          <option value="completed">已完成</option>
          <option value="archived">已归档</option>
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
          {[1, 2].map((i) => (
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
          <p className="mt-2 text-sm text-slate-500">暂无学习计划</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300"
            >
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <div>
                  <h3 className="font-medium text-slate-800">{item.course}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    创建于 {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === 'active'
                        ? 'bg-green-50 text-green-600'
                        : item.status === 'completed'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.status === 'active'
                      ? '进行中'
                      : item.status === 'completed'
                        ? '已完成'
                        : '已归档'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {expandedId === item.id ? '收起 ▲' : '展开 ▼'}
                  </span>
                </div>
              </div>
              {expandedId === item.id && <PlanExpanded />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlanExpanded() {
  return (
    <div className="border-t border-slate-100 px-4 py-4">
      <div className="space-y-4 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-1 font-medium text-slate-700">📈 学情分析</p>
          <p className="text-slate-600">基础概念掌握一般，应用题偏弱</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {['复合函数求导', '极值应用题'].map((w) => (
              <span
                key={w}
                className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700"
              >
                {w}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-medium text-slate-700">📋 每日计划</p>
          <div className="space-y-2">
            {[
              '复习核心知识点并完成基础练习',
              '强化薄弱知识点，完成专项练习',
              '进行综合训练，提升应用能力',
              '总结回顾，整理错题笔记',
            ].map((task, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-700">{task}</p>
                  <p className="mt-0.5 text-xs text-slate-400">⏱ 60 分钟</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
