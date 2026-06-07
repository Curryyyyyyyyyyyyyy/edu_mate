import request from '../utils/request'
import type {
  ApiResponse,
  ChangePasswordRequest,
  LoginData,
  RegisterData,
  UpdateProfileRequest,
  UserInfo,
} from '../types/api'

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

export async function updateMe(
  data: UpdateProfileRequest,
): Promise<ApiResponse<UserInfo>> {
  const res = await request.patch('/auth/me', data)
  return res as unknown as ApiResponse<UserInfo>
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<ApiResponse<Record<string, never>>> {
  const res = await request.post('/auth/change-password', data)
  return res as unknown as ApiResponse<Record<string, never>>
}
