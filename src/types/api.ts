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
export type SubmitType = 'text' | 'file' | 'mixed'

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
  content?: string
  file_urls?: string[]
  submitted_at: string
  status: 'submitted'
}

export interface MySubmissionData {
  id: string
  assignment_id: string
  submit_type: SubmitType
  file_url: string | null
  file_urls?: string[]
  content?: string
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

export interface PageParams {
  page?: number
  page_size?: number
}

export interface UpdateProfileRequest {
  bio?: string
  interests?: string[]
  career_direction?: string
  class_name?: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface AnnouncementCreateRequest {
  title: string
  content: string
  is_pinned?: boolean
}

export type AnnouncementUpdateRequest = Partial<AnnouncementCreateRequest>

export interface AnnouncementDetail {
  id: string
  course_id: string
  title: string
  content: string
  is_pinned: boolean
  is_read?: boolean
  created_at: string
  updated_at?: string
}

export interface TeacherAnnouncementItem {
  id: string
  title: string
  is_pinned: boolean
  read_count: number
  total_students: number
  created_at: string
}

export interface StudentAnnouncementItem {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_read: boolean
  created_at: string
}

export interface TeacherAnnouncementListData {
  course_id: string
  items: TeacherAnnouncementItem[]
  total: number
}

export interface StudentAnnouncementListData {
  course_id: string
  unread_count: number
  items: StudentAnnouncementItem[]
  total: number
}

export interface DiscussionAuthor {
  id: string
  name: string
  role: Role
}

export type DiscussionStatus = 'open' | 'closed'

export interface DiscussionCreateRequest {
  title: string
  content: string
  section_id?: string
}

export interface DiscussionItem {
  id: string
  course_id?: string
  section_id?: string
  section_title?: string
  title: string
  content?: string
  status: DiscussionStatus
  reply_count: number
  created_by: DiscussionAuthor
  last_reply_at?: string
  created_at: string
}

export interface DiscussionListData {
  course_id: string
  items: DiscussionItem[]
  total: number
}

export interface DiscussionReply {
  id: string
  discussion_id?: string
  content: string
  author: DiscussionAuthor
  is_teacher: boolean
  created_at: string
}

export interface DiscussionDetail extends Omit<DiscussionItem, 'content'> {
  course_id: string
  content: string
  replies: {
    items: DiscussionReply[]
    total: number
    page: number
    page_size: number
  }
}

export type QuestionVisibility = 'public' | 'private'
export type QuestionStatus = 'unanswered' | 'answered'

export interface QuestionCreateRequest {
  title: string
  content?: string
  visibility: QuestionVisibility
  section_id?: string
}

export interface QuestionUser {
  id: string
  name: string
}

export interface QuestionAnswer {
  content: string
  answered_by: QuestionUser
  answered_at: string
}

export interface QuestionItem {
  id: string
  course_id?: string
  section_id?: string
  section_title?: string
  title: string
  content?: string
  visibility: QuestionVisibility
  status: QuestionStatus
  asked_by: QuestionUser
  answer?: QuestionAnswer
  created_at: string
  answered_at?: string
}

export interface QuestionListData {
  course_id: string
  items: QuestionItem[]
  total: number
}

export interface QuestionAnswerData {
  question_id: string
  answer: QuestionAnswer
}

export type QuizQuestionType = 'single_choice' | 'multi_choice' | 'true_false' | 'short_answer'
export type QuizStatus = 'open' | 'closed'
export type QuizAttemptStatus = 'in_progress' | 'submitted'

export interface QuizOption {
  key: string
  text: string
}

export interface QuizQuestionCreate {
  question_type: QuizQuestionType
  content: string
  options?: QuizOption[]
  correct_answer: string
  explanation?: string
  score?: number
  order?: number
}

export interface QuizCreateRequest {
  title: string
  description?: string
  section_id?: string
  time_limit_minutes?: number
  questions: QuizQuestionCreate[]
}

export interface TeacherQuizItem {
  id: string
  title: string
  section_id?: string
  status: QuizStatus
  question_count: number
  time_limit_minutes: number | null
  attempt_count: number
  created_at: string
}

export interface TeacherQuizListData {
  course_id: string
  items: TeacherQuizItem[]
  total: number
}

export interface QuizAttemptSummary {
  attempt_id: string
  student_id: string
  student_name: string
  total_score: number
  full_score: number
  submitted_at: string
}

export interface TeacherQuizAttemptsData {
  quiz_id: string
  attempt_count: number
  average_score: number
  items: QuizAttemptSummary[]
}

export interface StudentQuizItem {
  id: string
  title: string
  section_id?: string
  question_count: number
  time_limit_minutes: number | null
  attempt_status: QuizAttemptStatus | null
  score: number | null
}

export interface StudentQuizListData {
  course_id: string
  items: StudentQuizItem[]
  total: number
}

export interface StudentQuizQuestion {
  id: string
  question_type: QuizQuestionType
  content: string
  options?: QuizOption[]
  score: number
  order: number
}

export interface StudentQuizDetail {
  id: string
  course_id: string
  title: string
  description?: string
  section_id?: string
  time_limit_minutes: number | null
  questions: StudentQuizQuestion[]
  attempt?: {
    id: string
    status: string
    total_score: number | null
    started_at: string
  } | null
}

export interface QuizStartData {
  attempt_id: string
  started_at: string
}

export interface QuizSubmitRequest {
  answers: {
    question_id: string
    answer: string
  }[]
}

export interface QuizAnswerResult {
  question_id: string
  is_correct: boolean
  score: number
  ai_feedback: string | null
  correct_answer: string
  explanation: string | null
}

export interface QuizResultData {
  attempt_id: string
  total_score: number
  full_score: number
  results: QuizAnswerResult[]
}

export interface ScoreRecord {
  assignment_id: string
  assignment_title: string
  section_title?: string
  full_score: number
  score: number
  ai_score: number | null
  deductions?: Deduction[]
  suggestions?: string[]
  teacher_comment: string | null
  graded_at: string
}

export interface StudentCourseScoresData {
  course_id: string
  course_name: string
  total_score: number
  rank: number
  total_students: number
  records: ScoreRecord[]
}

export interface StudentScoresItem {
  course_id: string
  course_name: string
  total_score: number
  rank: number
  total_students: number
  graded_assignments: number
  total_assignments: number
}

export interface StudentScoresData {
  items: StudentScoresItem[]
}

export interface TeacherScoresData {
  course_id: string
  course_name: string
  statistics: {
    average_score: number
    max_score: number
    min_score: number
    pass_rate: number
    excellent_rate: number
  }
  score_distribution: {
    '90_100': number
    '80_89': number
    '70_79': number
    '60_69': number
    below_60: number
  }
  items: {
    student_id: string
    student_name: string
    class_name: string
    total_score: number
    graded_assignments: number
    rank: number
  }[]
  total: number
}

export interface TeacherStudentScoresData {
  student_id: string
  student_name: string
  course_id: string
  total_score: number
  rank: number
  records: ScoreRecord[]
}
