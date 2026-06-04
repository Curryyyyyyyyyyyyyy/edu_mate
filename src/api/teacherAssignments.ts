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

export async function getTeacherAssignments(
  courseId: string,
  params?: { section_id?: string; status?: string },
): Promise<ApiResponse<TeacherAssignmentListData>> {
  const res = await request.get(`/teacher/courses/${courseId}/assignments`, { params })
  return res as unknown as ApiResponse<TeacherAssignmentListData>
}

export async function getTeacherAssignmentDetail(
  courseId: string,
  assignmentId: string,
): Promise<ApiResponse<TeacherAssignmentDetail>> {
  const res = await request.get(`/teacher/courses/${courseId}/assignments/${assignmentId}`)
  return res as unknown as ApiResponse<TeacherAssignmentDetail>
}

export async function updateAssignment(
  courseId: string,
  assignmentId: string,
  updates: { description?: string; due_at?: string },
): Promise<
  ApiResponse<{
    id: string
    description: string
    due_at: string
    updated_at: string
  }>
> {
  const res = await request.patch(`/teacher/courses/${courseId}/assignments/${assignmentId}`, updates)
  return res as unknown as ApiResponse<{
    id: string
    description: string
    due_at: string
    updated_at: string
  }>
}

export async function closeAssignment(
  courseId: string,
  assignmentId: string,
): Promise<ApiResponse<{ id: string; status: string }>> {
  const res = await request.post(`/teacher/courses/${courseId}/assignments/${assignmentId}/close`)
  return res as unknown as ApiResponse<{ id: string; status: string }>
}

export async function getSubmissions(
  courseId: string,
  assignmentId: string,
): Promise<ApiResponse<TeacherSubmissionListData>> {
  const res = await request.get(`/teacher/courses/${courseId}/assignments/${assignmentId}/submissions`)
  return res as unknown as ApiResponse<TeacherSubmissionListData>
}

// ── AI 批改 ───────────────────────────────────────────

export async function gradeSubmissions(
  courseId: string,
  assignmentId: string,
  submissionIds: string[],
): Promise<ApiResponse<GradeResultData>> {
  const res = await request.post(`/teacher/courses/${courseId}/assignments/${assignmentId}/grade`, {
    submission_ids: submissionIds,
    need_teacher_confirm: true,
  })
  return res as unknown as ApiResponse<GradeResultData>
}

export async function confirmGrade(
  courseId: string,
  assignmentId: string,
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
  const res = await request.patch(
    `/teacher/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}`,
    {
      final_score: finalScore,
      confirmed,
      teacher_comment: teacherComment,
    },
  )
  return res as unknown as ApiResponse<{
    submission_id: string
    final_score: number
    confirmed: boolean
  }>
}

export async function getGradingReport(
  courseId: string,
  assignmentId: string,
): Promise<ApiResponse<GradingReportData>> {
  const res = await request.get(`/teacher/courses/${courseId}/assignments/${assignmentId}/grading-report`)
  return res as unknown as ApiResponse<GradingReportData>
}

// ── 查重与比对 ────────────────────────────────────────

export async function analyzeSubmissions(
  courseId: string,
  assignmentId: string,
  submissionIds: string[],
  threshold?: number,
  dimensions?: string[],
): Promise<ApiResponse<AnalyzeReportData>> {
  const res = await request.post(`/teacher/courses/${courseId}/assignments/${assignmentId}/analyze`, {
    submission_ids: submissionIds,
    similarity_threshold: threshold,
    compare_dimensions: dimensions,
  })
  return res as unknown as ApiResponse<AnalyzeReportData>
}

export async function getAnalyzeReport(
  courseId: string,
  assignmentId: string,
): Promise<ApiResponse<AnalyzeReportData>> {
  const res = await request.get(`/teacher/courses/${courseId}/assignments/${assignmentId}/analyze-report`)
  return res as unknown as ApiResponse<AnalyzeReportData>
}
