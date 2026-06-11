import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  getAssignments,
  getAssignmentDetail,
  submitAssignment,
  getMySubmission,
} from "../../../api/studentAssignments";
import type {
  StudentAssignmentItem,
  StudentAssignmentDetail,
  MySubmissionData,
} from "../../../types/api";

interface Props {
  courseId: string;
}

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".doc", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "📕";
    case "txt":
      return "📄";
    case "doc":
    case "docx":
      return "📘";
    default:
      return "📎";
  }
}

export default function AssignmentsTab({ courseId }: Props) {
  const [items, setItems] = useState<StudentAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<StudentAssignmentDetail | null>(
    null,
  );
  const [submission, setSubmission] = useState<MySubmissionData | null>(null);

  // 提交相关状态
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getAssignments(courseId, {
      status: filterStatus || undefined,
    })
      .then((res) => {
        if (!cancelled && res.success) setItems(res.data.items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, filterStatus]);

  const resetSubmitState = () => {
    setError("");
    setSuccessMsg("");
    setContent("");
    setSelectedFiles([]);
    setUploadProgress(null);
  };

  const openDetail = async (assignmentId: string) => {
    resetSubmitState();
    try {
      const [dRes, sRes] = await Promise.all([
        getAssignmentDetail(courseId, assignmentId),
        getMySubmission(courseId, assignmentId).catch(() => ({
          success: true,
          data: null,
        })),
      ]);
      if (dRes.success) setSelected(dRes.data);
      if (sRes.success && sRes.data) setSubmission(sRes.data);
      else setSubmission(null);
    } catch {
      // ignore
    }
  };

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `不支持的文件类型（${file.name}），仅支持：${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件 ${file.name} 大小超过 10 MB 限制`;
    }
    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    setError("");
    const arr = Array.from(newFiles);
    const remaining = MAX_FILES - selectedFiles.length;
    if (remaining <= 0) {
      setError(`最多上传 ${MAX_FILES} 个文件`);
      return;
    }
    const toAdd = arr.slice(0, remaining);

    // 逐个校验
    for (const f of toAdd) {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
    }

    // 去重（按 name + size）
    setSelectedFiles((prev) => {
      const merged = [...prev];
      for (const f of toAdd) {
        if (!merged.some((x) => x.name === f.name && x.size === f.size)) {
          merged.push(f);
        }
      }
      return merged.slice(0, MAX_FILES);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // 重置 input 以允许重新选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setError("");
    setSuccessMsg("");

    if (selectedFiles.length === 0 && !content.trim()) {
      setError("请输入作业内容或上传文件");
      return;
    }

    setSubmitting(true);
    setUploadProgress(null);
    try {
      const res = await submitAssignment(courseId, selected.id, {
        content: content.trim() || undefined,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
        onUploadProgress: (current, total) => {
          setUploadProgress({ current, total });
        },
      });

      if (res.success) {
        setSubmission({
          id: res.data.id,
          assignment_id: res.data.assignment_id,
          submit_type: res.data.submit_type,
          file_url: res.data.file_ids?.[0] ?? null,
          file_urls: res.data.file_ids ?? undefined,
          content: res.data.content ?? (content.trim() || undefined),
          submitted_at: res.data.submitted_at,
          status: res.data.status,
          score: null,
          ai_score: null,
          comments: null,
          deductions: [],
          suggestions: [],
          teacher_comment: null,
          graded_at: null,
        });
        setSuccessMsg("作业提交成功！");
        setContent("");
        setSelectedFiles([]);
        // 刷新列表
        getAssignments(courseId, {
          status: filterStatus || undefined,
        })
          .then((r) => {
            if (r.success) setItems(r.data.items);
          })
          .catch(() => {});
      }
    } catch {
      setError("提交失败，请重试");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  // 详情视图
  if (selected) {
    const isClosed = selected.status === "closed";
    const isSubmitted = submission !== null;

    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <svg
            className="mr-1 h-3.5 w-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回作业列表
        </button>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                {selected.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {selected.section_title ? `${selected.section_title} · ` : ""}
                截止：{new Date(selected.due_at).toLocaleString("zh-CN")} ·
                满分：
                {selected.full_score}
              </p>
            </div>
            <div className="flex gap-2">
              {isSubmitted && (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                  已提交
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isClosed
                    ? "bg-slate-100 text-slate-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {isClosed ? "已关闭" : "进行中"}
              </span>
            </div>
          </div>

          {selected.description && (
            <div className="mb-6">
              <h3 className="mb-1 text-sm font-medium text-slate-700">
                📄 作业要求
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {selected.description}
              </p>
            </div>
          )}

          {selected.attachment_url && (
            <div className="mb-6">
              <AttachmentInfo url={selected.attachment_url} />
            </div>
          )}

          {/* 已提交状态 */}
          {isSubmitted && (
            <div className="mb-6 rounded-lg bg-green-50 p-4">
              <p className="font-medium text-green-700">✅ 作业已提交</p>
              <p className="mt-1 text-sm text-green-600">
                提交时间：
                {new Date(submission.submitted_at).toLocaleString("zh-CN")}
                {submission.submit_type === "file" && "（文件提交）"}
                {submission.submit_type === "text" && "（文本提交）"}
              </p>
              {/* 提交的文本内容 */}
              {submission.content != null && (
                <div className="mt-2 rounded bg-white p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    📝 提交文本
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {submission.content || "（无文本内容）"}
                  </p>
                </div>
              )}
              {/* 提交的文件（file_ids 映射为 file_urls 显示） */}
              {(() => {
                const urls = submission.file_urls?.length
                  ? submission.file_urls
                  : submission.file_url
                    ? [submission.file_url]
                    : [];
                if (urls.length === 0) return null;
                return (
                  <div className="mt-2 rounded bg-white p-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      📎 已上传文件（{urls.length} 个）
                    </p>
                    <div className="space-y-1">
                      {urls.map((url, i) => {
                        const fileName = url.split("/").pop() || `文件${i + 1}`;
                        return (
                          <SubmittedFileItem
                            key={i}
                            url={url}
                            fileName={fileName}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {/* 仅 submit_type=text 且无内容提示 */}
              {submission.submit_type === "text" &&
                submission.content == null &&
                !submission.file_url &&
                submission.file_urls == null && (
                  <div className="mt-2 rounded bg-white p-3">
                    <p className="text-xs text-slate-400">暂无提交内容详情</p>
                  </div>
                )}
              {submission.score != null && (
                <div className="mt-2 rounded bg-white p-3">
                  <p className="text-sm font-medium text-slate-700">
                    得分：{submission.score}/{selected.full_score}
                  </p>
                  {submission.comments && (
                    <p className="mt-1 text-sm text-slate-600">
                      {submission.comments}
                    </p>
                  )}
                  {submission.teacher_comment && (
                    <div className="mt-2 rounded bg-blue-50 p-2">
                      <p className="text-xs font-medium text-blue-600">
                        👨‍🏫 老师评语
                      </p>
                      <p className="mt-0.5 text-sm text-slate-700">
                        {submission.teacher_comment}
                      </p>
                    </div>
                  )}
                  {submission.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500">
                        修改建议：
                      </p>
                      <ul className="list-inside list-disc text-xs text-slate-500">
                        {submission.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 提交表单 */}
          {!isClosed && !isSubmitted && (
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-100 pt-4"
            >
              <h3 className="mb-3 text-sm font-medium text-slate-700">
                ✏️ 提交作业
              </h3>

              {error && (
                <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-600">
                  {successMsg}
                </div>
              )}
              {uploadProgress && (
                <div className="mb-3 rounded bg-blue-50 px-3 py-2 text-sm text-blue-600">
                  📤 正在上传文件 {uploadProgress.current + 1}/
                  {uploadProgress.total} ...
                </div>
              )}

              {/* 提交区域 */}
              <div
                className="mb-3 overflow-hidden rounded-lg border border-slate-300 transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* 工具栏 */}
                <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                    title={`上传文件（PDF/TXT/DOC/DOCX，最大 10 MB，最多 ${MAX_FILES} 个）`}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    上传文件
                  </button>
                  <span className="mx-0.5 h-4 w-px bg-slate-300" />
                  <span className="px-1 text-xs text-slate-400">
                    支持 PDF、TXT、DOC、DOCX ≤ 10 MB，最多 {MAX_FILES} 个文件
                  </span>
                  {selectedFiles.length > 0 && (
                    <>
                      <span className="mx-0.5 h-4 w-px bg-slate-300" />
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="rounded px-1.5 py-0.5 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        清空全部
                      </button>
                    </>
                  )}
                </div>

                {/* 文件列表 */}
                {selectedFiles.length > 0 && (
                  <div
                    className={`border-b border-slate-200 ${dragOver ? "bg-blue-50" : "bg-slate-50/50"}`}
                  >
                    {selectedFiles.map((file, i) => (
                      <div
                        key={`${file.name}_${file.size}_${i}`}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">
                            {getFileIcon(file.name)}
                          </span>
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-slate-400 shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="shrink-0 rounded p-1 ml-2 text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="移除文件"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 拖放提示覆盖 */}
                {dragOver && (
                  <div className="border-b border-dashed border-blue-300 bg-blue-50/80 px-3 py-4 text-center">
                    <p className="text-sm font-medium text-blue-600">
                      📂 松开鼠标添加文件
                    </p>
                    <p className="text-xs text-blue-400">
                      已选 {selectedFiles.length}/{MAX_FILES} 个文件
                    </p>
                  </div>
                )}

                {/* 文本输入区 */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    selectedFiles.length > 0
                      ? "可同时输入文字说明（将与文件一起提交）..."
                      : "请输入你的作业内容，或点击上方工具栏上传文件（支持多文件）..."
                  }
                  rows={6}
                  className="w-full resize-y border-0 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "提交中..." : "提交作业"}
              </button>
            </form>
          )}

          {isClosed && !isSubmitted && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                该作业已关闭，不再接受提交。
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 列表视图
  return (
    <div>
      {/* 筛选 */}
      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">全部状态</option>
          <option value="open">进行中</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-2 text-sm text-slate-500">暂无作业</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => openDetail(item.id)}
              className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-800">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.section_title ? `${item.section_title} · ` : ""}
                    截止：{new Date(item.due_at).toLocaleString("zh-CN")} ·
                    满分：
                    {item.full_score}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.submitted && (
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                      已提交
                    </span>
                  )}
                  {item.score != null && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                      {item.score}分
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === "open"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.status === "open" ? "进行中" : "已关闭"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 附件信息卡片（认证下载）──

function AttachmentInfo({ url }: { url: string }) {
  const [downloading, setDownloading] = useState(false);
  const fileName = url.split("/").pop() || "附件";
  const ext = "." + (fileName.split(".").pop()?.toLowerCase() || "");
  const isKnownType = [".pdf", ".txt", ".doc", ".docx"].includes(ext);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("下载失败");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-700">📎 作业附件</h3>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getFileIcon(fileName)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700 truncate">
            {fileName}
          </p>
          <p className="text-xs text-slate-400">
            {isKnownType
              ? ext.toUpperCase().replace(".", "") + " 文件"
              : "未知类型"}
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
        >
          {downloading ? "下载中..." : "下载附件"}
        </button>
      </div>
    </div>
  );
}

// ── 已提交文件条目（认证下载）──

function SubmittedFileItem({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("下载失败");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded px-2 py-1 hover:bg-slate-50">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">{getFileIcon(fileName)}</span>
        <span className="text-sm text-slate-700 truncate">{fileName}</span>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="shrink-0 ml-2 rounded px-2 py-0.5 text-xs text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
      >
        {downloading ? "下载中..." : "下载"}
      </button>
    </div>
  );
}
