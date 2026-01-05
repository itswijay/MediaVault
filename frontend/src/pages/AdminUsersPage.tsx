import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Footer } from '@/components/Footer'
import {
  getAllUsers,
  updateAdminUser,
  softDeleteUser,
  hardDeleteUser,
} from '@/services/userService'
import type { User } from '@/types'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Eye,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Shield,
  User as UserIcon,
  Mail,
} from 'lucide-react'
import { formatDate } from '@/utils'
import logoImg from '../assets/mediavault.png'

interface EditingUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  isActive: boolean
}

export const AdminUsersPage = () => {
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuth()

  // State
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'' | 'user' | 'admin'>('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>(
    ''
  )

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const USERS_PER_PAGE = 10

  // Modal States
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch users
  const fetchUsers = async (page: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const isActive =
        statusFilter === 'active'
          ? true
          : statusFilter === 'inactive'
          ? false
          : undefined
      const role = roleFilter || undefined

      const data = await getAllUsers(page, USERS_PER_PAGE, role, isActive)
      setUsers(data.users)
      setCurrentPage(data.pagination.currentPage)
      setTotalPages(data.pagination.totalPages)
      setTotalItems(data.pagination.totalItems)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch users on mount and filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter, statusFilter])

  // Check if user is admin - but don't return early, set a flag
  const isAdmin = isAuthenticated && currentUser?.role === 'admin'

  // Filter users by search term (client-side)
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  // Handle edit save
  const handleSaveEdit = async () => {
    if (!editingUser) return

    setIsSavingEdit(true)
    try {
      const updatedUser = await updateAdminUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive,
      })

      if (updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? updatedUser : u))
        )
        setEditingUser(null)
        setSuccessMessage('User updated successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      let errorMsg = 'Failed to update user'
      if (err instanceof Error && err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Handle soft delete (deactivate)
  const handleDeactivate = async (userId: string) => {
    if (userId === currentUser?.id) {
      setError('You cannot deactivate your own account')
      return
    }

    if (
      !window.confirm(
        'Are you sure you want to deactivate this user? They will not be able to login.'
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await softDeleteUser(userId)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: false } : u))
      )
      setSuccessMessage('User deactivated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMsg = 'Failed to deactivate user'
      if (err instanceof Error && err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle hard delete
  const handlePermanentDelete = async (userId: string) => {
    if (userId === currentUser?.id) {
      setError('You cannot delete your own account')
      return
    }

    if (
      !window.confirm(
        'Are you sure you want to permanently delete this user? This action is irreversible and will delete all their data.'
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await hardDeleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setSuccessMessage('User permanently deleted')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      let errorMsg = 'Failed to delete user'
      if (err instanceof Error && err.message) {
        errorMsg = err.message
      }
      setError(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Show access denied if not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You need admin privileges to access this page.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-slate-800/50 border-b border-slate-700 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="MediaVault" className="h-10 w-10" />
            <h1 className="text-xl font-bold text-white">MediaVault</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">
              User Management
            </h2>
            <p className="text-slate-400">
              Manage users, roles, and account status
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="mb-8 border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <Label htmlFor="search" className="text-slate-200">
                  Search by Name or Email
                </Label>
                <Input
                  id="search"
                  placeholder="Enter name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role-filter" className="text-slate-200">
                    Filter by Role
                  </Label>
                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(e.target.value as '' | 'user' | 'admin')
                    }
                    className="mt-2 w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status-filter" className="text-slate-200">
                    Filter by Status
                  </Label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as '' | 'active' | 'inactive'
                      )
                    }
                    className="mt-2 w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table Card */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Users</CardTitle>
                  <CardDescription className="text-slate-400">
                    Total: {totalItems} users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <UserIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {searchTerm
                      ? 'No users found matching your search'
                      : 'No users found'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-slate-700 hover:bg-slate-700/30 transition"
                        >
                          <td className="px-4 py-3 text-slate-200">
                            {editingUser?.id === u.id ? (
                              <input
                                type="text"
                                value={editingUser.name}
                                onChange={(e) =>
                                  setEditingUser({
                                    ...editingUser,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white"
                              />
                            ) : (
                              u.name
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-200">
                            {editingUser?.id === u.id ? (
                              <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) =>
                                  setEditingUser({
                                    ...editingUser,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white"
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4 text-slate-500" />
                                {u.email}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingUser?.id === u.id ? (
                              <select
                                value={editingUser.role}
                                onChange={(e) =>
                                  setEditingUser({
                                    ...editingUser,
                                    role: e.target.value as 'user' | 'admin',
                                  })
                                }
                                className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                  u.role === 'admin'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}
                              >
                                {u.role === 'admin' && (
                                  <Shield className="w-3 h-3" />
                                )}
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingUser?.id === u.id ? (
                              <label className="flex items-center gap-2 text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={editingUser.isActive}
                                  onChange={(e) =>
                                    setEditingUser({
                                      ...editingUser,
                                      isActive: e.target.checked,
                                    })
                                  }
                                  className="rounded"
                                />
                                Active
                              </label>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                  u.isActive
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {u.isActive ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-sm">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {editingUser?.id === u.id ? (
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveEdit}
                                  disabled={isSavingEdit}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {isSavingEdit ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Save'
                                  )}
                                </Button>
                                <Button
                                  onClick={() => setEditingUser(null)}
                                  disabled={isSavingEdit}
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    setEditingUser({
                                      id: u.id,
                                      name: u.name,
                                      email: u.email,
                                      role: u.role as 'user' | 'admin',
                                      isActive: u.isActive,
                                    })
                                  }
                                  size="sm"
                                  variant="ghost"
                                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDeactivate(u.id)}
                                  disabled={isDeleting}
                                  size="sm"
                                  variant="ghost"
                                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                  title={
                                    u.isActive
                                      ? 'Deactivate user'
                                      : 'User already inactive'
                                  }
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : u.isActive ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() => handlePermanentDelete(u.id)}
                                  disabled={isDeleting}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Permanently delete user"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && filteredUsers.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoading}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || isLoading}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-200 hover:bg-slate-800"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
