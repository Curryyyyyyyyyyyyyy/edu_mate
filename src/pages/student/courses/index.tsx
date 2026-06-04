import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { getStudentCourseDetail } from '../../../api/courses'
import type { StudentCourseDetail } from '../../../types/api'
import CourseContentTab from './CourseContentTab'
import ChatTab from './ChatTab'
import AssignmentsTab from './AssignmentsTab'
import SummariesTab from './SummariesTab'
import LearningPlansTab from './LearningPlansTab'

const TABS = [
  { key: 'sections', label: '课程内容', icon: '📖' },
  { key: 'chat', label: 'AI问答', icon: '💬' },
  { key: 'assignments', label: '作业列表', icon: '📝' },
  { key: 'summaries', label: '知识总结', icon: '📊' },
  { key: 'learning-plans', label: '学习计划', icon: '📅' },
]

export default function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState<StudentCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const activeTab = searchParams.get('tab') || 'sections'

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getStudentCourseDetail(courseId)
      .then((res) => {
        if (!cancelled && res.success) setCourse(res.data)
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

  // 没有选中课程
  if (!courseId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-5xl">👈</p>
          <p className="mt-4 text-lg font-medium text-slate-600">
            请从左侧选择一个课程
          </p>
          <p className="mt-2 text-sm text-slate-400">
            或点击「加入课程」输入课程码
          </p>
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
          <p className="mt-4 text-slate-600">课程不存在或你未加入该课程</p>
          <button
            onClick={() => navigate('/student')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            返回课程列表
          </button>
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
          {course.teacher_name} · {course.semester}
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
        {activeTab === 'sections' && <CourseContentTab courseId={courseId} />}
        {activeTab === 'chat' && <ChatTab courseId={courseId} />}
        {activeTab === 'assignments' && <AssignmentsTab courseId={courseId} />}
        {activeTab === 'summaries' && <SummariesTab courseId={courseId} />}
        {activeTab === 'learning-plans' && <LearningPlansTab courseId={courseId} />}
      </div>
    </div>
  )
}
