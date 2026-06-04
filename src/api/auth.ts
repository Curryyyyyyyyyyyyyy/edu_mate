import request from '../utils/request'
import type { ApiResponse, LoginData, RegisterData, UserInfo } from '../types/api'

export async function login(
  username: string,
  password: string,
): Promise<ApiResponse<LoginData>> {
  const res = await request.post('/auth/login', { username, password })
  return res as unknown as ApiResponse<LoginData>
}

export async function registerStudent(payload: {
  username: string
  name: string
  class_name: string
  password: string
}): Promise<ApiResponse<RegisterData>> {
  const res = await request.post('/auth/register/student', payload)
  return res as unknown as ApiResponse<RegisterData>
}

export async function registerTeacher(payload: {
  username: string
  name: string
  password: string
}): Promise<ApiResponse<RegisterData>> {
  const res = await request.post('/auth/register/teacher', payload)
  return res as unknown as ApiResponse<RegisterData>
}

export async function getMe(): Promise<ApiResponse<UserInfo>> {
  const res = await request.get('/auth/me')
  return res as unknown as ApiResponse<UserInfo>
}
