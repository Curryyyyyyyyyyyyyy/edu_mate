/**
 * Mock 数据层 —— 后端不可用时前端使用。
 * 所有返回结构与 API 文档完全一致。
 */
import type {
  ApiResponse,
  ChatData,
  ChatMessage,
  GradingReportData,
  LearningPlanData,
  LearningPlanListData,
  LoginData,
  MySubmissionData,
  RegisterData,
  SessionMessagesData,
  StudentAssignmentDetail,
  StudentAssignmentListData,
  SummaryDetail,
  SummaryListData,
  SubmissionData,
  TeacherAssignmentDetail,
  TeacherAssignmentListData,
  TeacherSubmissionListData,
  GradeResultData,
  AnalyzeReportData,
  SuspiciousPair,
  ComparisonDetail,
  UserInfo,
} from '../types/api'

// ═══════════════════════════════════════════════════════════════
// 工具
// ═══════════════════════════════════════════════════════════════

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let counter = 100

function uid(prefix: string): string {
  return `${prefix}_${++counter}_${Date.now()}`
}

// ═══════════════════════════════════════════════════════════════
// 预置用户
// ═══════════════════════════════════════════════════════════════

export const MOCK_STUDENT: UserInfo = {
  id: 'user_student_01',
  username: '20240101',
  name: '张三',
  role: 'student',
  extra: { class_name: '计算机 2401 班' },
}

export const MOCK_TEACHER: UserInfo = {
  id: 'user_teacher_01',
  username: 'T20240001',
  name: '李老师',
  role: 'teacher',
  extra: { courses: ['高等数学', '线性代数'] },
}

// ═══════════════════════════════════════════════════════════════
// 内存存储
// ═══════════════════════════════════════════════════════════════

const store = {
  token: 'mock_jwt_token_xxx',
  currentUser: null as UserInfo | null,
  sessions: new Map<string, ChatMessage[]>(),
  assignments: [
    {
      id: 'assignment_001',
      teacher_id: MOCK_TEACHER.id,
      title: '操作系统进程管理作业',
      course: '操作系统',
      description:
        '请结合课堂内容，分析进程与线程的区别及调度机制，不少于 800 字。',
      reference_answer:
        '进程是资源分配的基本单位，拥有独立的地址空间；线程是CPU调度的基本单位，共享进程资源。调度算法包括FCFS、SJF、优先级调度、时间片轮转等。',
      rubric:
        '满分 100 分，概念解释 30 分，过程分析 40 分，结论 30 分。',
      attachment_url: null as string | null,
      due_at: '2026-06-20T23:59:00+08:00',
      status: 'open' as const,
      created_at: '2026-06-01T10:00:00+08:00',
      updated_at: '2026-06-01T10:00:00+08:00',
    },
    {
      id: 'assignment_002',
      teacher_id: MOCK_TEACHER.id,
      title: '高等数学第三章作业',
      course: '高等数学',
      description:
        '完成第三章课后习题 1-10 题，要求写出详细解题步骤。',
      reference_answer: '1. 解：... 2. 解：...',
      rubric: '满分 100 分，每题 10 分，步骤完整得满分。',
      attachment_url: null as string | null,
      due_at: '2026-06-15T23:59:00+08:00',
      status: 'open' as const,
      created_at: '2026-06-01T10:00:00+08:00',
      updated_at: '2026-06-01T10:00:00+08:00',
    },
    {
      id: 'assignment_003',
      teacher_id: MOCK_TEACHER.id,
      title: '线性代数矩阵运算作业',
      course: '线性代数',
      description: '完成矩阵运算相关习题，包含逆矩阵和特征值计算。',
      reference_answer: '',
      rubric: '满分 100 分。',
      attachment_url: null as string | null,
      due_at: '2026-06-08T23:59:00+08:00',
      status: 'closed' as const,
      created_at: '2026-05-20T10:00:00+08:00',
      updated_at: '2026-06-08T23:59:00+08:00',
    },
  ],
  submissions: [
    {
      id: 'submission_001',
      assignment_id: 'assignment_001',
      student_id: MOCK_STUDENT.id,
      student_name: MOCK_STUDENT.name,
      submit_type: 'text' as const,
      content: '进程是程序执行的实体...',
      file_path: null as string | null,
      submitted_at: '2026-06-08T14:30:00+08:00',
      status: 'submitted' as const,
    },
  ],
  summaries: [
    {
      id: 'summary_001',
      user_id: MOCK_STUDENT.id,
      title: '操作系统进程管理',
      course: '操作系统',
      source_text:
        '进程是程序的一次执行过程，包含程序段、数据段和进程控制块。进程具有动态性、并发性、独立性和异步性等特征...',
      summary: {
        overview:
          '本部分主要介绍进程的定义、状态转换和调度机制。',
        key_points: [
          '进程是资源分配的基本单位',
          '进程状态通常包括就绪、运行和阻塞',
          '调度算法影响系统响应时间和吞吐量',
        ],
        difficult_points: [
          '进程与线程的区别',
          '阻塞和就绪状态的转换条件',
        ],
        review_tips: [
          '结合状态转换图记忆进程生命周期',
          '对比 FCFS、SJF、时间片轮转等调度算法',
        ],
      },
      created_at: '2026-06-01T20:00:00+08:00',
    },
  ],
  learningPlans: [
    {
      id: 'plan_001',
      student_id: MOCK_STUDENT.id,
      course: '高等数学',
      status: 'active' as const,
      analysis: {
        current_level: '基础概念掌握一般，应用题偏弱',
        weak_points: ['复合函数求导', '极值应用题'],
        priority: '先补齐求导规则，再训练应用题建模',
      },
      plan: [
        {
          day: 1,
          task: '复习复合函数求导规则并完成 10 道基础题',
          duration_minutes: 60,
        },
        {
          day: 2,
          task: '整理极值应用题常见模型并完成 5 道例题',
          duration_minutes: 60,
        },
        {
          day: 3,
          task: '练习综合应用题 8 道，总结解题思路',
          duration_minutes: 60,
        },
      ],
      created_at: '2026-06-01T20:00:00+08:00',
    },
  ],
  grades: new Map<string, {
    submission_id: string
    student_id: string
    student_name: string
    ai_score: number
    comments: string
    deductions: { point: string; minus: number }[]
    suggestions: string[]
    confirmed: boolean
    final_score?: number
    teacher_comment?: string
  }>(),
}

