import { useEffect, useState, useRef, useCallback, type FormEvent } from 'react'
import {
  getStudentQuizzes,
  getStudentQuiz,
  startQuiz,
  submitQuiz,
  getQuizResult,
  saveAnswer,
  getAttemptDetail,
} from '../../../api/quizzes'
import type {
  StudentQuizItem,
  StudentQuizDetail,
  QuizResultData,
  QuizAttemptStatus,
  StudentQuizQuestion,
} from '../../../types/api'

interface Props {
  courseId: string
}

type View = 'list' | 'detail' | 'taking' | 'result'

export default function QuizzesTab({ courseId }: Props) {
  const [items, setItems] = useState<StudentQuizItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [view, setView] = useState<View>('list')
  const [selectedQuiz, setSelectedQuiz] = useState<StudentQuizDetail | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptStatus, setAttemptStatus] = useState<QuizAttemptStatus | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null)

  // 记忆已开始的 attempt，退出后可以继续作答
  const activeAttemptsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getStudentQuizzes(courseId)
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

  const openQuiz = async (item: StudentQuizItem) => {
    try {
      const res = await getStudentQuiz(courseId, item.id)
      if (res.success) {
        setSelectedQuiz(res.data)
        setAttemptStatus(item.attempt_status)
        setView('detail')
      }
    } catch {
      // ignore
    }
  }

  const handleStart = async () => {
    if (!selectedQuiz) return
    try {
      const res = await startQuiz(courseId, selectedQuiz.id)
      if (res.success) {
        activeAttemptsRef.current[selectedQuiz.id] = res.data.attempt_id
        setAttemptId(res.data.attempt_id)
        setAttemptStatus('in_progress')
        setView('taking')
      }
    } catch {
      // ignore
    }
  }

  // 进入答题页：从 getStudentQuiz 取 attempt.id（后端已保证 in_progress 时返回）
  const enterTakingView = async (quizId: string) => {
    try {
      const res = await getStudentQuiz(courseId, quizId)
      if (!res.success) return
      setSelectedQuiz(res.data)
      const att = res.data.attempt
      if (att && att.status === 'in_progress') {
        // 已有进行中的 attempt，直接继续作答
        activeAttemptsRef.current[quizId] = att.id
        setAttemptId(att.id)
        setAttemptStatus('in_progress')
        setView('taking')
      } else if (att && att.status === 'submitted') {
        // 已提交，进详情页展示"已完成"
        setAttemptStatus('submitted')
        setView('detail')
      } else {
        // 未开始，进详情页展示"开始答题"
        setAttemptStatus(null)
        setView('detail')
      }
    } catch {
      // ignore
    }
  }

  // 列表"继续作答"入口
  const resumeQuiz = (quizId: string) => {
    enterTakingView(quizId)
  }

  const handleSubmit = async (answers: { question_id: string; answer: string }[]) => {
    if (!selectedQuiz || !attemptId) return
    try {
      const res = await submitQuiz(courseId, selectedQuiz.id, attemptId, { answers })
      if (res.success) {
        // 提交成功后清除 attempt 记忆
        delete activeAttemptsRef.current[selectedQuiz.id]
        setAttemptStatus('submitted')
        setQuizResult(res.data)
        setView('result')
      }
    } catch {
      // ignore
    }
  }

  const handleViewResult = async (quizId: string, attId: string) => {
    try {
      const res = await getQuizResult(courseId, quizId, attId)
      if (res.success) {
        setQuizResult(res.data)
        // Need to also load quiz detail for question info
        const quizRes = await getStudentQuiz(courseId, quizId)
        if (quizRes.success) setSelectedQuiz(quizRes.data)
        setView('result')
      }
    } catch {
      // ignore
    }
  }

  const backToList = () => {
    setView('list')
    setSelectedQuiz(null)
    setAttemptId(null)
    setAttemptStatus(null)
    setQuizResult(null)
    setRefreshKey((k) => k + 1)
  }

  // ── 列表视图 ──
  if (view === 'list') {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">共 {items.length} 个测验</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-3xl">📝</p>
            <p className="mt-2 text-sm text-slate-500">暂无测验</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-slate-800">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {item.question_count} 题
                      {item.time_limit_minutes ? ` · ${item.time_limit_minutes} 分钟` : ''}
                      {item.section_id ? ` · ${item.section_id}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.score != null && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        {item.score} 分
                      </span>
                    )}
                    {item.attempt_status === 'submitted' ? (
                      <button
                        onClick={() => openQuiz(item)}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        查看详情
                      </button>
                    ) : item.attempt_status === 'in_progress' ? (
                      <button
                        onClick={() => resumeQuiz(item.id)}
                        className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-200"
                      >
                        继续作答
                      </button>
                    ) : (
                      <button
                        onClick={() => openQuiz(item)}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        开始测验
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── 详情视图（开始前）──
  if (view === 'detail' && selectedQuiz) {
    return (
      <div>
        <button onClick={backToList} className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
          <svg className="mr-1 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回测验列表
        </button>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-800">{selectedQuiz.title}</h1>
          {selectedQuiz.description && (
            <p className="mt-2 text-sm text-slate-500">{selectedQuiz.description}</p>
          )}

          <div className="mt-4 flex gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 px-4 py-2">
              <p className="text-xs text-slate-400">题目数量</p>
              <p className="font-medium text-slate-700">{selectedQuiz.questions.length} 题</p>
            </div>
            {selectedQuiz.time_limit_minutes && (
              <div className="rounded-lg bg-slate-50 px-4 py-2">
                <p className="text-xs text-slate-400">时间限制</p>
                <p className="font-medium text-slate-700">{selectedQuiz.time_limit_minutes} 分钟</p>
              </div>
            )}
          </div>

          {attemptStatus === 'submitted' ? (
            <button
              disabled
              className="mt-6 rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
            >
              已完成
            </button>
          ) : attemptStatus === 'in_progress' ? (
            <button
              onClick={() => enterTakingView(selectedQuiz.id)}
              className="mt-6 rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
            >
              继续作答
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              开始答题
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── 答题视图 ──
  if (view === 'taking' && selectedQuiz && attemptId) {
    return (
      <QuizTakingView
        courseId={courseId}
        quiz={selectedQuiz}
        attemptId={attemptId}
        onSubmit={handleSubmit}
        onBack={backToList}
      />
    )
  }

  // ── 结果视图 ──
  if (view === 'result' && quizResult && selectedQuiz) {
    return (
      <QuizResultView
        quiz={selectedQuiz}
        result={quizResult}
        onBack={backToList}
      />
    )
  }

  return null
}

// ── 答题中组件 ──

function QuizTakingView({
  quiz,
  attemptId,
  onSubmit,
  onBack,
  courseId,
}: {
  courseId: string
  quiz: StudentQuizDetail
  attemptId: string
  onSubmit: (answers: { question_id: string; answer: string }[]) => void
  onBack: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  // 多选答案存储为 Set
  const [multiAnswers, setMultiAnswers] = useState<Record<string, Set<string>>>({})

  // 加载已保存的答案
  useEffect(() => {
    let cancelled = false
    getAttemptDetail(courseId, quiz.id, attemptId)
      .then((res) => {
        if (cancelled || !res.success || !res.data.answers) return
        const saved: Record<string, string> = {}
        const savedMulti: Record<string, Set<string>> = {}
        Object.entries(res.data.answers).forEach(([qId, ans]) => {
          if (ans.includes(',')) {
            savedMulti[qId] = new Set(ans.split(',').filter(Boolean))
          } else {
            saved[qId] = ans
          }
        })
        setAnswers(saved)
        setMultiAnswers(savedMulti)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [courseId, quiz.id, attemptId])

  // 自动保存定时器
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSave = useCallback((qId: string, ans: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaving(true)
      saveAnswer(courseId, quiz.id, attemptId, qId, ans)
        .finally(() => setSaving(false))
    }, 600)
  }, [courseId, quiz.id, attemptId])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const totalScore = quiz.questions.reduce((sum, q) => sum + q.score, 0)

  const handleSingleChoice = (qId: string, key: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: key }))
    doSave(qId, key)
  }

  const handleMultiChoice = (qId: string, key: string) => {
    let answerStr = ''
    setMultiAnswers((prev) => {
      const current = new Set(prev[qId] || [])
      if (current.has(key)) {
        current.delete(key)
      } else {
        current.add(key)
      }
      answerStr = Array.from(current).join(',')
      return { ...prev, [qId]: current }
    })
    doSave(qId, answerStr)
  }

  const handleTrueFalse = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
    doSave(qId, value)
  }

  const handleShortAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
    doSave(qId, value)
  }

  const handleSubmitClick = () => {
    // Check if all questions answered
    const unanswered = quiz.questions.filter((q) => {
      if (q.question_type === 'multi_choice') {
        const multiSet = multiAnswers[q.id]
        return !multiSet || multiSet.size === 0
      }
      return !answers[q.id]
    })

    if (unanswered.length > 0) {
      if (!confirm(`还有 ${unanswered.length} 题未作答，确定提交吗？`)) return
    }
    setShowConfirm(true)
  }

  const confirmSubmit = async () => {
    setSubmitting(true)
    const answerList = quiz.questions.map((q) => ({
      question_id: q.id,
      answer: q.question_type === 'multi_choice'
        ? Array.from(multiAnswers[q.id] || []).join(',')
        : (answers[q.id] || ''),
    }))
    await onSubmit(answerList)
  }

  const question = quiz.questions[currentIndex]
  const answeredCount = quiz.questions.filter((q) => {
    if (q.question_type === 'multi_choice') {
      const s = multiAnswers[q.id]
      return s && s.size > 0
    }
    return !!answers[q.id]
  }).length

  return (
    <div>
      {/* 顶部信息 */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700">
          <svg className="mr-1 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          退出答题
        </button>
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          已答 {answeredCount}/{quiz.questions.length} 题
          {saving && (
            <span className="text-xs text-slate-400">保存中...</span>
          )}
        </span>
      </div>

      {/* 进度条 */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* 题目导航 */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {quiz.questions.map((q, i) => {
          const isAnswered = q.question_type === 'multi_choice'
            ? multiAnswers[q.id]?.size > 0
            : !!answers[q.id]
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                currentIndex === i
                  ? 'bg-blue-600 text-white'
                  : isAnswered
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* 当前题目 */}
      {question && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
              {question.question_type === 'single_choice' ? '单选题' :
               question.question_type === 'multi_choice' ? '多选题' :
               question.question_type === 'true_false' ? '判断题' : '简答题'}
              {' · '}{question.score} 分
            </span>
            <span className="text-sm text-slate-500">第 {currentIndex + 1}/{quiz.questions.length} 题</span>
          </div>

          <h3 className="mb-4 text-base font-medium text-slate-800">{question.content}</h3>

          {/* 单选题 */}
          {question.question_type === 'single_choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((opt) => (
                <label
                  key={opt.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    answers[question.id] === opt.key
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q_${question.id}`}
                    value={opt.key}
                    checked={answers[question.id] === opt.key}
                    onChange={() => handleSingleChoice(question.id, opt.key)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="mr-2 font-medium text-slate-500">{opt.key}.</span>
                    {opt.text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* 多选题 */}
          {question.question_type === 'multi_choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((opt) => {
                const selected = multiAnswers[question.id]?.has(opt.key)
                return (
                  <label
                    key={opt.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected || false}
                      onChange={() => handleMultiChoice(question.id, opt.key)}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                    <span className="text-sm text-slate-700">
                      <span className="mr-2 font-medium text-slate-500">{opt.key}.</span>
                      {opt.text}
                    </span>
                  </label>
                )
              })}
            </div>
          )}

          {/* 判断题 */}
          {question.question_type === 'true_false' && (
            <div className="space-y-2">
              {[
                { key: 'true', text: '正确' },
                { key: 'false', text: '错误' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    answers[question.id] === opt.key
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q_${question.id}`}
                    value={opt.key}
                    checked={answers[question.id] === opt.key}
                    onChange={() => handleTrueFalse(question.id, opt.key)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">{opt.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* 简答题 */}
          {question.question_type === 'short_answer' && (
            <textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleShortAnswer(question.id, e.target.value)}
              placeholder="请输入你的答案..."
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          )}
        </div>
      )}

      {/* 底部导航 */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
        >
          上一题
        </button>

        {currentIndex < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            下一题
          </button>
        ) : (
          <button
            onClick={handleSubmitClick}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            提交答案
          </button>
        )}
      </div>

      {/* 确认提交弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">确认提交</h2>
            <p className="mt-2 text-sm text-slate-500">
              提交后将无法修改答案。已答 {answeredCount}/{quiz.questions.length} 题，满分 {totalScore} 分。
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                继续检查
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 结果视图 ──

function QuizResultView({
  quiz,
  result,
  onBack,
}: {
  quiz: StudentQuizDetail
  result: QuizResultData
  onBack: () => void
}) {
  const rate = result.full_score > 0 ? (result.total_score / result.full_score * 100) : 0

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
        <svg className="mr-1 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回测验列表
      </button>

      {/* 成绩总览 */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-4xl">🎉</p>
        <p className="mt-2 text-2xl font-bold text-slate-800">
          {result.total_score} / {result.full_score}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          正确率 {rate.toFixed(0)}%
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* 各题结果 */}
      <div className="space-y-3">
        {result.results.map((r, i) => {
          const question = quiz.questions.find((q) => q.id === r.question_id)
          return (
            <div
              key={r.question_id}
              className={`rounded-lg border p-4 ${
                r.is_correct
                  ? 'border-green-100 bg-green-50/30'
                  : 'border-red-100 bg-red-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {i + 1}. {question?.content || r.question_id}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    得分：{r.score}/{question?.score || 0} 分
                  </p>
                  {!r.is_correct && (
                    <div className="mt-2 rounded bg-white p-2 text-xs">
                      <p className="text-slate-500">
                        <span className="font-medium">正确答案：</span>{r.correct_answer}
                      </p>
                      {r.explanation && (
                        <p className="mt-0.5 text-slate-500">
                          <span className="font-medium">解析：</span>{r.explanation}
                        </p>
                      )}
                    </div>
                  )}
                  {r.ai_feedback && (
                    <p className="mt-1 text-xs text-blue-600">💬 {r.ai_feedback}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.is_correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {r.is_correct ? '✓' : '✗'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
