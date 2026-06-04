import { useEffect, useState, type FormEvent } from 'react'
import { getTeacherSections, createSection, deleteSection, publishAssignmentInSection } from '../../../api/teacherSections'
import { getCourseStudents, addStudents, removeStudent } from '../../../api/teacherCourses'
import type { TeacherCourseDetail, SectionItem } from '../../../types/api'

interface Props { courseId: string; course: TeacherCourseDetail }

export default function CourseManageTab({ courseId }: Props) {
  const [subTab, setSubTab] = useState<'sections' | 'students'>('sections')
  return (
    <div>
      <div className="mb-4 flex rounded-lg bg-slate-100 p-1 w-fit">
        {[
          ['sections', '📖 小节管理'],
          ['students', '👥 学生管理'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key as 'sections' | 'students')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              subTab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === 'sections' && <SectionsManager courseId={courseId} />}
      {subTab === 'students' && <StudentsManager courseId={courseId} />}
    </div>
  )
}

// ── 小节管理 ────────────────────────────────────────────────

function SectionsManager({ courseId }: { courseId: string }) {
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // 创建小节
  const [showCreate, setShowCreate] = useState(false)
  const [sTitle, setSTitle] = useState('')
  const [sDesc, setSDesc] = useState('')
  const [sOrder, setSOrder] = useState('')
  const [creating, setCreating] = useState(false)

  // 发布作业
  const [publishSectionId, setPublishSectionId] = useState<string | null>(null)
  const [asgTitle, setAsgTitle] = useState('')
  const [asgDesc, setAsgDesc] = useState('')
  const [asgDue, setAsgDue] = useState('')
  const [asgScore, setAsgScore] = useState('100')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getTeacherSections(courseId)
      .then((res) => { if (!cancelled && res.success) setSections(res.data.items) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, refreshKey])

  const handleCreateSection = async (e: FormEvent) => {
    e.preventDefault()
    if (!sTitle.trim()) return
    setCreating(true)
    try {
      await createSection(courseId, { title: sTitle.trim(), description: sDesc.trim() || undefined, order: Number(sOrder) || undefined })
      setSTitle(''); setSDesc(''); setSOrder(''); setShowCreate(false)
      setRefreshKey((k) => k + 1)
    } catch { /* ignore */ }
    finally { setCreating(false) }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('确定要删除该小节吗？小节下的作业也将被删除。')) return
    try { await deleteSection(courseId, sectionId); setRefreshKey((k) => k + 1) } catch { /* ignore */ }
  }

  const handlePublishAsg = async (e: FormEvent) => {
    e.preventDefault()
    if (!asgTitle.trim() || !asgDesc.trim() || !asgDue || !publishSectionId) return
    setPublishing(true)
    try {
      const fd = new FormData()
      fd.append('title', asgTitle.trim())
      fd.append('description', asgDesc.trim())
      fd.append('due_at', new Date(asgDue).toISOString())
      fd.append('full_score', String(asgScore))
      await publishAssignmentInSection(courseId, publishSectionId, fd)
      setAsgTitle(''); setAsgDesc(''); setAsgDue(''); setAsgScore('100'); setPublishSectionId(null)
      setRefreshKey((k) => k + 1)
    } catch { /* ignore */ }
    finally { setPublishing(false) }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">共 {sections.length} 个小节</p>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showCreate ? '取消' : '＋ 添加小节'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateSection} className="mb-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex gap-3 mb-3">
            <input type="text" value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder="小节标题 *" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <input type="number" value={sOrder} onChange={(e) => setSOrder(e.target.value)} placeholder="排序" className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          <textarea value={sDesc} onChange={(e) => setSDesc(e.target.value)} placeholder="小节说明（可选）" rows={2} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          <button type="submit" disabled={creating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {creating ? '创建中...' : '创建小节'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => (<div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"><div className="mb-2 h-5 w-2/3 rounded bg-slate-200" /></div>))}</div>
      ) : sections.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">📭</p><p className="mt-2 text-sm text-slate-500">暂无小节</p></div>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{s.order || '-'}</span>
                    <div>
                      <h3 className="font-medium text-slate-800">{s.title}</h3>
                      {s.description && <p className="text-sm text-slate-500 mt-0.5">{s.description}</p>}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">作业: {s.assignment_count} 个</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => { setPublishSectionId(s.id); setAsgTitle(''); setAsgDesc(''); setAsgDue(''); setAsgScore('100') }} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">发布作业</button>
                  <button onClick={() => handleDeleteSection(s.id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">删除</button>
                </div>
              </div>

              {/* 发布作业表单 */}
              {publishSectionId === s.id && (
                <form onSubmit={handlePublishAsg} className="mt-4 border-t border-slate-100 pt-4">
                  <h4 className="mb-2 text-sm font-medium text-slate-700">📝 在该小节下发布作业</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="text" value={asgTitle} onChange={(e) => setAsgTitle(e.target.value)} placeholder="作业标题 *" className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                    <div className="flex gap-2">
                      <input type="datetime-local" value={asgDue} onChange={(e) => setAsgDue(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                      <input type="number" value={asgScore} onChange={(e) => setAsgScore(e.target.value)} placeholder="满分" className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                    </div>
                  </div>
                  <textarea value={asgDesc} onChange={(e) => setAsgDesc(e.target.value)} placeholder="作业要求说明 *" rows={3} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
                  <div className="mt-3 flex gap-2">
                    <button type="submit" disabled={publishing} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{publishing ? '发布中...' : '发布作业'}</button>
                    <button type="button" onClick={() => setPublishSectionId(null)} className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 学生管理 ────────────────────────────────────────────────

function StudentsManager({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<{ id: string; username: string; name: string; class_name: string; joined_at: string; total_score: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [usernames, setUsernames] = useState('')
  const [adding, setAdding] = useState(false)
  const [result, setResult] = useState<{ added: { username: string; name: string }[]; failed: { username: string; reason: string }[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getCourseStudents(courseId)
      .then((res) => { if (!cancelled && res.success) setStudents(res.data.items) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId, refreshKey])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const list = usernames.split(/[\n,，\s]+/).map((s) => s.trim()).filter(Boolean)
    if (list.length === 0) return
    setAdding(true)
    setResult(null)
    try {
      const res = await addStudents(courseId, list)
      if (res.success) {
        setResult(res.data)
        setUsernames('')
        setRefreshKey((k) => k + 1)
      }
    } catch { /* ignore */ }
    finally { setAdding(false) }
  }

  const handleRemove = async (studentId: string, name: string) => {
    if (!confirm(`确定要将 ${name} 从课程中移除吗？`)) return
    try { await removeStudent(courseId, studentId); setRefreshKey((k) => k + 1) } catch { /* ignore */ }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">共 {students.length} 名学生</p>
        <button onClick={() => { setShowAdd(!showAdd); setResult(null) }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {showAdd ? '取消' : '＋ 添加学生'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">输入学号（每行一个，或用逗号/空格分隔）</label>
          <textarea value={usernames} onChange={(e) => setUsernames(e.target.value)} placeholder="20240101&#10;20240102&#10;20240103" rows={4} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          <button type="submit" disabled={adding} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{adding ? '添加中...' : '添加'}</button>
          {result && (
            <div className="mt-3 text-sm">
              {result.added.length > 0 && <p className="text-green-600">✅ 成功添加 {result.added.length} 人：{result.added.map((a) => a.name).join('、')}</p>}
              {result.failed.length > 0 && <p className="text-red-500">❌ 失败 {result.failed.length} 人：{result.failed.map((f) => `${f.username}(${f.reason})`).join('、')}</p>}
            </div>
          )}
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse h-12 rounded-lg bg-slate-100" />))}</div>
      ) : students.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center"><p className="text-4xl">👥</p><p className="mt-2 text-sm text-slate-500">暂无学生</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">姓名</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">学号</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">班级</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">总成绩</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.username}</td>
                  <td className="px-4 py-3 text-slate-500">{s.class_name}</td>
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