// ═══════════════════════════════════════════════════════════════
// Mock API 处理函数
// ═══════════════════════════════════════════════════════════════

export const mockApi = {
  // ── 认证 ──────────────────────────────────────────────────

  async login(
    username: string,
    password: string,
  ): Promise<ApiResponse<LoginData>> {
    await delay()
    if (username === MOCK_STUDENT.username && password === '123456') {
      store.currentUser = MOCK_STUDENT
      return {
        success: true,
        data: {
          token: store.token,
          expires_in: 86400,
          user: MOCK_STUDENT,
        },
        message: 'ok',
      }
    }
    if (username === MOCK_TEACHER.username && password === '123456') {
      store.currentUser = MOCK_TEACHER
      return {
        success: true,
        data: {
          token: store.token,
          expires_in: 86400,
          user: MOCK_TEACHER,
        },
        message: 'ok',
      }
    }
    throw { response: { status: 401, data: { detail: '用户名或密码错误' } } }
  },

  async registerStudent(
    payload: {
      username: string
      name: string
      class_name: string
      password: string
    },
  ): Promise<ApiResponse<RegisterData>> {
    await delay()
    const user: RegisterData = {
      id: uid('user'),
      username: payload.username,
      name: payload.name,
      role: 'student',
    }
    return { success: true, data: user, message: 'registered' }
  },

  async registerTeacher(payload: {
    username: string
    name: string
    courses: string[]
    password: string
  }): Promise<ApiResponse<RegisterData>> {
    await delay()
    const user: RegisterData = {
      id: uid('user'),
      username: payload.username,
      name: payload.name,
      role: 'teacher',
    }
    return { success: true, data: user, message: 'registered' }
  },

  async getMe(): Promise<ApiResponse<UserInfo>> {
    await delay()
    const user = store.currentUser
      || JSON.parse(localStorage.getItem('mockUser') || 'null')
      || MOCK_STUDENT
    return { success: true, data: user, message: 'ok' }
  },

  // ── 智能问答 ─────────────────────────────────────────────

  async sendMessage(params: {
    question: string
    course?: string
    session_id?: string
  }): Promise<ApiResponse<ChatData>> {
    await delay(800)
    const sessionId = params.session_id || uid('session')
    const answer = generateMockAnswer(params.question, params.course)
    const suggestions = [
      `可以结合${params.course || '课本'}进一步理解该知识点`,
      '建议做一些相关练习题加深印象',
      '如果有疑问可以继续追问',
    ]

    // 存储消息
    if (!store.sessions.has(sessionId)) {
      store.sessions.set(sessionId, [])
    }
    const msgs = store.sessions.get(sessionId)!
    msgs.push({
      id: uid('msg'),
      role: 'user',
      content: params.question,
      created_at: new Date().toISOString(),
    })
    msgs.push({
      id: uid('msg'),
      role: 'assistant',
      content: answer,
      created_at: new Date().toISOString(),
    })

    return {
      success: true,
      data: { session_id: sessionId, answer, suggestions },
      message: 'ok',
    }
  },

  async getSessionMessages(
    sessionId: string,
  ): Promise<ApiResponse<SessionMessagesData>> {
    await delay()
    const messages = store.sessions.get(sessionId) || []
    return {
      success: true,
      data: { session_id: sessionId, messages },
      message: 'ok',
    }
  },

  // ── 学生端作业 ───────────────────────────────────────────

  async getStudentAssignments(params?: {
    course?: string
    status?: string
  }): Promise<ApiResponse<StudentAssignmentListData>> {
    await delay()
    let items = store.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      course: a.course,
      due_at: a.due_at,
      status: a.status,
      submitted: store.submissions.some(
        (s) =>
          s.assignment_id === a.id && s.student_id === MOCK_STUDENT.id,
      ),
    }))
    if (params?.course) items = items.filter((i) => i.course === params.course)
    if (params?.status) items = items.filter((i) => i.status === params.status)
    return {
      success: true,
      data: { items, total: items.length },
      message: 'ok',
    }
  },

  async getStudentAssignmentDetail(
    id: string,
  ): Promise<ApiResponse<StudentAssignmentDetail>> {
    await delay()
    const a = store.assignments.find((x) => x.id === id)
    if (!a) throw { response: { status: 404 } }
    return {
      success: true,
      data: {
        id: a.id,
        title: a.title,
        course: a.course,
        description: a.description,
        due_at: a.due_at,
        status: a.status,
        attachment_url: a.attachment_url,
        submitted: store.submissions.some(
          (s) => s.assignment_id === a.id && s.student_id === MOCK_STUDENT.id,
        ),
      },
      message: 'ok',
    }
  },

  async submitAssignment(
    assignmentId: string,
    submitType: 'text',
    content: string,
  ): Promise<ApiResponse<SubmissionData>> {
    await delay()
    const sub: typeof store.submissions[number] = {
      id: uid('submission'),
      assignment_id: assignmentId,
      student_id: MOCK_STUDENT.id,
      student_name: MOCK_STUDENT.name,
      submit_type: submitType,
      content,
      file_path: null,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    }
    store.submissions.push(sub)
    return {
      success: true,
      data: {
        id: sub.id,
        assignment_id: sub.assignment_id,
        student_id: sub.student_id,
        submit_type: sub.submit_type,
        submitted_at: sub.submitted_at,
        status: sub.status,
      },
      message: 'submitted',
    }
  },

  async getMySubmission(
    assignmentId: string,
  ): Promise<ApiResponse<MySubmissionData | null>> {
    await delay()
    const sub = store.submissions.find(
      (s) =>
        s.assignment_id === assignmentId && s.student_id === MOCK_STUDENT.id,
    )
    if (!sub) {
      return { success: true, data: null as unknown as MySubmissionData, message: 'ok' }
    }
    return {
      success: true,
      data: {
        id: sub.id,
        assignment_id: sub.assignment_id,
        submit_type: sub.submit_type,
        file_url: null,
        submitted_at: sub.submitted_at,
        status: sub.status,
      },
      message: 'ok',
    }
  },

  // ── 知识点总结 ───────────────────────────────────────────

  async createSummary(params: {
    title: string
    course?: string
    source_text: string
    summary_type?: string
  }): Promise<ApiResponse<SummaryDetail>> {
    await delay(800)
    const s = {
      id: uid('summary'),
      user_id: MOCK_STUDENT.id,
      title: params.title,
      course: params.course || '',
      source_text: params.source_text,
      summary: {
        overview: `这是关于"${params.title}"的知识点总结。主要内容涵盖了核心概念和关键原理。`,
        key_points: [
          '核心概念定义与特征',
          '关键原理与应用场景',
          '与其他知识点的关联',
        ],
        difficult_points: [
          '抽象概念的理解',
          '复杂公式的推导过程',
        ],
        review_tips: [
          '建议制作思维导图梳理知识结构',
          '结合例题加深对概念的理解',
          '定期回顾巩固记忆',
        ],
      },
      created_at: new Date().toISOString(),
    }
    store.summaries.push(s)
    return { success: true, data: s, message: 'created' }
  },

  async getSummaries(params?: {
    course?: string
    keyword?: string
  }): Promise<ApiResponse<SummaryListData>> {
    await delay()
    let items = store.summaries.map((s) => ({
      id: s.id,
      title: s.title,
      course: s.course,
      created_at: s.created_at,
    }))
    if (params?.course)
      items = items.filter((i) => i.course === params.course)
    if (params?.keyword)
      items = items.filter(
        (i) =>
          i.title.includes(params.keyword!) ||
          i.course.includes(params.keyword!),
      )
    return {
      success: true,
      data: { items, total: items.length },
      message: 'ok',
    }
  },

  async getSummary(id: string): Promise<ApiResponse<SummaryDetail>> {
    await delay()
    const s = store.summaries.find((x) => x.id === id)
    if (!s) throw { response: { status: 404 } }
    return { success: true, data: s, message: 'ok' }
  },

  async deleteSummary(
    id: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await delay()
    store.summaries = store.summaries.filter((s) => s.id !== id)
    return { success: true, data: { id }, message: 'deleted' }
  },

  // ── 学习计划 ─────────────────────────────────────────────

  async createLearningPlan(params: {
    course: string
    goal: string
    grade_records?: { exam_name: string; score: number; full_score: number }[]
    homework_records?: {
      title: string
      score: number
      full_score: number
      weak_points: string[]
    }[]
    available_time_per_day?: number
  }): Promise<ApiResponse<LearningPlanData>> {
    await delay(800)
    const mins = params.available_time_per_day || 60
    const plan: LearningPlanData = {
      id: uid('plan'),
      course: params.course,
      analysis: {
        current_level: '根据已有成绩分析，当前水平处于中等偏上，有提升空间',
        weak_points: params.homework_records
          ?.flatMap((r) => r.weak_points) || [],
        priority: '优先巩固薄弱知识点，再进行综合训练',
      },
      plan: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        task: [
          `复习${params.course}第${i + 1}章核心知识点`,
          `完成${params.course}相关练习题 ${Math.floor(mins / 10)} 道`,
          `整理错题笔记并总结解题方法`,
          `进行单元小测检验学习效果`,
          `回顾本周学习内容并查漏补缺`,
          `进行综合性练习，提升应用能力`,
          `进行模拟测试，评估学习成果`,
        ][i],
        duration_minutes: mins,
      })),
      created_at: new Date().toISOString(),
    }
    store.learningPlans.push({ ...plan, student_id: MOCK_STUDENT.id, status: 'active' as const })
    return { success: true, data: plan, message: 'created' }
  },

  async getLearningPlans(params?: {
    course?: string
    status?: string
  }): Promise<ApiResponse<LearningPlanListData>> {
    await delay()
    let items = store.learningPlans.map((p) => ({
      id: p.id,
      course: p.course,
      status: p.status,
      created_at: p.created_at,
    }))
    if (params?.course)
      items = items.filter((i) => i.course === params.course)
    if (params?.status)
      items = items.filter((i) => i.status === params.status)
    return {
      success: true,
      data: { items, total: items.length },
      message: 'ok',
    }
  },

  // ── 教师端作业管理 ───────────────────────────────────────

  async publishAssignment(formData: {
    title: string
    course: string
    description: string
    due_at: string
    reference_answer?: string
    rubric?: string
  }): Promise<ApiResponse<TeacherAssignmentDetail>> {
    await delay()
    const a = {
      id: uid('assignment'),
      teacher_id: MOCK_TEACHER.id,
      title: formData.title,
      course: formData.course,
      description: formData.description,
      reference_answer: formData.reference_answer || '',
      rubric: formData.rubric || '',
      attachment_url: null as string | null,
      due_at: formData.due_at,
      status: 'open' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    store.assignments.push(a)
    return {
      success: true,
      data: {
        id: a.id,
        title: a.title,
        course: a.course,
        description: a.description,
        reference_answer: a.reference_answer || null,
        rubric: a.rubric || null,
        due_at: a.due_at,
        status: a.status,
        attachment_url: a.attachment_url,
        submission_count: 0,
        created_at: a.created_at,
        updated_at: a.updated_at,
      },
      message: 'published',
    }
  },

  async getTeacherAssignments(params?: {
    course?: string
    status?: string
  }): Promise<ApiResponse<TeacherAssignmentListData>> {
    await delay()
    let items = store.assignments.map((a) => ({
      id: a.id,
      title: a.title,
      course: a.course,
      due_at: a.due_at,
      status: a.status,
      submission_count: store.submissions.filter(
        (s) => s.assignment_id === a.id,
      ).length,
      total_students: 40,
    }))
    if (params?.course) items = items.filter((i) => i.course === params.course)
    if (params?.status) items = items.filter((i) => i.status === params.status)
    return {
      success: true,
      data: { items, total: items.length },
      message: 'ok',
    }
  },

  async getTeacherAssignmentDetail(
    id: string,
  ): Promise<ApiResponse<TeacherAssignmentDetail>> {
    await delay()
    const a = store.assignments.find((x) => x.id === id)
    if (!a) throw { response: { status: 404 } }
    return {
      success: true,
      data: {
        id: a.id,
        title: a.title,
        course: a.course,
        description: a.description,
        reference_answer: a.reference_answer || null,
        rubric: a.rubric || null,
        due_at: a.due_at,
        status: a.status,
        attachment_url: a.attachment_url,
        submission_count: store.submissions.filter(
          (s) => s.assignment_id === a.id,
        ).length,
        created_at: a.created_at,
        updated_at: a.updated_at,
      },
      message: 'ok',
    }
  },

  async updateAssignment(
    id: string,
    updates: { description?: string; due_at?: string },
  ): Promise<ApiResponse<{ id: string; description: string; due_at: string; updated_at: string }>> {
    await delay()
    const a = store.assignments.find((x) => x.id === id)
    if (!a) throw { response: { status: 404 } }
    if (updates.description) a.description = updates.description
    if (updates.due_at) a.due_at = updates.due_at
    a.updated_at = new Date().toISOString()
    return {
      success: true,
      data: {
        id: a.id,
        description: a.description,
        due_at: a.due_at,
        updated_at: a.updated_at,
      },
      message: 'updated',
    }
  },

  async closeAssignment(
    id: string,
  ): Promise<ApiResponse<{ id: string; status: string }>> {
    await delay()
    const a = store.assignments.find((x) => x.id === id)
    if (!a) throw { response: { status: 404 } }
    a.status = 'closed'
    return {
      success: true,
      data: { id: a.id, status: a.status },
      message: 'closed',
    }
  },

  async getSubmissions(
    assignmentId: string,
  ): Promise<ApiResponse<TeacherSubmissionListData>> {
    await delay()
    const items = store.submissions
      .filter((s) => s.assignment_id === assignmentId)
      .map((s) => ({
        id: s.id,
        student_id: s.student_id,
        student_name: s.student_name,
        submit_type: s.submit_type,
        submitted_at: s.submitted_at,
        status: s.status,
      }))
    return {
      success: true,
      data: { assignment_id: assignmentId, items, total: items.length },
      message: 'ok',
    }
  },

  // ── AI 批改 ─────────────────────────────────────────────

  async gradeSubmissions(
    assignmentId: string,
    submissionIds: string[],
  ): Promise<ApiResponse<GradeResultData>> {
    await delay(1000)
    const results = submissionIds.map((sid) => {
      const sub = store.submissions.find((s) => s.id === sid)
      const result = {
        submission_id: sid,
        student_id: sub?.student_id || '',
        student_name: sub?.student_name || '未知',
        ai_score: Math.floor(Math.random() * 20) + 75,
        comments: '整体思路正确，部分细节可以进一步完善。',
        deductions: [
          { point: '概念解释不够完整', minus: 5 },
          { point: '缺少具体案例分析', minus: 3 },
        ],
        suggestions: [
          '补充更多具体案例来支撑论点',
          '加强对核心概念的定义性描述',
        ],
        confirmed: false,
      }
      store.grades.set(sid, result)
      return result
    })
    return {
      success: true,
      data: { assignment_id: assignmentId, results },
      message: 'graded',
    }
  },

  async confirmGrade(
    submissionId: string,
    finalScore: number,
    confirmed: boolean,
    teacherComment?: string,
  ): Promise<
    ApiResponse<{
      submission_id: string
      final_score: number
      confirmed: boolean
    }>
  > {
    await delay()
    const g = store.grades.get(submissionId)
    if (g) {
      g.final_score = finalScore
      g.confirmed = confirmed
      g.teacher_comment = teacherComment
    }
    return {
      success: true,
      data: { submission_id: submissionId, final_score: finalScore, confirmed },
      message: 'updated',
    }
  },

  async getGradingReport(
    assignmentId: string,
  ): Promise<ApiResponse<GradingReportData>> {
    await delay()
    const grades = Array.from(store.grades.values())
    const scores = grades.map((g) => g.final_score || g.ai_score)
    const avg =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0
    return {
      success: true,
      data: {
        assignment_id: assignmentId,
        average_score: Math.round(avg * 10) / 10,
        graded_count: grades.length,
        common_mistakes: ['概念解释不完整', '缺少案例分析', '结论过于简略'],
        weak_points: ['核心概念定义', '案例分析能力', '逻辑推导过程'],
        teaching_suggestions: [
          '建议课堂上使用流程图讲解核心概念',
          '安排一次概念对比小测',
          '提供更多案例分析练习',
        ],
      },
      message: 'ok',
    }
  },

  // ── 查重与比对 ──────────────────────────────────────────

  async analyzeSubmissions(
    assignmentId: string,
    submissionIds: string[],
    _threshold?: number,
    dimensions?: string[],
  ): Promise<ApiResponse<AnalyzeReportData>> {
    await delay(1200)
    const dims = dimensions || [
      'structure',
      'concept',
      'expression',
      'conclusion',
    ]

    const submissions = submissionIds.map((sid) => {
      const sub = store.submissions.find((s) => s.id === sid)
      return {
        submission_id: sid,
        student_name: sub?.student_name || '未知',
      }
    })

    const suspiciousPairs: SuspiciousPair[] =
      submissions.length >= 2
        ? [
            {
              submission_a: submissions[0].submission_id,
              student_a: submissions[0].student_name,
              submission_b: submissions[1].submission_id,
              student_b: submissions[1].student_name,
              similarity: 0.87,
              risk_level: 'high',
              similar_segments: [
                '对核心概念的定义表述高度一致',
                '结论段落结构相同',
              ],
              ai_reason:
                '两份作业在观点顺序、关键句表达和例子选择上高度相似，存在参考同一来源的可能。',
            },
          ]
        : []

    const comparisonDetails: ComparisonDetail[] = submissions.map(
      (s) => ({
        submission_id: s.submission_id,
        student_name: s.student_name,
        strengths: [
          '对核心概念有一定理解',
          '结合了具体场景举例',
        ],
        weaknesses: ['缺少深入分析', '部分推导跳跃'],
        dimension_scores: Object.fromEntries(
          dims.map((d) => [d, ['完整', '准确', '流畅', '一般'][Math.floor(Math.random() * 4)]]),
        ),
      }),
    )

    return {
      success: true,
      data: {
        report_id: uid('report'),
        assignment_id: assignmentId,
        suspicious_pairs: suspiciousPairs,
        comparison_details: comparisonDetails,
        common_issues: ['都没有结合具体场景举例', '结论部分较为简略'],
        teaching_suggestions: [
          '课堂上补充相关案例',
          '强调概念解释和例子结合',
        ],
        created_at: new Date().toISOString(),
      },
      message: 'analyzed',
    }
  },

  async getAnalyzeReport(
    assignmentId: string,
  ): Promise<ApiResponse<AnalyzeReportData>> {
    await delay()
    return this.analyzeSubmissions(assignmentId, [])
  },
}

