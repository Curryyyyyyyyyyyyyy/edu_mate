/**
 * Mock 数据层 —— 后端不可用时前端使用。
 * 通过 VITE_USE_MOCK=true 启用，在 request.ts 拦截器中接入。
 * 所有返回结构与 API 文档完全一致。
 */
import type {
  ApiResponse,
  LoginData,
  RegisterData,
  UserInfo,
  StudentCourseItem,
  StudentCourseDetail,
  JoinCourseData,
  SectionItem,
  ChatData,
  ChatSessionItem,
  SessionMessagesData,
  ChatMessage,
  StudentAssignmentItem,
  StudentAssignmentDetail,
  SubmissionData,
  MySubmissionData,
  SummaryListItem,
  SummaryDetail,
  LearningPlanData,
  LearningPlanListItem,
  PlanProgress,
  StudentAnnouncementItem,
  StudentAnnouncementListData,
  AnnouncementDetail,
  DiscussionItem,
  DiscussionDetail,
  DiscussionReply,
  DiscussionListData,
  DiscussionAuthor,
  QuestionItem,
  QuestionListData,
  QuestionAnswer,
  StudentQuizItem,
  StudentQuizListData,
  StudentQuizDetail,
  StudentQuizQuestion,
  QuizStartData,
  QuizResultData,
  QuizAnswerResult,
  ScoreRecord,
  StudentCourseScoresData,
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

const STUDENT: UserInfo = {
  id: 'user_student_01',
  username: '20240101',
  name: '张三',
  role: 'student',
  class_name: '计算机 2401 班',
  profile: { interests: ['后端开发', '算法'], career_direction: 'backend', bio: '' },
}

const TEACHER: UserInfo = {
  id: 'user_teacher_01',
  username: 'T20240001',
  name: '李老师',
  role: 'teacher',
}

const MOCK_TOKEN = 'mock_jwt_token_xxx'

// ═══════════════════════════════════════════════════════════════
// 预置课程
// ═══════════════════════════════════════════════════════════════

const COURSES: Record<string, StudentCourseDetail> = {
  course_001: {
    id: 'course_001',
    name: '操作系统',
    description: '本课程介绍操作系统的核心原理，包括进程管理、内存管理和文件系统。',
    teacher_name: '李老师',
    semester: '2026春季',
    status: 'active',
    section_count: 3,
    completed_sections: 1,
    total_score: 87.5,
    joined_at: '2026-06-01T10:00:00+08:00',
  },
  course_002: {
    id: 'course_002',
    name: '数据结构与算法',
    description: '学习常见数据结构和经典算法，培养计算思维。',
    teacher_name: '王老师',
    semester: '2026春季',
    status: 'active',
    section_count: 5,
    completed_sections: 2,
    total_score: 92,
    joined_at: '2026-06-02T10:00:00+08:00',
  },
  course_003: {
    id: 'course_003',
    name: '计算机网络',
    description: '介绍计算机网络体系结构和核心协议。',
    teacher_name: '李老师',
    semester: '2025秋季',
    status: 'archived',
    section_count: 8,
    completed_sections: 8,
    total_score: 85,
    joined_at: '2025-09-01T10:00:00+08:00',
  },
}

// ═══════════════════════════════════════════════════════════════
// 内存存储
// ═══════════════════════════════════════════════════════════════

const store = {
  currentUser: null as UserInfo | null,
  token: MOCK_TOKEN,

  sections: {
    course_001: [
      { id: 'section_001', title: '第一章：进程管理', description: '介绍进程的概念、状态转换和调度算法。', order: 1, material_url: '/files/section_001_slides.pdf', material_file_name: 'section_001_slides.pdf', assignment_count: 2, submitted_count: 1, section_score: 88 },
      { id: 'section_002', title: '第二章：内存管理', description: '介绍内存分配、分页、分段和虚拟内存。', order: 2, material_url: null, material_file_name: null, assignment_count: 1, submitted_count: 0, section_score: null },
      { id: 'section_003', title: '第三章：文件系统', description: '介绍文件系统结构、目录和存储管理。', order: 3, material_url: '/files/section_003_notes.docx', material_file_name: 'section_003_notes.docx', assignment_count: 1, submitted_count: 0, section_score: null },
    ],
    course_002: [
      { id: 'section_004', title: '第一章：线性表', description: '顺序表、链表及其操作。', order: 1, material_url: '/files/section_004_textbook.pdf', material_file_name: 'section_004_textbook.pdf', assignment_count: 2, submitted_count: 2, section_score: 95 },
      { id: 'section_005', title: '第二章：树与二叉树', description: '树的定义、遍历和应用。', order: 2, material_url: null, material_file_name: null, assignment_count: 1, submitted_count: 0, section_score: null },
    ],
  } as Record<string, (SectionItem & { material_file_name?: string | null })[]>,

  sectionDetails: {
    section_001: { id: 'section_001', course_id: 'course_001', title: '第一章：进程管理', description: '介绍进程的概念、状态转换和调度算法。', order: 1, material_url: '/files/section_001_slides.pdf', material_file_name: 'section_001_slides.pdf', material_text: '第一章：进程管理\n\n1.1 进程的概念\n\n进程是操作系统中的一个核心概念。进程可以定义为程序的一次执行过程，是系统进行资源分配和调度的基本单位。\n\n进程具有以下特征：\n- 动态性：进程是程序的一次执行过程，有创建、运行、消亡等状态\n- 并发性：多个进程可以同时存在于内存中，并发执行\n- 独立性：进程是能够独立运行的基本单位\n- 异步性：进程按各自独立的、不可预知的速度向前推进\n\n1.2 进程的状态\n\n进程在其生命周期中会经历多种状态：\n\n（1）就绪状态（Ready）：进程已获得除CPU之外的所有必要资源，只要获得CPU就可立即执行。\n\n（2）执行状态（Running）：进程正在CPU上运行。\n\n（3）阻塞状态（Blocked）：进程因等待某个事件而暂停执行。\n\n状态转换：\n- 就绪 → 执行：进程被调度程序选中\n- 执行 → 就绪：时间片用完或被抢占\n- 执行 → 阻塞：进程请求I/O或等待事件\n- 阻塞 → 就绪：等待的事件发生\n\n1.3 进程调度算法\n\n常见的进程调度算法包括：FCFS、SJF、时间片轮转、优先级调度、多级反馈队列。', assignments: [{ id: 'asg_001', title: '进程管理练习', due_at: '2026-06-15T23:59:00+08:00', status: 'open' as const, submitted: true, score: 88 }, { id: 'asg_002', title: '调度算法分析', due_at: '2026-06-20T23:59:00+08:00', status: 'open' as const, submitted: false, score: null }] },
    section_003: { id: 'section_003', course_id: 'course_001', title: '第三章：文件系统', description: '介绍文件系统结构、目录和存储管理。', order: 3, material_url: '/files/section_003_notes.docx', material_file_name: 'section_003_notes.docx', material_text: '第三章：文件系统\n\n3.1 文件的概念\n\n文件是具有符号名的一组相关信息的集合。文件系统将底层存储设备的物理特性隐藏起来，为用户提供统一的数据访问方式。\n\n3.2 文件系统的层次结构\n\n- 用户接口层\n- 文件目录系统\n- 存取控制验证层\n- 逻辑文件系统\n- 物理文件系统\n\n3.3 目录结构\n\n常见的目录结构有：单级目录、两级目录、树形目录、无环图目录。\n\n3.4 文件存储空间管理\n\n常见方法：空闲表法、空闲链表法、位示图法、成组链接法。', assignments: [{ id: 'asg_006', title: '文件系统练习', due_at: '2026-06-25T23:59:00+08:00', status: 'open' as const, submitted: false, score: null }] },
    section_004: { id: 'section_004', course_id: 'course_002', title: '第一章：线性表', description: '顺序表、链表及其操作。', order: 1, material_url: '/files/section_004_textbook.pdf', material_file_name: 'section_004_textbook.pdf', material_text: '第一章：线性表\n\n1.1 线性表的定义\n\n线性表是最基本、最简单、最常用的一种数据结构。一个线性表是n个具有相同特性的数据元素的有限序列。\n\n特点：有且仅有一个头结点和尾结点；除头结点外每个结点有唯一前驱；除尾结点外每个结点有唯一后继。\n\n1.2 顺序表\n\n顺序表用一组地址连续的存储单元依次存储数据元素。\n\n特点：可随机存取O(1)，但插入删除需移动大量元素O(n)。\n\n1.3 链表\n\n链表用一组任意的存储单元存储数据元素，通过指针链接。\n\n特点：插入删除O(1)，但不能随机存取需遍历。常见类型：单链表、双向链表、循环链表。', assignments: [{ id: 'asg_004', title: '链表操作练习', due_at: '2026-06-18T23:59:00+08:00', status: 'open' as const, submitted: true, score: 95 }, { id: 'asg_005', title: '顺序表与链表对比', due_at: '2026-06-22T23:59:00+08:00', status: 'open' as const, submitted: true, score: 95 }] },
  } as Record<string, { id: string; course_id: string; title: string; description: string; order: number; material_url: string | null; material_file_name: string | null; material_text: string; assignments: { id: string; title: string; due_at: string; status: 'open' | 'closed'; submitted: boolean; score: number | null }[] }>,

  assignments: {
    course_001: [
      { id: 'asg_001', course_id: 'course_001', section_id: 'section_001', section_title: '第一章：进程管理', title: '进程管理练习', description: '完成关于进程状态转换的分析题，不少于 500 字。', due_at: '2026-06-15T23:59:00+08:00', full_score: 100, status: 'open' as const, attachment_url: null },
      { id: 'asg_002', course_id: 'course_001', section_id: 'section_001', section_title: '第一章：进程管理', title: '调度算法分析', description: '对比FCFS、SJF和时间片轮转算法，不少于 300 字。', due_at: '2026-06-20T23:59:00+08:00', full_score: 100, status: 'open' as const, attachment_url: null },
      { id: 'asg_003', course_id: 'course_001', section_id: 'section_002', section_title: '第二章：内存管理', title: '内存分页练习', description: '完成分页地址转换练习，5道计算题。', due_at: '2026-06-10T23:59:00+08:00', full_score: 100, status: 'closed' as const, attachment_url: null },
    ],
    course_002: [
      { id: 'asg_004', course_id: 'course_002', section_id: 'section_004', section_title: '第一章：线性表', title: '链表反转练习', description: '实现单链表反转并分析时间复杂度。', due_at: '2026-06-18T23:59:00+08:00', full_score: 100, status: 'open' as const, attachment_url: null },
    ],
  } as Record<string, Array<{
    id: string; course_id: string; section_id: string; section_title: string;
    title: string; description: string; due_at: string; full_score: number;
    status: 'open' | 'closed'; attachment_url: string | null;
  }>>,

  submissions: {} as Record<string, {
    id: string; assignment_id: string; submit_type: 'text' | 'file' | 'mixed'; content: string;
    file_urls?: string[];
    submitted_at: string; score: number | null; ai_score: number | null;
    comments: string | null; deductions: { point: string; minus: number }[];
    suggestions: string[]; teacher_comment: string | null; graded_at: string | null;
  }>,

  chatSessions: {} as Record<string, {
    id: string; course_id: string; section_id?: string; section_title?: string;
    last_question: string; message_count: number;
    created_at: string; updated_at: string;
    messages: ChatMessage[];
  }>,

  summaries: {} as Record<string, SummaryDetail[]>,

  learningPlans: {} as Record<string, LearningPlanData[]>,
  planProgress: {} as Record<string, PlanProgress>,

  // 公告
  announcements: {} as Record<string, AnnouncementDetail[]>,

  // 讨论
  discussions: {} as Record<string, DiscussionDetail[]>,

  // 问答
  questions: {} as Record<string, QuestionItem[]>,

  // 测验（教师端创建的数据）
  quizzes: {} as Record<string, StudentQuizDetail[]>,
  // 测验尝试记录
  quizAttempts: {} as Record<string, { attempt_id: string; quiz_id: string; answers: Record<string, string>; submitted: boolean; result?: QuizResultData }>,

  // 成绩记录
  scoreRecords: {} as Record<string, StudentCourseScoresData>,
}

// 初始化一些测试数据
store.submissions['asg_001'] = {
  id: 'sub_001', assignment_id: 'asg_001', submit_type: 'text',
  content: '进程是程序执行的实体...',
  submitted_at: '2026-06-08T14:30:00+08:00',
  score: 88, ai_score: 86, comments: '整体思路正确，但关键概念解释不够完整。',
  deductions: [{ point: '进程状态转换条件说明不完整', minus: 6 }],
  suggestions: ['补充阻塞态与就绪态的转换条件'],
  teacher_comment: '补充了一些关键点，酌情加分。',
  graded_at: '2026-06-09T10:00:00+08:00',
}

store.summaries['course_001'] = [{
  id: 'summary_001', course_id: 'course_001', section_id: 'section_001',
  section_title: '第一章：进程管理', title: '进程管理课件总结', rag_used: true,
  references: [{ section_id: 'section_001', section_title: '第一章：进程管理', file_name: 'section_001_slides.pdf', excerpt: '进程是操作系统进行资源分配和调度的基本单位...' }],
  summary: {
    overview: '本章主要介绍进程的定义、状态转换和调度机制。',
    key_points: ['进程是资源分配的基本单位', '进程状态包括就绪、运行和阻塞', '调度算法影响系统响应时间和吞吐量'],
    difficult_points: ['进程与线程的区别', '阻塞和就绪状态的转换条件'],
    review_tips: ['结合状态转换图记忆进程生命周期', '对比 FCFS、SJF、时间片轮转等调度算法'],
  },
  created_at: '2026-06-04T20:00:00+08:00',
}]

store.learningPlans['course_001'] = [{
  id: 'plan_001', course_id: 'course_001', course_name: '操作系统',
  career_direction: 'backend', version: 1, parent_plan_id: null,
  data_sources: ['scores', 'quizzes', 'profile', 'chat_sessions', 'questions'],
  analysis: {
    current_level: '基础概念掌握一般，进程调度和内存分页部分偏弱',
    weak_points: ['进程状态转换', '调度算法对比'],
    career_relevance: '进程调度和并发模型是后端开发的重要基础',
    priority: '先补齐进程状态转换，再横向对比调度算法',
  },
  rag_references: [{ section_id: 'section_001', section_title: '第一章：进程管理', file_name: 'section_001_slides.pdf', excerpt: '进程的五种状态及转换条件如下...' }],
  plan: [
    { day: 1, task: '精读课件「进程状态转换图」，重点理解阻塞态与挂起态的区别', duration_minutes: 60, section_id: 'section_001', section_title: '第一章：进程管理' },
    { day: 2, task: '整理 FCFS、SJF、时间片轮转三种算法差异，结合后端开发场景理解', duration_minutes: 60, section_id: 'section_001', section_title: '第一章：进程管理' },
    { day: 3, task: '完成进程调度相关习题5道，整理错题笔记', duration_minutes: 45, section_id: 'section_001', section_title: '第一章：进程管理' },
    { day: 4, task: '复习内存分页与分段，对比二者的地址转换过程', duration_minutes: 60, section_id: 'section_002', section_title: '第二章：内存管理' },
    { day: 5, task: '综合练习：完成一套操作系统模拟测试题', duration_minutes: 60, section_id: undefined, section_title: undefined },
  ],
  created_at: '2026-06-10T20:00:00+08:00',
}]

store.planProgress['plan_001'] = {
  plan_id: 'plan_001', version: 1, total_days: 5, completed_days: 2, completion_rate: 0.40,
  tasks: [
    { day: 1, task: '精读课件「进程状态转换图」', duration_minutes: 60, section_id: 'section_001', section_title: '第一章：进程管理', completed: true, feedback: '已掌握，进程状态转换比较清楚了', completed_at: '2026-06-11T21:00:00+08:00' },
    { day: 2, task: '整理 FCFS、SJF、时间片轮转三种算法差异', duration_minutes: 60, section_id: 'section_001', section_title: '第一章：进程管理', completed: true, feedback: '算法对比还需要再复习', completed_at: '2026-06-12T20:00:00+08:00' },
    { day: 3, task: '完成进程调度相关习题5道', duration_minutes: 45, section_id: 'section_001', section_title: '第一章：进程管理', completed: false, feedback: null, completed_at: null },
    { day: 4, task: '复习内存分页与分段', duration_minutes: 60, section_id: 'section_002', section_title: '第二章：内存管理', completed: false, feedback: null, completed_at: null },
    { day: 5, task: '综合练习：完成一套操作系统模拟测试题', duration_minutes: 60, section_id: undefined, section_title: undefined, completed: false, feedback: null, completed_at: null },
  ],
}

// 公告
store.announcements['course_001'] = [
  { id: 'notice_001', course_id: 'course_001', title: '📌 期中考试通知', content: '各位同学好，\n\n操作系统课程期中考试将于 6 月 25 日（周三）上午 9:00-11:00 在 3 号教学楼 301 教室进行。\n\n考试范围：第 1-3 章（进程管理、内存管理、文件系统）\n考试形式：闭卷笔试\n\n请同学们提前复习，重点掌握：\n1. 进程状态转换\n2. 调度算法（FCFS、SJF、时间片轮转、优先级）\n3. 内存分页与分段\n4. 文件系统层次结构\n\n如有疑问请在学习群或讨论区提出。\n\n祝大家考试顺利！📚', is_pinned: true, created_at: '2026-06-10T09:00:00+08:00', updated_at: '2026-06-10T09:00:00+08:00' },
  { id: 'notice_002', course_id: 'course_001', title: '作业提交截止提醒', content: '提醒各位同学：\n\n📝 进程管理练习 截止日期为 6 月 15 日\n📝 调度算法分析 截止日期为 6 月 20 日\n\n请务必在截止日期前完成提交，逾期将不再接受补交。作业成绩会纳入期末总评。', is_pinned: false, created_at: '2026-06-08T14:00:00+08:00' },
  { id: 'notice_003', course_id: 'course_001', title: '关于实验课安排调整', content: '原定于本周五的实验课因故调整至下周一（6 月 16 日）下午 2:00，地点不变（机房 401）。\n\n实验内容：进程调度算法模拟实现\n\n请提前预习实验指导书第三章内容。', is_pinned: false, created_at: '2026-06-07T16:30:00+08:00' },
]

// 讨论
const studentAuthor: DiscussionAuthor = { id: STUDENT.id, name: STUDENT.name, role: 'student' }
const teacherAuthor: DiscussionAuthor = { id: TEACHER.id, name: TEACHER.name, role: 'teacher' }

store.discussions['course_001'] = [
  {
    id: 'disc_001', course_id: 'course_001', section_id: 'section_001', section_title: '第一章：进程管理',
    title: '进程和线程的区别到底是什么？', content: '我在看课件的时候对进程和线程的区别还是有些模糊。课件里说进程是资源分配的基本单位，线程是CPU调度的基本单位。但在实际编程中怎么体现这个区别呢？有没有同学可以帮忙解释一下？',
    status: 'open', reply_count: 3, created_by: { ...studentAuthor }, last_reply_at: '2026-06-11T10:30:00+08:00', created_at: '2026-06-09T20:00:00+08:00',
    replies: {
      items: [
        { id: 'reply_001', content: '简单来说，进程之间是独立的，每个进程有自己的内存空间；而同一进程内的线程共享内存空间。所以线程间通信更方便，但一个线程崩溃可能影响整个进程。', author: { id: 'user_s2', name: '李四', role: 'student' }, is_teacher: false, created_at: '2026-06-10T15:00:00+08:00' },
        { id: 'reply_002', content: '李四同学说得很好。补充一点：在实际编程中，比如用 Python 的 multiprocessing 模块创建的是进程，它们各自有独立的 Python 解释器；而 threading 模块创建的是线程，共享全局变量。这也是为什么 Python 有 GIL 限制但多进程不受影响。', author: { ...teacherAuthor }, is_teacher: true, created_at: '2026-06-10T18:00:00+08:00' },
        { id: 'reply_003', content: '谢谢老师和同学的解释，现在清楚多了！那请问有没有推荐的练习可以帮助理解？', author: { ...studentAuthor }, is_teacher: false, created_at: '2026-06-11T10:30:00+08:00' },
      ],
      total: 3, page: 1, page_size: 20,
    },
  },
  {
    id: 'disc_002', course_id: 'course_001', section_id: 'section_002', section_title: '第二章：内存管理',
    title: '分页和分段在实际系统中怎么用的？', content: '课件里介绍了分页和分段两种内存管理方式，但我想知道现代操作系统（比如 Linux）实际用的是哪种？还是混合使用？',
    status: 'open', reply_count: 1, created_by: { id: 'user_s2', name: '李四', role: 'student' }, last_reply_at: '2026-06-11T09:00:00+08:00', created_at: '2026-06-10T22:00:00+08:00',
    replies: {
      items: [
        { id: 'reply_004', content: 'Linux 主要使用分页机制，但也支持分段。实际上 x86 架构同时支持分段和分页，但 Linux 尽量弱化了分段的使用，主要通过分页来管理内存。可以查阅《深入理解 Linux 内核》相关章节了解更多。', author: { ...teacherAuthor }, is_teacher: true, created_at: '2026-06-11T09:00:00+08:00' },
      ],
      total: 1, page: 1, page_size: 20,
    },
  },
]

// 问答
store.questions['course_001'] = [
  {
    id: 'q_001', course_id: 'course_001', section_id: 'section_001', section_title: '第一章：进程管理',
    title: '多级反馈队列调度算法中，为什么短作业可能会被饿死？',
    content: '课件里提到多级反馈队列可能会让短作业饿死，但短作业不是优先级更高吗？有点不太理解这个逻辑。',
    visibility: 'public', status: 'answered',
    asked_by: { id: STUDENT.id, name: STUDENT.name },
    answer: {
      content: '多级反馈队列调度中确实存在短作业饿死的问题，但这不是因为短作业优先级低，恰恰相反——是因为长作业可能一直得不到 CPU。\n\n具体来说：新作业进入最高优先级队列，如果用完时间片还没完成，就降到下一级。短作业在第一级或第二级就能完成，而长作业会一直被降级。如果系统持续有新作业进入（短作业），高优先级队列总有任务，长作业在高优先级队列的时间片又很短，还没来得及执行多少就被抢占，然后降到更低优先级——这样一来，长作业可能永远得不到足够的 CPU 时间。\n\n解决方法：可以周期性地提升所有作业到最高优先级（老化机制），确保长作业也有机会执行。',
      answered_by: { id: TEACHER.id, name: TEACHER.name },
      answered_at: '2026-06-11T14:00:00+08:00',
    },
    created_at: '2026-06-11T10:00:00+08:00', answered_at: '2026-06-11T14:00:00+08:00',
  },
  {
    id: 'q_002', course_id: 'course_001', section_id: 'section_002', section_title: '第二章：内存管理',
    title: '虚拟内存的页面置换算法在实际中哪个更好？',
    visibility: 'public', status: 'unanswered',
    asked_by: { id: 'user_s2', name: '李四' },
    created_at: '2026-06-11T16:00:00+08:00',
  },
]

// 测验
store.quizzes['course_001'] = [
  {
    id: 'quiz_001', course_id: 'course_001', title: '进程管理基础测验', description: '测试对进程概念、状态转换和调度算法的理解',
    section_id: 'section_001', time_limit_minutes: 30,
    questions: [
      { id: 'qzq_001', question_type: 'single_choice', content: '在操作系统中，进程是（ ）。', options: [
        { key: 'A', text: '程序的执行过程，是资源分配和调度的基本单位' },
        { key: 'B', text: '一段静态的代码' },
        { key: 'C', text: 'CPU 执行的指令序列' },
        { key: 'D', text: '内存中的一个数据结构' },
      ], score: 10, order: 1 },
      { id: 'qzq_002', question_type: 'single_choice', content: '进程从执行状态变为阻塞状态的原因是（ ）。', options: [
        { key: 'A', text: '时间片用完' },
        { key: 'B', text: '被高优先级进程抢占' },
        { key: 'C', text: '等待 I/O 操作完成' },
        { key: 'D', text: '进程创建完成' },
      ], score: 10, order: 2 },
      { id: 'qzq_003', question_type: 'true_false', content: '在时间片轮转调度算法中，时间片设置得越小，系统响应时间一定越快。', options: [
        { key: 'true', text: '正确' }, { key: 'false', text: '错误' }
      ], score: 10, order: 3 },
      { id: 'qzq_004', question_type: 'multi_choice', content: '以下哪些属于进程调度算法的评价指标？（多选）', options: [
        { key: 'A', text: 'CPU 利用率' },
        { key: 'B', text: '吞吐量' },
        { key: 'C', text: '周转时间' },
        { key: 'D', text: '等待时间' },
        { key: 'E', text: '内存使用率' },
      ], score: 15, order: 4 },
      { id: 'qzq_005', question_type: 'short_answer', content: '请简要说明死锁产生的四个必要条件。', score: 15, order: 5 },
    ] as StudentQuizQuestion[],
  },
  {
    id: 'quiz_002', course_id: 'course_001', title: '内存管理综合测验', description: '考察内存分页、分段和虚拟内存的综合理解',
    section_id: 'section_002', time_limit_minutes: 45,
    questions: [
      { id: 'qzq_006', question_type: 'single_choice', content: '分页存储管理中，页面的大小一般是（ ）。', options: [
        { key: 'A', text: '512 B' },
        { key: 'B', text: '4 KB' },
        { key: 'C', text: '64 KB' },
        { key: 'D', text: '1 MB' },
      ], score: 10, order: 1 },
      { id: 'qzq_007', question_type: 'true_false', content: '虚拟内存的容量受计算机地址位数的限制。', options: [
        { key: 'true', text: '正确' }, { key: 'false', text: '错误' }
      ], score: 10, order: 2 },
      { id: 'qzq_008', question_type: 'short_answer', content: '请简述 LRU（最近最久未使用）页面置换算法的基本思想及其优缺点。', score: 20, order: 3 },
    ] as StudentQuizQuestion[],
  },
]

// 测验尝试记录（预置已完成的 quiz_001 尝试）
store.quizAttempts['quiz_001_user_student_01'] = {
  attempt_id: 'attempt_001',
  quiz_id: 'quiz_001',
  answers: { qzq_001: 'A', qzq_002: 'C', qzq_003: 'false', qzq_004: 'A,B,C,D', qzq_005: '互斥条件、占有且等待、不可剥夺、循环等待' },
  submitted: true,
  result: {
    attempt_id: 'attempt_001',
    total_score: 45,
    full_score: 60,
    results: [
      { question_id: 'qzq_001', is_correct: true, score: 10, ai_feedback: '回答正确！', correct_answer: 'A', explanation: '进程是程序的一次执行过程，是系统进行资源分配和调度的基本单位。' },
      { question_id: 'qzq_002', is_correct: true, score: 10, ai_feedback: '回答正确！', correct_answer: 'C', explanation: '进程因等待 I/O 操作等事件而进入阻塞状态。' },
      { question_id: 'qzq_003', is_correct: true, score: 10, ai_feedback: '回答正确！', correct_answer: 'false', explanation: '时间片过小会导致上下文切换开销过大，反而降低系统效率。' },
      { question_id: 'qzq_004', is_correct: false, score: 5, ai_feedback: '部分正确，内存使用率不属于调度算法评价指标。', correct_answer: 'A,B,C,D', explanation: 'CPU利用率、吞吐量、周转时间、等待时间是调度算法的四个主要评价指标。' },
      { question_id: 'qzq_005', is_correct: true, score: 10, ai_feedback: '回答正确，四个必要条件表述完整。', correct_answer: '互斥条件、占有且等待、不可剥夺、循环等待', explanation: '死锁的四个必要条件缺一不可，破坏其中任一条件即可预防死锁。' },
    ],
  },
}

// 成绩记录
store.scoreRecords['course_001'] = {
  course_id: 'course_001', course_name: '操作系统', total_score: 87.5, rank: 8, total_students: 35,
  records: [
    { assignment_id: 'asg_001', assignment_title: '进程管理练习', section_title: '第一章：进程管理', full_score: 100, score: 88, ai_score: 86, deductions: [{ point: '进程状态转换条件说明不完整', minus: 6 }], suggestions: ['补充阻塞态与就绪态的转换条件', '加强对进程定义的关键词记忆'], teacher_comment: '整体答得不错，扣分项需要认真复习课本相关内容。', graded_at: '2026-06-09T10:00:00+08:00' },
    { assignment_id: 'asg_005', assignment_title: '链表反转练习', section_title: '第一章：线性表', full_score: 100, score: 95, ai_score: 95, deductions: [], suggestions: ['继续保持！'], teacher_comment: null, graded_at: '2026-06-10T14:00:00+08:00' },
  ] as ScoreRecord[],
}

// ═══════════════════════════════════════════════════════════════
// Mock API 处理函数导出
// ═══════════════════════════════════════════════════════════════

export function mockHandle(method: string, url: string, data?: unknown): Promise<unknown> | null {
  // 解析路径和参数
  const urlObj = new URL(url, 'http://localhost')
  const path = urlObj.pathname

  // ── 认证 ──────────────────────────────────────────────
  if (method === 'POST' && path === '/api/auth/login') {
    return handleLogin(data as { username: string; password: string })
  }
  if (method === 'POST' && path === '/api/auth/register/student') {
    return handleRegister('student', data)
  }
  if (method === 'POST' && path === '/api/auth/register/teacher') {
    return handleRegister('teacher', data)
  }
  if (method === 'GET' && path === '/api/auth/me') {
    return handleGetMe()
  }

  // ── 课程 ──────────────────────────────────────────────
  if (method === 'GET' && path === '/api/student/courses') {
    return handleGetCourses()
  }
  if (method === 'POST' && path === '/api/student/courses/join') {
    return handleJoinCourse(data as { code: string })
  }
  const courseDetailMatch = path.match(/^\/api\/student\/courses\/([^/]+)$/)
  if (method === 'GET' && courseDetailMatch) {
    return handleGetCourseDetail(courseDetailMatch[1])
  }

  // ── 小节 ──────────────────────────────────────────────
  const sectionDetailMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/sections\/([^/]+)$/)
  if (method === 'GET' && sectionDetailMatch) {
    return handleGetSectionDetail(sectionDetailMatch[1], sectionDetailMatch[2])
  }
  const sectionsMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/sections$/)
  if (method === 'GET' && sectionsMatch) {
    return handleGetSections(sectionsMatch[1])
  }

  // ── 聊天 ──────────────────────────────────────────────
  const chatSessionsMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/chat\/sessions\/([^/]+)\/messages$/)
  if (method === 'GET' && chatSessionsMatch) {
    return handleGetSessionMessages(chatSessionsMatch[1], chatSessionsMatch[2])
  }
  const chatSessionsListMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/chat\/sessions$/)
  if (method === 'GET' && chatSessionsListMatch) {
    return handleGetChatSessions(chatSessionsListMatch[1])
  }
  const chatMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/chat$/)
  if (method === 'POST' && chatMatch) {
    return handleSendMessage(chatMatch[1], data as { question: string; session_id?: string })
  }

  // ── 作业 ──────────────────────────────────────────────
  const asgSubmitMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/assignments\/([^/]+)\/submit$/)
  if (method === 'POST' && asgSubmitMatch) {
    return handleSubmitAssignment(asgSubmitMatch[1], asgSubmitMatch[2], data)
  }
  const asgMySubMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/assignments\/([^/]+)\/my-submission$/)
  if (method === 'GET' && asgMySubMatch) {
    return handleGetMySubmission(asgMySubMatch[1], asgMySubMatch[2])
  }
  const asgDetailMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/assignments\/([^/]+)$/)
  if (method === 'GET' && asgDetailMatch) {
    return handleGetAssignmentDetail(asgDetailMatch[1], asgDetailMatch[2])
  }
  const asgListMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/assignments$/)
  if (method === 'GET' && asgListMatch) {
    return handleGetAssignments(asgListMatch[1])
  }

  // ── 总结 ──────────────────────────────────────────────
  const sumDetailMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/summaries\/([^/]+)$/)
  if (method === 'GET' && sumDetailMatch) {
    return handleGetSummary(sumDetailMatch[1], sumDetailMatch[2])
  }
  if (method === 'DELETE' && sumDetailMatch) {
    return handleDeleteSummary(sumDetailMatch[1], sumDetailMatch[2])
  }
  const sumListMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/summaries$/)
  if (method === 'GET' && sumListMatch) {
    return handleGetSummaries(sumListMatch[1])
  }
  if (method === 'POST' && sumListMatch) {
    return handleCreateSummary(sumListMatch[1], data)
  }

  // ── 学习计划 ──────────────────────────────────────────
  const planProgressMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/learning-plans\/([^/]+)\/progress$/)
  if (method === 'GET' && planProgressMatch) {
    return handleGetPlanProgress(planProgressMatch[1], planProgressMatch[2])
  }
  if (method === 'POST' && planProgressMatch) {
    return handleMarkTaskComplete(planProgressMatch[1], planProgressMatch[2], data)
  }
  const planStatusMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/learning-plans\/([^/]+)\/status$/)
  if (method === 'PATCH' && planStatusMatch) {
    return handleUpdatePlanStatus(planStatusMatch[1], planStatusMatch[2], data)
  }
  const planDetailMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/learning-plans\/([^/]+)$/)
  if (method === 'GET' && planDetailMatch) {
    return handleGetLearningPlan(planDetailMatch[1], planDetailMatch[2])
  }
  const planListMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/learning-plans$/)
  if (method === 'GET' && planListMatch) {
    return handleGetLearningPlans(planListMatch[1])
  }
  if (method === 'POST' && planListMatch) {
    return handleCreateLearningPlan(planListMatch[1], data)
  }

  // ── 公告（学生端）────────────────────────────────────
  const noticeDetailMatch = path.match(/^\/api\/courses\/([^/]+)\/announcements\/([^/]+)$/)
  if (method === 'GET' && noticeDetailMatch) {
    return handleGetAnnouncement(noticeDetailMatch[1], noticeDetailMatch[2])
  }
  const noticeListMatch = path.match(/^\/api\/courses\/([^/]+)\/announcements$/)
  if (method === 'GET' && noticeListMatch) {
    return handleGetStudentAnnouncements(noticeListMatch[1])
  }

  // ── 讨论（学生端）────────────────────────────────────
  const discReplyMatch = path.match(/^\/api\/courses\/([^/]+)\/discussions\/([^/]+)\/replies\/([^/]+)$/)
  if (method === 'DELETE' && discReplyMatch) {
    return handleDeleteDiscussionReply(discReplyMatch[1], discReplyMatch[2], discReplyMatch[3])
  }
  const discReplyCreateMatch = path.match(/^\/api\/courses\/([^/]+)\/discussions\/([^/]+)\/replies$/)
  if (method === 'POST' && discReplyCreateMatch) {
    return handleCreateDiscussionReply(discReplyCreateMatch[1], discReplyCreateMatch[2], data)
  }
  const discDetailMatch = path.match(/^\/api\/courses\/([^/]+)\/discussions\/([^/]+)$/)
  if (method === 'GET' && discDetailMatch) {
    return handleGetDiscussion(discDetailMatch[1], discDetailMatch[2])
  }
  const discListMatch = path.match(/^\/api\/courses\/([^/]+)\/discussions$/)
  if (method === 'GET' && discListMatch) {
    return handleGetDiscussions(discListMatch[1])
  }
  if (method === 'POST' && discListMatch) {
    return handleCreateDiscussion(discListMatch[1], data)
  }

  // ── 问答（学生端）────────────────────────────────────
  const qDetailMatch = path.match(/^\/api\/courses\/([^/]+)\/questions\/([^/]+)$/)
  if (method === 'GET' && qDetailMatch) {
    return handleGetQuestion(qDetailMatch[1], qDetailMatch[2])
  }
  const qListMatch = path.match(/^\/api\/courses\/([^/]+)\/questions$/)
  if (method === 'GET' && qListMatch) {
    return handleGetQuestions(qListMatch[1])
  }
  if (method === 'POST' && qListMatch) {
    return handleCreateQuestion(qListMatch[1], data)
  }

  // ── 测验（学生端）────────────────────────────────────
  const quizResultMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/quizzes\/([^/]+)\/attempts\/([^/]+)\/result$/)
  if (method === 'GET' && quizResultMatch) {
    return handleGetQuizResult(quizResultMatch[1], quizResultMatch[2], quizResultMatch[3])
  }
  const quizSubmitMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/quizzes\/([^/]+)\/attempts\/([^/]+)\/submit$/)
  if (method === 'POST' && quizSubmitMatch) {
    return handleSubmitQuiz(quizSubmitMatch[1], quizSubmitMatch[2], quizSubmitMatch[3], data)
  }
  const quizStartMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/quizzes\/([^/]+)\/start$/)
  if (method === 'POST' && quizStartMatch) {
    return handleStartQuiz(quizStartMatch[1], quizStartMatch[2])
  }
  const quizDetailMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/quizzes\/([^/]+)$/)
  if (method === 'GET' && quizDetailMatch) {
    return handleGetStudentQuiz(quizDetailMatch[1], quizDetailMatch[2])
  }
  const quizListMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/quizzes$/)
  if (method === 'GET' && quizListMatch) {
    return handleGetStudentQuizzes(quizListMatch[1])
  }

  // ── 成绩（学生端）────────────────────────────────────
  const scoreMatch = path.match(/^\/api\/student\/courses\/([^/]+)\/scores$/)
  if (method === 'GET' && scoreMatch) {
    return handleGetStudentCourseScores(scoreMatch[1])
  }

  // ── 教师端 ──────────────────────────────────────────────
  // 课程
  if (method === 'GET' && path === '/api/teacher/courses') {
    return handleTeacherGetCourses()
  }
  if (method === 'POST' && path === '/api/teacher/courses') {
    return handleTeacherCreateCourse(data)
  }
  const tCourseDetailMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)$/)
  if (method === 'GET' && tCourseDetailMatch) {
    return handleTeacherGetCourseDetail(tCourseDetailMatch[1])
  }
  // 学生管理
  const tStudentsMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/students$/)
  if (method === 'GET' && tStudentsMatch) {
    return handleTeacherGetStudents(tStudentsMatch[1])
  }
  if (method === 'POST' && tStudentsMatch) {
    return handleTeacherAddStudents(tStudentsMatch[1], data)
  }
  const tRemoveStudentMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/students\/([^/]+)$/)
  if (method === 'DELETE' && tRemoveStudentMatch) {
    return handleTeacherRemoveStudent(tRemoveStudentMatch[1], tRemoveStudentMatch[2])
  }
  // 小节
  const tSectionsListMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/sections$/)
  if (method === 'GET' && tSectionsListMatch) {
    return handleTeacherGetSections(tSectionsListMatch[1])
  }
  if (method === 'POST' && tSectionsListMatch) {
    return handleTeacherCreateSection(tSectionsListMatch[1], data)
  }
  if (method === 'DELETE' && path.match(/^\/api\/teacher\/courses\/([^/]+)\/sections\/([^/]+)$/)) {
    const m = path.match(/^\/api\/teacher\/courses\/([^/]+)\/sections\/([^/]+)$/)!
    return handleTeacherDeleteSection(m[1], m[2])
  }
  // 发布作业（在小节下）
  const tPublishAsgMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/sections\/([^/]+)\/assignments$/)
  if (method === 'POST' && tPublishAsgMatch) {
    return handleTeacherPublishAssignment(tPublishAsgMatch[1], tPublishAsgMatch[2], data)
  }
  // 作业管理
  const tAsgListMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments$/)
  if (method === 'GET' && tAsgListMatch) {
    return handleTeacherGetAssignments(tAsgListMatch[1])
  }
  const tAsgDetailMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)$/)
  if (method === 'GET' && tAsgDetailMatch) {
    return handleTeacherGetAssignmentDetail(tAsgDetailMatch[1], tAsgDetailMatch[2])
  }
  const tAsgCloseMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)\/close$/)
  if (method === 'POST' && tAsgCloseMatch) {
    return handleTeacherCloseAssignment(tAsgCloseMatch[1], tAsgCloseMatch[2])
  }
  // 提交列表
  const tSubListMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)\/submissions$/)
  if (method === 'GET' && tSubListMatch) {
    return handleTeacherGetSubmissions(tSubListMatch[1], tSubListMatch[2])
  }
  // 批改
  const tGradeMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)\/grade$/)
  if (method === 'POST' && tGradeMatch) {
    return handleTeacherGrade(tGradeMatch[1], tGradeMatch[2], data)
  }
  const tConfirmMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)\/submissions\/([^/]+)$/)
  if (method === 'PATCH' && tConfirmMatch) {
    return handleTeacherConfirmGrade(tConfirmMatch[1], tConfirmMatch[2], tConfirmMatch[3], data)
  }
  const tGradingReportMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)\/grading-report$/)
  if (method === 'GET' && tGradingReportMatch) {
    return handleTeacherGradingReport(tGradingReportMatch[1], tGradingReportMatch[2])
  }
  // 查重
  const tAnalyzeMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)\/analyze$/)
  if (method === 'POST' && tAnalyzeMatch) {
    return handleTeacherAnalyze(tAnalyzeMatch[1], tAnalyzeMatch[2], data)
  }
  const tAnalyzeReportMatch = path.match(/^\/api\/teacher\/courses\/([^/]+)\/assignments\/([^/]+)\/analyze-report$/)
  if (method === 'GET' && tAnalyzeReportMatch) {
    return handleTeacherAnalyzeReport(tAnalyzeReportMatch[1], tAnalyzeReportMatch[2])
  }

  return null // 不匹配，走真实网络请求
}

