import request from '../utils/request'
import type {
  ApiResponse,
  ChatData,
  ChatSessionListData,
  SessionMessagesData,
} from '../types/api'

export async function sendMessage(
  courseId: string,
  params: {
    question: string
    session_id?: string
    section_id?: string
  },
): Promise<ApiResponse<ChatData>> {
  const res = await request.post(
    `/student/courses/${courseId}/chat`,
    params,
  )
  return res as unknown as ApiResponse<ChatData>
}

export async function getChatSessions(
  courseId: string,
  params?: { section_id?: string },
): Promise<ApiResponse<ChatSessionListData>> {
  const res = await request.get(
    `/student/courses/${courseId}/chat/sessions`,
    { params },
  )
  return res as unknown as ApiResponse<ChatSessionListData>
}

export async function getSessionMessages(
  courseId: string,
  sessionId: string,
): Promise<ApiResponse<SessionMessagesData>> {
  const res = await request.get(
    `/student/courses/${courseId}/chat/sessions/${sessionId}/messages`,
  )
  return res as unknown as ApiResponse<SessionMessagesData>
}
