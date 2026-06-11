import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { registerStudent, registerTeacher, login as loginApi } from '../../../api/auth'
import { useAuth } from '../../../components/useAuth'
const QUICK_STUDENT = {
  username: '20240101',
  name: '张三',
  class_name: '计算机 2401 班',
  password: '123456',
}
const QUICK_TEACHER = {
  username: 'T20240001',
  name: '李老师',
  password: '123456',
}

type Tab = 'student' | 'teacher'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [tab, setTab] = useState<Tab>('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 学生字段
  const [sUsername, setSUsername] = useState('')
  const [sName, setSName] = useState('')
  const [sClassName, setSClassName] = useState('')
  const [sPassword, setSPassword] = useState('')

  // 教师字段
  const [tUsername, setTUsername] = useState('')
  const [tName, setTName] = useState('')
  const [tPassword, setTPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (tab === 'student') {
      if (!sUsername.trim() || !sName.trim() || !sClassName.trim() || !sPassword.trim()) {
        setError('请填写所有必填字段')
        return
      }
      if (sPassword.length < 6 || sPassword.length > 32) {
        setError('密码长度需在 6-32 位之间')
        return
      }
      setLoading(true)
      try {
        const res = await registerStudent({
          username: sUsername,
          name: sName,
          class_name: sClassName,
          password: sPassword,
        })
        if (res.success) {
          // 注册成功后自动登录
          const loginRes = await loginApi(sUsername, sPassword)
          login(loginRes.data.token, loginRes.data.user)
          navigate('/student', { replace: true })
        }
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || '注册失败',
        )
      } finally {
        setLoading(false)
      }
    } else {
      if (!tUsername.trim() || !tName.trim() || !tPassword.trim()) {
        setError('请填写所有必填字段')
        return
      }
      if (tPassword.length < 6 || tPassword.length > 32) {
        setError('密码长度需在 6-32 位之间')
        return
      }
      setLoading(true)
      try {
        const res = await registerTeacher({
          username: tUsername,
          name: tName,
          courses: [],
          password: tPassword,
        })
        if (res.success) {
          const loginRes = await loginApi(tUsername, tPassword)
          login(loginRes.data.token, loginRes.data.user)
          navigate('/teacher', { replace: true })
        }
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || '注册失败',
        )
      } finally {
        setLoading(false)
      }
    }
  }

  const fillMock = () => {
    if (tab === 'student') {
      setSUsername(QUICK_STUDENT.username)
      setSName(QUICK_STUDENT.name)
      setSClassName(QUICK_STUDENT.class_name)
      setSPassword(QUICK_STUDENT.password)
    } else {
      setTUsername(QUICK_TEACHER.username)
      setTName(QUICK_TEACHER.name)
      setTPassword(QUICK_TEACHER.password)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">🎓 智学伴侣</h1>
          <p className="mt-2 text-sm text-slate-500">创建你的账号</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Tab 切换 */}
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('student')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === 'student'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🧑‍🎓 学生注册
            </button>
            <button
              type="button"
              onClick={() => setTab('teacher')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === 'teacher'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              👩‍🏫 教师注册
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {tab === 'student' ? (
              <>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">学号</label>
                <input
                  type="text"
                  value={sUsername}
                  onChange={(e) => setSUsername(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="请输入学号"
                />

                <label className="mb-1.5 block text-sm font-medium text-slate-700">姓名</label>
                <input
                  type="text"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="请输入真实姓名"
                />

                <label className="mb-1.5 block text-sm font-medium text-slate-700">班级</label>
                <input
                  type="text"
                  value={sClassName}
                  onChange={(e) => setSClassName(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="例如：计算机 2401 班"
                />

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  密码（6-32 位）
                </label>
                <input
                  type="password"
                  value={sPassword}
                  onChange={(e) => setSPassword(e.target.value)}
                  className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="请输入密码"
                />
              </>
            ) : (
              <>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">工号</label>
                <input
                  type="text"
                  value={tUsername}
                  onChange={(e) => setTUsername(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="请输入工号"
                />

                <label className="mb-1.5 block text-sm font-medium text-slate-700">姓名</label>
                <input
                  type="text"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="请输入真实姓名"
                />

                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  密码（6-32 位）
                </label>
                <input
                  type="password"
                  value={tPassword}
                  onChange={(e) => setTPassword(e.target.value)}
                  className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="请输入密码"
                />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            已有账号？{' '}
            <Link to="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
              去登录
            </Link>
          </p>

          {/* Mock 快捷填充 */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs text-slate-400">Mock 快捷填充</p>
            <button
              type="button"
              onClick={fillMock}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
            >
              填充预设{tab === 'student' ? '学生' : '教师'}信息
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
