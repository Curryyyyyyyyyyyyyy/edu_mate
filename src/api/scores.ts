import request from '../utils/request'
import type {
  ApiResponse,
  StudentCourseScoresData,
  StudentScoresData,
  TeacherScoresData,
  TeacherStudentScoresData,
} from '../types/api'

export async function getStudentCourseScores(
  courseId: string,
): Promise<ApiResponse<StudentCourseScoresData>> {
  const res = await request.get(`/student/courses/${courseId}/scores`)
  return res as unknown as ApiResponse<StudentCourseScoresData>
}

export async function getStudentScores(): Promise<ApiResponse<StudentScoresData>> {
  const res = await request.get('/student/scores')
  return res as unknown as ApiResponse<StudentScoresData>
}

export async function getTeacherCourseScores(
  courseId: string,
  params?: { sort_by?: 'total_score' | 'name'; order?: 'asc' | 'desc' },
): Promise<ApiResponse<TeacherScoresData>> {
  const res = await request.get(`/teacher/courses/${courseId}/scores`, { params })
  return res as unknown as ApiResponse<TeacherScoresData>
}

export async function getTeacherStudentScores(
  courseId: string,
  studentId: string,
): Promise<ApiResponse<TeacherStudentScoresData>> {
  const res = await request.get(`/teacher/courses/${courseId}/scores/${studentId}`)
  return res as unknown as ApiResponse<TeacherStudentScoresData>
}
