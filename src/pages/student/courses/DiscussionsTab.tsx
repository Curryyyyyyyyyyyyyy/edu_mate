import { useEffect, useState, type FormEvent } from 'react'
import {
  getDiscussions,
  getDiscussion,
  createDiscussionReply,
  deleteDiscussionReply,
} from '../../../api/discussions'
import type { DiscussionItem, DiscussionDetail, DiscussionReply, DiscussionStatus } from '../../../types/api'
import { useAuth } from '../../../components/useAuth'

interface Props {
  courseId: string
}

export default function DiscussionsTab({ courseId }: Props) {
  const { user } = useAuth()
  const [items, setItems] = useState<DiscussionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterStatus, setFilterStatus] = useState<DiscussionStatus | ''>('')

  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDiscussions(courseId, {
      status: filterStatus || undefined,
    })
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, refreshKey, filterStatus])

  if (selectedId) {
    return (
      <DiscussionDetailView
        courseId={courseId}
        discussionId={selectedId}
        onBack={() => {
          setSelectedId(null)
          setRefreshKey((k) => k + 1)
        }}
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">共 {items.length} 个讨论</p>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DiscussionStatus | '')}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs transition-colors focus:border-blue-400 focus:outline-none"
          >
            <option value="">全部</option>
            <option value="open">开放中</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-3xl">💬</p>
          <p className="mt-2 text-sm text-slate-500">暂无讨论</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-800">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {item.created_by.name} · {item.reply_count} 条回复
                    {item.section_title ? ` · ${item.section_title}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === 'open'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.status === 'open' ? '开放' : '已关闭'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 讨论详情视图（含回复列表和回复表单）──

function DiscussionDetailView({
  courseId,
  discussionId,
  onBack,
}: {
  courseId: string
  discussionId: string
  onBack: () => void
}) {
  const { user } = useAuth()
  const [detail, setDetail] = useState<DiscussionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [replying, setReplying] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getDiscussion(courseId, discussionId)
      .then((res) => {
        if (!cancelled && res.success) setDetail(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, discussionId, refreshKey])

  const handleReply = async (e: FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) {
      setError('回复内容不能为空')
      return
    }
    setError('')
    setReplying(true)
    try {
      await createDiscussionReply(courseId, discussionId, replyContent.trim())
      setReplyContent('')
      setRefreshKey((k) => k + 1)
    } catch {
      setError('回复失败，请重试')
    } finally {
      setReplying(false)
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('确定删除该回复吗？')) return
    try {
      await deleteDiscussionReply(courseId, discussionId, replyId)
      setRefreshKey((k) => k + 1)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-1/4 rounded bg-slate-200" />
        <div className="h-32 rounded bg-slate-100" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">讨论不存在</p>
        <button onClick={onBack} className="mt-2 text-sm text-blue-600 hover:underline">返回列表</button>
      </div>
    )
  }

  const isClosed = detail.status === 'closed'
  const replies = detail.replies?.items || []

  return (
    <div>
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
      >
        <svg className="mr-1 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回讨论列表
      </button>

      {/* 主题帖 */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{detail.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {detail.created_by.name} · {new Date(detail.created_at).toLocaleString('zh-CN')}
              {detail.section_title ? ` · ${detail.section_title}` : ''}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isClosed ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-600'
            }`}
          >
            {isClosed ? '已关闭' : '开放中'}
          </span>
        </div>

        <div className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
          {detail.content}
        </div>
      </div>

      {/* 回复列表 */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-slate-700">
          💬 回复 ({detail.replies?.total ?? replies.length})
        </h3>

        {replies.length === 0 ? (
          <p className="text-sm text-slate-400">暂无回复</p>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                canDelete={user?.id === reply.author.id}
                onDelete={() => handleDeleteReply(reply.id)}
              />
            ))}
          </div>
        )}

        {/* 回复表单 */}
        {!isClosed && (
          <form onSubmit={handleReply} className="mt-4">
            {error && (
              <div className="mb-2 rounded bg-red-50 px-3 py-1.5 text-sm text-red-600">{error}</div>
            )}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={replying || !replyContent.trim()}
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {replying ? '发送中...' : '回复'}
            </button>
          </form>
        )}

        {isClosed && (
          <p className="mt-4 text-sm text-slate-400">该讨论已关闭，不再接受新回复。</p>
        )}
      </div>
    </div>
  )
}

function ReplyItem({
  reply,
  canDelete,
  onDelete,
}: {
  reply: DiscussionReply
  canDelete: boolean
  onDelete: () => void
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{reply.author.name}</span>
          {reply.is_teacher && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-600">
              教师
            </span>
          )}
          <span className="text-xs text-slate-400">
            {new Date(reply.created_at).toLocaleString('zh-CN')}
          </span>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-xs text-red-400 transition-colors hover:text-red-600"
          >
            删除
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
        {reply.content}
      </p>
    </div>
  )
}
