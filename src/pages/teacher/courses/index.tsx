/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { getTeacherCourseDetail } from '../../../api/teacherCourses'
import type { TeacherCourseDetail } from '../../../types/api'
import AnalyzeTab from './AnalyzeTab'
import AnnouncementsTab from './AnnouncementsTab'
import AssignmentsTab from './AssignmentsTab'
import CourseManageTab from './CourseManageTab'
import DiscussionsTab from './DiscussionsTab'
import GradingTab from './GradingTab'
import QuestionsTab from './QuestionsTab'
import QuizzesTab from './QuizzesTab'
import ScoresTab from './ScoresTab'

const TABS = [
  { key: 'manage', label: '课程管理' },
  { key: 'assignments', label: '作业管理' },
  { key: 'grading', label: 'AI 批改' },
  { key: 'analyze', label: '查重分析' },
  { key: 'quizzes', label: '测验管理' },
  { key: 'scores', label: '成绩查看' },
  { key: 'announcements', label: '公告' },
  { key: 'discussions', label: '讨论' },
  { key: 'questions', label: '答疑' },
]

export default function TeacherCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<TeacherCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const tabFromUrl = searchParams.get('tab') || 'manage'
  const activeTab = TABS.some((tab) => tab.key === tabFromUrl) ? tabFromUrl : 'manage'

  useEffect(() => {
    if (!courseId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    getTeacherCourseDetail(courseId)
      .then((res) => {
        if (!cancelled && res.success) setCourse(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('课程详情加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  const setTab = (tab: string) => {
    setSearchParams({ tab })
  }

  if (!courseId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-700">请选择一门课程</p>
          <p className="mt-2 text-sm text-slate-500">从左侧课程列表进入，或创建一门新课程。</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-1/4 rounded bg-slate-100" />
        <div className="h-96 rounded bg-slate-100" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-700">{error || '课程不存在'}</p>
          <button onClick={() => navigate('/teacher')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            返回课程列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">{course.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {course.semester || '未设置学期'} · {course.student_count} 名学生 · 课程码{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{course.code}</code>
          {course.description ? ` · ${course.description}` : ''}
        </p>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-0 overflow-x-auto" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'manage' && <CourseManageTab courseId={courseId} course={course} />}
        {activeTab === 'assignments' && <AssignmentsTab courseId={courseId} />}
        {activeTab === 'grading' && <GradingTab courseId={courseId} />}
        {activeTab === 'analyze' && <AnalyzeTab courseId={courseId} />}
        {activeTab === 'quizzes' && <QuizzesTab courseId={courseId} />}
        {activeTab === 'scores' && <ScoresTab courseId={courseId} />}
        {activeTab === 'announcements' && <AnnouncementsTab courseId={courseId} />}
        {activeTab === 'discussions' && <DiscussionsTab courseId={courseId} />}
        {activeTab === 'questions' && <QuestionsTab courseId={courseId} />}
      </div>
    </div>
  )
}
