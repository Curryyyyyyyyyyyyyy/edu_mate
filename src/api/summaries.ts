import request from '../utils/request'
import type {
  ApiResponse,
  SummaryCreateRequest,
  SummaryDetail,
  SummaryListData,
} from '../types/api'

export async function createSummary(
  courseId: string,
  params: SummaryCreateRequest,
): Promise<ApiResponse<SummaryDetail>> {
  const res = await request.post(
    `/student/courses/${courseId}/summaries`,
    params,
  )
  return res as unknown as ApiResponse<SummaryDetail>
}

export async function getSummaries(
  courseId: string,
  params?: { section_id?: string; keyword?: string },
): Promise<ApiResponse<SummaryListData>> {
  const res = await request.get(
    `/student/courses/${courseId}/summaries`,
    { params },
  )
  return res as unknown as ApiResponse<SummaryListData>
}

export async function getSummary(
  courseId: string,
  summaryId: string,
): Promise<ApiResponse<SummaryDetail>> {
  const res = await request.get(
    `/student/courses/${courseId}/summaries/${summaryId}`,
  )
  return res as unknown as ApiResponse<SummaryDetail>
}

export async function deleteSummary(
  courseId: string,
  summaryId: string,
): Promise<ApiResponse<{ id: string }>> {
  const res = await request.delete(
    `/student/courses/${courseId}/summaries/${summaryId}`,
  )
  return res as unknown as ApiResponse<{ id: string }>
}
