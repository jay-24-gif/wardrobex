import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LockIcon } from './icons'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <LockIcon className="h-6 w-6" />
        </span>
        <p className="text-lg font-semibold text-slate-700">Access Restricted</p>
        <p className="max-w-xs text-center text-sm text-slate-400">
          Your account role doesn&apos;t have permission to view this page. Contact an administrator if you believe this is a mistake.
        </p>
      </div>
    )
  }

  return children
}
