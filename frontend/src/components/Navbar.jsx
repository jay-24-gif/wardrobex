import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UsersIcon } from './icons'

export default function Navbar({ title }) {
  const { user } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>

      {user?.role !== 'admin' && (
        <NavLink
          to="/users"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700'
            }`
          }
        >
          User Management
          <UsersIcon className="h-[18px] w-[18px]" />
        </NavLink>
      )}
    </header>
  )
}
