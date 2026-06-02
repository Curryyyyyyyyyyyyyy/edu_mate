import request from '../utils/request'
import type {
  ApiResponse,
  AnalyzeReportData,
  GradeResultData,
  GradingReportData,
  TeacherAssignmentDetail,
  TeacherAssignmentListData,
  TeacherSubmissionListData,
} from '../types/api'

// ── 作业管理 ───────────────────────────────────────────

export async function publishAssignment(formData: {
  title: string
  course: string
  description: string
  due_at: string
  reference_answer?: string
  rubric?: string
}): Promise<ApiResponse<TeacherAssignmentDetail>> {
  const fd = new FormData()
  fd.append('title', formData.title)
  fd.append('course', formData.course)
  fd.append('description', formData.description)
  fd.append('due_at', formData.due_at)
  if (formData.reference_answer) fd.append('reference_answer', formData.reference_answer)
  if (formData.rubric) fd.append('rubric', formData.rubric)
  const res = await request.post('/teacher/assignments', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res as unknown as ApiResponse<TeacherAssignmentDetail>
}

export async function getTeacherAssignments(params?: {
  course?: string
  status?: string
}): Promise<ApiResponse<TeacherAssignmentListData>> {
  const res = await request.get('/teacher/assignments', { params })
  return res as unknown as ApiResponse<TeacherAssignmentListData>
}

export async function getTeacherAssignmentDetail(
  id: string,
): Promise<ApiResponse<TeacherAssignmentDetail>> {
  const res = await request.get(`/teacher/assignments/${id}`)
  return res as unknown as ApiResponse<TeacherAssignmentDetail>
}

export async function updateAssignment(
  id: string,
  updates: { description?: string; due_at?: string },
): Promise<
  ApiResponse<{
    id: string
    description: string
    due_at: string
    updated_at: string
  }>
> {
  const res = await request.patch(`/teacher/assignments/${id}`, updates)
  return res as unknown as ApiResponse<{
    id: string
    description: string
    due_at: string
    updated_at: string
  }>
}

export async function closeAssignment(
  id: string,
): Promise<ApiResponse<{ id: string; status: string }>> {
  const res = await request.post(`/teacher/assignments/${id}/close`)
  return res as unknown as ApiResponse<{ id: string; status: string }>
}

export async function getSubmissions(
  assignmentId: string,
): Promise<ApiResponse<TeacherSubmissionListData>> {
  const res = await request.get(`/teacher/assignments/${assignmentId}/submissions`)
  return res as unknown as ApiResponse<TeacherSubmissionListData>
}

// ── AI 批改 ───────────────────────────────────────────

export async function gradeSubmissions(
  assignmentId: string,
  submissionIds: string[],
): Promise<ApiResponse<GradeResultData>> {
  const res = await request.post(`/teacher/assignments/${assignmentId}/grade`, {
    submission_ids: submissionIds,
    need_teacher_confirm: true,
  })
  return res as unknown as ApiResponse<GradeResultData>
}

export async function confirmGrade(
  submissionId: string,
  finalScore: number,
  confirmed: boolean,
  teacherComment?: string,
): Promise<
  ApiResponse<{
    submission_id: string
    final_score: number
    confirmed: boolean
  }>
> {
  const res = await request.patch(`/teacher/submissions/${submissionId}/grade`, {
    final_score: finalScore,
    confirmed,
    teacher_comment: teacherComment,
  })
  return res as unknown as ApiResponse<{
    submission_id: string
    final_score: number
    confirmed: boolean
  }>
}

export async function getGradingReport(
  assignmentId: string,
): Promise<ApiResponse<GradingReportData>> {
  const res = await request.get(`/teacher/assignments/${assignmentId}/grading-report`)
  return res as unknown as ApiResponse<GradingReportData>
}

// ── 查重与比对 ────────────────────────────────────────

export async function analyzeSubmissions(
  assignmentId: string,
  submissionIds: string[],
  threshold?: number,
  dimensions?: string[],
): Promise<ApiResponse<AnalyzeReportData>> {
  const res = await request.post(`/teacher/assignments/${assignmentId}/analyze`, {
    submission_ids: submissionIds,
    similarity_threshold: threshold,
    compare_dimensions: dimensions,
  })
  return res as unknown as ApiResponse<AnalyzeReportData>
}

export async function getAnalyzeReport(
  assignmentId: string,
): Promise<ApiResponse<AnalyzeReportData>> {
  const res = await request.get(`/teacher/assignments/${assignmentId}/analyze-report`)
  return res as unknown as ApiResponse<AnalyzeReportData>
}
