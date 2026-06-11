import { useEffect, useState } from 'react'
import { getStudentAnnouncements, getAnnouncement } from '../../../api/announcements'
import type { StudentAnnouncementItem, AnnouncementDetail } from '../../../types/api'

interface Props {
  courseId: string
}

export default function AnnouncementsTab({ courseId }: Props) {
  const [items, setItems] = useState<StudentAnnouncementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getStudentAnnouncements(courseId)
      .then((res) => {
        if (!cancelled && res.success) {
          setItems(res.data.items)
          setUnreadCount(res.data.unread_count)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-3xl">📢</p>
        <p className="mt-2 text-sm text-slate-500">暂无课程公告</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          共 {items.length} 条公告
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
              {unreadCount} 条未读
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300"
          >
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.is_pinned && <span className="shrink-0 text-red-500">📌</span>}
                {!item.is_read && (
                  <span className="shrink-0 h-2 w-2 rounded-full bg-red-500" />
                )}
                <div className="min-w-0">
                  <h3 className={`truncate font-medium ${!item.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <span className="shrink-0 ml-2 text-xs text-slate-400">
                {expandedId === item.id ? '收起 ▲' : '展开 ▼'}
              </span>
            </div>
            {expandedId === item.id && (
              <ExpandedAnnouncement courseId={courseId} noticeId={item.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ExpandedAnnouncement({
  courseId,
  noticeId,
}: {
  courseId: string
  noticeId: string
}) {
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAnnouncement(courseId, noticeId)
      .then((res) => {
        if (!cancelled && res.success) setDetail(res.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId, noticeId])

  if (loading) {
    return (
      <div className="border-t border-slate-100 px-4 py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-100" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!detail) return null

  return (
    <div className="border-t border-slate-100 px-4 py-4">
      <div className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
        {detail.content}
      </div>
      {detail.updated_at && (
        <p className="mt-3 text-xs text-slate-400">
          最后更新于 {new Date(detail.updated_at).toLocaleString('zh-CN')}
        </p>
      )}
    </div>
  )
}
