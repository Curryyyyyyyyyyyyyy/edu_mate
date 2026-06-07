import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { streamMessage, mockStreamMessage, getChatSessions, getSessionMessages } from '../../../api/chat'
import type { ChatMessage, ChatSessionItem } from '../../../types/api'
import Markdown from '../../../components/Markdown'

const isMock = import.meta.env.VITE_USE_MOCK === 'true'

interface Props {
  courseId: string
}

export default function ChatTab({ courseId }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState<ChatSessionItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const [, setSearchParams] = useSearchParams()

  // 组件卸载时中断流，防止 setState 在卸载组件上执行
  useEffect(() => {
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  // 自动滚动到底部
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

  // 流式发送消息
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    // 如果正在流式输出中，点击按钮是停止
    if (streaming) {
      abortRef.current?.abort()
      return
    }

    setError('')
    setLoading(true)
    setStreaming(true)

    const userMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: question.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    const currentQuestion = question.trim()
    setQuestion('')

    // 创建 AbortController 用于中断
    const controller = new AbortController()
    abortRef.current = controller

    // 先插入一个空的 AI 消息占位
    const aiMsgId = `temp_ai_${Date.now()}`
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      rag_used: false,
      references: [],
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, aiMsg])

    try {
      // 选择流式实现：mock 模式用 mockStreamMessage，否则用真实 SSE
      const stream = isMock
        ? mockStreamMessage(courseId, { question: currentQuestion, session_id: sessionId || undefined }, controller.signal)
        : streamMessage(courseId, { question: currentQuestion, session_id: sessionId || undefined }, controller.signal)

      console.log('[ChatTab] isMock:', isMock, 'stream:', isMock ? 'mock' : 'real')
      for await (const event of stream) {
        console.log('[ChatTab] event:', event.type, 'content' in event ? (event as {content: string}).content?.slice(0, 20) : '')
        if (!mountedRef.current) break
        switch (event.type) {
          case 'meta':
            setSessionId(event.session_id)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, rag_used: event.rag_used, references: event.references }
                  : m,
              ),
            )
            break

          case 'delta':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, content: m.content + event.content }
                  : m,
              ),
            )
            break

          case 'done':
            // 流结束，刷新会话列表
            loadSessions()
            break

          case 'error':
            setError(event.message)
            // 移除空的 AI 消息
            setMessages((prev) => prev.filter((m) => m.id !== aiMsgId))
            break
        }
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 用户主动停止 — 保留已有内容，移除空消息或标记为已中断
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId && !m.content
              ? { ...m, content: '（已停止生成）' }
              : m,
          ),
        )
      } else {
        setError('发送失败，请重试')
        setMessages((prev) => prev.filter((m) => m.id !== aiMsgId))
      }
    } finally {
      setLoading(false)
      setStreaming(false)
      abortRef.current = null
    }
  }

  const startNewChat = () => {
    setSessionId(null)
    setMessages([])
    setShowHistory(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部操作栏 */}
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100"
          >
            ＋ 新对话
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100"
          >
            📋 历史 ({sessions.length})
          </button>
        </div>
        {sessionId && (
          <span className="text-xs text-slate-400">会话: {sessionId.slice(0, 8)}...</span>
        )}
      </div>

      {/* 历史会话列表 */}
      {showHistory && sessions.length > 0 && (
        <div className="mb-2 shrink-0 rounded-lg border border-slate-200 bg-white p-2 max-h-40 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors hover:bg-slate-50 ${
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
              <p className="text-3xl">💡</p>
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
                className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="markdown-body">
                    <Markdown content={msg.content} />
                    {/* 流式输出中的光标 */}
                    {streaming && msg.content && (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-blue-600 align-middle" />
                    )}
                  </div>
                )}
                {/* 引用来源 */}
                {msg.rag_used && msg.references && msg.references.length > 0 && (
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <p className="mb-1 text-xs font-medium text-slate-500">📚 参考材料：</p>
                    {msg.references.map((ref, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setSearchParams({ tab: 'sections', section: ref.section_id })
                        }
                        className="block w-full rounded px-1 py-0.5 text-left text-xs text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                      >
                        {ref.section_title} · {ref.file_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* 加载中但还没有 AI 消息内容时显示动画 */}
          {loading && !streaming && (
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
        <div className="mt-2 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="mt-2 flex shrink-0 gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="输入你的学习问题..."
          disabled={loading && !streaming}
        />
        <button
          type="submit"
          disabled={(!streaming && (!question.trim() || loading))}
          className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors ${
            streaming
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
          }`}
        >
          {streaming ? '停止' : '发送'}
        </button>
      </form>
    </div>
  )
}
