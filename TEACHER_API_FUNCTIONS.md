# 教师端功能接口文档

本文档整理 `src/api` 目录下已提供的教师端相关接口封装。项目的 Axios 客户端在 `src/utils/request.ts` 中统一配置了 `baseURL = /api`，因此下表中的路径均省略了前缀 `/api`。

## 课程管理

来源文件：`src/api/teacherCourses.ts`

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `getTeacherCourses(params)` | `GET /teacher/courses` | 获取教师课程列表，支持按 `status`、`keyword` 筛选。 |
| `getTeacherCourseDetail(courseId)` | `GET /teacher/courses/{courseId}` | 获取教师端课程详情，包括课程基础信息、状态、学生数、小节数等。 |
| `createCourse(data)` | `POST /teacher/courses` | 创建课程，支持课程名称、简介、封面地址、学期。 |
| `updateCourse(courseId, data)` | `PATCH /teacher/courses/{courseId}` | 更新课程名称、简介、学期。 |
| `archiveCourse(courseId)` | `POST /teacher/courses/{courseId}/archive` | 归档课程。 |
| `regenerateCode(courseId)` | `POST /teacher/courses/{courseId}/regenerate-code` | 重新生成课程加入码。 |
| `getCourseStudents(courseId)` | `GET /teacher/courses/{courseId}/students` | 获取课程学生列表，包含学号、姓名、班级、加入时间和总分。 |
| `addStudents(courseId, usernames)` | `POST /teacher/courses/{courseId}/students` | 按学号批量添加学生到课程，返回添加成功和失败列表。 |
| `removeStudent(courseId, studentId)` | `DELETE /teacher/courses/{courseId}/students/{studentId}` | 从课程中移除指定学生。 |

## 课程小节与作业发布

来源文件：`src/api/teacherSections.ts`

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `getTeacherSections(courseId)` | `GET /teacher/courses/{courseId}/sections` | 获取课程小节列表。 |
| `createSection(courseId, data)` | `POST /teacher/courses/{courseId}/sections` | 创建课程小节，支持标题、描述、排序、资料 URL。 |
| `updateSection(courseId, sectionId, data)` | `PATCH /teacher/courses/{courseId}/sections/{sectionId}` | 更新小节标题、描述、排序。 |
| `deleteSection(courseId, sectionId)` | `DELETE /teacher/courses/{courseId}/sections/{sectionId}` | 删除课程小节。 |
| `publishAssignmentInSection(courseId, sectionId, formData)` | `POST /teacher/courses/{courseId}/sections/{sectionId}/assignments` | 在指定小节下发布作业，使用 `multipart/form-data`，可包含附件。 |

## 作业管理、批改与分析

来源文件：`src/api/teacherAssignments.ts`

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `getTeacherAssignments(courseId, params)` | `GET /teacher/courses/{courseId}/assignments` | 获取教师端作业列表，支持按小节和状态筛选。 |
| `getTeacherAssignmentDetail(courseId, assignmentId)` | `GET /teacher/courses/{courseId}/assignments/{assignmentId}` | 获取作业详情，包括要求、参考答案、评分标准、附件、提交统计。 |
| `updateAssignment(courseId, assignmentId, updates)` | `PATCH /teacher/courses/{courseId}/assignments/{assignmentId}` | 更新作业描述和截止时间。 |
| `closeAssignment(courseId, assignmentId)` | `POST /teacher/courses/{courseId}/assignments/{assignmentId}/close` | 关闭作业。 |
| `getSubmissions(courseId, assignmentId)` | `GET /teacher/courses/{courseId}/assignments/{assignmentId}/submissions` | 获取某个作业的学生提交列表。 |
| `gradeSubmissions(courseId, assignmentId, submissionIds)` | `POST /teacher/courses/{courseId}/assignments/{assignmentId}/grade` | 对指定提交执行 AI 批改，默认需要教师二次确认。 |
| `confirmGrade(courseId, assignmentId, submissionId, finalScore, confirmed, teacherComment)` | `PATCH /teacher/courses/{courseId}/assignments/{assignmentId}/submissions/{submissionId}` | 教师确认或调整 AI 批改结果，可设置最终分数、确认状态和教师评语。 |
| `getGradingReport(courseId, assignmentId)` | `GET /teacher/courses/{courseId}/assignments/{assignmentId}/grading-report` | 获取作业批改报告，包括平均分、常见错误、薄弱点和教学建议。 |
| `analyzeSubmissions(courseId, assignmentId, submissionIds, threshold, dimensions)` | `POST /teacher/courses/{courseId}/assignments/{assignmentId}/analyze` | 对提交进行查重和多维度对比分析。 |
| `getAnalyzeReport(courseId, assignmentId)` | `GET /teacher/courses/{courseId}/assignments/{assignmentId}/analyze-report` | 获取查重与对比分析报告。 |

## 测试管理

来源文件：`src/api/quizzes.ts`

该文件同时包含学生端测试接口。下表只列教师端函数。

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `createQuiz(courseId, data)` | `POST /teacher/courses/{courseId}/quizzes` | 发布课程测试，支持小节关联、限时、题目列表、正确答案和解析。 |
| `getTeacherQuizzes(courseId, params)` | `GET /teacher/courses/{courseId}/quizzes` | 获取教师端测试列表，支持按小节和状态筛选。 |
| `updateQuizStatus(courseId, quizId, status)` | `PATCH /teacher/courses/{courseId}/quizzes/{quizId}` | 关闭或重新开放测试。 |
| `getQuizAttempts(courseId, quizId)` | `GET /teacher/courses/{courseId}/quizzes/{quizId}/attempts` | 查看学生测试作答汇总，包括作答人数、平均分和学生提交记录。 |

