// ── 通用 ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
  }
}

// ── 用户 / 认证 ────────────────────────────────────────────────

export type Role = 'student' | 'teacher'

export interface UserInfo {
  id: string
  username: string
  name: string
  role: Role
  extra?: Record<string, unknown>
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginData {
  token: string
  expires_in: number
  user: UserInfo
}

export interface StudentRegisterRequest {
  username: string
  name: string
  class_name: string
  password: string
}

export interface TeacherRegisterRequest {
  username: string
  name: string
  courses: string[]
  password: string
}

export interface RegisterData {
  id: string
  username: string
  name: string
  role: Role
}

// ── 智能问答 ──────────────────────────────────────────────────

export interface ChatRequest {
  question: string
  course?: string
  session_id?: string
}

export interface ChatData {
  session_id: string
  answer: string
  suggestions: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface SessionMessagesData {
  session_id: string
  messages: ChatMessage[]
}

// ── 学生端作业 ────────────────────────────────────────────────

export type AssignmentStatus = 'open' | 'closed'
export type SubmitType = 'text' | 'file'

export interface StudentAssignmentItem {
  id: string
  title: string
  course: string
  due_at: string
  status: AssignmentStatus
  submitted: boolean
}

export interface StudentAssignmentListData {
  items: StudentAssignmentItem[]
  total: number
}

export interface StudentAssignmentDetail {
  id: string
  title: string
  course: string
  description: string
  due_at: string
  status: AssignmentStatus
  attachment_url: string | null
  submitted: boolean
}

export interface SubmissionData {
  id: string
  assignment_id: string
  student_id: string
  submit_type: SubmitType
  submitted_at: string
  status: 'submitted'
}

export interface MySubmissionData {
  id: string
  assignment_id: string
  submit_type: SubmitType
  file_url: string | null
  submitted_at: string
  status: 'submitted'
}

// ── 知识点总结 ────────────────────────────────────────────────

export interface SummaryCreateRequest {
  title: string
  course?: string
  source_text: string
  summary_type?: 'structured' | 'brief' | 'review'
}

export interface SummaryResult {
  overview: string
  key_points: string[]
  difficult_points: string[]
  review_tips: string[]
}

export interface SummaryListItem {
  id: string
  title: string
  course: string
  created_at: string
}

export interface SummaryListData {
  items: SummaryListItem[]
  total: number
}

export interface SummaryDetail {
  id: string
  title: string
  course: string
  source_text: string
  summary: SummaryResult
  created_at: string
}

// ── 学习计划 ──────────────────────────────────────────────────

export interface GradeRecord {
  exam_name: string
  score: number
  full_score: number
}

export interface HomeworkRecord {
  title: string
  score: number
  full_score: number
  weak_points: string[]
}

export interface LearningPlanCreateRequest {
  course: string
  goal: string
  grade_records?: GradeRecord[]
  homework_records?: HomeworkRecord[]
  available_time_per_day?: number
}

export interface PlanAnalysis {
  current_level: string
  weak_points: string[]
  priority: string
}

export interface PlanDay {
  day: number
  task: string
  duration_minutes: number
}

export interface LearningPlanData {
  id: string
  course: string
  analysis: PlanAnalysis
  plan: PlanDay[]
  created_at: string
}

export interface LearningPlanListItem {
  id: string
  course: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
}

export interface LearningPlanListData {
  items: LearningPlanListItem[]
  total: number
}

// ── 教师端作业 ────────────────────────────────────────────────

export interface TeacherAssignmentItem {
  id: string
  title: string
  course: string
  due_at: string
  status: AssignmentStatus
  submission_count: number
  total_students: number
}

export interface TeacherAssignmentListData {
  items: TeacherAssignmentItem[]
  total: number
}

export interface TeacherAssignmentDetail {
  id: string
  title: string
  course: string
  description: string
  reference_answer: string | null
  rubric: string | null
  due_at: string
  status: AssignmentStatus
  attachment_url: string | null
  submission_count: number
  created_at: string
  updated_at: string
}

export interface TeacherSubmissionItem {
  id: string
  student_id: string
  student_name: string
  submit_type: SubmitType
  submitted_at: string
  status: 'submitted'
}

export interface TeacherSubmissionListData {
  assignment_id: string
  items: TeacherSubmissionItem[]
  total: number
}

// ── AI 批改 ───────────────────────────────────────────────────

export interface GradeRequest {
  submission_ids: string[]
  need_teacher_confirm?: boolean
}

export interface Deduction {
  point: string
  minus: number
}

export interface GradeResultItem {
  submission_id: string
  student_id: string
  student_name: string
  ai_score: number
  comments: string
  deductions: Deduction[]
  suggestions: string[]
  confirmed: boolean
}

export interface GradeResultData {
  assignment_id: string
  results: GradeResultItem[]
}

export interface GradeConfirmRequest {
  final_score: number
  confirmed: boolean
  teacher_comment?: string
}

export interface GradingReportData {
  assignment_id: string
  average_score: number
  graded_count: number
  common_mistakes: string[]
  weak_points: string[]
  teaching_suggestions: string[]
}

// ── 查重与比对 ────────────────────────────────────────────────

export interface AnalyzeRequest {
  submission_ids: string[]
  similarity_threshold?: number
  compare_dimensions?: string[]
}

export interface SuspiciousPair {
  submission_a: string
  student_a: string
  submission_b: string
  student_b: string
  similarity: number
  risk_level: 'high' | 'medium' | 'low'
  similar_segments: string[]
  ai_reason: string
}

export interface ComparisonDetail {
  submission_id: string
  student_name: string
  strengths: string[]
  weaknesses: string[]
  dimension_scores: Record<string, string>
}

export interface AnalyzeReportData {
  report_id: string
  assignment_id: string
  suspicious_pairs: SuspiciousPair[]
  comparison_details: ComparisonDetail[]
  common_issues: string[]
  teaching_suggestions: string[]
  created_at: string
}