// ═══════════════════════════════════════════════════════════════
// 处理函数
// ═══════════════════════════════════════════════════════════════

async function handleLogin(body: { username: string; password: string }): Promise<ApiResponse<LoginData>> {
  await delay()
  if (body.username === STUDENT.username && body.password === '123456') {
    return { success: true, data: { token: MOCK_TOKEN, expires_in: 86400, user: STUDENT }, message: 'ok' }
  }
  if (body.username === TEACHER.username && body.password === '123456') {
    return { success: true, data: { token: MOCK_TOKEN, expires_in: 86400, user: TEACHER }, message: 'ok' }
  }
  throw { response: { status: 401, data: { detail: '用户名或密码错误' } } }
}

async function handleRegister(role: string, body: unknown): Promise<ApiResponse<RegisterData>> {
  await delay()
  const d = body as Record<string, string>
  return { success: true, data: { id: uid('user'), username: d.username, name: d.name, role: role as 'student' | 'teacher' }, message: 'registered' }
}

async function handleGetMe(): Promise<ApiResponse<UserInfo>> {
  await delay()
  const u = store.currentUser || JSON.parse(localStorage.getItem('user') || 'null') || STUDENT
  return { success: true, data: u, message: 'ok' }
}

async function handleGetCourses(): Promise<ApiResponse<{ items: StudentCourseItem[]; total: number }>> {
  await delay()
  const items: StudentCourseItem[] = Object.values(COURSES).map((c) => ({
    id: c.id, name: c.name, teacher_name: c.teacher_name,
    semester: c.semester, status: c.status,
    section_count: c.section_count, completed_sections: c.completed_sections,
    total_score: c.total_score, joined_at: c.joined_at,
  }))
  return { success: true, data: { items, total: items.length }, message: 'ok' }
}

