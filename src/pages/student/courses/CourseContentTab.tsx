import { useEffect, useState } from 'react'
import { getSections } from '../../../api/sections'
import type { SectionItem } from '../../../types/api'

interface Props {
  courseId: string
}

export default function CourseContentTab({ courseId }: Props) {
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-4xl">📭</p>
        <p className="mt-2 text-sm text-slate-500">该课程暂无小节内容</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div
          key={section.id}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors"
        >
          <button
            onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  {section.order}
                </span>
                <div>
                  <h3 className="font-medium text-slate-800">{section.title}</h3>
                  {section.description && (
                    <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-3 text-sm text-slate-400">
              <span>
                📝 {section.submitted_count}/{section.assignment_count} 作业
              </span>
              {section.section_score != null && (
                <span className="font-medium text-blue-600">
                  {section.section_score}分
                </span>
              )}
              <span className="text-xs">
                {expandedId === section.id ? '收起 ▲' : '展开 ▼'}
              </span>
            </div>
          </button>

          {expandedId === section.id && (
            <div className="border-t border-slate-100 px-4 py-4">
              {section.description && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700">📄 小节说明</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {section.description}
                  </p>
                </div>
              )}
              {section.material_url && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700">📎 课件资料</p>
                  <a
                    href={section.material_url}
                    className="mt-1 inline-block text-sm text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    查看课件
                  </a>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span>作业总数：{section.assignment_count}</span>
                <span>已提交：{section.submitted_count}</span>
                {section.section_score != null && (
                  <span>小节均分：{section.section_score}</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
