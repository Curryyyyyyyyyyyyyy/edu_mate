import request from '../utils/request'
import type {
  ApiResponse,
  StudentAssignmentDetail,
  StudentAssignmentListData,
  SubmissionData,
  MySubmissionData,
} from '../types/api'

export async function getAssignments(params?: {
  course?: string
  status?: string
}): Promise<ApiResponse<StudentAssignmentListData>> {
  const res = await request.get('/student/assignments', { params })
  return res as unknown as ApiResponse<StudentAssignmentListData>
}

export async function getAssignmentDetail(
  id: string,
): Promise<ApiResponse<StudentAssignmentDetail>> {
  const res = await request.get(`/student/assignments/${id}`)
  return res as unknown as ApiResponse<StudentAssignmentDetail>
}

export async function submitAssignment(
  assignmentId: string,
  content: string,
): Promise<ApiResponse<SubmissionData>> {
  const formData = new FormData()
  formData.append('submit_type', 'text')
  formData.append('content', content)
  const res = await request.post(`/student/assignments/${assignmentId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res as unknown as ApiResponse<SubmissionData>
}

export async function getMySubmission(
  assignmentId: string,
): Promise<ApiResponse<MySubmissionData | null>> {
  const res = await request.get(`/student/assignments/${assignmentId}/my-submission`)
  return res as unknown as ApiResponse<MySubmissionData | null>
}
