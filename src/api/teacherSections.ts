import request from '../utils/request'
import type {
  ApiResponse,
  SectionItem,
  SectionListData,
} from '../types/api'

export async function getTeacherSections(
  courseId: string,
): Promise<ApiResponse<SectionListData>> {
  const res = await request.get(`/teacher/courses/${courseId}/sections`)
  return res as unknown as ApiResponse<SectionListData>
}

export async function createSection(
  courseId: string,
  data: { title: string; description?: string; order?: number; material_url?: string },
): Promise<ApiResponse<SectionItem & { course_id: string; created_at: string }>> {
  const res = await request.post(`/teacher/courses/${courseId}/sections`, data)
  return res as unknown as ApiResponse<SectionItem & { course_id: string; created_at: string }>
}

export async function updateSection(
  courseId: string,
  sectionId: string,
  data: { title?: string; description?: string; order?: number },
): Promise<ApiResponse<{ id: string; title: string; updated_at: string }>> {
  const res = await request.patch(`/teacher/courses/${courseId}/sections/${sectionId}`, data)
  return res as unknown as ApiResponse<{ id: string; title: string; updated_at: string }>
}

export async function deleteSection(
  courseId: string,
  sectionId: string,
): Promise<ApiResponse<{ id: string }>> {
  const res = await request.delete(`/teacher/courses/${courseId}/sections/${sectionId}`)
  return res as unknown as ApiResponse<{ id: string }>
}

export async function publishAssignmentInSection(
  courseId: string,
  sectionId: string,
  formData: FormData,
): Promise<ApiResponse<{
  id: string; course_id: string; section_id: string; section_title: string;
  title: string; description: string; due_at: string; full_score: number;
  status: string; attachment_url: string | null; created_at: string;
}>> {
  const res = await request.post(
    `/teacher/courses/${courseId}/sections/${sectionId}/assignments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return res as unknown as ApiResponse<{
    id: string; course_id: string; section_id: string; section_title: string;
    title: string; description: string; due_at: string; full_score: number;
    status: string; attachment_url: string | null; created_at: string;
  }>
}
