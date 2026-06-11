/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  getTeacherSections,
  createSection,
  updateSection,
  deleteSection,
  publishAssignmentInSection,
} from '../../../api/teacherSections'
import { uploadFile } from '../../../api/upload'
import {
  getCourseStudents,
  addStudents,
  removeStudent,
  updateCourse,
  archiveCourse,
  regenerateCode,
} from '../../../api/teacherCourses'
import type { TeacherCourseDetail, SectionItem } from '../../../types/api'

interface Props { courseId: string; course: TeacherCourseDetail }

type Notice = { type: 'success' | 'error'; text: string } | null
type StudentItem = {
  id: string
  username: string
  name: string
  class_name: string
  joined_at: string
  total_score: number
}

export default function CourseManageTab({ courseId, course }: Props) {
  const [subTab, setSubTab] = useState<'overview' | 'sections' | 'students'>('overview')
  const [localCourse, setLocalCourse] = useState(course)

  useEffect(() => {
    setLocalCourse(course)
  }, [course])

  return (
    <div>
      <div className="mb-4 flex w-fit rounded-lg bg-slate-100 p-1">
        {[
          ['overview', '课程设置'],
          ['sections', '小节管理'],
          ['students', '学生管理'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key as 'overview' | 'sections' | 'students')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              subTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && <CourseSettings course={localCourse} onCourseChange={setLocalCourse} />}
      {subTab === 'sections' && <SectionsManager courseId={courseId} />}
      {subTab === 'students' && <StudentsManager courseId={courseId} />}
    </div>
  )
}

function CourseSettings({
  course,
  onCourseChange,
}: {
  course: TeacherCourseDetail
  onCourseChange: (course: TeacherCourseDetail) => void
}) {
  const [name, setName] = useState(course.name)
  const [description, setDescription] = useState(course.description || '')
  const [semester, setSemester] = useState(course.semester || '')
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    setName(course.name)
    setDescription(course.description || '')
    setSemester(course.semester || '')
  }, [course])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setNotice({ type: 'error', text: '课程名称不能为空。' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      await updateCourse(course.id, {
        name: name.trim(),
        description: description.trim(),
        semester: semester.trim(),
      })
      onCourseChange({
        ...course,
        name: name.trim(),
        description: description.trim(),
        semester: semester.trim(),
        updated_at: new Date().toISOString(),
      })
      setNotice({ type: 'success', text: '课程基础信息已保存。' })
    } catch {
      setNotice({ type: 'error', text: '保存失败，请稍后重试。' })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (course.status === 'archived') {
      setNotice({ type: 'error', text: '课程已归档，无需重复操作。' })
      return
    }
    if (!confirm('确定要归档该课程吗？归档后学生将不能继续加入该课程。')) return
    setArchiving(true)
    setNotice(null)
    try {
      const res = await archiveCourse(course.id)
      onCourseChange({ ...course, status: res.success ? res.data.status as TeacherCourseDetail['status'] : 'archived' })
      setNotice({ type: 'success', text: '课程已归档。若列表状态未同步，请刷新课程详情。' })
    } catch {
      setNotice({ type: 'error', text: '归档失败，请稍后重试。' })
    } finally {
      setArchiving(false)
    }
  }

  const handleRegenerateCode = async () => {
    if (!confirm('确定要重置课程码吗？旧课程码将失效。')) return
    setRegenerating(true)
    setNotice(null)
    try {
      const res = await regenerateCode(course.id)
      if (res.success) {
        onCourseChange({ ...course, code: res.data.code })
        setNotice({ type: 'success', text: `课程码已重置为 ${res.data.code}。` })
      }
    } catch {
      setNotice({ type: 'error', text: '重置课程码失败，请稍后重试。' })
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-slate-800">课程基础信息</h3>
          <p className="mt-1 text-sm text-slate-500">课程码：<span className="font-mono text-slate-700">{course.code}</span></p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${course.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {course.status === 'active' ? '进行中' : '已归档'}
        </span>
      </div>

      {notice && <NoticeBar notice={notice} />}

      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            课程名称 *
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            学期
            <input value={semester} onChange={(e) => setSemester(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          课程说明
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存信息'}
          </button>
          <button type="button" onClick={handleRegenerateCode} disabled={regenerating} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {regenerating ? '重置中...' : '重置课程码'}
          </button>
          <button type="button" onClick={handleArchive} disabled={archiving || course.status === 'archived'} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
            {archiving ? '归档中...' : '归档课程'}
          </button>
        </div>
      </form>
    </div>
  )
}

function SectionsManager({ courseId }: { courseId: string }) {
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState<Notice>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [sTitle, setSTitle] = useState('')
  const [sDesc, setSDesc] = useState('')
  const [sOrder, setSOrder] = useState('')
  const [sMaterial, setSMaterial] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editOrder, setEditOrder] = useState('')
  const [updating, setUpdating] = useState(false)

  const [publishSectionId, setPublishSectionId] = useState<string | null>(null)
  const [asgTitle, setAsgTitle] = useState('')
  const [asgDesc, setAsgDesc] = useState('')
  const [asgDue, setAsgDue] = useState('')
  const [asgScore, setAsgScore] = useState('100')
  const [asgAttachment, setAsgAttachment] = useState<File | null>(null)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTeacherSections(courseId)
      .then((res) => {
        if (!cancelled && res.success) setSections(res.data.items)
      })
      .catch(() => {
        if (!cancelled) setNotice({ type: 'error', text: '小节列表加载失败。' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [courseId, refreshKey])

  const resetCreateForm = () => {
    setSTitle('')
    setSDesc('')
    setSOrder('')
    setSMaterial(null)
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const token = localStorage.getItem('token')
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
      const res = await fetch(fullUrl, {
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
      setNotice({ type: 'error', text: '课件下载失败，请稍后重试。' })
    }
  }

  const getMaterialFileName = (url: string) =>
    url.split('/').pop() || '课件'

  const handleCreateSection = async (e: FormEvent) => {
    e.preventDefault()
    if (!sTitle.trim()) {
      setNotice({ type: 'error', text: '小节标题不能为空。' })
      return
    }
    setCreating(true)
    setNotice(null)
    try {
      let materialFileId: string | undefined
      if (sMaterial) {
        const uploadRes = await uploadFile(sMaterial)
        if (!uploadRes.success) {
          setNotice({ type: 'error', text: '课件上传失败，请重试。' })
          return
        }
        materialFileId = uploadRes.data.file_id
      }
      await createSection(courseId, {
        title: sTitle.trim(),
        description: sDesc.trim() || undefined,
        order: Number(sOrder) || undefined,
        material_file_id: materialFileId,
      })
      resetCreateForm()
      setShowCreate(false)
      setNotice({ type: 'success', text: '小节已创建。' })
      setRefreshKey((k) => k + 1)
    } catch {
      setNotice({ type: 'error', text: '创建小节失败，请稍后重试。' })
    } finally {
      setCreating(false)
    }
  }

  const startEditSection = (section: SectionItem) => {
    setEditingSectionId(section.id)
    setEditTitle(section.title)
    setEditDesc(section.description || '')
    setEditOrder(String(section.order || ''))
    setPublishSectionId(null)
  }

  const handleUpdateSection = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingSectionId) return
    if (!editTitle.trim()) {
      setNotice({ type: 'error', text: '小节标题不能为空。' })
      return
    }
    setUpdating(true)
    setNotice(null)
    try {
      const payload: Parameters<typeof updateSection>[2] = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        order: Number(editOrder) || undefined,
      }
      await updateSection(courseId, editingSectionId, payload)
      setEditingSectionId(null)
      setNotice({ type: 'success', text: '小节已更新。' })
      setRefreshKey((k) => k + 1)
    } catch {
      setNotice({ type: 'error', text: '更新小节失败，请稍后重试。' })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('确定要删除该小节吗？小节下的作业也将被删除。')) return
    setNotice(null)
    try {
      await deleteSection(courseId, sectionId)
      setNotice({ type: 'success', text: '小节已删除。' })
      setRefreshKey((k) => k + 1)
    } catch {
      setNotice({ type: 'error', text: '删除小节失败，请稍后重试。' })
    }
  }

  const handlePublishAsg = async (e: FormEvent) => {
    e.preventDefault()
    if (!asgTitle.trim() || !asgDesc.trim() || !asgDue || !publishSectionId) {
      setNotice({ type: 'error', text: '请填写作业标题、要求和截止时间。' })
      return
    }
    setPublishing(true)
    setNotice(null)
    try {
      const fd = new FormData()
      fd.append('title', asgTitle.trim())
      fd.append('description', asgDesc.trim())
      fd.append('due_at', new Date(asgDue).toISOString())
      fd.append('full_score', String(Number(asgScore) || 100))
      if (asgAttachment) fd.append('attachment', asgAttachment)
      await publishAssignmentInSection(courseId, publishSectionId, fd)
      setAsgTitle('')
      setAsgDesc('')
      setAsgDue('')
      setAsgScore('100')
      setAsgAttachment(null)
      setPublishSectionId(null)
      setNotice({ type: 'success', text: '作业已发布。' })
      setRefreshKey((k) => k + 1)
    } catch {
      setNotice({ type: 'error', text: '发布作业失败，请稍后重试。' })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">共 {sections.length} 个小节</p>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showCreate ? '取消' : '添加小节'}
        </button>
      </div>

      {notice && <NoticeBar notice={notice} />}

      {showCreate && (
        <form onSubmit={handleCreateSection} className="mb-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_96px]">
            <input type="text" value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder="小节标题 *" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <input type="number" value={sOrder} onChange={(e) => setSOrder(e.target.value)} placeholder="排序" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setSMaterial(e.target.files?.[0] ?? null)} className="mb-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" />
          <textarea value={sDesc} onChange={(e) => setSDesc(e.target.value)} placeholder="小节说明（可选）" rows={2} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          <button type="submit" disabled={creating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {creating ? '创建中...' : '创建小节'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => (<div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"><div className="mb-2 h-5 w-2/3 rounded bg-slate-200" /></div>))}</div>
      ) : sections.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-sm text-slate-500">暂无小节</p></div>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-4">
              {editingSectionId === s.id ? (
                <form onSubmit={handleUpdateSection} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_96px]">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="小节标题 *" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                    <input type="number" value={editOrder} onChange={(e) => setEditOrder(e.target.value)} placeholder="排序" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                  </div>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="小节说明（可选）" rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={updating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{updating ? '保存中...' : '保存小节'}</button>
                    <button type="button" onClick={() => setEditingSectionId(null)} className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{s.order || '-'}</span>
                        <div className="min-w-0">
                          <h3 className="font-medium text-slate-800">{s.title}</h3>
                          {s.description && <p className="mt-0.5 text-sm text-slate-500">{s.description}</p>}
                        </div>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <p>作业：{s.assignment_count} 个</p>
                        {s.material_url && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-slate-500">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {getMaterialFileName(s.material_url)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownload(s.material_url!, getMaterialFileName(s.material_url))}
                              className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                            >
                              下载课件
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <button onClick={() => startEditSection(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">编辑</button>
                      <button onClick={() => { setPublishSectionId(s.id); setEditingSectionId(null); setAsgTitle(''); setAsgDesc(''); setAsgDue(''); setAsgScore('100'); setAsgAttachment(null) }} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">发布作业</button>
                      <button onClick={() => handleDeleteSection(s.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">删除</button>
                    </div>
                  </div>

                  {publishSectionId === s.id && (
                    <form onSubmit={handlePublishAsg} className="mt-4 border-t border-slate-100 pt-4">
                      <h4 className="mb-2 text-sm font-medium text-slate-700">在该小节下发布作业</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input type="text" value={asgTitle} onChange={(e) => setAsgTitle(e.target.value)} placeholder="作业标题 *" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                        <div className="flex gap-2">
                          <input type="datetime-local" value={asgDue} onChange={(e) => setAsgDue(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                          <input type="number" value={asgScore} onChange={(e) => setAsgScore(e.target.value)} placeholder="满分" className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                        </div>
                      </div>
                      <textarea value={asgDesc} onChange={(e) => setAsgDesc(e.target.value)} placeholder="作业要求说明 *" rows={3} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                      <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setAsgAttachment(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" />
                      <div className="mt-3 flex gap-2">
                        <button type="submit" disabled={publishing} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{publishing ? '发布中...' : '发布作业'}</button>
                        <button type="button" onClick={() => setPublishSectionId(null)} className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentsManager({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [usernames, setUsernames] = useState('')
  const [adding, setAdding] = useState(false)
  const [result, setResult] = useState<{ added: { username: string; name: string }[]; failed: { username: string; reason: string }[] } | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCourseStudents(courseId)
      .then((res) => {
        if (!cancelled && res.success) setStudents(res.data.items)
      })
      .catch(() => {
        if (!cancelled) setNotice({ type: 'error', text: '学生列表加载失败。' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [courseId, refreshKey])

  const filteredStudents = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) =>
      [s.name, s.username, s.class_name].some((value) => (value || '').toLowerCase().includes(q)),
    )
  }, [keyword, students])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const list = usernames.split(/[\n,，\s]+/).map((s) => s.trim()).filter(Boolean)
    if (list.length === 0) {
      setNotice({ type: 'error', text: '请输入至少一个学号。' })
      return
    }
    setAdding(true)
    setResult(null)
    setNotice(null)
    try {
      const res = await addStudents(courseId, list)
      if (res.success) {
        setResult(res.data)
        setUsernames('')
        setNotice({ type: res.data.failed.length > 0 ? 'error' : 'success', text: `添加完成：成功 ${res.data.added.length} 人，失败 ${res.data.failed.length} 人。` })
        setRefreshKey((k) => k + 1)
      }
    } catch {
      setNotice({ type: 'error', text: '添加学生失败，请稍后重试。' })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (studentId: string, name: string) => {
    if (!confirm(`确定要将 ${name} 从课程中移除吗？`)) return
    setNotice(null)
    try {
      await removeStudent(courseId, studentId)
      setNotice({ type: 'success', text: `${name} 已移出课程。` })
      setRefreshKey((k) => k + 1)
    } catch {
      setNotice({ type: 'error', text: '移除学生失败，请稍后重试。' })
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">共 {students.length} 名学生</p>
        <button onClick={() => { setShowAdd(!showAdd); setResult(null) }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showAdd ? '取消' : '添加学生'}
        </button>
      </div>

      {notice && <NoticeBar notice={notice} />}

      <input
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="按姓名、学号、班级搜索"
        className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">输入学号（每行一个，或用逗号/空格分隔）</label>
          <textarea value={usernames} onChange={(e) => setUsernames(e.target.value)} placeholder="20240101&#10;20240102&#10;20240103" rows={4} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          <button type="submit" disabled={adding} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{adding ? '添加中...' : '添加'}</button>
          {result && (
            <div className="mt-3 space-y-1 text-sm">
              {result.added.length > 0 && <p className="text-green-600">成功添加 {result.added.length} 人：{result.added.map((a) => a.name).join('、')}</p>}
              {result.failed.length > 0 && <p className="text-red-500">失败 {result.failed.length} 人：{result.failed.map((f) => `${f.username}（${f.reason}）`).join('、')}</p>}
            </div>
          )}
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />))}</div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-sm text-slate-500">暂无学生</p></div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-sm text-slate-500">没有匹配的学生</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">姓名</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">学号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">班级</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">加入时间</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">总成绩</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.username}</td>
                  <td className="px-4 py-3 text-slate-500">{s.class_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(s.joined_at)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.total_score ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRemove(s.id, s.name)} className="text-xs text-red-500 hover:text-red-700">移除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NoticeBar({ notice }: { notice: Exclude<Notice, null> }) {
  return (
    <div className={`mb-4 rounded-lg border px-4 py-2 text-sm ${
      notice.type === 'success'
        ? 'border-green-200 bg-green-50 text-green-700'
        : 'border-red-200 bg-red-50 text-red-600'
    }`}
    >
      {notice.text}
    </div>
  )
}

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
