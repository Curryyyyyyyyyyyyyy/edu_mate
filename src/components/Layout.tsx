import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from './useAuth'

const studentNav = [
  { to: '/student/chat', label: 'AI 问答', icon: '💬' },
  { to: '/student/assignments', label: '我的作业', icon: '📝' },
  { to: '/student/summaries', label: '知识总结', icon: '📊' },
  { to: '/student/learning-plans', label: '学习计划', icon: '📅' },
]

const teacherNav = [
  { to: '/teacher/assignments', label: '作业管理', icon: '📋' },
  { to: '/teacher/grading', label: 'AI 批改', icon: '✅' },
  { to: '/teacher/analyze', label: '查重比对', icon: '🔍' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const nav = user?.role === 'teacher' ? teacherNav : studentNav
  const roleLabel = user?.role === 'teacher' ? '教师端' : '学生端'

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 侧边栏 */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-5">
          <span className="text-lg">🎓</span>
          <span className="text-base font-semibold text-slate-800">智学伴侣</span>
          <span className="ml-auto rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
            {roleLabel}
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">
              {user?.role === 'teacher'
                ? '教师'
                : user?.extra
                  ? (user.extra as Record<string, string>).class_name
                  : ''}
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
            {roleLabel}
          </span>
        </header>

        {/* 移动端菜单 */}
        {menuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav className="space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <button
                onClick={handleLogout}
                className="mt-1 text-sm text-red-500"
              >
                退出登录
              </button>
            </div>
          </div>
        )}

        {/* 主内容 */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
