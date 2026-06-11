import request from '../utils/request'
import type {
  ApiResponse,
  UploadResult,
  StudentAssignmentListData,
  StudentAssignmentDetail,
  SubmissionData,
  MySubmissionData,
} from '../types/api'

export async function getAssignments(
  courseId: string,
  params?: { section_id?: string; status?: string },
): Promise<ApiResponse<StudentAssignmentListData>> {
  const res = await request.get(
    `/student/courses/${courseId}/assignments`,
    { params },
  )
  return res as unknown as ApiResponse<StudentAssignmentListData>
}

export async function getAssignmentDetail(
  courseId: string,
  assignmentId: string,
): Promise<ApiResponse<StudentAssignmentDetail>> {
  const res = await request.get(
    `/student/courses/${courseId}/assignments/${assignmentId}`,
  )
  return res as unknown as ApiResponse<StudentAssignmentDetail>
}

/**
 * 上传单个文件到文件服务器
 * 用于作业提交前的文件上传，返回文件服务器的可访问路径 file_url
 */
export async function uploadFile(
  file: File,
): Promise<ApiResponse<UploadResult>> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request.post('/upload', formData)
  return res as unknown as ApiResponse<UploadResult>
}

/**
 * 提交作业 — 文本模式
 */
export async function submitAssignmentText(
  courseId: string,
  assignmentId: string,
  content: string,
): Promise<ApiResponse<SubmissionData>> {
  const formData = new FormData()
  formData.append('submit_type', 'text')
  formData.append('content', content)

  const res = await request.post(
    `/student/courses/${courseId}/assignments/${assignmentId}/submit`,
    formData,
  )
  return res as unknown as ApiResponse<SubmissionData>
}

/**
 * 提交作业 — 文件模式（单文件，向后兼容）
 * 先上传文件获取 file_url，再提交
 */
export async function submitAssignmentFile(
  courseId: string,
  assignmentId: string,
  file: File,
): Promise<ApiResponse<SubmissionData>> {
  // 第一步：上传文件
  const uploadRes = await uploadFile(file)
  const fileUrl = uploadRes.data.file_url

  // 第二步：提交作业
  const formData = new FormData()
  formData.append('submit_type', 'file')
  formData.append('file_urls', fileUrl)
  const res = await request.post(
    `/student/courses/${courseId}/assignments/${assignmentId}/submit`,
    formData,
  )
  return res as unknown as ApiResponse<SubmissionData>
}

/**
 * 提交作业 — 统一模式（支持文本 + 文件）
 * 文件提交时先将文件通过 POST /upload 上传，获取 file_url 后再提交
 * submit_type: 有文件用 'file'，否则 'text'
 */
export async function submitAssignment(
  courseId: string,
  assignmentId: string,
  params: {
    content?: string
    files?: File[]
    onUploadProgress?: (current: number, total: number) => void
  },
): Promise<ApiResponse<SubmissionData>> {
  const { content, files, onUploadProgress } = params
  const hasContent = !!content?.trim()
  const hasFiles = !!(files && files.length > 0)

  // 第一步：如有文件，逐个上传获取 URL
  const fileUrls: string[] = []
  if (hasFiles) {
    for (let i = 0; i < files!.length; i++) {
      onUploadProgress?.(i, files!.length)
      const uploadRes = await uploadFile(files![i])
      fileUrls.push(uploadRes.data.file_url)
    }
  }

  // 第二步：提交作业
  const submitType: 'text' | 'file' = fileUrls.length > 0 ? 'file' : 'text'
  const formData = new FormData()
  formData.append('submit_type', submitType)

  if (hasContent) {
    formData.append('content', content!.trim())
  }

  if (fileUrls.length > 0) {
    formData.append('file_urls', fileUrls.join(','))
  }

  const res = await request.post(
    `/student/courses/${courseId}/assignments/${assignmentId}/submit`,
    formData,
  )
  return res as unknown as ApiResponse<SubmissionData>
}

export async function getMySubmission(
  courseId: string,
  assignmentId: string,
): Promise<ApiResponse<MySubmissionData | null>> {
  const res = await request.get(
    `/student/courses/${courseId}/assignments/${assignmentId}/my-submission`,
  )
  return res as unknown as ApiResponse<MySubmissionData | null>
}
