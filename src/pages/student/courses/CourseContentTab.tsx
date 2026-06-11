/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getSections, getSectionDetail } from '../../../api/sections'
import type { SectionItem, SectionDetail } from '../../../types/api'

interface Props {
  courseId: string
}

type View = 'list' | 'material'

export default function CourseContentTab({ courseId }: Props) {
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<SectionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')

  // 当从 AI 问答引用跳转过来时，自动打开对应课件
  useEffect(() => {
    if (!sectionParam || sections.length === 0) return
    const target = sections.find((s) => s.id === sectionParam)
    if (target?.material_url) {
      openMaterial(target)
      // 清除 section 参数，避免返回列表时再次触发
      setSearchParams({ tab: 'sections' }, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionParam, sections])

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

  const openMaterial = async (section: SectionItem) => {
    if (!section.material_url) return
    setDetailLoading(true)
    try {
      const res = await getSectionDetail(courseId, section.id)
      if (res.success) {
        setSelected(res.data)
        setView('material')
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false)
    }
  }

  const backToList = () => {
    setView('list')
    setSelected(null)
  }

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

  // ── 课件内容视图 ──
  if (view === 'material' && selected) {
    return (
      <div>
        {/* 返回按钮 + 标题 */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={backToList}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回列表
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-slate-800">{selected.title}</h2>
          </div>
        </div>

        {/* 课件信息卡 */}
        <div className="mb-4 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">📎 课件文件：</span>
              <span className="font-medium text-slate-700">{selected.material_file_name || '未知'}</span>
              {selected.material_url && (
                <button
                  type="button"
                  onClick={() => handleDownload(selected.material_url!, selected.material_file_name || '课件')}
                  className="ml-auto text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                >
                  下载原件
                </button>
              )}
            </div>
          </div>
          {selected.description && (
            <div className="border-b border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                <span className="font-medium">小节说明：</span>
                {selected.description}
              </p>
            </div>
          )}
          {/* 课件文本内容 */}
          <div className="px-5 py-4">
            {selected.material_text ? (
              <div className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {selected.material_text}
              </div>
            ) : (
              <p className="text-sm text-slate-400">暂无课件文本内容</p>
            )}
          </div>
        </div>
      </div>
    )
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

  // ── 加载课件中 ──
  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">加载课件内容...</p>
        </div>
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
                  {section.material_file_name ? (
                    <>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {section.material_file_name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openMaterial(section)
                        }}
                        className="flex items-center gap-0.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
                      >
                        查看课件
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
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
