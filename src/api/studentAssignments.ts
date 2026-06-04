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

export async function submitAssignment(
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
    { headers: { 'Content-Type': 'multipart/form-data' } },
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
