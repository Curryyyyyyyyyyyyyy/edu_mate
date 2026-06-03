import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { publishAssignment } from '../../../../api/teacherAssignments'

function getErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { detail?: string; message?: string } } })
    ?.response?.data

  return data?.detail || data?.message || fallback
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default function TeacherAssignmentCreatePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [referenceAnswer, setReferenceAnswer] = useState('')
  const [rubric, setRubric] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim() || !course.trim() || !description.trim() || !dueAt) {
      setError('请填写作业标题、课程、要求说明和截止时间')
      return
    }

    setError('')
    setPublishing(true)
    try {
      await publishAssignment({
        title: title.trim(),
        course: course.trim(),
        description: description.trim(),
        due_at: new Date(dueAt).toISOString(),
        reference_answer: referenceAnswer.trim() || undefined,
        rubric: rubric.trim() || undefined,
        attachment: attachment || undefined,
      })
      navigate('/teacher/assignments', { replace: true })
    } catch (err: unknown) {
      setError(getErrorMessage(err, '发布失败，请检查内容后重试'))
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/teacher/assignments"
            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            返回作业管理
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">发布作业</h1>
          <p className="mt-2 text-sm text-slate-500">
            填写作业信息后发布到学生端，附件字段会按接口文档上传为 attachment。
          </p>
        </div>
      </div>

      <form
        onSubmit={handlePublish}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <section>
              <h2 className="mb-4 text-base font-semibold text-slate-900">基础信息</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    作业标题
                  </span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="例如：操作系统进程管理作业"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    课程
                  </span>
                  <input
                    type="text"
                    value={course}
                    onChange={(event) => setCourse(event.target.value)}
                    placeholder="例如：操作系统"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-base font-semibold text-slate-900">作业内容</h2>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  作业要求
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="说明提交要求、字数、格式和评价重点"
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </section>

            <section>
              <h2 className="mb-4 text-base font-semibold text-slate-900">评分辅助</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    参考答案
                  </span>
                  <textarea
                    value={referenceAnswer}
                    onChange={(event) => setReferenceAnswer(event.target.value)}
                    placeholder="可选，供 AI 批改时参考"
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    评分标准
                  </span>
                  <textarea
                    value={rubric}
                    onChange={(event) => setRubric(event.target.value)}
                    placeholder="可选，例如：概念 30 分，分析 40 分"
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="h-fit space-y-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                截止时间
              </span>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                作业附件
              </span>
              <input
                type="file"
                onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-100"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                可选。按 api.md，后端支持 PDF、TXT，最大限制由后端控制。
              </p>
              {attachment && (
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                  {attachment.name} · {formatFileSize(attachment.size)}
                </p>
              )}
            </label>

            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5">
              <button
                type="submit"
                disabled={publishing}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publishing ? '发布中...' : '确认发布'}
              </button>
              <Link
                to="/teacher/assignments"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                取消
              </Link>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
