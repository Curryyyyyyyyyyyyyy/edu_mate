import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { getTeacherCourseDetail } from '../../../api/teacherCourses'
import type { TeacherCourseDetail } from '../../../types/api'
import CourseManageTab from './CourseManageTab'
import AssignmentsTab from './AssignmentsTab'
import GradingTab from './GradingTab'
import AnalyzeTab from './AnalyzeTab'

const TABS = [
  { key: 'manage', label: '课程管理', icon: '📖' },
  { key: 'assignments', label: '作业管理', icon: '📝' },
  { key: 'grading', label: 'AI批改', icon: '✅' },
  { key: 'analyze', label: '查重比对', icon: '🔍' },
]

export default function TeacherCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState<TeacherCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const activeTab = searchParams.get('tab') || 'manage'

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getTeacherCourseDetail(courseId)
      .then((res) => {
        if (!cancelled && res.success) setCourse(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [courseId])

  const setTab = (tab: string) => {
    setSearchParams({ tab })
  }

  if (!courseId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-5xl">👈</p>
          <p className="mt-4 text-lg font-medium text-slate-600">请从左侧选择一个课程</p>
          <p className="mt-2 text-sm text-slate-400">或点击「创建课程」新建课程</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-1/4 rounded bg-slate-100" />
        <div className="h-96 rounded bg-slate-100" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-4xl">⚠️</p>
          <p className="mt-4 text-slate-600">课程不存在</p>
          <button onClick={() => navigate('/teacher')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">返回</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* 课程头部 */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">{course.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {course.semester} · {course.student_count} 名学生 · 课程码: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{course.code}</code>
          {course.description && ` · ${course.description}`}
        </p>
      </div>

      {/* Tab 导航 */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex gap-0 overflow-x-auto" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 内容 */}
      <div className="min-h-[400px]">
        {activeTab === 'manage' && <CourseManageTab courseId={courseId} course={course} />}
        {activeTab === 'assignments' && <AssignmentsTab courseId={courseId} />}
        {activeTab === 'grading' && <GradingTab courseId={courseId} />}
        {activeTab === 'analyze' && <AnalyzeTab courseId={courseId} />}
      </div>
    </div>
  )
}
