import { useEffect, useState } from 'react'
import { getSections } from '../../../api/sections'
import type { SectionItem } from '../../../types/api'

interface Props {
  courseId: string
}

export default function CourseContentTab({ courseId }: Props) {
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getSections(courseId)
      .then((res) => {
        if (!cancelled && res.success) setSections(res.data.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  const getMaterialFileName = (url: string) =>
    url.split('/').pop() || '课件'

  const handleDownload = async (url: string, filename: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('下载失败')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      // ignore
    }
  }

  // ── 列表加载中 ──
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 h-5 w-2/3 rounded bg-slate-200" />
            <div className="h-4 w-1/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  // ── 空状态 ──
  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-3xl">📭</p>
        <p className="mt-2 text-sm text-slate-500">该课程暂无章节内容</p>
      </div>
    )
  }

  // ── 章节列表视图 ──
  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div
          key={section.id}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* 序号 */}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {section.order}
              </span>
              {/* 内容 */}
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-800">{section.title}</h3>
                {section.description && (
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500 line-clamp-2">
                    {section.description}
                  </p>
                )}
                {/* 课件信息 */}
                <div className="mt-2 flex items-center gap-3">
                  {section.material_url ? (
                    <>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {getMaterialFileName(section.material_url)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(section.material_url!, getMaterialFileName(section.material_url!))
                        }}
                        className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                      >
                        下载课件
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-300">暂无课件</span>
                  )}
                </div>
              </div>
              {/* 右侧信息 */}
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-slate-400">
                {section.assignment_count > 0 && (
                  <span>📝 {section.assignment_count} 份作业</span>
                )}
                {section.section_score != null && (
                  <span className="font-medium text-blue-600">{section.section_score} 分</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
