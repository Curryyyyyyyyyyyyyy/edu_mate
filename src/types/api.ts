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

export interface UserProfile {
  interests?: string[]
  career_direction?: string
  bio?: string
}

export interface UserInfo {
  id: string
  username: string
  name: string
  role: Role
  class_name?: string
  profile?: UserProfile
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
  password: string
}

export interface RegisterData {
  id: string
  username: string
  name: string
  role: Role
}

// ── 课程（学生端）─────────────────────────────────────────────

export type CourseStatus = 'active' | 'archived'

export interface StudentCourseItem {
  id: string
  name: string
  teacher_name: string
  semester: string
  status: CourseStatus
  section_count: number
  completed_sections: number
  total_score: number | null
  joined_at: string
}

export interface StudentCourseListData {
  items: StudentCourseItem[]
  total: number
}

// ── 课程（教师端）─────────────────────────────────────────────

export interface TeacherCourseItem {
  id: string
  name: string
  code: string
  semester: string
  status: CourseStatus
  student_count: number
  section_count: number
  created_at: string
}

export interface TeacherCourseListData {
  items: TeacherCourseItem[]
  total: number
}

export interface TeacherCourseDetail {
  id: string
  name: string
  description: string
  code: string
  semester: string
  status: CourseStatus
  teacher_id: string
  teacher_name: string
  student_count: number
  section_count: number
  created_at: string
  updated_at: string
}

export interface StudentCourseDetail {
  id: string
  name: string
  description: string
  teacher_name: string
  semester: string
  status: CourseStatus
  section_count: number
  completed_sections: number
  total_score: number | null
  joined_at: string
}

export interface JoinCourseData {
  course_id: string
  course_name: string
  teacher_name: string
  semester: string
  joined_at: string
}

// ── 课程小节（学生端）─────────────────────────────────────────

export interface SectionItem {
  id: string
  title: string
  description?: string
  order: number
  material_url: string | null
  material_file_name: string | null
  assignment_count: number
  submitted_count: number
  section_score: number | null
}

export interface SectionListData {
  course_id: string
  items: SectionItem[]
  total: number
}

export interface SectionDetail {
  id: string
  course_id: string
  title: string
  description?: string
  order: number
  material_url: string | null
  material_file_name: string | null
  material_text: string | null
  assignments: SectionAssignment[]
}

export interface SectionAssignment {
  id: string
  title: string
  due_at: string
  status: 'open' | 'closed'
  submitted: boolean
  score: number | null
}

// ── 智能问答 ──────────────────────────────────────────────────

export interface ChatRequest {
  question: string
  session_id?: string
  section_id?: string
}

export interface Reference {
  section_id: string
  section_title: string
  file_name: string
  excerpt: string
}

export interface ChatData {
  session_id: string
  answer: string
  rag_used: boolean
  references: Reference[]
  suggestions: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  rag_used?: boolean
  references?: Reference[]
  created_at: string
}

export interface SessionMessagesData {
  session_id: string
  course_id: string
  messages: ChatMessage[]
}

