import request from '../utils/request'
import type {
  ApiResponse,
  TeacherCourseListData,
  TeacherCourseDetail,
} from '../types/api'

export async function getTeacherCourses(params?: {
  status?: string
  keyword?: string
}): Promise<ApiResponse<TeacherCourseListData>> {
  const res = await request.get('/teacher/courses', { params })
  return res as unknown as ApiResponse<TeacherCourseListData>
}

export async function getTeacherCourseDetail(
  courseId: string,
): Promise<ApiResponse<TeacherCourseDetail>> {
  const res = await request.get(`/teacher/courses/${courseId}`)
  return res as unknown as ApiResponse<TeacherCourseDetail>
}

export async function createCourse(data: {
  name: string
  description?: string
  cover_image_url?: string
  semester?: string
}): Promise<ApiResponse<TeacherCourseDetail>> {
  const res = await request.post('/teacher/courses', data)
  return res as unknown as ApiResponse<TeacherCourseDetail>
}

export async function updateCourse(
  courseId: string,
  data: { name?: string; description?: string; semester?: string },
): Promise<ApiResponse<{ id: string; name: string; updated_at: string }>> {
  const res = await request.patch(`/teacher/courses/${courseId}`, data)
  return res as unknown as ApiResponse<{ id: string; name: string; updated_at: string }>
}

export async function archiveCourse(
  courseId: string,
): Promise<ApiResponse<{ id: string; status: string }>> {
  const res = await request.post(`/teacher/courses/${courseId}/archive`)
  return res as unknown as ApiResponse<{ id: string; status: string }>
}

export async function regenerateCode(
  courseId: string,
): Promise<ApiResponse<{ id: string; code: string }>> {
  const res = await request.post(`/teacher/courses/${courseId}/regenerate-code`)
  return res as unknown as ApiResponse<{ id: string; code: string }>
}

export async function getCourseStudents(
  courseId: string,
): Promise<ApiResponse<{ course_id: string; items: { id: string; username: string; name: string; class_name: string; joined_at: string; total_score: number }[]; total: number }>> {
  const res = await request.get(`/teacher/courses/${courseId}/students`)
  return res as unknown as ApiResponse<{ course_id: string; items: { id: string; username: string; name: string; class_name: string; joined_at: string; total_score: number }[]; total: number }>
}

export async function addStudents(
  courseId: string,
  usernames: string[],
): Promise<ApiResponse<{ course_id: string; added: { username: string; name: string; student_id: string }[]; failed: { username: string; reason: string }[] }>> {
  const res = await request.post(`/teacher/courses/${courseId}/students`, { usernames })
  return res as unknown as ApiResponse<{ course_id: string; added: { username: string; name: string; student_id: string }[]; failed: { username: string; reason: string }[] }>
}

export async function removeStudent(
  courseId: string,
  studentId: string,
): Promise<ApiResponse<{ course_id: string; student_id: string }>> {
  const res = await request.delete(`/teacher/courses/${courseId}/students/${studentId}`)
  return res as unknown as ApiResponse<{ course_id: string; student_id: string }>
}
