import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { Outlet, useNavigate, NavLink } from 'react-router'
import { useAuth } from './useAuth'
import { getTeacherCourses, createCourse } from '../api/teacherCourses'
import type { TeacherCourseItem } from '../types/api'

export default function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<TeacherCourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  // 创建课程弹窗
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createSemester, setCreateSemester] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchCourses = useCallback(async () => {
    try {
      const res = await getTeacherCourses()
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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) {
      setCreateError('请输入课程名称')
      return
    }
    setCreateError('')
    setCreating(true)
    try {
      const res = await createCourse({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        semester: createSemester.trim() || undefined,
      })
      if (res.success) {
        setCreateName('')
        setCreateDesc('')
        setCreateSemester('')
        setCreateOpen(false)
        await fetchCourses()
        navigate(`/teacher/courses/${res.data.id}?tab=manage`)
      }
    } catch {
      setCreateError('创建失败，请重试')
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
          <span className="text-lg">🎓</span>
          <span className="text-base font-semibold text-slate-800">智学伴侣</span>
          <span className="ml-auto rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            教师端
          </span>
        </div>

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
                  to={`/teacher/courses/${c.id}?tab=manage`}
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
                      {c.student_count} 名学生 · 课程码: {c.code}
                    </p>
                  </div>
                </NavLink>
              ))}
            </div>
          )}

          <button
            onClick={() => setCreateOpen(true)}
            className="mt-3 w-full rounded-lg border-2 border-dashed border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-600"
          >
            ＋ 创建课程
          </button>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">教师</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* 移动端 */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-semibold text-slate-800">智学伴侣</span>
          <span className="ml-auto rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            教师端
          </span>
        </header>

        {menuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav className="space-y-1">
              {courses.map((c) => (
                <NavLink
                  key={c.id}
                  to={`/teacher/courses/${c.id}?tab=manage`}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                    }`
                  }
                >
                  <span className={`h-2 w-2 rounded-full ${c.status === 'active' ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  {c.name}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={() => { setMenuOpen(false); setCreateOpen(true) }}
              className="mt-3 w-full rounded-lg border-2 border-dashed border-slate-200 px-3 py-2 text-sm font-medium text-slate-500"
            >
              ＋ 创建课程
            </button>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <button onClick={handleLogout} className="mt-1 text-sm text-red-500">退出登录</button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet context={{ courses, refreshCourses: fetchCourses }} />
        </main>
      </div>

      {/* 创建课程弹窗 */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-800">创建课程</h2>
            <p className="mt-1 text-sm text-slate-500">填写课程基本信息，系统将自动生成课程码</p>
            <form onSubmit={handleCreate} className="mt-4">
              {createError && (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createError}</div>
              )}
              <label className="mb-1 block text-sm font-medium text-slate-700">课程名称 *</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="例如：操作系统"
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              <label className="mb-1 block text-sm font-medium text-slate-700">课程简介</label>
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="简要描述课程内容"
                rows={2}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <label className="mb-1 block text-sm font-medium text-slate-700">学期</label>
              <input
                type="text"
                value={createSemester}
                onChange={(e) => setCreateSemester(e.target.value)}
                placeholder="例如：2026春季"
                className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setCreateOpen(false); setCreateError('') }}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
