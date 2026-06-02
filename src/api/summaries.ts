import request from '../utils/request'
import type {
  ApiResponse,
  SummaryCreateRequest,
  SummaryDetail,
  SummaryListData,
} from '../types/api'

export async function createSummary(
  params: SummaryCreateRequest,
): Promise<ApiResponse<SummaryDetail>> {
  const res = await request.post('/summaries', params)
  return res as unknown as ApiResponse<SummaryDetail>
}

export async function getSummaries(params?: {
  course?: string
  keyword?: string
}): Promise<ApiResponse<SummaryListData>> {
  const res = await request.get('/summaries', { params })
  return res as unknown as ApiResponse<SummaryListData>
}

export async function getSummary(
  id: string,
): Promise<ApiResponse<SummaryDetail>> {
  const res = await request.get(`/summaries/${id}`)
  return res as unknown as ApiResponse<SummaryDetail>
}

export async function deleteSummary(
  id: string,
): Promise<ApiResponse<{ id: string }>> {
  const res = await request.delete(`/summaries/${id}`)
  return res as unknown as ApiResponse<{ id: string }>
}
