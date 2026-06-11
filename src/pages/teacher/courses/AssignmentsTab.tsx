/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type FormEvent } from 'react'
import { getTeacherAssignments, getTeacherAssignmentDetail, getSubmissions, closeAssignment, updateAssignment } from '../../../api/teacherAssignments'
import { getTeacherSections } from '../../../api/teacherSections'
import type { SectionItem, TeacherAssignmentItem, TeacherAssignmentDetail, TeacherSubmissionItem } from '../../../types/api'

interface Props { courseId: string }

function toDateTimeLocal(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function getProgress(submissionCount: number, totalStudents: number) {
  if (!Number.isFinite(totalStudents) || totalStudents <= 0) return 0
  const raw = Math.round((submissionCount / totalStudents) * 100)
  return Math.max(0, Math.min(100, raw))
}

function getProgressStats(submissionCount?: number, totalStudents?: number) {
  const submitted = Number.isFinite(submissionCount) ? Number(submissionCount) : 0
  const total = Number.isFinite(totalStudents) && Number(totalStudents) > 0
    ? Number(totalStudents)
    : submitted
  return { submitted, total, progress: getProgress(submitted, total) }
}

function normalizeProgressFields<T extends { submission_count?: number; total_students?: number }>(item: T): T {
  const { submitted, total } = getProgressStats(item.submission_count, item.total_students)
  return { ...item, submission_count: submitted, total_students: total }
}

function getAttachmentName(url: string) {
  const name = url.split('?')[0]?.split('/').pop()
  if (!name) return '作业附件'
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

export default function AssignmentsTab({ courseId }: Props) {
  const [items, setItems] = useState<TeacherAssignmentItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [selected, setSelected] = useState<TeacherAssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<TeacherSubmissionItem[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [editDue, setEditDue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getTeacherSections(courseId)
      .then((res) => { if (!cancelled && res.success) setSections(res.data.items) })
      .catch(() => { if (!cancelled) setSections([]) })
    return () => { cancelled = true }
  }, [courseId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTeacherAssignments(courseId, {
      status: filterStatus || undefined,
      section_id: filterSection || undefined,
    })
      .then((res) => { if (!cancelled && res.success) setItems(res.data.items.map(normalizeProgressFields)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, filterStatus, filterSection, refreshKey])

  const openDetail = async (asgId: string) => {
    setError('')
    setLoadingSubmissions(true)
    try {
      const [res, subRes] = await Promise.all([
        getTeacherAssignmentDetail(courseId, asgId),
        getSubmissions(courseId, asgId).catch(() => null),
      ])
      if (res.success) {
        setSelected(normalizeProgressFields(res.data))
        setEditing(false)
        setEditDesc(res.data.description || '')
        setEditDue(toDateTimeLocal(res.data.due_at))
      }
      if (subRes?.success) setSubmissions(subRes.data.items)
      else setSubmissions([])
    } catch {
      setError('加载作业详情失败，请稍后重试')
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const refreshListAndDetail = async (asgId?: string) => {
    setRefreshKey((k) => k + 1)
    if (asgId) await openDetail(asgId)
  }

  const handleClose = async (asgId: string) => {
    if (!confirm('确定关闭该作业吗？关闭后学生将无法继续提交。')) return
    try {
      await closeAssignment(courseId, asgId)
      await refreshListAndDetail(selected?.id === asgId ? asgId : undefined)
    } catch {
      setError('关闭作业失败，请稍后重试')
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected || !editDue) return
    setSaving(true)
    setError('')
    try {
      await updateAssignment(courseId, selected.id, {
        description: editDesc.trim(),
        due_at: new Date(editDue).toISOString(),
      })
      setEditing(false)
      await refreshListAndDetail(selected.id)
    } catch {
      setError('保存作业失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  if (selected) {
    const { submitted, total, progress } = getProgressStats(selected.submission_count, selected.total_students)
    const attachmentName = selected.attachment_url ? getAttachmentName(selected.attachment_url) : ''
    return (
      <div>
        <button onClick={() => setSelected(null)} className="mb-4 text-sm text-blue-600 hover:text-blue-700">返回作业列表</button>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{selected.title}</h1>
              <p className="mt-1 text-sm text-slate-500">
                截止：{new Date(selected.due_at).toLocaleString('zh-CN')} · 满分：{selected.full_score} · {selected.status === 'open' ? '进行中' : '已关闭'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${selected.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {selected.status === 'open' ? '进行中' : '已关闭'}
              </span>
              <button onClick={() => setEditing((v) => !v)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                {editing ? '取消编辑' : '编辑'}
              </button>
              {selected.status === 'open' && (
                <button onClick={() => handleClose(selected.id)} className="rounded border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">关闭</button>
              )}
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="mb-4 rounded-lg border border-blue-100 bg-blue-50/30 p-4">
              <label className="mb-1 block text-xs font-medium text-slate-600">作业要求</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={5} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              <label className="mb-1 block text-xs font-medium text-slate-600">截止时间</label>
              <input type="datetime-local" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="mb-3 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              <div>
                <button type="submit" disabled={saving || !editDue} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          ) : selected.description && (
            <div className="mb-4"><h3 className="mb-1 text-sm font-medium text-slate-700">作业要求</h3><p className="whitespace-pre-wrap text-sm text-slate-600">{selected.description}</p></div>
          )}
          {selected.attachment_url && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-slate-700">附件</h3>
              <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100">
                    附
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{attachmentName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">作业附件</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href={selected.attachment_url} target="_blank" rel="noreferrer" className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    预览
                  </a>
                  <a href={selected.attachment_url} download={attachmentName} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium !text-white hover:bg-blue-700">
                    下载附件
                  </a>
                </div>
              </div>
            </div>
          )}
          {selected.reference_answer && (
            <div className="mb-4"><h3 className="mb-1 text-sm font-medium text-slate-700">参考答案</h3><p className="whitespace-pre-wrap text-sm text-slate-600">{selected.reference_answer}</p></div>
          )}
          {selected.rubric && (
            <div className="mb-4"><h3 className="mb-1 text-sm font-medium text-slate-700">评分标准</h3><p className="text-sm text-slate-600">{selected.rubric}</p></div>
          )}

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">提交进度</p>
              <p className="text-sm text-slate-600">{submitted}/{total} · {progress}%</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">学生提交详情</h3>
              <span className="text-xs text-slate-400">{submissions.length} 份提交</span>
            </div>
            {loadingSubmissions ? (
              <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-slate-100" />)}</div>
            ) : submissions.length === 0 ? (
              <p className="rounded bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">暂无学生提交。</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => {
                  const text = submission.content || submission.extracted_text || ''
                  return (
                    <div key={submission.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{submission.student_name}</p>
                          <p className="text-xs text-slate-500">提交于 {new Date(submission.submitted_at).toLocaleString('zh-CN')} · {submission.submit_type === 'file' ? '文件提交' : '文本提交'}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${submission.confirmed ? 'bg-green-50 text-green-700' : submission.graded ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {submission.confirmed ? `已确认：${submission.score ?? '-'}` : submission.graded ? `已批改：${submission.ai_score ?? '-'}` : '待批改'}
                        </span>
                      </div>
                      {submission.file_url && (
                        <a href={submission.file_url} target="_blank" rel="noreferrer" className="mb-2 inline-block text-xs text-blue-600 hover:text-blue-700">查看提交文件</a>
                      )}
                      {text ? (
                        <p className="max-h-32 overflow-auto whitespace-pre-wrap rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{text}</p>
                      ) : (
                        <p className="rounded border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">暂无可预览的提交文本。</p>
                      )}
                      {submission.comments && <p className="mt-2 text-xs text-slate-500">AI 评语：{submission.comments}</p>}
                      {submission.teacher_comment && <p className="mt-1 text-xs text-slate-500">教师评语：{submission.teacher_comment}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
          <option value="">全部状态</option>
          <option value="open">进行中</option>
          <option value="closed">已关闭</option>
        </select>
        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
          <option value="">全部小节</option>
          {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"><div className="mb-2 h-5 w-3/4 rounded bg-slate-200" /><div className="h-4 w-1/2 rounded bg-slate-100" /></div>))}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">📄</p><p className="mt-2 text-sm text-slate-500">暂无作业</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const { submitted, total, progress } = getProgressStats(item.submission_count, item.total_students)
            return (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {item.section_title && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{item.section_title}</span>}
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${item.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.status === 'open' ? '进行中' : '已关闭'}
                      </span>
                    </div>
                    <button onClick={() => openDetail(item.id)} className="text-left font-medium text-slate-800 hover:text-blue-700">{item.title}</button>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>截止：{new Date(item.due_at).toLocaleString('zh-CN')}</span>
                      <span>提交：{submitted}/{total}</span>
                      <span>满分：{item.full_score}</span>
                    </div>
                    <div className="mt-2 max-w-md">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => openDetail(item.id)} className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">详情</button>
                    {item.status === 'open' && (
                      <button onClick={() => handleClose(item.id)} className="rounded border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50">关闭</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
