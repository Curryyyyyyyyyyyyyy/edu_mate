import request from '../utils/request'
import type {
  ApiResponse,
  SectionListData,
  SectionDetail,
} from '../types/api'

export async function getSections(
  courseId: string,
): Promise<ApiResponse<SectionListData>> {
  const res = await request.get(`/student/courses/${courseId}/sections`)
  return res as unknown as ApiResponse<SectionListData>
}

export async function getSectionDetail(
  courseId: string,
  sectionId: string,
): Promise<ApiResponse<SectionDetail>> {
  const res = await request.get(
    `/student/courses/${courseId}/sections/${sectionId}`,
  )
  return res as unknown as ApiResponse<SectionDetail>
}
