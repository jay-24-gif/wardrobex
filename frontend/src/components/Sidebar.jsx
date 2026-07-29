import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  LogoMark,
  POSIcon,
  InventoryIcon,
  ReportsIcon,
  DashboardIcon,
  UsersIcon,
  LogoutIcon,
} from './icons'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, roles: ['manager'] },
  { to: '/pos', label: 'Point of Sale', icon: POSIcon, roles: ['manager', 'cashier'] },
  { to: '/inventory', label: 'Inventory', icon: InventoryIcon, roles: ['manager', 'inventory_staff'] },
  { to: '/reports', label: 'Reports', icon: ReportsIcon, roles: ['manager'] },
  { to: '/users', label: 'Users Management', icon: UsersIcon, roles: ['admin'] },
]

const roleLabels = {
  admin: 'Administrator',
  manager: 'Store Manager',
  cashier: 'Cashier',
  inventory_staff: 'Inventory Staff',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter((item) => !user || item.roles.includes(user.role))

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <LogoMark className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-base font-bold text-slate-800">WardrobeX</p>
          <p className="text-[11px] font-medium tracking-wide text-slate-400">RETAIL POS &amp; IMS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="relative border-t border-slate-100 px-3 py-3">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user?.full_name?.charAt(0) || '?'}
          </span>
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-700">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{roleLabels[user?.role] || user?.role}</p>
          </span>
        </button>

        {menuOpen && (
          <div className="absolute bottom-16 left-3 right-3 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogoutIcon className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
