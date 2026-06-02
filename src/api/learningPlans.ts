import request from '../utils/request'
import type {
  ApiResponse,
  LearningPlanCreateRequest,
  LearningPlanData,
  LearningPlanListData,
} from '../types/api'

export async function createLearningPlan(
  params: LearningPlanCreateRequest,
): Promise<ApiResponse<LearningPlanData>> {
  const res = await request.post('/student/learning-plans', params)
  return res as unknown as ApiResponse<LearningPlanData>
}

export async function getLearningPlans(params?: {
  course?: string
  status?: string
}): Promise<ApiResponse<LearningPlanListData>> {
  const res = await request.get('/student/learning-plans', { params })
  return res as unknown as ApiResponse<LearningPlanListData>
}
