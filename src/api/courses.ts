import request from '../utils/request'
import type {
  ApiResponse,
  StudentCourseListData,
  StudentCourseDetail,
  JoinCourseData,
} from '../types/api'

export async function getStudentCourses(params?: {
  status?: string
}): Promise<ApiResponse<StudentCourseListData>> {
  const res = await request.get('/student/courses', { params })
  return res as unknown as ApiResponse<StudentCourseListData>
}

export async function getStudentCourseDetail(
  courseId: string,
): Promise<ApiResponse<StudentCourseDetail>> {
  const res = await request.get(`/student/courses/${courseId}`)
  return res as unknown as ApiResponse<StudentCourseDetail>
}

export async function joinCourse(
  code: string,
): Promise<ApiResponse<JoinCourseData>> {
  const res = await request.post('/student/courses/join', { code })
  return res as unknown as ApiResponse<JoinCourseData>
}

export async function quitCourse(
  courseId: string,
): Promise<ApiResponse<{ course_id: string }>> {
  const res = await request.post(`/student/courses/${courseId}/quit`)
  return res as unknown as ApiResponse<{ course_id: string }>
}
