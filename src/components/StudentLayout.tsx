import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Outlet, useNavigate, useParams, NavLink } from 'react-router'
import { useAuth } from './useAuth'
import { getStudentCourses, joinCourse } from '../api/courses'
import type { StudentCourseItem } from '../types/api'

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { courseId } = useParams<{ courseId?: string }>()

  const [courses, setCourses] = useState<StudentCourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  // 加入课程弹窗
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  const fetchCourses = useCallback(async () => {
    try {
      const res = await getStudentCourses()
      if (res.success) {
        setCourses(res.data.items)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses()
  }, [fetchCourses])

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) {
      setJoinError('请输入课程码')
      return
    }
    setJoinError('')
    setJoining(true)
    try {
      const res = await joinCourse(joinCode.trim().toUpperCase())
      if (res.success) {
        setJoinCode('')
        setJoinOpen(false)
        await fetchCourses()
        navigate(`/student/courses/${res.data.course_id}?tab=sections`)
      }
    } catch {
      setJoinError('课程码无效或课程不存在')
    } finally {
      setJoining(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const selectedId = courseId

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* 侧边栏 — 课程列表 */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col md:min-h-0">
        {/* 顶部品牌 */}
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
          <span className="text-lg">🎓</span>
          <span className="text-base font-semibold text-slate-800">智学伴侣</span>
          <span className="ml-auto rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            学生端
          </span>
        </div>

        {/* 课程列表 */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            我的课程
          </p>
          {loading ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="px-2 text-sm text-slate-400">暂无课程</p>
          ) : (
            <div className="space-y-0.5">
              {courses.map((c) => (
                <NavLink
                  key={c.id}
                  to={`/student/courses/${c.id}?tab=sections`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      c.status === 'active' ? 'bg-emerald-400' : 'bg-slate-300'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {c.teacher_name}
                    </p>
                  </div>
                </NavLink>
              ))}
            </div>
          )}

          {/* 加入课程按钮 */}
          <button
            onClick={() => setJoinOpen(true)}
            className="mt-3 w-full rounded-lg border-2 border-dashed border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-600"
          >
            ＋ 加入课程
          </button>
        </nav>

        {/* 底部用户信息 */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">
              {user?.extra?.class_name || user?.username || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* 移动端顶部栏 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-semibold text-slate-800">智学伴侣</span>
          {selectedId && (
            <span className="text-sm text-slate-500">
              {courses.find((c) => c.id === selectedId)?.name || ''}
            </span>
          )}
        </header>

        {/* 移动端菜单 */}
        {menuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              我的课程
            </p>
            <nav className="space-y-1">
              {courses.map((c) => (
                <NavLink
                  key={c.id}
                  to={`/student/courses/${c.id}?tab=sections`}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600'
                    }`
                  }
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      c.status === 'active' ? 'bg-emerald-400' : 'bg-slate-300'
                    }`}
                  />
                  {c.name}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => {
                setMenuOpen(false)
                setJoinOpen(true)
              }}
              className="mt-3 w-full rounded-lg border-2 border-dashed border-slate-200 px-3 py-2 text-sm font-medium text-slate-500"
            >
              ＋ 加入课程
            </button>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <button onClick={handleLogout} className="mt-1 text-sm text-red-500">
                退出登录
              </button>
            </div>
          </div>
        )}

        {/* 主内容 */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4 lg:px-8 lg:py-4" style={{ scrollbarGutter: 'stable' }}>
          <Outlet context={{ courses, refreshCourses: fetchCourses, openJoinDialog: () => setJoinOpen(true) }} />
        </main>
      </div>

      {/* 加入课程弹窗 */}
      {joinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">加入课程</h2>
            <p className="mt-1 text-sm text-slate-500">
              请输入老师提供的 6 位课程码
            </p>
            <form onSubmit={handleJoin} className="mt-4">
              {joinError && (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {joinError}
                </div>
              )}
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="例如：OS8X2K"
                maxLength={6}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-lg font-mono tracking-widest uppercase transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJoinOpen(false)
                    setJoinCode('')
                    setJoinError('')
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={joining || joinCode.trim().length === 0}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joining ? '加入中...' : '加入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
