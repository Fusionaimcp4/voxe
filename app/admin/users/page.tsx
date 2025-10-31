"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Crown,
  Zap,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Building,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { UserRole, SubscriptionTier, SubscriptionStatus } from '@/lib/generated/prisma';

interface User {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  avatarUrl: string | null;
  demos: { id: string; businessName: string }[];
  workflows: { id: string; name: string }[];
}

interface UserFilters {
  search: string;
  role: string;
  tier: string;
  status: string;
  verified: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleConfig = {
  USER: { label: 'User', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: Users },
  ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Shield },
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: ShieldCheck }
};

const tierConfig = {
  FREE: { label: 'Free', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: Zap },
  STARTER: { label: 'Starter', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300', icon: Crown },
  TEAM: { label: 'Team', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Crown },
  BUSINESS: { label: 'Business', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Crown },
  ENTERPRISE: { label: 'Enterprise', color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900 dark:to-orange-900 dark:text-amber-300', icon: Crown }
};

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  EXPIRED: { label: 'Expired', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    tier: '',
    status: '',
    verified: ''
  });
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, filters, sortField, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField,
        sortOrder,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: data.totalPages
        }));
      } else {
        setError(data.error || 'Failed to fetch users');
        toast.error('Failed to fetch users', { description: data.error });
      }
    } catch (error) {
      setError('Failed to fetch users');
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    // Convert "all" to empty string for API compatibility
    const apiValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: apiValue }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleSuspendUser = async (user: User) => {
    setSaving(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionStatus: user.subscriptionStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`User ${user.subscriptionStatus === 'SUSPENDED' ? 'activated' : 'suspended'} successfully`);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!selectedUser) return;
    
    setSaving(selectedUser.id);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditDialog(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    setSaving(selectedUser.id);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('User deleted successfully');
        setShowDeleteDialog(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setSaving(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage platform users, roles, and subscription tiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pagination.total}</p>
              </div>
              <Users className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.subscriptionStatus === 'ACTIVE').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Verified Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.isVerified).length}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Suspended Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.subscriptionStatus === 'SUSPENDED').length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-slate-700 dark:text-slate-300">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or company..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 border-slate-300 focus:border-slate-400 bg-white text-slate-900 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">Role</Label>
                <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                  <SelectTrigger className="border-slate-300 bg-white text-slate-900">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tier" className="text-slate-700 dark:text-slate-300">Subscription Tier</Label>
                <Select value={filters.tier} onValueChange={(value) => handleFilterChange('tier', value)}>
                  <SelectTrigger className="border-slate-300 bg-white text-slate-900">
                    <SelectValue placeholder="All tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tiers</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="TEAM">Team</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="border-slate-300 bg-white text-slate-900">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="verified" className="text-slate-700 dark:text-slate-300">Verification</Label>
                <Select value={filters.verified} onValueChange={(value) => handleFilterChange('verified', value)}>
                  <SelectTrigger className="border-slate-300 bg-white text-slate-900">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="true">Verified only</SelectItem>
                    <SelectItem value="false">Unverified only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="name">User</SortButton>
                  </th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="email">Email</SortButton>
                  </th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="role">Role</SortButton>
                  </th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="subscriptionTier">Tier</SortButton>
                  </th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="subscriptionStatus">Status</SortButton>
                  </th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="isVerified">Verified</SortButton>
                  </th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="lastLoginAt">Last Login</SortButton>
                  </th>
                  <th className="text-left p-3 text-slate-700 dark:text-slate-300">
                    <SortButton field="createdAt">Joined</SortButton>
                  </th>
                  <th className="text-right p-3 text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const RoleIcon = roleConfig[user.role].icon;
                  const tierConfigItem = tierConfig[user.subscriptionTier];
                  const TierIcon = tierConfigItem?.icon || Crown;
                  
                  return (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback className="bg-slate-100 text-slate-700">{getInitials(user.name, user.email)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {user.name || 'No name'}
                            </p>
                            {user.company && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {user.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900 dark:text-slate-100">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge className={roleConfig[user.role].color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleConfig[user.role].label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={tierConfigItem?.color || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}>
                          <TierIcon className="h-3 w-3 mr-1" />
                          {tierConfigItem?.label || user.subscriptionTier}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={statusConfig[user.subscriptionStatus].color}>
                          {statusConfig[user.subscriptionStatus].label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {user.isVerified ? (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <ShieldX className="h-4 w-4 text-red-600" />
                          )}
                          <span className={user.isVerified ? 'text-green-600' : 'text-red-600'}>
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-slate-100 text-slate-900">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                                {user.subscriptionStatus === 'SUSPENDED' ? (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate User
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information, role, and subscription details.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSave={handleUpdateUser}
              onCancel={() => setShowEditDialog(false)}
              saving={saving === selectedUser.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              {selectedUser && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {selectedUser.name || selectedUser.email}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    This will permanently delete the user and all associated data.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={saving === selectedUser?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={saving === selectedUser?.id}
            >
              {saving === selectedUser?.id ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform with appropriate role and subscription tier.
            </DialogDescription>
          </DialogHeader>
          <CreateUserForm
            onSave={() => {
              setShowCreateDialog(false);
              fetchUsers();
            }}
            onCancel={() => setShowCreateDialog(false)}
            saving={saving !== null}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Edit User Form Component
function EditUserForm({ 
  user, 
  onSave, 
  onCancel, 
  saving 
}: { 
  user: User; 
  onSave: (data: Partial<User>) => void; 
  onCancel: () => void; 
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    company: user.company || '',
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    isVerified: user.isVerified
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="User's full name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="user@example.com"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          placeholder="Company name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tier">Subscription Tier</Label>
          <Select value={formData.subscriptionTier} onValueChange={(value: SubscriptionTier) => setFormData(prev => ({ ...prev, subscriptionTier: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="STARTER">Starter</SelectItem>
              <SelectItem value="TEAM">Team</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
              <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.subscriptionStatus} onValueChange={(value: SubscriptionStatus) => setFormData(prev => ({ ...prev, subscriptionStatus: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="verified"
            checked={formData.isVerified}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVerified: checked }))}
          />
          <Label htmlFor="verified">Email Verified</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Create User Form Component
function CreateUserForm({ 
  onSave, 
  onCancel, 
  saving 
}: { 
  onSave: () => void; 
  onCancel: () => void; 
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: 'USER' as UserRole,
    subscriptionTier: 'FREE' as SubscriptionTier,
    subscriptionStatus: 'ACTIVE' as SubscriptionStatus,
    password: '',
    isVerified: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('User created successfully');
        onSave();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="User's full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="user@example.com"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          placeholder="Company name"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          placeholder="Temporary password"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tier">Subscription Tier</Label>
          <Select value={formData.subscriptionTier} onValueChange={(value: SubscriptionTier) => setFormData(prev => ({ ...prev, subscriptionTier: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="STARTER">Starter</SelectItem>
              <SelectItem value="TEAM">Team</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
              <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="verified"
          checked={formData.isVerified}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVerified: checked }))}
        />
        <Label htmlFor="verified">Email Verified</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Creating...' : 'Create User'}
        </Button>
      </DialogFooter>
    </form>
  );
}
