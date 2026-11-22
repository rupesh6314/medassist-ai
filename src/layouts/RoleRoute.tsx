import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface RoleRouteProps {
  allowedRoles: ('patient' | 'doctor')[]
  redirectTo?: string
  children: React.ReactNode
}

export function RoleRoute({ allowedRoles, redirectTo, children }: RoleRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role || 'patient'
  if (!allowedRoles.includes(role)) {
    const target = redirectTo || (role === 'doctor' ? '/doctor-dashboard' : '/dashboard')
    return <Navigate to={target} replace />
  }

  return <>{children}</>
}
