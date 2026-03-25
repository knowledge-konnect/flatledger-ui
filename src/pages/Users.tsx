import { useState, useMemo } from 'react';
import { Plus, Edit, Trash, AlertCircle, Users as UsersIcon, Search, Copy, Check, KeyRound, UserCheck, ShieldCheck, Clock, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal, { ModalFooter } from '../components/ui/Modal';
import { formatDate } from '../lib/utils';
import { useUsers, useCreateUser } from '../hooks/useUsers';
import { usersApi } from '../api/usersApi';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { RoleCode, RoleDisplayName, ROLE_DISPLAY_TO_CODE, ROLE_LABELS, isAdminRole, collectUserRoles } from '../types/roles';
import { User } from '../api/usersApi';
import { AlertMessages } from '../lib/alertMessages';
import { useFlats } from '../hooks/useFlats';
import { FlatDto } from '../api/flatsApi';

/* =====================================================
   ROLE CONFIGURATION
===================================================== */

/** Dropdown options for the role selector — derived entirely from enums, never hardcoded */
const ROLE_OPTIONS = (Object.values(RoleCode) as RoleCode[]).map(code => ({
  value: code,
  label: ROLE_LABELS[code],
}));

/* =====================================================
   COMPONENT
===================================================== */

import { useAuth } from '../contexts/AuthProvider';

export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ loginId: string; password: string; name: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'login' | 'password' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // form state
  // General/business-rule error shown in the top banner
  const [formError, setFormError] = useState<string | null>(null);
  // Per-field inline errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleCode, setSelectedRoleCode] = useState<RoleCode>(RoleCode.VIEWER); // default role
  const [selectedFlatPublicId, setSelectedFlatPublicId] = useState<string>('');

  // API hooks
  const { data: usersData, isLoading, isError } = useUsers();
  const createUserMutation = useCreateUser();
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const queryClient = useQueryClient();
  const { data: flatsData = [] } = useFlats();
  const users = (usersData || []) as User[];
  const flats = (flatsData || []) as FlatDto[];
  const { user } = useAuth();
  const isAdmin = isAdminRole(collectUserRoles(user));

  /* =====================================================
     HELPER FUNCTIONS
  ===================================================== */

  // Auto-populate email and mobile when a flat owner is selected
  const handleFlatSelection = (flatPublicId: string) => {
    setSelectedFlatPublicId(flatPublicId);
    const selectedFlat = flats.find(f => f.publicId === flatPublicId);
    if (selectedFlat) {
      setName(selectedFlat.ownerName);
      setEmail(selectedFlat.contactEmail || '');
      setMobile(selectedFlat.contactMobile || '');
    }
  };

  // Create dropdown options from flats
  const flatOwnerOptions = flats.map(flat => ({
    value: flat.publicId,
    label: `${flat.ownerName} (${flat.flatNo})`
  }));

  /* =====================================================
     CREATE USER
  ===================================================== */

  async function createUser() {
    setFormError(null);
    setNameError(null);
    setPasswordError(null);
    if (!name.trim()) {
      setNameError('Full name is required.');
      return;
    }
    if (!email.trim() && !username.trim()) {
      setFormError('Provide an email or username — the user needs one to log in.');
      return;
    }
    if (!password.trim()) {
      setPasswordError('Password is required.');
      return;
    }

    const enteredPassword = password.trim();
    const enteredUsername = username.trim();
    try {
      const result = await createUserMutation.mutateAsync({
        name,
        email: email.trim() || undefined,
        username: enteredUsername || undefined,
        mobile: mobile || undefined,
        roleCode: selectedRoleCode,
        password: enteredPassword,
      });

      setShowModal(false);
      setName('');
      setEmail('');
      setUsername('');
      setMobile('');
      setPassword('');
      setSelectedRoleCode(RoleCode.VIEWER);
      setSelectedFlatPublicId('');
      // Show generated credentials so admin can share them with the new user
      // Priority: returned email > entered username > entered email
      setCreatedCredentials({
        loginId: result.email || enteredUsername || email.trim(),
        password: enteredPassword,
        name,
      });
      setShowCredentialsModal(true);
    } catch (error: any) {
      if (error?.response?.data) {
        // If there are no fieldErrors, treat as general error, show only in modal
        if (!error.response.data.errors || error.response.data.errors.length === 0) {
          setFormError(error.response.data.message || AlertMessages.error.userCreationFailed);
        }
        // Do NOT show toast for form errors to avoid duplicate messages
      } else {
        setFormError(AlertMessages.error.userCreationFailed);
        showToast(AlertMessages.error.userCreationFailed, 'error');
      }
    }
  }

  /* =====================================================
     EDIT USER
  ===================================================== */

  async function handleEditUser() {
    setFormError(null);
    setNameError(null);
    if (!selectedUser) return;

    if (!name.trim()) {
      setNameError('Full name is required.');
      return;
    }

    setIsUpdating(true);
    try {
      await usersApi.updateUser(selectedUser.publicId, {
        publicId: selectedUser.publicId,
        name,
        email: email.trim() || undefined,
        mobile: mobile || '',
        roleCode: selectedRoleCode,
        isActive: selectedUser.isActive,
      });

      showToast(AlertMessages.success.userUpdated, 'success');

      // Invalidate the users query to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });

      setShowModal(false);
      setIsEditing(false);
      setSelectedUser(null);
      setName('');
      setEmail('');
      setMobile('');
      setPassword('');
      setSelectedRoleCode(RoleCode.VIEWER);
      setSelectedFlatPublicId('');
    } catch (error: any) {
      if (error?.response?.data) {
        if (!error.response.data.errors || error.response.data.errors.length === 0) {
          setFormError(error.response.data.message || AlertMessages.error.userUpdateFailed);
        }
        // Do NOT show toast for form errors to avoid duplicate messages
      } else {
        setFormError(AlertMessages.error.userUpdateFailed);
        showToast(AlertMessages.error.userUpdateFailed, 'error');
      }
    } finally {
      setIsUpdating(false);
    }
  }

  /* =====================================================
     DELETE USER
  ===================================================== */

  async function handleDeleteUser() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await usersApi.deleteUser(deleteTarget.publicId);
      showToast(AlertMessages.success.userDeleted, 'success');

      // Invalidate the users query to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });

      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || AlertMessages.error.userDeleteFailed,
          code: error.response.data.code,
          fieldErrors: error.response.data.errors?.reduce(
            (acc: any, err: any) => {
              acc[err.field] = err.messages;
              return acc;
            },
            {}
          ),
          traceId: error.response.data.traceId,
        });
      } else {
        showToast(AlertMessages.error.userDeleteFailed, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  /* =====================================================
     SEARCH & FILTER
  ===================================================== */

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = searchQuery.trim().toLowerCase();
  const [sortField, setSortField] = useState<'name' | 'roleDisplayName'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (field: 'name' | 'roleDisplayName') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'roleDisplayName' }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1" />
      : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const filteredUsers = useMemo(() => {
    const filtered = users.filter(u =>
      !debouncedSearch ||
      u.name.toLowerCase().includes(debouncedSearch) ||
      u.email.toLowerCase().includes(debouncedSearch) ||
      (u.mobile || '').toLowerCase().includes(debouncedSearch) ||
      u.roleDisplayName.toLowerCase().includes(debouncedSearch)
    );
    return [...filtered].sort((a, b) => {
      const cmp = a[sortField].localeCompare(b[sortField]);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [users, debouncedSearch, sortField, sortDir]);

  /* =====================================================
     UI
  ===================================================== */

  if (isLoading) {
    return (
      <DashboardLayout title="Users & Access">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout title="Users & Access">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Failed to load users. Please try again.</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const ROLE_STYLE: Record<string, { dot: string; text: string; bg: string; border: string }> = {
    [RoleDisplayName.SOCIETY_ADMIN]: { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800/50' },
    [RoleDisplayName.ADMIN]:         { dot: 'bg-red-500',    text: 'text-red-700 dark:text-red-300',    bg: 'bg-red-50 dark:bg-red-950/40',    border: 'border-red-200 dark:border-red-800/50' },
    [RoleDisplayName.TREASURER]:     { dot: 'bg-sky-500',   text: 'text-sky-700 dark:text-sky-300',   bg: 'bg-sky-50 dark:bg-sky-950/40',   border: 'border-sky-200 dark:border-sky-800/50' },
    [RoleDisplayName.SECRETARY]:     { dot: 'bg-teal-500',   text: 'text-teal-700 dark:text-teal-300',   bg: 'bg-teal-50 dark:bg-teal-950/40',   border: 'border-teal-200 dark:border-teal-800/50' },
    [RoleDisplayName.MANAGER]:       { dot: 'bg-amber-500',  text: 'text-amber-700 dark:text-amber-300',  bg: 'bg-amber-50 dark:bg-amber-950/40',  border: 'border-amber-200 dark:border-amber-800/50' },
    [RoleDisplayName.VIEWER]:        { dot: 'bg-slate-400',  text: 'text-slate-600 dark:text-slate-300',  bg: 'bg-slate-100 dark:bg-slate-800/60', border: 'border-slate-200 dark:border-slate-700' },
  };

  const getRoleStyle = (role: string) => ROLE_STYLE[role] ?? ROLE_STYLE[RoleDisplayName.VIEWER];

  return (
    <DashboardLayout title="Users & Access">
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
<div className="space-y-4 sm:space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Users
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {users.length} {users.length === 1 ? 'member' : 'members'} · Manage accounts & permissions
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative sm:w-72">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, email, role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                />
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setShowModal(true)}
                  className="h-10 px-4 font-medium bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Total Users',
                value: users.length,
                sub: 'All members',
                icon: UsersIcon,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-100 dark:border-emerald-900/40',
              },
              {
                label: 'Active',
                value: users.filter(u => u.isActive).length,
                sub: 'Currently active',
                icon: UserCheck,
                iconBg: 'bg-teal-100 dark:bg-teal-900/40',
                iconColor: 'text-teal-600 dark:text-teal-400',
                border: 'border-teal-100 dark:border-teal-900/40',
              },
              {
                label: 'Admins',
                value: users.filter(u => u.roleDisplayName === RoleDisplayName.SOCIETY_ADMIN || u.roleDisplayName === RoleDisplayName.ADMIN).length,
                sub: 'Admin access',
                icon: ShieldCheck,
                iconBg: 'bg-red-100 dark:bg-red-900/40',
                iconColor: 'text-red-500 dark:text-red-400',
                border: 'border-red-100 dark:border-red-900/40',
              },
              {
                label: 'Pending Login',
                value: users.filter(u => u.forcePasswordChange).length,
                sub: 'Awaiting first login',
                icon: Clock,
                iconBg: 'bg-amber-100 dark:bg-amber-900/40',
                iconColor: 'text-amber-600 dark:text-amber-400',
                border: 'border-amber-100 dark:border-amber-900/40',
              },
            ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, border }) => (
              <div key={label} className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border ${border} shadow-sm flex flex-col gap-3`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                  <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Table Card ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <UsersIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">No users yet</p>
                  <p className="text-sm text-slate-400 mt-1">Add your first team member to get started</p>
                </div>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowModal(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add User
                  </Button>
                )}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <div className="text-center">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No results found</p>
                  <p className="text-sm text-slate-400 mt-1">Try a different search query</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 via-slate-50/70 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => toggleSort('name')}>
                        <span className="inline-flex items-center">User <SortIcon field="name" /></span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden lg:table-cell">Mobile</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" onClick={() => toggleSort('roleDisplayName')}>
                        <span className="inline-flex items-center justify-center">Role <SortIcon field="roleDisplayName" /></span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden xl:table-cell">Last Login</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((user: User) => {
                      const roleStyle = getRoleStyle(user.roleDisplayName);
                      const initials = user.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <tr key={user.publicId} className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all duration-200">
                          {/* User */}
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                                {user.forcePasswordChange && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending first login</span>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Email */}
                          <td className="px-6 py-3 hidden md:table-cell">
                            <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[180px] inline-block" title={user.email}>{user.email}</span>
                          </td>
                          {/* Mobile */}
                          <td className="px-6 py-3 whitespace-nowrap hidden lg:table-cell">
                            {user.mobile ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{user.mobile}</span>
                              </div>
                            ) : <span className="text-slate-400 text-sm">—</span>}
                          </td>
                          {/* Role */}
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                                {user.roleDisplayName}
                              </span>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${user.isActive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          {/* Last Login */}
                          <td className="px-6 py-3 whitespace-nowrap hidden xl:table-cell">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-6 py-3 whitespace-nowrap">
                            {isAdmin && (
                              <div className="flex gap-2 justify-center items-center">
                                <button
                                  aria-label={`Edit ${user.name}`}
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setName(user.name);
                                    setEmail(user.email);
                                    setMobile(user.mobile || '');
                                    setSelectedRoleCode(ROLE_DISPLAY_TO_CODE[user.roleDisplayName] ?? RoleCode.VIEWER);
                                    setIsEditing(true);
                                    setShowModal(true);
                                  }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  aria-label={`Delete ${user.name}`}
                                  onClick={() => { setDeleteTarget(user); setShowDeleteModal(true); }}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-110 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      {/* Add/Edit User Modal */}
      {isAdmin && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setIsEditing(false);
            setSelectedUser(null);
            setName('');
            setEmail(''); setUsername(''); setMobile('');
            setPassword('');
            setSelectedRoleCode(RoleCode.VIEWER);
            setSelectedFlatPublicId('');
            setFormError(null);
            setNameError(null);
            setPasswordError(null);
          }}
          title={isEditing ? 'Edit User' : 'Add User'}
        >
          <div className="p-4 sm:p-6 space-y-4">
            {/* ── General/Business Rule Error Banner ── */}
            {formError && (
              <div className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">{formError}</p>
                </div>
              </div>
            )}
            {!isEditing && (
              <Select
                label="Select Flat Owner"
                value={selectedFlatPublicId}
                onChange={(e) => handleFlatSelection(e.target.value)}
                options={flatOwnerOptions.length > 0 ? flatOwnerOptions : [{ value: '', label: 'No flat owners available' }]}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (nameError) setNameError(null); }}
                error={nameError ?? undefined}
                readOnly={!isEditing && selectedFlatPublicId !== ''}
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!isEditing && selectedFlatPublicId !== ''}
                placeholder={!isEditing ? 'user@example.com' : ''}
              />

              <Input
                label="Mobile Number (Optional)"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                readOnly={!isEditing && selectedFlatPublicId !== ''}
              />

              <Select
                label="Role"
                value={selectedRoleCode}
                onChange={(e) => setSelectedRoleCode(e.target.value as RoleCode)}
                options={ROLE_OPTIONS}
              />
            </div>

            {!isEditing && (
              <>
                {!email.trim() && !username.trim() && (
                  <p className="text-[11px] text-red-500 dark:text-red-400 -mt-2">
                    Email or username is required for login.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                      placeholder="e.g. john_doe"
                    />
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {username.trim()
                        ? <>Login: <span className="font-medium text-slate-600 dark:text-slate-300">{username.trim()}</span></>
                        : 'Required if no email provided.'}
                    </p>
                  </div>
                  <Input
                    label="Password"
                    type="text"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                    error={passwordError ?? undefined}
                    placeholder="Set a password for this user"
                  />
                </div>
              </>
            )}
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setIsEditing(false);
                setSelectedUser(null);
                setName('');
                setEmail('');
                setUsername('');
                setMobile('');
                setPassword('');
                setSelectedRoleCode(RoleCode.VIEWER);
                setFormError(null);
                setNameError(null);
                setPasswordError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleEditUser : createUser}
              disabled={createUserMutation.isPending || isUpdating}
            >
              {isEditing
                ? (isUpdating ? 'Updating...' : 'Update User')
                : (createUserMutation.isPending ? 'Creating...' : 'Create User')
              }
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isAdmin && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          title="Delete User"
          size="sm"
        >
          <div className="space-y-4 p-4 sm:p-6">
            {deleteTarget && (
              <>
                <p className="text-sm text-foreground">
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
                </p>

                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-2 border-red-400 dark:border-red-600">
                  <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Warning
                  </p>
                  <ul className="text-xs text-red-800 dark:text-red-200 space-y-0.5 ml-3 list-disc font-semibold">
                    <li>This action cannot be undone</li>
                    <li>User will lose access immediately</li>
                    <li>Associated data may be affected</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus:ring-red-500/50"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Created User Credentials Modal */}
      <Modal
        isOpen={showCredentialsModal}
        onClose={() => { setShowCredentialsModal(false); setCreatedCredentials(null); setCopiedField(null); }}
        title="User Created Successfully"
        size="sm"
      >
        <div className="p-4 sm:p-6 space-y-4">
          {createdCredentials && (
            <>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <KeyRound className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  Share these login credentials with <span className="font-bold">{createdCredentials.name}</span>
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                {/* Login Email / Username */}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Login (Email / Username)</p>
                    {createdCredentials.loginId ? (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{createdCredentials.loginId}</p>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400 italic">No email provided — ask backend for auto-generated username</p>
                    )}
                  </div>
                  {createdCredentials.loginId && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.loginId);
                        setCopiedField('login');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Copy login"
                    >
                      {copiedField === 'login' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  )}
                </div>

                {/* Password */}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Password</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{createdCredentials.password || <span className="text-slate-400 italic font-sans font-normal">Auto-generated — check with backend</span>}</p>
                  </div>
                  {createdCredentials.password && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.password);
                        setCopiedField('password');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Copy password"
                    >
                      {copiedField === 'password' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                The user will be prompted to change their password on first login.
              </p>
            </>
          )}
        </div>
        <ModalFooter>
          <Button onClick={() => { setShowCredentialsModal(false); setCreatedCredentials(null); setCopiedField(null); }}>
            Done
          </Button>
        </ModalFooter>
      </Modal>
      </div>
    </DashboardLayout>
  );
}
