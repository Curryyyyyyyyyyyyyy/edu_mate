import request from '../utils/request'
import type {
  ApiResponse,
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
 * 提交作业 — 文本模式
 */
export async function submitAssignmentText(
  courseId: string,
  assignmentId: string,
  content: string,
): Promise<ApiResponse<SubmissionData>> {
  const res = await request.post(
    `/student/courses/${courseId}/assignments/${assignmentId}/submit`,
    { submit_type: 'text', content },
  )
  return res as unknown as ApiResponse<SubmissionData>
}

/**
 * 提交作业 — 文件模式（单文件，向后兼容）
 */
export async function submitAssignmentFile(
  courseId: string,
  assignmentId: string,
  file: File,
): Promise<ApiResponse<SubmissionData>> {
  const formData = new FormData()
  formData.append('submit_type', 'file')
  formData.append('file', file)
  // 不手动设 Content-Type，让浏览器自动带 boundary
  const res = await request.post(
    `/student/courses/${courseId}/assignments/${assignmentId}/submit`,
    formData,
  )
  return res as unknown as ApiResponse<SubmissionData>
}

/**
 * 提交作业 — 统一模式（支持文本 + 多文件混合）
 * submit_type 自动推断：'mixed'（文本+文件）/ 'file'（仅文件）/ 'text'（仅文本）
 */
export async function submitAssignment(
  courseId: string,
  assignmentId: string,
  params: { content?: string; files?: File[] },
): Promise<ApiResponse<SubmissionData>> {
  const { content, files } = params
  const hasContent = !!content?.trim()
  const hasFiles = !!(files && files.length > 0)

  let submitType: 'text' | 'file' | 'mixed'
  if (hasContent && hasFiles) {
    submitType = 'mixed'
  } else if (hasFiles) {
    submitType = 'file'
  } else {
    submitType = 'text'
  }

  const formData = new FormData()
  formData.append('submit_type', submitType)

  if (hasContent) {
    formData.append('content', content!.trim())
  }

  if (hasFiles) {
    files!.forEach((file) => {
      formData.append('files', file)
    })
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
