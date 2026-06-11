import request from "../utils/request";
import type {
  ApiResponse,
  QuizCreateRequest,
  QuizResultData,
  QuizStartData,
  QuizStatus,
  QuizSubmitRequest,
  StudentQuizDetail,
  StudentQuizListData,
  TeacherQuizAttemptsData,
  TeacherQuizListData,
} from "../types/api";

export async function createQuiz(
  courseId: string,
  data: QuizCreateRequest,
): Promise<ApiResponse<Record<string, unknown>>> {
  const res = await request.post(`/teacher/courses/${courseId}/quizzes`, data);
  return res as unknown as ApiResponse<Record<string, unknown>>;
}

export async function getTeacherQuizzes(
  courseId: string,
  params?: { section_id?: string; status?: QuizStatus },
): Promise<ApiResponse<TeacherQuizListData>> {
  const res = await request.get(`/teacher/courses/${courseId}/quizzes`, {
    params,
  });
  return res as unknown as ApiResponse<TeacherQuizListData>;
}

export async function updateQuizStatus(
  courseId: string,
  quizId: string,
  status: QuizStatus,
): Promise<ApiResponse<{ id: string; status: QuizStatus }>> {
  const res = await request.patch(
    `/teacher/courses/${courseId}/quizzes/${quizId}`,
    { status },
  );
  return res as unknown as ApiResponse<{ id: string; status: QuizStatus }>;
}

export async function getQuizAttempts(
  courseId: string,
  quizId: string,
): Promise<ApiResponse<TeacherQuizAttemptsData>> {
  const res = await request.get(
    `/teacher/courses/${courseId}/quizzes/${quizId}/attempts`,
  );
  return res as unknown as ApiResponse<TeacherQuizAttemptsData>;
}

export async function getStudentQuizzes(
  courseId: string,
): Promise<ApiResponse<StudentQuizListData>> {
  const res = await request.get(`/student/courses/${courseId}/quizzes`);
  return res as unknown as ApiResponse<StudentQuizListData>;
}

export async function getStudentQuiz(
  courseId: string,
  quizId: string,
): Promise<ApiResponse<StudentQuizDetail>> {
  const res = await request.get(
    `/student/courses/${courseId}/quizzes/${quizId}`,
  );
  return res as unknown as ApiResponse<StudentQuizDetail>;
}

export async function startQuiz(
  courseId: string,
  quizId: string,
): Promise<ApiResponse<QuizStartData>> {
  const res = await request.post(
    `/student/courses/${courseId}/quizzes/${quizId}/start`,
  );
  return res as unknown as ApiResponse<QuizStartData>;
}

export async function submitQuiz(
  courseId: string,
  quizId: string,
  attemptId: string,
  data: QuizSubmitRequest,
): Promise<ApiResponse<QuizResultData>> {
  const res = await request.post(
    `/student/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/submit`,
    data,
  );
  return res as unknown as ApiResponse<QuizResultData>;
}

export async function getQuizResult(
  courseId: string,
  quizId: string,
  attemptId: string,
): Promise<ApiResponse<QuizResultData>> {
  const res = await request.get(
    `/student/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/result`,
  );
  return res as unknown as ApiResponse<QuizResultData>;
}

// ── 逐题保存 ──

export interface SavedAnswer {
  question_id: string;
  answer: string;
  saved_at: string;
}

/**
 * 逐题保存答案
 */
export async function saveAnswer(
  courseId: string,
  quizId: string,
  attemptId: string,
  questionId: string,
  answer: string,
): Promise<ApiResponse<SavedAnswer>> {
  const res = await request.put(
    `/student/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/answers`,
    { question_id: questionId, answer },
  );
  return res as unknown as ApiResponse<SavedAnswer>;
}

/**
 * 获取 attempt 详情（含已保存的答案，恢复答题时用）
 * GET /student/courses/{course_id}/quizzes/{quiz_id}/attempts/{attempt_id}
 */
export interface AttemptDetail {
  attempt_id: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  answers: Record<string, string>; // question_id → answer
  answered_count: number;
}

export async function getAttemptDetail(
  courseId: string,
  quizId: string,
  attemptId: string,
): Promise<ApiResponse<AttemptDetail>> {
  const res = await request.get(
    `/student/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}`,
  );
  return res as unknown as ApiResponse<AttemptDetail>;
}
