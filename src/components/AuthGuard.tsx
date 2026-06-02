import { Navigate } from 'react-router'
import { useAuth } from './useAuth'
import type { Role } from '../types/api'

interface Props {
  children: React.ReactNode
  role?: Role
}

export default function AuthGuard({ children, role }: Props) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
