import request from '../utils/request'
import type {
  ApiResponse,
  LearningPlanCreateRequest,
  LearningPlanData,
  LearningPlanListData,
  PlanProgress,
  PlanEffect,
} from '../types/api'

export async function createLearningPlan(
  courseId: string,
  params: LearningPlanCreateRequest,
): Promise<ApiResponse<LearningPlanData>> {
  const res = await request.post(
    `/student/courses/${courseId}/learning-plans`,
    params,
  )
  return res as unknown as ApiResponse<LearningPlanData>
}

export async function getLearningPlans(
  courseId: string,
  params?: { status?: string },
): Promise<ApiResponse<LearningPlanListData>> {
  const res = await request.get(
    `/student/courses/${courseId}/learning-plans`,
    { params },
  )
  return res as unknown as ApiResponse<LearningPlanListData>
}

export async function getLearningPlan(
  courseId: string,
  planId: string,
): Promise<ApiResponse<LearningPlanData>> {
  const res = await request.get(
    `/student/courses/${courseId}/learning-plans/${planId}`,
  )
  return res as unknown as ApiResponse<LearningPlanData>
}

export async function updatePlanStatus(
  courseId: string,
  planId: string,
  status: string,
): Promise<ApiResponse<{ id: string; status: string }>> {
  const res = await request.patch(
    `/student/courses/${courseId}/learning-plans/${planId}/status`,
    { status },
  )
  return res as unknown as ApiResponse<{ id: string; status: string }>
}

export async function markTaskComplete(
  courseId: string,
  planId: string,
  day: number,
  completed: boolean,
  feedback?: string,
): Promise<ApiResponse<PlanProgress['tasks'][number]>> {
  const res = await request.post(
    `/student/courses/${courseId}/learning-plans/${planId}/progress`,
    { day, completed, feedback },
  )
  return res as unknown as ApiResponse<PlanProgress['tasks'][number]>
}

export async function getPlanProgress(
  courseId: string,
  planId: string,
): Promise<ApiResponse<PlanProgress>> {
  const res = await request.get(
    `/student/courses/${courseId}/learning-plans/${planId}/progress`,
  )
  return res as unknown as ApiResponse<PlanProgress>
}

export async function adjustPlan(
  courseId: string,
  planId: string,
  feedback: string,
  available_time_per_day?: number,
): Promise<ApiResponse<LearningPlanData>> {
  const res = await request.post(
    `/student/courses/${courseId}/learning-plans/${planId}/adjust`,
    { feedback, available_time_per_day },
  )
  return res as unknown as ApiResponse<LearningPlanData>
}

export async function getPlanEffect(
  courseId: string,
  planId: string,
): Promise<ApiResponse<PlanEffect>> {
  const res = await request.get(
    `/student/courses/${courseId}/learning-plans/${planId}/effect`,
  )
  return res as unknown as ApiResponse<PlanEffect>
}
