import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogoMark, ShieldIcon, LockIcon } from '../components/icons'

const roleRedirect = {
  admin: '/users',
  manager: '/dashboard',
  cashier: '/pos',
  inventory_staff: '/inventory',
}

// Eye Icon
function EyeIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Eye Slash Icon
function EyeSlashIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A9.78 9.78 0 0112 5c4.48 0 8.27 2.94 9.54 7a9.73 9.73 0 01-4.05 5.14M6.1 6.1A9.74 9.74 0 002.46 12a9.73 9.73 0 004.05 5.14"
      />
    </svg>
  )
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [adminMode, setAdminMode] = useState(false)

  const { login, logout } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await login(username, password)

      if (adminMode && user.role !== 'admin') {
        logout()
        setError('This account is not an administrator account.')
        return
      }

      if (!adminMode && user.role === 'admin') {
        logout()
        setError('Please use "Log in as Administrator?" for this account.')
        return
      }

      navigate(roleRedirect[user.role] || '/login')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Login failed. Please check your credentials.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <LogoMark className="h-8 w-8" />
          </span>

          <h1 className="text-2xl font-bold text-slate-800">
            WardrobeX
          </h1>

          <p className="text-sm font-medium text-slate-400">
            Retail POS &amp; IMS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              {adminMode ? 'Administrator ID' : 'Enter Employee ID'}
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Employee ID"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-600">
                Enter Password
              </label>

              <a
                href="#"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-brand-600"
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            <LockIcon className="h-4 w-4" />

            {submitting ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        {/* Toggle Login Mode */}
        <button
          type="button"
          onClick={() => setAdminMode((prev) => !prev)}
          className="mt-5 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ShieldIcon className="h-4 w-4" />

          {adminMode
            ? 'Log in as Employee?'
            : 'Log in as Administrator?'}
        </button>
      </div>
    </div>
  )
}