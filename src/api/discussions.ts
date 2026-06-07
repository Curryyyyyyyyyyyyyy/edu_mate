import request from '../utils/request'
import type {
  ApiResponse,
  DiscussionCreateRequest,
  DiscussionDetail,
  DiscussionItem,
  DiscussionListData,
  DiscussionReply,
  DiscussionStatus,
  PageParams,
} from '../types/api'

export async function createDiscussion(
  courseId: string,
  data: DiscussionCreateRequest,
): Promise<ApiResponse<DiscussionItem>> {
  const res = await request.post(`/courses/${courseId}/discussions`, data)
  return res as unknown as ApiResponse<DiscussionItem>
}

export async function getDiscussions(
  courseId: string,
  params?: { section_id?: string; status?: DiscussionStatus },
): Promise<ApiResponse<DiscussionListData>> {
  const res = await request.get(`/courses/${courseId}/discussions`, { params })
  return res as unknown as ApiResponse<DiscussionListData>
}

export async function getDiscussion(
  courseId: string,
  discussionId: string,
  params?: PageParams,
): Promise<ApiResponse<DiscussionDetail>> {
  const res = await request.get(`/courses/${courseId}/discussions/${discussionId}`, { params })
  return res as unknown as ApiResponse<DiscussionDetail>
}

export async function createDiscussionReply(
  courseId: string,
  discussionId: string,
  content: string,
): Promise<ApiResponse<DiscussionReply>> {
  const res = await request.post(
    `/courses/${courseId}/discussions/${discussionId}/replies`,
    { content },
  )
  return res as unknown as ApiResponse<DiscussionReply>
}

export async function deleteDiscussionReply(
  courseId: string,
  discussionId: string,
  replyId: string,
): Promise<ApiResponse<{ id: string }>> {
  const res = await request.delete(
    `/courses/${courseId}/discussions/${discussionId}/replies/${replyId}`,
  )
  return res as unknown as ApiResponse<{ id: string }>
}

export async function updateDiscussionStatus(
  courseId: string,
  discussionId: string,
  status: DiscussionStatus,
): Promise<ApiResponse<{ id: string; status: DiscussionStatus }>> {
  const res = await request.patch(`/courses/${courseId}/discussions/${discussionId}`, { status })
  return res as unknown as ApiResponse<{ id: string; status: DiscussionStatus }>
}

export async function deleteDiscussion(
  courseId: string,
  discussionId: string,
): Promise<ApiResponse<{ id: string }>> {
  const res = await request.delete(`/courses/${courseId}/discussions/${discussionId}`)
  return res as unknown as ApiResponse<{ id: string }>
}
