import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { sendMessage, getChatSessions, getSessionMessages } from '../../../api/chat'
import type { ChatMessage, ChatSessionItem } from '../../../types/api'

interface Props {
  courseId: string
}

export default function ChatTab({ courseId }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState<ChatSessionItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      const res = await getChatSessions(courseId)
      if (res.success) setSessions(res.data.items)
    } catch {
      // ignore
    }
  }, [courseId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions()
  }, [loadSessions])

  // 加载历史消息
  const loadSession = async (sid: string) => {
    setSessionId(sid)
    setMessages([])
    setShowHistory(false)
    try {
      const res = await getSessionMessages(courseId, sid)
      if (res.success) setMessages(res.data.messages)
    } catch {
      // ignore
    }
  }

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
      const res = await sendMessage(courseId, {
        question: userMsg.content,
        session_id: sessionId || undefined,
      })
      if (res.success) {
        setSessionId(res.data.session_id)
        const aiMsg: ChatMessage = {
          id: `temp_ai_${Date.now()}`,
          role: 'assistant',
          content: res.data.answer,
          rag_used: res.data.rag_used,
          references: res.data.references,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMsg])
        // 刷新会话列表
        loadSessions()
      }
    } catch {
      setError('发送失败，请重试')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const startNewChat = () => {
    setSessionId(null)
    setMessages([])
    setShowHistory(false)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
      {/* 顶部操作栏 */}
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            ＋ 新对话
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            📋 历史 ({sessions.length})
          </button>
        </div>
        {sessionId && (
          <span className="text-xs text-slate-400">会话: {sessionId}</span>
        )}
      </div>

      {/* 历史会话列表 */}
      {showHistory && sessions.length > 0 && (
        <div className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white p-2 max-h-48 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                s.id === sessionId ? 'bg-blue-50' : ''
              }`}
            >
              <p className="font-medium text-slate-700 truncate">{s.last_question}</p>
              <p className="text-xs text-slate-400">
                {s.message_count} 条消息 ·{' '}
                {new Date(s.updated_at).toLocaleDateString('zh-CN')}
              </p>
            </button>
          ))}
        </div>
      )}

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
                  '什么是虚拟内存？',
                  '如何理解死锁的四个必要条件？',
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
                {msg.rag_used && msg.references && msg.references.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <p className="text-xs font-medium text-slate-500">📚 参考材料：</p>
                    {msg.references.map((ref, i) => (
                      <p key={i} className="text-xs text-slate-400">
                        {ref.section_title} · {ref.file_name}
                      </p>
                    ))}
                  </div>
                )}
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
