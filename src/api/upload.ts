import request from '../utils/request'
import type { ApiResponse, UploadResult } from '../types/api'

/**
 * 上传单个文件到文件服务器
 * 返回 file_id，供创建小节、发布作业等接口使用
 */
export async function uploadFile(
  file: File,
): Promise<ApiResponse<UploadResult>> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request.post('/upload', formData)
  return res as unknown as ApiResponse<UploadResult>
}