export interface ChatSessionItem {
  id: string
  section_id?: string
  section_title?: string
  last_question: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface ChatSessionListData {
  course_id: string
  items: ChatSessionItem[]
  total: number
}

// ── SSE 流式事件类型 ──────────────────────────────────────────

export type SSEEventType = 'meta' | 'delta' | 'done' | 'error'

export interface SSEMetaEvent {
  type: 'meta'
  session_id: string
  rag_used: boolean
  references: Reference[]
}

export interface SSEDeltaEvent {
  type: 'delta'
  content: string
}

export interface SSEDoneEvent {
  type: 'done'
}

export interface SSEErrorEvent {
  type: 'error'
  message: string
}

export type SSEEvent = SSEMetaEvent | SSEDeltaEvent | SSEDoneEvent | SSEErrorEvent

// ── 学生端作业 ────────────────────────────────────────────────

export type AssignmentStatus = 'open' | 'closed'
export type SubmitType = 'text' | 'file'

export interface StudentAssignmentItem {
  id: string
  title: string
  section_id?: string
  section_title?: string
  due_at: string
  full_score: number
  status: AssignmentStatus
  submitted: boolean
  score: number | null
}

export interface StudentAssignmentListData {
  course_id: string
  items: StudentAssignmentItem[]
  total: number
}

export interface StudentAssignmentDetail {
  id: string
  course_id: string
  section_id?: string
  section_title?: string
  title: string
  description: string
  due_at: string
  full_score: number
  status: AssignmentStatus
  attachment_url: string | null
  submitted: boolean
  score: number | null
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
  status: string
  score: number | null
  ai_score: number | null
  comments: string | null
  deductions: Deduction[]
  suggestions: string[]
  teacher_comment: string | null
  graded_at: string | null
}

// ── 知识点总结 ────────────────────────────────────────────────

export interface SummaryCreateRequest {
  title: string
  section_id?: string
  source_text?: string
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
  section_id?: string
  section_title?: string
  title: string
  rag_used: boolean
  created_at: string
}

export interface SummaryListData {
  course_id: string
  items: SummaryListItem[]
  total: number
}

export interface SummaryDetail {
  id: string
  course_id: string
  section_id?: string
  section_title?: string
  title: string
  rag_used: boolean
  references: Reference[]
  summary: SummaryResult
  created_at: string
}

// ── 学习计划 ──────────────────────────────────────────────────

export interface LearningPlanCreateRequest {
  goal?: string
  available_time_per_day?: number
}

export interface PlanAnalysis {
  current_level: string
  weak_points: string[]
  career_relevance?: string
  priority: string
}

export interface PlanDay {
  day: number
  task: string
  duration_minutes: number
  section_id?: string
  section_title?: string
}

export interface LearningPlanData {
  id: string
  course_id: string
  course_name: string
  career_direction?: string
  version: number
  parent_plan_id: string | null
  data_sources: string[]
  analysis: PlanAnalysis
  rag_references?: Reference[]
  plan: PlanDay[]
  created_at: string
}

export interface LearningPlanListItem {
  id: string
  course_id: string
  course_name: string
  version: number
  status: 'active' | 'completed' | 'archived'
  created_at: string
}

export interface LearningPlanListData {
  course_id: string
  items: LearningPlanListItem[]
  total: number
}

export interface PlanProgress {
  plan_id: string
  version: number
  total_days: number
  completed_days: number
  completion_rate: number
  tasks: PlanTaskProgress[]
}

export interface PlanTaskProgress {
  day: number
  task: string
  duration_minutes: number
  section_id?: string
  section_title?: string
  completed: boolean
  feedback: string | null
  completed_at: string | null
}

export interface PlanEffect {
  plan_id: string
  plan_created_at: string
  assignment_effect: {
    before: { count: number; avg_rate: number; records: { title: string; score: number; full_score: number; rate: number }[] }
    after: { count: number; avg_rate: number; records: { title: string; score: number; full_score: number; rate: number }[] }
    improvement: number
  }
  note: string
}

// ── AI 批改（教师端）──────────────────────────────────────────

export interface Deduction {
  point: string
  minus: number
}

export interface GradeRequest {
  submission_ids: string[]
  need_teacher_confirm?: boolean
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

// ── 教师端作业 ────────────────────────────────────────────────

export interface TeacherAssignmentItem {
  id: string
  title: string
  course_name?: string
  section_id?: string
  section_title?: string
  due_at: string
  full_score: number
  status: AssignmentStatus
  submission_count: number
  total_students: number
}

export interface TeacherAssignmentListData {
  course_id: string
  items: TeacherAssignmentItem[]
  total: number
}

export interface TeacherAssignmentDetail {
  id: string
  course_id: string
  course_name?: string
  section_id?: string
  title: string
  description: string
  reference_answer: string | null
  rubric: string | null
  due_at: string
  full_score: number
  status: AssignmentStatus
  attachment_url: string | null
  submission_count: number
  total_students: number
  created_at: string
  updated_at: string
}

export interface TeacherSubmissionItem {
  id: string
  student_id: string
  student_name: string
  submit_type: SubmitType
  submitted_at: string
  status: string
  score: number | null
  confirmed: boolean
}

export interface TeacherSubmissionListData {
  assignment_id: string
  items: TeacherSubmissionItem[]
  total: number
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
