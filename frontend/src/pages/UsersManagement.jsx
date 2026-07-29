import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { PlusIcon, CloseIcon, TrashIcon, EditIcon } from '../components/icons'

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  cashier: 'Cashier',
  inventory_staff: 'Inventory Staff',
}

const emptyForm = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  role: 'cashier',
}

const emptyEditForm = {
  full_name: '',
  username: '',
  email: '',
  password: '',
  role: 'cashier',
}

export default function UsersManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busyId, setBusyId] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [deletingUser, setDeletingUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/users')
      setUsers(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await apiClient.post('/users', form)
      setMessage('User created successfully')
      setForm(emptyForm)
      setShowForm(false)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user')
    }
  }

  async function toggleStatus(user) {
    setBusyId(user.user_id)
    setError('')
    try {
      await apiClient.patch(`/users/${user.user_id}/status`, {
        is_active: !user.is_active,
      })
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user status')
    } finally {
      setBusyId(null)
    }
  }

  function openEdit(user) {
    setError('')
    setMessage('')
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    })
  }

  function closeEdit() {
    setEditingUser(null)
    setEditForm(emptyEditForm)
  }

  function handleEditChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editingUser) return
    setError('')
    setMessage('')
    setBusyId(editingUser.user_id)
    try {
      const payload = { ...editForm }
      if (!payload.password) delete payload.password
      await apiClient.patch(`/users/${editingUser.user_id}`, payload)
      setMessage('User updated successfully')
      closeEdit()
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingUser) return
    setError('')
    setMessage('')
    setBusyId(deletingUser.user_id)
    try {
      await apiClient.delete(`/users/${deletingUser.user_id}`)
      setMessage('User deleted successfully')
      setDeletingUser(null)
      loadUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user')
      setDeletingUser(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Users Management</h2>
          <p className="text-sm text-slate-400">{users.length} registered accounts</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showForm ? <CloseIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Full Name</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Employee ID / Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Temporary Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="cashier">Cashier</option>
              <option value="inventory_staff">Inventory Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2">
            <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Create Account
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No user accounts found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.user_id}>
                <td className="px-4 py-3 font-medium text-slate-700">{u.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3 text-slate-500">{roleLabels[u.role] || u.role}</td>
                <td className="px-4 py-3">
                  {u.is_active ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">Active</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      disabled={busyId === u.user_id}
                      title="Edit user"
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={busyId === u.user_id || u.user_id === currentUser?.user_id}
                      title={u.user_id === currentUser?.user_id ? "You can't deactivate your own account" : undefined}
                      className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                        u.is_active
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeletingUser(u)}
                      disabled={busyId === u.user_id || u.user_id === currentUser?.user_id}
                      title={u.user_id === currentUser?.user_id ? "You can't delete your own account" : 'Delete user'}
                      className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-100 disabled:opacity-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Edit User</h3>
              <button onClick={closeEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Full Name</label>
                <input
                  required
                  value={editForm.full_name}
                  onChange={(e) => handleEditChange('full_name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Username</label>
                <input
                  required
                  value={editForm.username}
                  onChange={(e) => handleEditChange('username', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editForm.password}
                  onChange={(e) => handleEditChange('password', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => handleEditChange('role', e.target.value)}
                  disabled={editingUser.user_id === currentUser?.user_id}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="cashier">Cashier</option>
                  <option value="inventory_staff">Inventory Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === editingUser.user_id}
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-800">Delete this user?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently remove <span className="font-medium text-slate-700">{deletingUser.full_name}</span>'s
              account ({roleLabels[deletingUser.role] || deletingUser.role}). This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={busyId === deletingUser.user_id}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
