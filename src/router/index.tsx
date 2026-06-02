import { createBrowserRouter, Navigate } from 'react-router'
import AuthGuard from '../components/AuthGuard'
import Layout from '../components/Layout'
import LoginPage from '../pages/auth/login'
import RegisterPage from '../pages/auth/register'
import StudentChatPage from '../pages/student/chat'
import StudentAssignmentsPage from '../pages/student/assignments'
import StudentAssignmentDetailPage from '../pages/student/assignments/detail'
import StudentSummariesPage from '../pages/student/summaries'
import StudentLearningPlansPage from '../pages/student/learning-plans'
import TeacherAssignmentsPage from '../pages/teacher/assignments'
import TeacherAssignmentDetailPage from '../pages/teacher/assignments/detail'
import TeacherGradingPage from '../pages/teacher/grading'
import TeacherAnalyzePage from '../pages/teacher/analyze'

const router = createBrowserRouter([
  // 公开路由（无需登录）
  {
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/register',
    element: <RegisterPage />,
  },

  // 学生端路由
  {
    path: '/student',
    element: (
      <AuthGuard role="student">
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/student/chat" replace /> },
      { path: 'chat', element: <StudentChatPage /> },
      { path: 'assignments', element: <StudentAssignmentsPage /> },
      { path: 'assignments/:assignmentId', element: <StudentAssignmentDetailPage /> },
      { path: 'summaries', element: <StudentSummariesPage /> },
      { path: 'learning-plans', element: <StudentLearningPlansPage /> },
    ],
  },

  // 教师端路由
  {
    path: '/teacher',
    element: (
      <AuthGuard role="teacher">
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/teacher/assignments" replace /> },
      { path: 'assignments', element: <TeacherAssignmentsPage /> },
      { path: 'assignments/:assignmentId', element: <TeacherAssignmentDetailPage /> },
      { path: 'grading', element: <TeacherGradingPage /> },
      { path: 'analyze', element: <TeacherAnalyzePage /> },
    ],
  },

  // 兜底
  {
    path: '/',
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/auth/login" replace />,
  },
])

export default router