async function handleJoinCourse(body: { code: string }): Promise<ApiResponse<JoinCourseData>> {
  await delay(400)
  // 模拟：课程码 "ABC123" 加入操作系统课程
  if (body.code === 'ABC123' || body.code === 'OS8X2K') {
    return {
      success: true,
      data: { course_id: 'course_001', course_name: '操作系统', teacher_name: '李老师', semester: '2026春季', joined_at: new Date().toISOString() },
      message: 'joined',
    }
  }
  throw { response: { status: 404, data: { detail: '课程码无效或课程不存在' } } }
}

async function handleGetCourseDetail(courseId: string): Promise<ApiResponse<StudentCourseDetail>> {
  await delay()
  const c = COURSES[courseId]
  if (!c) throw { response: { status: 404 } }
  return { success: true, data: c, message: 'ok' }
}

async function handleGetSections(courseId: string): Promise<ApiResponse<{ course_id: string; items: SectionItem[]; total: number }>> {
  await delay()
  const items = store.sections[courseId] || []
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetSectionDetail(courseId: string, sectionId: string): Promise<ApiResponse<unknown>> {
  await delay()
  const detail = store.sectionDetails[sectionId]
  if (!detail || detail.course_id !== courseId) throw { response: { status: 404 } }
  return { success: true, data: detail, message: 'ok' }
}

async function handleSendMessage(courseId: string, body: { question: string; session_id?: string }): Promise<ApiResponse<ChatData>> {
  await delay(800)
  const sessionId = body.session_id || uid('session')
  const courseName = COURSES[courseId]?.name || '课程'

  const answer = `关于「${body.question.replace('？', '').replace('?', '')}」这个问题，以下是详细解答：\n\n在${courseName}中，这是一个核心知识点。让我从几个方面来分析：\n\n**基本概念**\n首先需要理解相关的定义和核心原理。\n\n**关键要点**\n1. 理解基本概念和定义\n2. 掌握关键特征和属性\n3. 注意与其他知识点的关联\n\n**应用场景**\n这些知识在实际工程中有广泛的应用。\n\n希望这个解答对你有帮助！如有疑问欢迎继续追问。`

  const suggestions = [`可以结合${courseName}课本进一步理解该知识点`, '建议做一些相关练习题加深印象', '如果有疑问可以继续追问']

  // 存储会话
  if (!store.chatSessions[sessionId]) {
    store.chatSessions[sessionId] = {
      id: sessionId, course_id: courseId,
      last_question: body.question, message_count: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      messages: [],
    }
  }
  const session = store.chatSessions[sessionId]
  session.messages.push({ id: uid('msg'), role: 'user', content: body.question, created_at: new Date().toISOString() })
  session.messages.push({
    id: uid('msg'), role: 'assistant', content: answer, rag_used: true,
    references: [{ section_id: 'section_001', section_title: '第一章：进程管理', file_name: 'section_001_slides.pdf', excerpt: '相关课程材料摘录...' }],
    created_at: new Date().toISOString(),
  })
  session.message_count = session.messages.length
  session.last_question = body.question
  session.updated_at = new Date().toISOString()

  return { success: true, data: { session_id: sessionId, answer, rag_used: true, references: session.messages[session.messages.length - 1].references || [], suggestions }, message: 'ok' }
}

async function handleGetChatSessions(courseId: string): Promise<ApiResponse<{ course_id: string; items: ChatSessionItem[]; total: number }>> {
  await delay()
  const items: ChatSessionItem[] = Object.values(store.chatSessions)
    .filter((s) => s.course_id === courseId)
    .map((s) => ({ id: s.id, last_question: s.last_question, message_count: s.message_count, created_at: s.created_at, updated_at: s.updated_at }))
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetSessionMessages(courseId: string, sessionId: string): Promise<ApiResponse<SessionMessagesData>> {
  await delay()
  const s = store.chatSessions[sessionId]
  const messages = s?.messages || []
  return { success: true, data: { session_id: sessionId, course_id: courseId, messages }, message: 'ok' }
}

async function handleGetAssignments(courseId: string): Promise<ApiResponse<{ course_id: string; items: StudentAssignmentItem[]; total: number }>> {
  await delay()
  const list = store.assignments[courseId] || []
  const items: StudentAssignmentItem[] = list.map((a) => ({
    id: a.id, title: a.title, section_id: a.section_id, section_title: a.section_title,
    due_at: a.due_at, full_score: a.full_score, status: a.status,
    submitted: !!store.submissions[a.id],
    score: store.submissions[a.id]?.score ?? null,
  }))
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetAssignmentDetail(courseId: string, asgId: string): Promise<ApiResponse<StudentAssignmentDetail>> {
  await delay()
  const list = store.assignments[courseId] || []
  const a = list.find((x) => x.id === asgId)
  if (!a) throw { response: { status: 404 } }
  const sub = store.submissions[asgId]
  return {
    success: true, data: {
      id: a.id, course_id: a.course_id, section_id: a.section_id, section_title: a.section_title,
      title: a.title, description: a.description, due_at: a.due_at, full_score: a.full_score,
      status: a.status, attachment_url: a.attachment_url,
      submitted: !!sub, score: sub?.score ?? null,
    }, message: 'ok',
  }
}

async function handleSubmitAssignment(_courseId: string, asgId: string, data: unknown): Promise<ApiResponse<SubmissionData>> {
  await delay(400)
  let submitType: 'text' | 'file' | 'mixed' = 'text'
  let content = ''
  let fileUrls: string[] | undefined

  if (data instanceof FormData) {
    const fd = data
    const typeField = fd.get('submit_type') as string
    submitType = (typeField === 'file' || typeField === 'mixed' || typeField === 'text') ? typeField : 'text'

    // 文本内容
    const textContent = fd.get('content') as string | null
    if (textContent) content = textContent

    // 多文件处理
    const files = fd.getAll('files') as File[]
    // 向后兼容：旧 API 单文件 fallback
    const singleFile = fd.get('file') as File | null
    const allFiles = files.length > 0 ? files : (singleFile ? [singleFile] : [])

    if (allFiles.length > 0) {
      fileUrls = allFiles.map((f) => `/files/uploads/${f.name}`)
      if (!content) {
        content = allFiles.map((f) => `[文件上传] ${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join('\n')
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    // JSON 提交（文本模式）
    const obj = data as Record<string, string>
    submitType = (obj.submit_type === 'mixed' || obj.submit_type === 'file') ? obj.submit_type : 'text'
    content = obj.content || ''
  }

  const sub = {
    id: uid('submission'), assignment_id: asgId, submit_type: submitType, content,
    file_urls: fileUrls,
    submitted_at: new Date().toISOString(),
    score: null, ai_score: null, comments: null, deductions: [], suggestions: [],
    teacher_comment: null, graded_at: null,
  }
  store.submissions[asgId] = sub
  return { success: true, data: { id: sub.id, assignment_id: asgId, student_id: STUDENT.id, submit_type: submitType, content: content || undefined, file_urls: fileUrls, submitted_at: sub.submitted_at, status: 'submitted' }, message: 'submitted' }
}

async function handleGetMySubmission(_courseId: string, asgId: string): Promise<ApiResponse<MySubmissionData | null>> {
  await delay()
  const sub = store.submissions[asgId]
  if (!sub) return { success: true, data: null as unknown as MySubmissionData, message: 'ok' }
  return { success: true, data: { id: sub.id, assignment_id: sub.assignment_id, submit_type: sub.submit_type, file_url: sub.file_urls?.[0] ?? null, file_urls: sub.file_urls, content: sub.content, submitted_at: sub.submitted_at, status: 'submitted', score: sub.score, ai_score: sub.ai_score, comments: sub.comments, deductions: sub.deductions, suggestions: sub.suggestions, teacher_comment: sub.teacher_comment, graded_at: sub.graded_at }, message: 'ok' }
}

async function handleCreateSummary(courseId: string, data: unknown): Promise<ApiResponse<SummaryDetail>> {
  await delay(800)
  const body = data as Record<string, string>
  const item: SummaryDetail = {
    id: uid('summary'), course_id: courseId, section_id: body.section_id,
    section_title: body.section_id ? '第一章：进程管理' : undefined,
    title: body.title, rag_used: !body.source_text,
    references: body.source_text ? [] : [{ section_id: 'section_001', section_title: '第一章：进程管理', file_name: 'section_001_slides.pdf', excerpt: '课程材料摘录...' }],
    summary: {
      overview: `这是关于"${body.title}"的知识点总结。主要内容涵盖了核心概念和关键原理。`,
      key_points: ['核心概念定义与特征', '关键原理与应用场景', '与其他知识点的关联'],
      difficult_points: ['抽象概念的理解', '复杂公式的推导过程'],
      review_tips: ['建议制作思维导图梳理知识结构', '结合例题加深对概念的理解', '定期回顾巩固记忆'],
    },
    created_at: new Date().toISOString(),
  }
  if (!store.summaries[courseId]) store.summaries[courseId] = []
  store.summaries[courseId].push(item)
  return { success: true, data: item, message: 'created' }
}

async function handleGetSummaries(courseId: string): Promise<ApiResponse<{ course_id: string; items: SummaryListItem[]; total: number }>> {
  await delay()
  const items: SummaryListItem[] = (store.summaries[courseId] || []).map((s) => ({
    id: s.id, section_id: s.section_id, section_title: s.section_title,
    title: s.title, rag_used: s.rag_used, created_at: s.created_at,
  }))
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetSummary(courseId: string, summaryId: string): Promise<ApiResponse<SummaryDetail>> {
  await delay()
  const items = store.summaries[courseId] || []
  const s = items.find((x) => x.id === summaryId)
  if (!s) throw { response: { status: 404 } }
  return { success: true, data: s, message: 'ok' }
}

async function handleDeleteSummary(courseId: string, summaryId: string): Promise<ApiResponse<{ id: string }>> {
  await delay()
  if (store.summaries[courseId]) {
    store.summaries[courseId] = store.summaries[courseId].filter((s) => s.id !== summaryId)
  }
  return { success: true, data: { id: summaryId }, message: 'deleted' }
}

async function handleCreateLearningPlan(courseId: string, data: unknown): Promise<ApiResponse<LearningPlanData>> {
  await delay(1000)
  const body = data as Record<string, unknown>
  const course = COURSES[courseId]
  const mins = (body.available_time_per_day as number) || 60
  const plan: LearningPlanData = {
    id: uid('plan'), course_id: courseId, course_name: course?.name || '',
    career_direction: 'backend', version: 1, parent_plan_id: null,
    data_sources: ['scores', 'quizzes', 'profile', 'chat_sessions'],
    analysis: {
      current_level: '根据已有成绩分析，当前水平处于中等偏上',
      weak_points: ['核心概念理解', '综合应用能力'],
      career_relevance: '这些知识在后端开发中有重要应用',
      priority: '优先巩固薄弱知识点，再进行综合训练',
    },
    plan: Array.from({ length: 5 }, (_, i) => ({
      day: i + 1,
      task: [`复习${course?.name || '课程'}第${i + 1}章核心知识点`, `完成相关练习题 ${Math.floor(mins / 10)} 道`, '整理错题笔记并总结解题方法', '进行单元小测检验学习效果', '回顾本周学习内容并查漏补缺'][i],
      duration_minutes: mins,
      section_id: undefined,
      section_title: undefined,
    })),
    created_at: new Date().toISOString(),
  }
  if (!store.learningPlans[courseId]) store.learningPlans[courseId] = []
  store.learningPlans[courseId].push(plan)
  return { success: true, data: plan, message: 'created' }
}

async function handleGetLearningPlans(courseId: string): Promise<ApiResponse<{ course_id: string; items: LearningPlanListItem[]; total: number }>> {
  await delay()
  const items: LearningPlanListItem[] = (store.learningPlans[courseId] || []).map((p) => ({
    id: p.id, course_id: p.course_id, course_name: p.course_name,
    version: p.version, status: 'active' as const, created_at: p.created_at,
  }))
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetLearningPlan(courseId: string, planId: string): Promise<ApiResponse<LearningPlanData>> {
  await delay()
  const items = store.learningPlans[courseId] || []
  const p = items.find((x) => x.id === planId)
  if (!p) {
    // fallback to pre-seeded
    const pre = (store.learningPlans['course_001'] || []).find((x) => x.id === planId)
    if (pre) return { success: true, data: pre, message: 'ok' }
    throw { response: { status: 404 } }
  }
  return { success: true, data: p, message: 'ok' }
}

async function handleUpdatePlanStatus(_courseId: string, planId: string, data: unknown): Promise<ApiResponse<{ id: string; status: string }>> {
  await delay()
  return { success: true, data: { id: planId, status: (data as Record<string, string>).status }, message: 'updated' }
}

async function handleMarkTaskComplete(_courseId: string, planId: string, data: unknown): Promise<ApiResponse<PlanProgress['tasks'][number]>> {
  await delay()
  const body = data as Record<string, unknown>
  const day = body.day as number
  const completed = body.completed as boolean
  const feedback = body.feedback as string || null

  // 持久化进度到 store
  if (!store.planProgress[planId]) {
    store.planProgress[planId] = { plan_id: planId, version: 1, total_days: 0, completed_days: 0, completion_rate: 0, tasks: [] }
  }
  const progress = store.planProgress[planId]
  const existing = progress.tasks.find((t) => t.day === day)
  if (existing) {
    existing.completed = completed
    existing.feedback = feedback
    existing.completed_at = completed ? new Date().toISOString() : null
  } else {
    // 从对应的计划详情里取任务描述
    let plan: LearningPlanData | undefined
    for (const plans of Object.values(store.learningPlans)) {
      plan = plans.find((p) => p.id === planId)
      if (plan) break
    }
    const planDay = plan?.plan?.find((d: { day: number }) => d.day === day)
    progress.tasks.push({
      day,
      task: planDay?.task || '',
      duration_minutes: planDay?.duration_minutes || 60,
      section_id: planDay?.section_id,
      section_title: planDay?.section_title,
      completed,
      feedback,
      completed_at: completed ? new Date().toISOString() : null,
    })
    progress.total_days = plan?.plan?.length || progress.total_days
  }
  progress.completed_days = progress.tasks.filter((t) => t.completed).length
  progress.completion_rate = progress.total_days > 0 ? progress.completed_days / progress.total_days : 0

  return {
    success: true,
    data: {
      day, task: existing?.task || '', duration_minutes: existing?.duration_minutes || 60,
      completed, feedback, completed_at: completed ? new Date().toISOString() : null,
    },
    message: 'updated',
  }
}

async function handleGetPlanProgress(_courseId: string, planId: string): Promise<ApiResponse<PlanProgress>> {
  await delay()
  const progress = store.planProgress[planId]
  if (progress) return { success: true, data: progress, message: 'ok' }
  // 返回空进度
  return { success: true, data: { plan_id: planId, version: 1, total_days: 0, completed_days: 0, completion_rate: 0, tasks: [] }, message: 'ok' }
}

// ═══════════════════════════════════════════════════════════════
// 公告 Mock 处理函数
// ═══════════════════════════════════════════════════════════════

async function handleGetStudentAnnouncements(courseId: string): Promise<ApiResponse<StudentAnnouncementListData>> {
  await delay()
  const items: StudentAnnouncementItem[] = (store.announcements[courseId] || []).map((a) => ({
    id: a.id, title: a.title, content: a.content, is_pinned: a.is_pinned,
    is_read: a.id !== 'notice_001', // 模拟第一条未读
    created_at: a.created_at,
  }))
  const unreadCount = items.filter((i) => !i.is_read).length
  return { success: true, data: { course_id: courseId, unread_count: unreadCount, items, total: items.length }, message: 'ok' }
}

async function handleGetAnnouncement(courseId: string, noticeId: string): Promise<ApiResponse<AnnouncementDetail>> {
  await delay()
  const list = store.announcements[courseId] || []
  const a = list.find((x) => x.id === noticeId)
  if (!a) throw { response: { status: 404 } }
  return { success: true, data: a, message: 'ok' }
}

// ═══════════════════════════════════════════════════════════════
// 讨论 Mock 处理函数
// ═══════════════════════════════════════════════════════════════

async function handleGetDiscussions(courseId: string): Promise<ApiResponse<DiscussionListData>> {
  await delay()
  const items: DiscussionItem[] = (store.discussions[courseId] || []).map((d) => ({
    id: d.id, course_id: d.course_id, section_id: d.section_id, section_title: d.section_title,
    title: d.title, content: d.content, status: d.status, reply_count: d.reply_count,
    created_by: d.created_by, last_reply_at: d.last_reply_at, created_at: d.created_at,
  }))
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetDiscussion(courseId: string, discussionId: string): Promise<ApiResponse<DiscussionDetail>> {
  await delay()
  const list = store.discussions[courseId] || []
  const d = list.find((x) => x.id === discussionId)
  if (!d) throw { response: { status: 404 } }
  return { success: true, data: { ...d, content: d.content }, message: 'ok' }
}

async function handleCreateDiscussion(courseId: string, data: unknown): Promise<ApiResponse<DiscussionItem>> {
  await delay(400)
  const body = data as { title: string; content: string; section_id?: string }

  const newDisc: DiscussionDetail = {
    id: uid('disc'), course_id: courseId, title: body.title, content: body.content,
    section_id: body.section_id, status: 'open', reply_count: 0,
    created_by: { id: STUDENT.id, name: STUDENT.name, role: 'student' as const },
    last_reply_at: undefined, created_at: new Date().toISOString(),
    replies: { items: [], total: 0, page: 1, page_size: 20 },
  }
  if (!store.discussions[courseId]) store.discussions[courseId] = []
  store.discussions[courseId].push(newDisc)

  return { success: true, data: { id: newDisc.id, title: newDisc.title, status: newDisc.status, reply_count: 0, created_by: newDisc.created_by, created_at: newDisc.created_at }, message: 'created' }
}

async function handleCreateDiscussionReply(courseId: string, discussionId: string, data: unknown): Promise<ApiResponse<DiscussionReply>> {
  await delay(400)
  const body = data as { content: string }
  const list = store.discussions[courseId] || []
  const disc = list.find((x) => x.id === discussionId)
  if (!disc) throw { response: { status: 404 } }

  const reply: DiscussionReply = {
    id: uid('reply'), content: body.content,
    author: { id: STUDENT.id, name: STUDENT.name, role: 'student' as const },
    is_teacher: false, created_at: new Date().toISOString(),
  }
  disc.replies.items.push(reply)
  disc.replies.total = disc.replies.items.length
  disc.reply_count = disc.replies.total
  disc.last_reply_at = reply.created_at

  return { success: true, data: reply, message: 'created' }
}

async function handleDeleteDiscussionReply(courseId: string, discussionId: string, replyId: string): Promise<ApiResponse<{ id: string }>> {
  await delay()
  const list = store.discussions[courseId] || []
  const disc = list.find((x) => x.id === discussionId)
  if (!disc) throw { response: { status: 404 } }
  disc.replies.items = disc.replies.items.filter((r) => r.id !== replyId)
  disc.replies.total = disc.replies.items.length
  disc.reply_count = disc.replies.total
  return { success: true, data: { id: replyId }, message: 'deleted' }
}

// ═══════════════════════════════════════════════════════════════
// 问答 Mock 处理函数
// ═══════════════════════════════════════════════════════════════

async function handleGetQuestions(courseId: string): Promise<ApiResponse<QuestionListData>> {
  await delay()
  const items = store.questions[courseId] || []
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetQuestion(courseId: string, questionId: string): Promise<ApiResponse<QuestionItem>> {
  await delay()
  const list = store.questions[courseId] || []
  const q = list.find((x) => x.id === questionId)
  if (!q) throw { response: { status: 404 } }
  return { success: true, data: q, message: 'ok' }
}

async function handleCreateQuestion(courseId: string, data: unknown): Promise<ApiResponse<QuestionItem>> {
  await delay(400)
  const body = data as { title: string; content?: string; visibility: 'public' | 'private'; section_id?: string }

  const newQ: QuestionItem = {
    id: uid('question'), course_id: courseId, title: body.title, content: body.content,
    section_id: body.section_id, visibility: body.visibility || 'public',
    status: 'unanswered', asked_by: { id: STUDENT.id, name: STUDENT.name },
    created_at: new Date().toISOString(),
  }
  if (!store.questions[courseId]) store.questions[courseId] = []
  store.questions[courseId].push(newQ)

  return { success: true, data: newQ, message: 'created' }
}

// ═══════════════════════════════════════════════════════════════
// 测验 Mock 处理函数
// ═══════════════════════════════════════════════════════════════

async function handleGetStudentQuizzes(courseId: string): Promise<ApiResponse<StudentQuizListData>> {
  await delay()
  const quizzes = store.quizzes[courseId] || []
  const items: StudentQuizItem[] = quizzes.map((q) => {
    // 查找该用户是否有尝试记录
    const attemptKey = `${q.id}_${STUDENT.id}`
    const attempt = store.quizAttempts[attemptKey]
    return {
      id: q.id, title: q.title, section_id: q.section_id,
      question_count: q.questions.length, time_limit_minutes: q.time_limit_minutes,
      attempt_status: attempt ? (attempt.submitted ? 'submitted' as const : 'in_progress' as const) : null,
      score: attempt?.result?.total_score ?? null,
    }
  })
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleGetStudentQuiz(courseId: string, quizId: string): Promise<ApiResponse<StudentQuizDetail>> {
  await delay()
  const quizzes = store.quizzes[courseId] || []
  const q = quizzes.find((x) => x.id === quizId)
  if (!q) throw { response: { status: 404 } }
  // 查找已有的 attempt
  const attemptKey = `${quizId}_${STUDENT.id}`
  const attempt = store.quizAttempts[attemptKey]

  // StudentQuizDetail 不包含 correct_answer
  const detail: StudentQuizDetail = {
    id: q.id, course_id: q.course_id, title: q.title, description: q.description,
    section_id: q.section_id, time_limit_minutes: q.time_limit_minutes,
    questions: q.questions.map(({ id, question_type, content, options, score, order }) => ({
      id, question_type, content, options, score, order,
    })),
    attempt: attempt ? {
      id: attempt.attempt_id,
      status: attempt.submitted ? 'submitted' : 'in_progress',
      total_score: attempt.result?.total_score ?? null,
      started_at: new Date().toISOString(),
    } : null,
  }
  return { success: true, data: detail, message: 'ok' }
}

async function handleStartQuiz(courseId: string, quizId: string): Promise<ApiResponse<QuizStartData>> {
  await delay()
  const quizzes = store.quizzes[courseId] || []
  const q = quizzes.find((x) => x.id === quizId)
  if (!q) throw { response: { status: 404 } }
  const attemptKey = `${quizId}_${STUDENT.id}`
  const existing = store.quizAttempts[attemptKey]
  if (existing) {
    // 已有 attempt，直接返回
    return { success: true, data: { attempt_id: existing.attempt_id, started_at: new Date().toISOString() }, message: 'started' }
  }
  const attemptId = uid('attempt')
  store.quizAttempts[attemptKey] = { attempt_id: attemptId, quiz_id: quizId, answers: {}, submitted: false }
  return { success: true, data: { attempt_id: attemptId, started_at: new Date().toISOString() }, message: 'started' }
}

async function handleSubmitQuiz(courseId: string, quizId: string, attemptId: string, data: unknown): Promise<ApiResponse<QuizResultData>> {
  await delay(600)
  const body = data as { answers: { question_id: string; answer: string }[] }
  const quizzes = store.quizzes[courseId] || []
  const q = quizzes.find((x) => x.id === quizId)
  if (!q) throw { response: { status: 404 } }

  const results: QuizAnswerResult[] = q.questions.map((question) => {
    const userAnswer = body.answers.find((a) => a.question_id === question.id)?.answer || ''
    // 简单判断对错（mock 用包含判断）
    const correctAnswer = (question as unknown as { correct_answer?: string }).correct_answer || ''
    let isCorrect = false
    if (question.question_type === 'multi_choice') {
      // 多选：按逗号分隔，排序后比较
      const userSet = new Set(userAnswer.split(',').map((s: string) => s.trim()).filter(Boolean))
      const correctSet = new Set(correctAnswer.split(',').map((s: string) => s.trim()).filter(Boolean))
      isCorrect = userSet.size === correctSet.size && [...userSet].every((k) => correctSet.has(k))
    } else if (question.question_type === 'short_answer') {
      // 简答题：包含关键词即可
      isCorrect = userAnswer.length > 5
    } else {
      isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
    }

    return {
      question_id: question.id,
      is_correct: isCorrect,
      score: isCorrect ? question.score : (question.question_type === 'short_answer' ? Math.floor(question.score * 0.6) : 0),
      ai_feedback: isCorrect ? '回答正确！' : '回答有误，请参考解析。',
      correct_answer: correctAnswer,
      explanation: `标准答案：${correctAnswer || '详见题目解析'}`,
    }
  })

  const totalScore = results.reduce((s, r) => s + r.score, 0)
  const fullScore = q.questions.reduce((s, qq) => s + qq.score, 0)

  const resultData: QuizResultData = {
    attempt_id: attemptId, total_score: totalScore, full_score: fullScore, results,
  }

  const attemptKey = `${quizId}_${STUDENT.id}`
  if (store.quizAttempts[attemptKey]) {
    store.quizAttempts[attemptKey].submitted = true
    store.quizAttempts[attemptKey].result = resultData
    store.quizAttempts[attemptKey].answers = Object.fromEntries(body.answers.map((a) => [a.question_id, a.answer]))
  }

  return { success: true, data: resultData, message: 'submitted' }
}

async function handleGetQuizResult(courseId: string, quizId: string, _attemptId: string): Promise<ApiResponse<QuizResultData>> {
  await delay()
  const attemptKey = `${quizId}_${STUDENT.id}`
  const attempt = store.quizAttempts[attemptKey]
  if (!attempt?.result) throw { response: { status: 404 } }
  return { success: true, data: attempt.result, message: 'ok' }
}

// ═══════════════════════════════════════════════════════════════
// 成绩 Mock 处理函数
// ═══════════════════════════════════════════════════════════════

async function handleGetStudentCourseScores(courseId: string): Promise<ApiResponse<StudentCourseScoresData>> {
  await delay()
  const data = store.scoreRecords[courseId]
  if (!data) {
    // 返回空数据
    return {
      success: true,
      data: {
        course_id: courseId, course_name: COURSES[courseId]?.name || '',
        total_score: 0, rank: 0, total_students: 0, records: [],
      },
      message: 'ok',
    }
  }
  return { success: true, data, message: 'ok' }
}

// ═══════════════════════════════════════════════════════════════
// 教师端 Mock 处理函数
// ═══════════════════════════════════════════════════════════════

const TEACHER_COURSES_STORE: Record<string, {
  id: string; name: string; description: string; code: string; semester: string;
  status: string; teacher_id: string; teacher_name: string;
  student_count: number; section_count: number;
  created_at: string; updated_at: string;
  students: { id: string; username: string; name: string; class_name: string; joined_at: string; total_score: number }[];
}> = {
  course_001: {
    id: 'course_001', name: '操作系统', description: '本课程介绍操作系统的核心原理', code: 'OS8X2K',
    semester: '2026春季', status: 'active', teacher_id: TEACHER.id, teacher_name: TEACHER.name,
    student_count: 35, section_count: 3,
    created_at: '2026-06-01T10:00:00+08:00', updated_at: '2026-06-01T10:00:00+08:00',
    students: [
      { id: STUDENT.id, username: STUDENT.username, name: STUDENT.name, class_name: STUDENT.class_name || '', joined_at: '2026-06-04T10:30:00+08:00', total_score: 87.5 },
      { id: 'user_s2', username: '20240102', name: '李四', class_name: '计算机2401班', joined_at: '2026-06-04T11:00:00+08:00', total_score: 92 },
      { id: 'user_s3', username: '20240103', name: '王五', class_name: '计算机2401班', joined_at: '2026-06-04T11:30:00+08:00', total_score: 78 },
    ],
  },
}

async function handleTeacherGetCourses(): Promise<ApiResponse<{ items: { id: string; name: string; code: string; semester: string; status: string; student_count: number; section_count: number; created_at: string }[]; total: number }>> {
  await delay()
  const items = Object.values(TEACHER_COURSES_STORE).map((c) => ({
    id: c.id, name: c.name, code: c.code, semester: c.semester,
    status: c.status, student_count: c.student_count, section_count: c.section_count,
    created_at: c.created_at,
  }))
  return { success: true, data: { items, total: items.length }, message: 'ok' }
}

async function handleTeacherCreateCourse(data: unknown): Promise<ApiResponse<unknown>> {
  await delay(400)
  const body = data as Record<string, string>
  const id = uid('course')
  const course = {
    id, name: body.name, description: body.description || '', code: 'CS' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    semester: body.semester || '', status: 'active', teacher_id: TEACHER.id, teacher_name: TEACHER.name,
    student_count: 0, section_count: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    students: [],
  }
  TEACHER_COURSES_STORE[id] = course
  return { success: true, data: { id: course.id, name: course.name, description: course.description, code: course.code, semester: course.semester, status: course.status, teacher_id: course.teacher_id, teacher_name: course.teacher_name, student_count: 0, created_at: course.created_at }, message: 'created' }
}

async function handleTeacherGetCourseDetail(courseId: string): Promise<ApiResponse<unknown>> {
  await delay()
  const c = TEACHER_COURSES_STORE[courseId]
  if (!c) throw { response: { status: 404 } }
  return { success: true, data: { id: c.id, name: c.name, description: c.description, code: c.code, semester: c.semester, status: c.status, teacher_id: c.teacher_id, teacher_name: c.teacher_name, student_count: c.student_count, section_count: c.section_count, created_at: c.created_at, updated_at: c.updated_at }, message: 'ok' }
}

async function handleTeacherGetStudents(courseId: string): Promise<ApiResponse<unknown>> {
  await delay()
  const c = TEACHER_COURSES_STORE[courseId]
  if (!c) throw { response: { status: 404 } }
  return { success: true, data: { course_id: courseId, items: c.students, total: c.students.length }, message: 'ok' }
}

async function handleTeacherAddStudents(courseId: string, data: unknown): Promise<ApiResponse<unknown>> {
  await delay()
  const body = data as { usernames: string[] }
  const c = TEACHER_COURSES_STORE[courseId]
  if (!c) throw { response: { status: 404 } }
  const added: { username: string; name: string; student_id: string }[] = []
  const failed: { username: string; reason: string }[] = []
  body.usernames.forEach((uname) => {
    if (c.students.find((s) => s.username === uname)) {
      failed.push({ username: uname, reason: '已在课程中' })
    } else {
      const sid = uid('user')
      c.students.push({ id: sid, username: uname, name: '学生' + uname, class_name: '', joined_at: new Date().toISOString(), total_score: 0 })
      added.push({ username: uname, name: '学生' + uname, student_id: sid })
    }
  })
  c.student_count = c.students.length
  return { success: true, data: { course_id: courseId, added, failed }, message: 'ok' }
}

async function handleTeacherRemoveStudent(courseId: string, studentId: string): Promise<ApiResponse<unknown>> {
  await delay()
  const c = TEACHER_COURSES_STORE[courseId]
  if (!c) throw { response: { status: 404 } }
  c.students = c.students.filter((s) => s.id !== studentId)
  c.student_count = c.students.length
  return { success: true, data: { course_id: courseId, student_id: studentId }, message: 'removed' }
}

async function handleTeacherGetSections(courseId: string): Promise<ApiResponse<unknown>> {
  await delay()
  const items = store.sections[courseId] || []
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleTeacherCreateSection(courseId: string, data: unknown): Promise<ApiResponse<unknown>> {
  await delay()
  const body = data as Record<string, string>
  const item: SectionItem & { course_id: string; created_at: string } = {
    id: uid('section'), course_id: courseId,
    title: body.title, description: body.description, order: Number(body.order) || 0,
    material_url: null, material_file_name: null, assignment_count: 0, submitted_count: 0, section_score: null,
    created_at: new Date().toISOString(),
  }
  if (!store.sections[courseId]) store.sections[courseId] = []
  store.sections[courseId].push(item)
  return { success: true, data: item, message: 'created' }
}

async function handleTeacherDeleteSection(courseId: string, sectionId: string): Promise<ApiResponse<unknown>> {
  await delay()
  if (store.sections[courseId]) {
    store.sections[courseId] = store.sections[courseId].filter((s) => s.id !== sectionId)
  }
  return { success: true, data: { id: sectionId }, message: 'deleted' }
}

async function handleTeacherPublishAssignment(courseId: string, sectionId: string, data: unknown): Promise<ApiResponse<unknown>> {
  await delay()
  const fd = data as FormData
  const asgId = uid('assignment')
  const section = (store.sections[courseId] || []).find((s) => s.id === sectionId)
  const asg = {
    id: asgId, course_id: courseId, section_id: sectionId,
    section_title: section?.title || '',
    title: String(fd.get('title') || ''), description: String(fd.get('description') || ''),
    due_at: String(fd.get('due_at') || ''), full_score: Number(fd.get('full_score')) || 100,
    status: 'open' as const, attachment_url: null,
  }
  if (!store.assignments[courseId]) store.assignments[courseId] = []
  store.assignments[courseId].push(asg)
  return { success: true, data: { ...asg, created_at: new Date().toISOString() }, message: 'published' }
}

async function handleTeacherGetAssignments(courseId: string): Promise<ApiResponse<unknown>> {
  await delay()
  const list = store.assignments[courseId] || []
  const items = list.map((a) => ({
    id: a.id, title: a.title, section_id: a.section_id, section_title: a.section_title,
    due_at: a.due_at, full_score: a.full_score, status: a.status,
    submission_count: 0, total_students: 35,
  }))
  return { success: true, data: { course_id: courseId, items, total: items.length }, message: 'ok' }
}

async function handleTeacherGetAssignmentDetail(courseId: string, asgId: string): Promise<ApiResponse<unknown>> {
  await delay()
  const list = store.assignments[courseId] || []
  const a = list.find((x) => x.id === asgId)
  if (!a) throw { response: { status: 404 } }
  return { success: true, data: { id: a.id, course_id: a.course_id, section_id: a.section_id, title: a.title, description: a.description, reference_answer: '参考答案：进程状态转换的关键在于理解就绪、运行、阻塞三种状态之间的转换条件...', rubric: '满分 100 分，概念 40 分，分析 40 分，表达 20 分。', due_at: a.due_at, full_score: a.full_score, status: a.status, attachment_url: a.attachment_url, submission_count: 25, created_at: '2026-06-04T10:00:00+08:00', updated_at: '2026-06-04T10:00:00+08:00' }, message: 'ok' }
}

async function handleTeacherCloseAssignment(_courseId: string, asgId: string): Promise<ApiResponse<unknown>> {
  await delay()
  return { success: true, data: { id: asgId, status: 'closed' }, message: 'closed' }
}

async function handleTeacherGetSubmissions(_courseId: string, asgId: string): Promise<ApiResponse<unknown>> {
  await delay()
  // 生成模拟提交
  const items = TEACHER_COURSES_STORE['course_001']?.students.map((s) => ({
    id: uid('submission'), student_id: s.id, student_name: s.name,
    submit_type: 'text' as const, submitted_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
    status: 'submitted', score: null, confirmed: false,
  })) || []
  return { success: true, data: { assignment_id: asgId, items, total: items.length }, message: 'ok' }
}

async function handleTeacherGrade(_courseId: string, asgId: string, data: unknown): Promise<ApiResponse<unknown>> {
  await delay(1000)
  const body = data as { submission_ids: string[] }
  const results = body.submission_ids.map((sid) => ({
    submission_id: sid, student_id: '', student_name: '学生',
    ai_score: Math.floor(Math.random() * 20) + 75,
    comments: '整体思路正确，部分细节可以进一步完善。',
    deductions: [{ point: '概念解释不够完整', minus: 5 }],
    suggestions: ['补充更多具体案例来支撑论点', '加强对核心概念的定义性描述'],
    confirmed: false,
  }))
  return { success: true, data: { assignment_id: asgId, results }, message: 'graded' }
}

async function handleTeacherConfirmGrade(_courseId: string, _asgId: string, submissionId: string, data: unknown): Promise<ApiResponse<unknown>> {
  await delay()
  const body = data as { final_score: number; confirmed: boolean; teacher_comment?: string }
  return { success: true, data: { submission_id: submissionId, final_score: body.final_score, confirmed: body.confirmed }, message: 'updated' }
}

async function handleTeacherGradingReport(_courseId: string, asgId: string): Promise<ApiResponse<unknown>> {
  await delay()
  return { success: true, data: { assignment_id: asgId, average_score: 82.5, graded_count: 25, unconfirmed_count: 3, common_mistakes: ['概念解释不完整', '缺少案例分析', '结论过于简略'], weak_points: ['核心概念定义', '案例分析能力', '逻辑推导过程'], teaching_suggestions: ['建议课堂上使用流程图讲解核心概念', '安排一次概念对比小测'] }, message: 'ok' }
}

async function handleTeacherAnalyze(_courseId: string, asgId: string, data: unknown): Promise<ApiResponse<unknown>> {
  await delay(1200)
  const body = data as { submission_ids: string[]; similarity_threshold?: number; compare_dimensions?: string[] }
  const dims = body.compare_dimensions || ['structure', 'concept', 'expression', 'conclusion']
  const submissions = body.submission_ids.map((sid, i) => ({ submission_id: sid, student_name: ['张三', '李四', '王五'][i % 3] }))
  const suspiciousPairs = submissions.length >= 2 ? [{ submission_a: submissions[0].submission_id, student_a: submissions[0].student_name, submission_b: submissions[1].submission_id, student_b: submissions[1].student_name, similarity: 0.87, risk_level: 'high' as const, similar_segments: ['对核心概念的定义表述高度一致', '结论段落结构相同'], ai_reason: '两份作业在观点顺序、关键句表达和例子选择上高度相似' }] : []
  const comparisonDetails = submissions.map((s) => ({ submission_id: s.submission_id, student_name: s.student_name, strengths: ['对核心概念有一定理解', '结合了具体场景举例'], weaknesses: ['缺少深入分析', '部分推导跳跃'], dimension_scores: Object.fromEntries(dims.map((d) => [d, ['完整', '准确', '流畅', '一般'][Math.floor(Math.random() * 4)]])) }))
  return { success: true, data: { report_id: uid('report'), assignment_id: asgId, suspicious_pairs: suspiciousPairs, comparison_details: comparisonDetails, common_issues: ['都没有结合具体场景举例', '结论部分较为简略'], teaching_suggestions: ['课堂上补充相关案例', '强调概念解释和例子结合'], created_at: new Date().toISOString() }, message: 'analyzed' }
}

async function handleTeacherAnalyzeReport(_courseId: string, asgId: string): Promise<ApiResponse<unknown>> {
  await delay()
  return handleTeacherAnalyze(_courseId, asgId, { submission_ids: ['sub_001', 'sub_002', 'sub_003'], similarity_threshold: 0.8, compare_dimensions: ['structure', 'concept', 'expression', 'conclusion'] })
}
