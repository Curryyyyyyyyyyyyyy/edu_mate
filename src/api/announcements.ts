import request from '../utils/request'
import type {
  AnnouncementCreateRequest,
  AnnouncementDetail,
  AnnouncementUpdateRequest,
  ApiResponse,
  PageParams,
  StudentAnnouncementListData,
  TeacherAnnouncementListData,
} from '../types/api'

export async function createAnnouncement(
  courseId: string,
  data: AnnouncementCreateRequest,
): Promise<ApiResponse<AnnouncementDetail>> {
  const res = await request.post(`/courses/${courseId}/announcements`, data)
  return res as unknown as ApiResponse<AnnouncementDetail>
}

export async function getTeacherAnnouncements(
  courseId: string,
  params?: PageParams,
): Promise<ApiResponse<TeacherAnnouncementListData>> {
  const res = await request.get(`/courses/${courseId}/announcements`, { params })
  return res as unknown as ApiResponse<TeacherAnnouncementListData>
}

export async function updateAnnouncement(
  courseId: string,
  noticeId: string,
  data: AnnouncementUpdateRequest,
): Promise<ApiResponse<{ id: string; title: string; is_pinned: boolean; updated_at: string }>> {
  const res = await request.patch(`/courses/${courseId}/announcements/${noticeId}`, data)
  return res as unknown as ApiResponse<{ id: string; title: string; is_pinned: boolean; updated_at: string }>
}

export async function deleteAnnouncement(
  courseId: string,
  noticeId: string,
): Promise<ApiResponse<{ id: string }>> {
  const res = await request.delete(`/courses/${courseId}/announcements/${noticeId}`)
  return res as unknown as ApiResponse<{ id: string }>
}

export async function getStudentAnnouncements(
  courseId: string,
  params?: PageParams,
): Promise<ApiResponse<StudentAnnouncementListData>> {
  const res = await request.get(`/courses/${courseId}/announcements`, { params })
  return res as unknown as ApiResponse<StudentAnnouncementListData>
}

export async function getAnnouncement(
  courseId: string,
  noticeId: string,
): Promise<ApiResponse<AnnouncementDetail>> {
  const res = await request.get(`/courses/${courseId}/announcements/${noticeId}`)
  return res as unknown as ApiResponse<AnnouncementDetail>
}
