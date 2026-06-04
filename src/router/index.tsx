import { createBrowserRouter, Navigate } from 'react-router'
import AuthGuard from '../components/AuthGuard'
import StudentLayout from '../components/StudentLayout'
import TeacherLayout from '../components/TeacherLayout'
import LoginPage from '../pages/auth/login'
import RegisterPage from '../pages/auth/register'
import StudentCoursePage from '../pages/student/courses'
import TeacherCoursePage from '../pages/teacher/courses'

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
        <StudentLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <StudentCoursePage />,
      },
      {
        path: 'courses/:courseId',
        element: <StudentCoursePage />,
      },
    ],
  },

  // 教师端路由
  {
    path: '/teacher',
    element: (
      <AuthGuard role="teacher">
        <TeacherLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <TeacherCoursePage />,
      },
      {
        path: 'courses/:courseId',
        element: <TeacherCoursePage />,
      },
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
