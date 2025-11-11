import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { AppLayout } from './app-layout'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout>{children}</AppLayout>
}
