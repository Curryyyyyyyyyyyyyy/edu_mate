import request from '../utils/request'
import type {
  ApiResponse,
  QuestionAnswerData,
  QuestionCreateRequest,
  QuestionItem,
  QuestionListData,
  QuestionStatus,
  QuestionVisibility,
} from '../types/api'

export async function createQuestion(
  courseId: string,
  data: QuestionCreateRequest,
): Promise<ApiResponse<QuestionItem>> {
  const res = await request.post(`/courses/${courseId}/questions`, data)
  return res as unknown as ApiResponse<QuestionItem>
}

export async function getQuestions(
  courseId: string,
  params?: {
    section_id?: string
    status?: QuestionStatus
    visibility?: QuestionVisibility
  },
): Promise<ApiResponse<QuestionListData>> {
  const res = await request.get(`/courses/${courseId}/questions`, { params })
  return res as unknown as ApiResponse<QuestionListData>
}

export async function getQuestion(
  courseId: string,
  questionId: string,
): Promise<ApiResponse<QuestionItem>> {
  const res = await request.get(`/courses/${courseId}/questions/${questionId}`)
  return res as unknown as ApiResponse<QuestionItem>
}

export async function answerQuestion(
  courseId: string,
  questionId: string,
  content: string,
): Promise<ApiResponse<QuestionAnswerData>> {
  const res = await request.post(`/courses/${courseId}/questions/${questionId}/answer`, { content })
  return res as unknown as ApiResponse<QuestionAnswerData>
}

export async function updateQuestionVisibility(
  courseId: string,
  questionId: string,
  visibility: QuestionVisibility,
): Promise<ApiResponse<{ id: string; visibility: QuestionVisibility }>> {
  const res = await request.patch(`/courses/${courseId}/questions/${questionId}`, { visibility })
  return res as unknown as ApiResponse<{ id: string; visibility: QuestionVisibility }>
}

export async function deleteQuestion(
  courseId: string,
  questionId: string,
): Promise<ApiResponse<{ id: string }>> {
  const res = await request.delete(`/courses/${courseId}/questions/${questionId}`)
  return res as unknown as ApiResponse<{ id: string }>
}