## 成绩查看

来源文件：`src/api/scores.ts`

该文件同时包含学生端成绩接口。下表只列教师端函数。

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `getTeacherCourseScores(courseId, params)` | `GET /teacher/courses/{courseId}/scores` | 获取课程成绩分布、统计数据和学生成绩排行，支持排序参数。 |
| `getTeacherStudentScores(courseId, studentId)` | `GET /teacher/courses/{courseId}/scores/{studentId}` | 查看指定学生在课程内的详细成绩记录。 |

## 公告管理

来源文件：`src/api/announcements.ts`

公告接口路径是课程通用路径 `/courses/{courseId}/announcements`，其中发布、教师列表、更新、删除属于教师端管理能力。

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `createAnnouncement(courseId, data)` | `POST /courses/{courseId}/announcements` | 发布课程公告，支持标题、内容、是否置顶。 |
| `getTeacherAnnouncements(courseId, params)` | `GET /courses/{courseId}/announcements` | 获取教师视角的公告列表，包含阅读人数和课程学生总数。 |
| `updateAnnouncement(courseId, noticeId, data)` | `PATCH /courses/{courseId}/announcements/{noticeId}` | 更新公告标题、内容或置顶状态。 |
| `deleteAnnouncement(courseId, noticeId)` | `DELETE /courses/{courseId}/announcements/{noticeId}` | 删除公告。 |
| `getAnnouncement(courseId, noticeId)` | `GET /courses/{courseId}/announcements/{noticeId}` | 获取公告详情。 |

## 讨论管理

来源文件：`src/api/discussions.ts`

讨论接口路径是课程通用路径 `/courses/{courseId}/discussions`，教师可创建、查看、回复、关闭、删除讨论，也可管理回复。

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `createDiscussion(courseId, data)` | `POST /courses/{courseId}/discussions` | 创建课程讨论，可关联小节。 |
| `getDiscussions(courseId, params)` | `GET /courses/{courseId}/discussions` | 获取讨论列表，支持按小节和状态筛选。 |
| `getDiscussion(courseId, discussionId, params)` | `GET /courses/{courseId}/discussions/{discussionId}` | 获取讨论详情和回复分页列表。 |
| `createDiscussionReply(courseId, discussionId, content)` | `POST /courses/{courseId}/discussions/{discussionId}/replies` | 发表讨论回复。 |
| `deleteDiscussionReply(courseId, discussionId, replyId)` | `DELETE /courses/{courseId}/discussions/{discussionId}/replies/{replyId}` | 删除讨论回复。 |
| `updateDiscussionStatus(courseId, discussionId, status)` | `PATCH /courses/{courseId}/discussions/{discussionId}` | 关闭或重新开放讨论。 |
| `deleteDiscussion(courseId, discussionId)` | `DELETE /courses/{courseId}/discussions/{discussionId}` | 删除讨论及其回复。 |

## 提问答疑

来源文件：`src/api/questions.ts`

提问接口路径是课程通用路径 `/courses/{courseId}/questions`。教师端重点能力是查看问题、回答问题、调整可见性和删除问题。

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `getQuestions(courseId, params)` | `GET /courses/{courseId}/questions` | 获取课程问题列表，支持按小节、回答状态、可见性筛选。 |
| `getQuestion(courseId, questionId)` | `GET /courses/{courseId}/questions/{questionId}` | 获取问题详情和官方回答。 |
| `answerQuestion(courseId, questionId, content)` | `POST /courses/{courseId}/questions/{questionId}/answer` | 教师回答问题；重复调用可视为更新回答。 |
| `updateQuestionVisibility(courseId, questionId, visibility)` | `PATCH /courses/{courseId}/questions/{questionId}` | 调整问题可见性。 |
| `deleteQuestion(courseId, questionId)` | `DELETE /courses/{courseId}/questions/{questionId}` | 删除问题及其回答。 |
| `createQuestion(courseId, data)` | `POST /courses/{courseId}/questions` | 创建课程问题。文档中主要面向学生，但接口封装本身也可用于具备权限的教师调用。 |

## 账号相关

来源文件：`src/api/auth.ts`

这些不是教师业务功能，但教师端登录、注册和个人资料维护会用到。

| 函数 | 方法与路径 | 功能 |
| --- | --- | --- |
| `registerTeacher(payload)` | `POST /auth/register/teacher` | 注册教师账号。 |
| `login(username, password)` | `POST /auth/login` | 登录，返回 Token 和用户信息。 |
| `getMe()` | `GET /auth/me` | 获取当前登录用户信息。 |
| `updateMe(data)` | `PATCH /auth/me` | 更新当前用户资料。 |
| `changePassword(data)` | `POST /auth/change-password` | 修改当前账号密码。 |

## 功能覆盖概览

当前 `src/api` 已覆盖的教师端能力包括：

- 课程生命周期管理：创建、查询、更新、归档、重置课程码。
- 学生管理：查看课程学生、批量添加学生、移除学生。
- 课程内容管理：小节 CRUD、在小节下发布作业。
- 作业管理：查询作业、更新作业、关闭作业、查看提交。
- AI 批改：批量批改、教师确认成绩、查看批改报告。
- 查重与对比：提交分析、查看分析报告。
- 测试管理：发布测试、查询测试、关闭/开放测试、查看作答汇总。
- 成绩分析：课程成绩分布、学生成绩详情。
- 课程互动：公告、讨论、提问答疑。
- 账号基础能力：教师注册、登录、用户信息、修改密码。
