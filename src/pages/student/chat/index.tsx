import { useState, useRef, useEffect, type FormEvent } from 'react'
import { sendMessage } from '../../../api/chat'
import type { ChatMessage } from '../../../types/api'

export default function StudentChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [course, setCourse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    setError('')
    setLoading(true)

    const userMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: question.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setQuestion('')

    try {
      const res = await sendMessage({
        question: userMsg.content,
        course: course.trim() || undefined,
        session_id: sessionId || undefined,
      })
      if (res.success) {
        setSessionId(res.data.session_id)
        const aiMsg: ChatMessage = {
          id: `temp_ai_${Date.now()}`,
          role: 'assistant',
          content: res.data.answer,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMsg])
      }
    } catch {
      setError('发送失败，请重试')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-semibold text-slate-800">💬 AI 智能问答</h1>
        <p className="mt-1 text-sm text-slate-500">
          向 AI 学习伴侣提问，获取学习建议和解答
        </p>
      </div>

      {/* 课程输入 */}
      <div className="mb-3 shrink-0">
        <input
          type="text"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="课程名称（可选）"
        />
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            <div className="text-center">
              <p className="text-4xl">💡</p>
              <p className="mt-2">输入你的学习问题，开始对话</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  '进程和线程有什么区别？',
                  '什么是特征值和特征向量？',
                  '如何高效备考期末考试？',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuestion(q)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-slate-100 px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 delay-150" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400 delay-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-2 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="mt-3 flex shrink-0 gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="输入你的学习问题..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </div>
  )
}
