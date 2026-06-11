import { useEffect, useState, useCallback, type FormEvent } from 'react'
import {
  getLearningPlans,
  createLearningPlan,
  getLearningPlan,
  updatePlanStatus,
  markTaskComplete,
  getPlanProgress,
} from '../../../api/learningPlans'
import type {
  LearningPlanListItem,
  LearningPlanData,
  PlanProgress,
} from '../../../types/api'

interface Props {
  courseId: string
}

export default function LearningPlansTab({ courseId }: Props) {
  const [items, setItems] = useState<LearningPlanListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const [goal, setGoal] = useState('')
  const [availableTime, setAvailableTime] = useState('60')
  const [planDays, setPlanDays] = useState('7')

  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getLearningPlans(courseId)
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, refreshKey])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await createLearningPlan(courseId, {
        goal: goal.trim() || undefined,
        available_time_per_day: Number(availableTime) || 60,
        plan_days: Number(planDays) || 7,
      })
      setGoal('')
      setAvailableTime('60')
      setPlanDays('7')
      setShowCreate(false)
      setRefreshKey((k) => k + 1)
    } catch {
      setError('创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  const handleComplete = async (planId: string) => {
    try {
      await updatePlanStatus(courseId, planId, 'completed')
      setRefreshKey((k) => k + 1)
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          共 {items.length} 个学习计划
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {showCreate ? '取消' : '＋ 生成计划'}
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
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
                placeholder="每日可用时间"
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-sm text-slate-500">分钟/天</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                value={planDays}
                onChange={(e) => setPlanDays(e.target.value)}
                placeholder="计划天数"
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-sm text-slate-500">天</span>
            </div>
          </div>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="学习目标（可选），例如：两周内提升进程调度相关知识点的掌握程度"
            rows={2}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mb-3 text-xs text-slate-400">
            💡 系统将自动采集你的作业成绩、测试记录、提问历史等数据，生成个性化计划
          </p>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? '生成中...' : '生成学习计划'}
          </button>
        </form>
      )}

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
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm text-slate-500">暂无学习计划，点击上方按钮生成</p>
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
                  <h3 className="font-medium text-slate-800">
                    {item.course_name}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.basis?.goal
                      ? `${item.basis.goal.slice(0, 30)}${item.basis.goal.length > 30 ? '…' : ''}`
                      : item.basis
                        ? `${item.basis.plan_days || '?'} 天 · 每日 ${item.basis.available_time_per_day || '?'} 分钟`
                        : ''}
                  </p>
                  <p className="text-xs text-slate-400">
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
              {expandedId === item.id && (
                <ExpandedPlan
                  courseId={courseId}
                  planId={item.id}
                  onComplete={() => handleComplete(item.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpandedPlan({
  courseId,
  planId,
  onComplete,
}: {
  courseId: string
  planId: string
  onComplete: () => void
}) {
  const [plan, setPlan] = useState<LearningPlanData | null>(null)
  const [progress, setProgress] = useState<PlanProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [checkinDay, setCheckinDay] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, prRes] = await Promise.all([
        getLearningPlan(courseId, planId),
        getPlanProgress(courseId, planId).catch(() => null),
      ])
      if (pRes.success) setPlan(pRes.data)
      if (prRes?.success) setProgress(prRes.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [courseId, planId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const handleCheckin = async (day: number) => {
    setToggling(day)
    try {
      await markTaskComplete(courseId, planId, day, true, feedbackText.trim() || undefined)
      setFeedbackText('')
      setCheckinDay(null)
      await load()
    } catch {
      // ignore
    } finally {
      setToggling(null)
    }
  }

  const handleUndo = async (day: number) => {
    setToggling(day)
    try {
      await markTaskComplete(courseId, planId, day, false)
      await load()
    } catch {
      // ignore
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return (
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-100 px-4 py-4">
      <div className="space-y-4 text-sm">
        {/* 计划概要 */}
        {plan?.basis && (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="mb-1 font-medium text-slate-700">📋 计划概要</p>
            <p className="text-slate-600">
              {plan.basis.plan_days || '?'} 天 · 每日 {plan.basis.available_time_per_day || '?'} 分钟
            </p>
            {plan.basis.goal && (
              <p className="mt-0.5 text-xs text-slate-500">
                🎯 {plan.basis.goal}
              </p>
            )}
            {plan.basis.adjustment_feedback && (
              <p className="mt-0.5 text-xs text-orange-600">
                🔄 调整反馈：{plan.basis.adjustment_feedback}
              </p>
            )}
          </div>
        )}

        {/* 分析 */}
        {plan?.analysis && (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="mb-1 font-medium text-slate-700">📈 学情分析</p>
            <p className="text-slate-600">{plan.analysis.current_level}</p>
            {plan.analysis.weak_points && plan.analysis.weak_points.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {plan.analysis.weak_points.map((w) => (
                  <span
                    key={w}
                    className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700"
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}
            {plan.analysis.priority && (
              <p className="mt-1.5 text-xs text-slate-500">
                🎯 优先级：{plan.analysis.priority}
              </p>
            )}
            {plan.data_sources && (
              <p className="mt-1 text-xs text-slate-400">
                数据来源：{plan.data_sources.join('、')}
              </p>
            )}
          </div>
        )}

        {/* 进度概览 */}
        {progress && (
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-blue-700">📊 进度</p>
              <p className="text-sm text-blue-600">
                {progress.completed_days}/{progress.total_days} 天 ·{' '}
                {Math.round(progress.completion_rate * 100)}%
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress.completion_rate * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 每日计划 */}
        {plan?.plan && plan.plan.length > 0 && (
          <div>
            <p className="mb-2 font-medium text-slate-700">📋 每日计划</p>
            <div className="space-y-2">
              {plan.plan.map((day) => {
                const taskProgress = progress?.tasks?.find(
                  (t) => t.day === day.day,
                )
                const completed = taskProgress?.completed ?? false
                const isOpen = checkinDay === day.day
                return (
                  <div
                    key={day.day}
                    className={`rounded-lg border p-3 transition-colors ${
                      completed
                        ? 'border-green-100 bg-green-50/50'
                        : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => {
                          if (completed) {
                            handleUndo(day.day)
                          } else {
                            setCheckinDay(isOpen ? null : day.day)
                            setFeedbackText('')
                          }
                        }}
                        disabled={toggling === day.day}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          completed
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                        title={completed ? '取消打卡' : '点击打卡'}
                      >
                        {toggling === day.day ? '…' : completed ? '✓' : day.day}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-slate-700 ${
                            completed ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {day.task}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          ⏱ {day.duration_minutes} 分钟
                          {day.section_title ? ` · ${day.section_title}` : ''}
                        </p>
                        {taskProgress?.feedback && (
                          <p className="mt-1 text-xs text-slate-500">
                            💬 {taskProgress.feedback}
                          </p>
                        )}
                        {taskProgress?.completed_at && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            🕒 {new Date(taskProgress.completed_at).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* 打卡反馈输入 */}
                    {isOpen && !completed && (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <textarea
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="学习心得（可选），例如：已掌握进程状态转换"
                          rows={2}
                          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCheckin(day.day)}
                            disabled={toggling === day.day}
                            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            {toggling === day.day ? '打卡中...' : '✅ 确认打卡'}
                          </button>
                          <button
                            onClick={() => setCheckinDay(null)}
                            className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-50"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {plan && plan.plan?.some(
            (d) => progress?.tasks?.find((t) => t.day === d.day)?.completed,
          ) && (
            <button
              onClick={onComplete}
              className="rounded-lg border border-green-200 px-4 py-1.5 text-sm text-green-600 transition-colors hover:bg-green-50"
            >
              标记完成
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
