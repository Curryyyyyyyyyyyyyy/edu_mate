/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createQuiz, getQuizAttempts, getTeacherQuizzes, updateQuizStatus } from '../../../api/quizzes'
import { getTeacherSections } from '../../../api/teacherSections'
import type {
  QuizAttemptSummary,
  QuizCreateRequest,
  QuizQuestionCreate,
  QuizQuestionType,
  QuizStatus,
  SectionItem,
  TeacherQuizAttemptsData,
  TeacherQuizItem,
} from '../../../types/api'

interface Props { courseId: string }

type DraftQuestion = {
  id: string
  question_type: QuizQuestionType
  content: string
  options: { key: string; text: string }[]
  correct_answer: string
  explanation: string
  score: string
}

const questionTypeLabels: Record<QuizQuestionType, string> = {
  single_choice: '单选题',
  multi_choice: '多选题',
  true_false: '判断题',
  short_answer: '简答题',
}

const statusLabels: Record<QuizStatus, string> = {
  open: '开放中',
  closed: '已关闭',
}

const optionKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

let draftQuestionId = 0

function createDraftQuestionId() {
  draftQuestionId += 1
  return `draft_question_${Date.now()}_${draftQuestionId}`
}

function newQuestion(type: QuizQuestionType = 'single_choice'): DraftQuestion {
  return {
    id: createDraftQuestionId(),
    question_type: type,
    content: '',
    options: type === 'true_false'
      ? [{ key: 'A', text: '正确' }, { key: 'B', text: '错误' }]
      : type === 'short_answer'
        ? []
        : [{ key: 'A', text: '' }, { key: 'B', text: '' }],
    correct_answer: '',
    explanation: '',
    score: '10',
  }
}

function normalizeQuestion(question: DraftQuestion, index: number): QuizQuestionCreate {
  const payload: QuizQuestionCreate = {
    question_type: question.question_type,
    content: question.content.trim(),
    correct_answer: question.correct_answer.trim(),
    explanation: question.explanation.trim() || undefined,
    score: Number(question.score) || 0,
    order: index + 1,
  }

  if (question.question_type !== 'short_answer') {
    payload.options = question.options
      .filter((option) => option.text.trim())
      .map((option) => ({ key: option.key, text: option.text.trim() }))
  }

  return payload
}

