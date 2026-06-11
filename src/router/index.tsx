import { createBrowserRouter, Navigate } from 'react-router'
import AuthGuard from '../components/AuthGuard'
import StudentLayout from '../components/StudentLayout'
import TeacherLayout from '../components/TeacherLayout'
import LoginPage from '../pages/auth/login'
import RegisterPage from '../pages/auth/register'
import StudentCoursePage from '../pages/student/courses'
import TeacherAccountPage from '../pages/teacher/account'
import TeacherCoursePage from '../pages/teacher/courses'

const router = createBrowserRouter([
  {
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/auth/register',
    element: <RegisterPage />,
  },
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
        path: 'account',
        element: <TeacherAccountPage />,
      },
      {
        path: 'courses/:courseId',
        element: <TeacherCoursePage />,
      },
    ],
  },
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
