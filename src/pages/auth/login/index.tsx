import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { login } from '../../../api/auth'
import { useAuth } from '../../../components/useAuth'
// 快捷登录凭证（后端已注册的测试用户）
const QUICK_STUDENT = { username: '20240101', password: '123456' }
const QUICK_TEACHER = { username: 'T20240001', password: '123456' }

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res = await login(username, password)
      if (res.success) {
        authLogin(res.data.token, res.data.user)
        navigate(res.data.user.role === 'teacher' ? '/teacher/assignments' : '/student/chat', { replace: true })
      }
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || '登录失败，请重试'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  const fillStudent = () => {
    setUsername(QUICK_STUDENT.username)
    setPassword(QUICK_STUDENT.password)
  }

  const fillTeacher = () => {
    setUsername(QUICK_TEACHER.username)
    setPassword(QUICK_TEACHER.password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">🎓 智学伴侣</h1>
          <p className="mt-2 text-sm text-slate-500">AI 校园学习伴侣平台</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-6 text-lg font-semibold text-slate-800">登录</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            用户名（学号 / 工号）
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="请输入用户名"
          />

          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="请输入密码（6-32 位）"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            还没有账号？{' '}
            <Link to="/auth/register" className="font-medium text-blue-600 hover:text-blue-700">
              立即注册
            </Link>
          </p>

          {/* Mock 快捷登录 */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs text-slate-400">Mock 快捷登录</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fillStudent}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
              >
                填充学生账号
              </button>
              <button
                type="button"
                onClick={fillTeacher}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
              >
                填充教师账号
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