export default function QuizzesTab({ courseId }: Props) {
  const [quizzes, setQuizzes] = useState<TeacherQuizItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [statusFilter, setStatusFilter] = useState<'' | QuizStatus>('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion()])

  const [attempts, setAttempts] = useState<TeacherQuizAttemptsData | null>(null)
  const [attemptQuizTitle, setAttemptQuizTitle] = useState('')
  const [loadingAttempts, setLoadingAttempts] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      getTeacherQuizzes(courseId, {
        status: statusFilter || undefined,
        section_id: sectionFilter || undefined,
      }),
      getTeacherSections(courseId),
    ])
      .then(([quizRes, sectionRes]) => {
        if (cancelled) return
        if (quizRes.success) setQuizzes(quizRes.data.items)
        if (sectionRes.success) setSections(sectionRes.data.items)
      })
      .catch(() => {
        if (!cancelled) setError('测验列表加载失败，请稍后重试。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [courseId, statusFilter, sectionFilter, refreshKey])

  const sectionNameMap = useMemo(() => {
    return new Map(sections.map((section) => [section.id, section.title]))
  }, [sections])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSectionId('')
    setTimeLimit('')
    setQuestions([newQuestion()])
  }

  const updateQuestion = (id: string, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((question) => (
      question.id === id ? { ...question, ...patch } : question
    )))
  }

  const changeQuestionType = (id: string, type: QuizQuestionType) => {
    setQuestions((prev) => prev.map((question) => (
      question.id === id
        ? { ...newQuestion(type), id, content: question.content, score: question.score }
        : question
    )))
  }

  const addOption = (questionId: string) => {
    setQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId || question.options.length >= optionKeys.length) return question
      return {
        ...question,
        options: [...question.options, { key: optionKeys[question.options.length], text: '' }],
      }
    }))
  }

  const updateOption = (questionId: string, key: string, text: string) => {
    setQuestions((prev) => prev.map((question) => (
      question.id === questionId
        ? { ...question, options: question.options.map((option) => option.key === key ? { ...option, text } : option) }
        : question
    )))
  }

  const removeOption = (questionId: string, key: string) => {
    setQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question
      const options = question.options
        .filter((option) => option.key !== key)
        .map((option, index) => ({ ...option, key: optionKeys[index] }))
      return {
        ...question,
        options,
        correct_answer: question.correct_answer
          .split(',')
          .map((answer) => answer.trim())
          .filter((answer) => answer && answer !== key)
          .join(','),
      }
    }))
  }

  const setSingleAnswer = (questionId: string, key: string) => {
    setQuestions((prev) => prev.map((question) => (
      question.id === questionId ? { ...question, correct_answer: key } : question
    )))
  }

  const toggleMultiAnswer = (questionId: string, key: string) => {
    setQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question
      const selected = question.correct_answer
        .split(',')
        .map((answer) => answer.trim())
        .filter(Boolean)
      const index = selected.indexOf(key)
      if (index >= 0) {
        selected.splice(index, 1)
      } else {
        selected.push(key)
      }
      return { ...question, correct_answer: selected.join(',') }
    }))
  }

  const validate = () => {
    if (!title.trim()) return '请填写测验标题。'
    if (questions.length === 0) return '请至少添加一道题目。'
    for (const [index, question] of questions.entries()) {
      if (!question.content.trim()) return `第 ${index + 1} 题缺少题干。`
      if (!question.correct_answer.trim()) return `第 ${index + 1} 题缺少参考答案。`
      if (question.question_type !== 'short_answer' && question.options.filter((option) => option.text.trim()).length < 2) {
        return `第 ${index + 1} 题至少需要两个有效选项。`
      }
    }
    return ''
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload: QuizCreateRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      section_id: sectionId || undefined,
      time_limit_minutes: Number(timeLimit) || undefined,
      questions: questions.map(normalizeQuestion),
    }

    setCreating(true)
    setError('')
    try {
      const res = await createQuiz(courseId, payload)
      if (res.success) {
        resetForm()
        setShowCreate(false)
        setRefreshKey((key) => key + 1)
      } else {
        setError(res.message || '测验创建失败。')
      }
    } catch {
      setError('测验创建失败，请检查题目内容后重试。')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (quiz: TeacherQuizItem, status: QuizStatus) => {
    setError('')
    try {
      await updateQuizStatus(courseId, quiz.id, status)
      setQuizzes((prev) => prev.map((item) => item.id === quiz.id ? { ...item, status } : item))
    } catch {
      setError('状态更新失败，请稍后重试。')
    }
  }

  const openAttempts = async (quiz: TeacherQuizItem) => {
    setAttemptQuizTitle(quiz.title)
    setLoadingAttempts(true)
    setAttempts(null)
    setError('')
    try {
      const res = await getQuizAttempts(courseId, quiz.id)
      if (res.success) setAttempts(res.data)
    } catch {
      setError('作答汇总加载失败，请稍后重试。')
    } finally {
      setLoadingAttempts(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | QuizStatus)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            <option value="">全部状态</option>
            <option value="open">开放中</option>
            <option value="closed">已关闭</option>
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
            <option value="">全部小节</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </div>
        <button onClick={() => setShowCreate((value) => !value)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showCreate ? '收起表单' : '创建测验'}
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-5 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="测验标题 *" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
                <option value="">不关联小节</option>
                {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
              </select>
              <input type="number" min="1" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="限时（分钟）" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            </div>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="测验说明（可选）" rows={2} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />

          <div className="mt-4 space-y-3">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">第 {index + 1} 题</p>
                  <div className="flex gap-2">
                    <select value={question.question_type} onChange={(e) => changeQuestionType(question.id, e.target.value as QuizQuestionType)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none">
                      {Object.entries(questionTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                    <input type="number" min="0" value={question.score} onChange={(e) => updateQuestion(question.id, { score: e.target.value })} className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none" />
                    <button type="button" onClick={() => setQuestions((prev) => prev.filter((item) => item.id !== question.id))} disabled={questions.length === 1} className="rounded-lg border border-red-100 px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40">删除</button>
                  </div>
                </div>
                <textarea value={question.content} onChange={(e) => updateQuestion(question.id, { content: e.target.value })} placeholder="题干 *" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />

                {question.question_type !== 'short_answer' && (
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => (
                      <div key={option.key} className="flex items-center gap-2">
                        <span className="w-6 text-xs font-semibold text-slate-500">{option.key}</span>
                        <input value={option.text} onChange={(e) => updateOption(question.id, option.key, e.target.value)} disabled={question.question_type === 'true_false'} placeholder={`选项 ${option.key}`} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:bg-slate-50" />
                        {question.question_type !== 'true_false' && (
                          <button type="button" onClick={() => removeOption(question.id, option.key)} disabled={question.options.length <= 2} className="rounded border px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40">移除</button>
                        )}
                      </div>
                    ))}
                    {question.question_type !== 'true_false' && (
                      <button type="button" onClick={() => addOption(question.id)} className="rounded border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50">添加选项</button>
                    )}
                  </div>
                )}

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {question.question_type === 'short_answer' ? (
                    <input value={question.correct_answer} onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })} placeholder="参考答案 *" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                  ) : question.question_type === 'multi_choice' ? (
                    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                      <p className="mb-1.5 text-xs font-medium text-slate-500">正确答案（可多选）*</p>
                      <div className="flex flex-wrap gap-2">
                        {question.options.map((option) => {
                          const selected = question.correct_answer.split(',').map((a) => a.trim()).includes(option.key)
                          return (
                            <label key={option.key} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${selected ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                              <input type="checkbox" checked={selected} onChange={() => toggleMultiAnswer(question.id, option.key)} className="accent-blue-600" />
                              <span className="font-semibold">{option.key}</span>
                              <span className="text-slate-500">·</span>
                              <span>{option.text || `选项 ${option.key}`}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                      <p className="mb-1.5 text-xs font-medium text-slate-500">正确答案 *</p>
                      <div className="flex flex-wrap gap-2">
                        {question.options.map((option) => (
                          <label key={option.key} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${question.correct_answer === option.key ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                            <input type="radio" name={`correct_answer_${question.id}`} checked={question.correct_answer === option.key} onChange={() => setSingleAnswer(question.id, option.key)} className="accent-blue-600" />
                            <span className="font-semibold">{option.key}</span>
                            <span className="text-slate-500">·</span>
                            <span>{option.text || `选项 ${option.key}`}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <input value={question.explanation} onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })} placeholder="答案解析（可选）" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setQuestions((prev) => [...prev, newQuestion()])} className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">添加题目</button>
            <button type="submit" disabled={creating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{creating ? '创建中...' : '提交测验'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg border border-slate-200 bg-white" />)}</div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-500">暂无测验。可以先创建一份测验，或调整筛选条件。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {quiz.section_id && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{sectionNameMap.get(quiz.section_id) || '未命名小节'}</span>}
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${quiz.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{statusLabels[quiz.status]}</span>
                  </div>
                  <h3 className="font-medium text-slate-800">{quiz.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>{quiz.question_count} 题</span>
                    <span>作答 {quiz.attempt_count} 次</span>
                    <span>{quiz.time_limit_minutes ? `${quiz.time_limit_minutes} 分钟` : '不限时'}</span>
                    <span>创建于 {new Date(quiz.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <button onClick={() => openAttempts(quiz)} className="rounded-lg border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">作答汇总</button>
                  {quiz.status === 'open' ? (
                    <button onClick={() => handleStatusChange(quiz, 'closed')} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">关闭</button>
                  ) : (
                    <button onClick={() => handleStatusChange(quiz, 'open')} className="rounded-lg border border-emerald-100 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50">开放</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(loadingAttempts || attempts) && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">作答汇总：{attemptQuizTitle}</h3>
              {attempts && <p className="mt-1 text-xs text-slate-500">共 {attempts.attempt_count} 次作答，平均分 {attempts.average_score}</p>}
            </div>
            <button onClick={() => setAttempts(null)} className="rounded border px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">关闭</button>
          </div>
          {loadingAttempts ? (
            <div className="h-20 animate-pulse rounded bg-slate-100" />
          ) : attempts && attempts.items.length === 0 ? (
            <p className="rounded bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">暂无学生提交。</p>
          ) : attempts && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">学生</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">得分</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">提交时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attempts.items.map((item: QuizAttemptSummary) => (
                    <tr key={item.attempt_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{item.student_name}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{item.total_score}/{item.full_score}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{new Date(item.submitted_at).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
