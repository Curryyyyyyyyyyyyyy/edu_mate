import request from '../utils/request'
import type { ApiResponse, ChatData, SessionMessagesData } from '../types/api'

export async function sendMessage(params: {
  question: string
  course?: string
  session_id?: string
}): Promise<ApiResponse<ChatData>> {
  const res = await request.post('/chat', params)
  return res as unknown as ApiResponse<ChatData>
}

export async function getSessionMessages(
  sessionId: string,
): Promise<ApiResponse<SessionMessagesData>> {
  const res = await request.get(`/chat/sessions/${sessionId}/messages`)
  return res as unknown as ApiResponse<SessionMessagesData>
}