// ═══════════════════════════════════════════════════════════════
// 智能回答生成（模拟 AI）
// ═══════════════════════════════════════════════════════════════

function generateMockAnswer(question: string, course?: string): string {
  const coursePrefix = course ? `在${course}课程中，` : ''
  const templates = [
    `${coursePrefix}这是一个很好的问题。${question.replace('？', '').replace('?', '')}主要涉及以下几个方面的知识点：\n\n首先，从基本概念来看，需要理解相关的定义和核心原理。\n\n其次，从应用层面来看，这些知识在实践中有广泛的应用场景。\n\n最后，建议你结合课本内容和练习题来加深理解。如有疑问，欢迎继续提问。`,
    `${coursePrefix}关于这个问题，我来为你详细解答：\n\n该知识点是${course || '该课程'}的重要组成部分，理解它对于后续学习非常关键。核心要点包括：\n1. 基本概念和定义\n2. 关键特征和属性\n3. 与其他知识点的关联\n\n希望这个解答对你有帮助！`,
    `${coursePrefix}很好的问题！让我从以下几个角度来分析：\n\n从理论角度，这涉及到一些基本的原理和定义。\n\n从实践角度，这些理论在实际中有多种应用方式。\n\n从学习角度，建议你通过画图、列表对比等方式来加深理解。`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}
