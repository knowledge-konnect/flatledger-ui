import { useState } from 'react';
import { Plus, Copy, Check, Edit, Trash, AlertCircle, Users as UsersIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal, { ModalFooter } from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { formatDate } from '../lib/utils';
import { useUsers, useCreateUser } from '../hooks/useUsers';
import { usersApi } from '../api/usersApi';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { RoleId } from '../types/roles';
import { User } from '../api/usersApi';
import { AlertMessages } from '../lib/alertMessages';
import { useFlats } from '../hooks/useFlats';
import { FlatDto } from '../api/flatsApi';
import { useAuth } from '../contexts/AuthProvider';

/* =====================================================
   ROLE CONFIGURATION
===================================================== */

const ROLE_OPTIONS = [
  { value: String(RoleId.SOCIETY_ADMIN), label: 'Society Admin - Full access' },
  { value: String(RoleId.ACCOUNTANT), label: 'Accountant - Manage finances' },
  { value: String(RoleId.MEMBER), label: 'Member - Basic access' },
  { value: String(RoleId.AUDITOR), label: 'Auditor - Read-only audit access' },
];

const ROLE_ID_BADGE: Record<
  RoleId,
  { label: string; variant: 'error' | 'info' | 'default' | 'success' }
> = {
  [RoleId.SOCIETY_ADMIN]: { label: 'Society Admin', variant: 'error' },
  [RoleId.ACCOUNTANT]: { label: 'Accountant', variant: 'info' },
  [RoleId.MEMBER]: { label: 'Member', variant: 'default' },
  [RoleId.AUDITOR]: { label: 'Auditor', variant: 'success' },
};

/* =====================================================
   COMPONENT
===================================================== */

export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>(RoleId.MEMBER); // default role
  const [selectedFlatPublicId, setSelectedFlatPublicId] = useState<string>('');

  // API hooks
  const { data: usersData, isLoading, isError } = useUsers();
  const createUserMutation = useCreateUser();
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { data: flatsData = [] } = useFlats(currentUser?.societyId ? Number(currentUser.societyId) : undefined);
  const users = (usersData || []) as User[];
  const flats = (flatsData || []) as FlatDto[];

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
    if (!name.trim() || !email.trim()) {
      showToast(AlertMessages.error.fillAllFields, 'error');
      return;
    }

    try {
      const result = await createUserMutation.mutateAsync({
        name,
        email,
        password: '', // Backend will generate temporary password
        roleId: selectedRoleId,
      });

      // Show temporary password modal if available
      if (result.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
        setNewUserName(result.name);
        setNewUserEmail(result.email);
        setShowPasswordModal(true);
      }

      showToast(AlertMessages.success.userCreated, 'success');
      setShowModal(false);
      setName('');
      setEmail('');
      setMobile('');
      setSelectedRoleId(RoleId.MEMBER);
      setSelectedFlatPublicId('');
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || AlertMessages.error.userCreationFailed,
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
        showToast(AlertMessages.error.userCreationFailed, 'error');
      }
    }
  }

  /* =====================================================
     EDIT USER
  ===================================================== */

  async function handleEditUser() {
    if (!selectedUser) return;

    if (!name.trim() || !email.trim()) {
      showToast(AlertMessages.error.fillAllFields, 'error');
      return;
    }

    setIsUpdating(true);
    try {
      await usersApi.updateUser(selectedUser.publicId, {
        publicId: selectedUser.publicId,
        name,
        email,
        mobile: mobile || '', // Send empty string if mobile is not provided
        roleId: selectedRoleId,
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
      setSelectedRoleId(RoleId.MEMBER);
      setSelectedFlatPublicId('');
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || AlertMessages.error.userUpdateFailed,
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
     COPY PASSWORD TO CLIPBOARD
  ===================================================== */

  function copyPasswordToClipboard() {
    navigator.clipboard.writeText(temporaryPassword);
    setPasswordCopied(true);
    showToast(AlertMessages.success.passwordCopied, 'success');
    setTimeout(() => setPasswordCopied(false), 2000);
  }

  /* =====================================================
     CLOSE PASSWORD MODAL SAFELY
  ===================================================== */

  function handleClosePasswordModal() {
    if (!passwordCopied) {
      // Show confirmation if password hasn't been copied
      setShowConfirmDialog(true);
    } else {
      // Close directly if password was copied
      setShowPasswordModal(false);
      setPasswordCopied(false);
    }
  }

  function confirmCloseWithoutCopy() {
    setShowPasswordModal(false);
    setPasswordCopied(false);
    setShowConfirmDialog(false);
    showToast('Save this password securely before closing!', 'warning');
  }

  /* =====================================================
     UI
  ===================================================== */

  if (isLoading) {
    return (
      <DashboardLayout title="Users & Access">
        <div className="text-center py-8">Loading users...</div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout title="Users & Access">
        <div className="text-center py-8 text-red-500">Failed to load users</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Users & Access">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Users & Access"
          description="Manage user accounts and permissions"
          icon={UsersIcon}
          actions={
            <Button size="md" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
                </div>
              </div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-1">Total Users</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">{users.length}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 dark:bg-[#22C55E]/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#16A34A] dark:text-[#22C55E]" />
                </div>
              </div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-1">Active Users</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {users.filter((u: User) => u.isActive).length}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
                </div>
              </div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-1">Admins</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {users.filter((u: User) => u.roleId === RoleId.SOCIETY_ADMIN).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Team Members</CardTitle>
              <Button size="sm" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Mobile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Force Pwd</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

              <TableBody>
                {users.map((user: User) => (
                  <TableRow key={user.publicId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate max-w-[120px] lg:max-w-none">{user.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs lg:text-sm">
                      <span className="text-[#64748B] dark:text-[#94A3B8] truncate max-w-[140px] inline-block" title={user.email}>
                        {user.email}
                      </span>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-xs lg:text-sm text-[#64748B] dark:text-[#94A3B8]">
                      {user.mobile ? user.mobile : '—'}
                    </TableCell>

                    <TableCell>
                      <Badge variant={ROLE_ID_BADGE[user.roleId].variant}>
                        {ROLE_ID_BADGE[user.roleId].label}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <Badge variant={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden xl:table-cell">
                      <Badge variant={user.forcePasswordChange ? 'error' : 'success'} className="text-xs">
                        {user.forcePasswordChange ? 'Required' : 'Changed'}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden 2xl:table-cell text-xs lg:text-sm">
                      {user.lastLogin ? (
                        <span className="text-[#64748B] dark:text-[#94A3B8]">{formatDate(user.lastLogin)}</span>
                      ) : (
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Never</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Tooltip content="Edit" side="top">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => {
                              setSelectedUser(user);
                              setName(user.name);
                              setEmail(user.email);
                              setMobile(user.mobile || '');
                              setSelectedRoleId(user.roleId);
                              setIsEditing(true);
                              setShowModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content="Delete" side="top">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => {
                              setDeleteTarget(user);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setIsEditing(false);
          setSelectedUser(null);
          setName('');
          setEmail('');
          setMobile('');
          setSelectedRoleId(RoleId.MEMBER);
          setSelectedFlatPublicId('');
        }}
        title={isEditing ? 'Edit User' : 'Add User'}
      >
        <div className="space-y-4 p-6">
          {!isEditing && (
            <Select
              label="Select Flat Owner"
              value={selectedFlatPublicId}
              onChange={(e) => handleFlatSelection(e.target.value)}
              options={flatOwnerOptions.length > 0 ? flatOwnerOptions : [{ value: '', label: 'No flat owners available' }]}
            />
          )}

          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!isEditing && selectedFlatPublicId !== ''}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={!isEditing && selectedFlatPublicId !== ''}
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
            value={String(selectedRoleId)}
            onChange={(e) => setSelectedRoleId(Number(e.target.value) as RoleId)}
            options={ROLE_OPTIONS}
          />
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
              setMobile('');
              setSelectedRoleId(RoleId.MEMBER);
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

      {/* Temporary Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        title="✅ User Created Successfully"
        size="md"
      >
        <div className="space-y-3 overflow-hidden p-6">
          {/* Success Header - Compact */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 p-3 rounded-lg border-2 border-green-400 dark:border-green-600">
            <p className="text-xs font-bold text-green-900 dark:text-green-100 mb-2">📋 USER DETAILS</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded border border-green-200 dark:border-green-700">
                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Name:</span>
                <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">{newUserName}</span>
              </div>
              <div className="flex justify-between items-center bg-white dark:bg-[#020617] p-2 rounded border border-[#16A34A]/20 dark:border-[#22C55E]/20">
                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Email:</span>
                <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate ml-2">{newUserEmail}</span>
              </div>
            </div>
          </div>

          {/* Temporary Password Section - Compact */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
              🔐 TEMPORARY PASSWORD
            </p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] dark:from-[#3B82F6] dark:to-[#2563EB] px-3 py-3 rounded-lg font-mono text-xl font-bold text-center tracking-wider text-white shadow-lg border-2 border-[#1D4ED8] dark:border-[#2563EB] select-all cursor-pointer">
                {temporaryPassword}
              </div>
              <Button
                size="sm"
                onClick={copyPasswordToClipboard}
                variant={passwordCopied ? 'primary' : 'outline'}
                className={`flex-shrink-0 font-semibold text-xs ${passwordCopied ? 'bg-[#16A34A] hover:bg-[#15803D] text-white border-0' : 'border-2 border-[#E2E8F0] dark:border-[#1E293B]'}`}
              >
                {passwordCopied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">Click password or use Copy button</p>
          </div>

          {/* Important Note - Compact with better color */}
          <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border-2 border-red-400 dark:border-red-600">
            <p className="text-xs font-bold text-red-900 dark:text-red-100 mb-1.5 flex items-center gap-1">
              ⚠️ CRITICAL
            </p>
            <ul className="text-xs text-red-800 dark:text-red-200 space-y-0.5 ml-3 list-disc font-semibold">
              <li>Share password with user immediately</li>
              <li>User MUST change on first login</li>
              <li>NOT retrievable after closing</li>
              <li>Keep secure & confidential</li>
            </ul>
          </div>
        </div>

        <ModalFooter>
          <Button
            onClick={handleClosePasswordModal}
            variant="primary"
          >
            Done
          </Button>
        </ModalFooter>
      </Modal>

      {/* Confirmation Dialog - Password Not Copied */}
      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="⚠️ Password Not Copied"
        size="sm"
      >
        <div className="space-y-4 p-6">
          <p className="text-sm text-gray-900 dark:text-gray-100">
            You haven't copied the temporary password yet. Once you close this dialog, <strong>you won't be able to retrieve it</strong>.
          </p>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border-2 border-orange-400 dark:border-orange-600">
            <p className="text-xs font-semibold text-orange-900 dark:text-orange-100">
              Current Password:
            </p>
            <p className="text-sm font-mono font-bold text-orange-700 dark:text-orange-200 mt-1">
              {temporaryPassword}
            </p>
          </div>

          <p className="text-sm text-gray-900 dark:text-gray-100">
            Would you like to:
          </p>
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowConfirmDialog(false)}
          >
            ← Go Back & Copy
          </Button>
          <Button
            onClick={() => {
              copyPasswordToClipboard();
              setTimeout(() => {
                setShowPasswordModal(false);
                setShowConfirmDialog(false);
                setPasswordCopied(false);
              }, 300);
            }}
            variant="primary"
            className="flex-1"
          >
            Copy & Close
          </Button>
          <Button
            onClick={confirmCloseWithoutCopy}
            variant="danger"
          >
            Close Anyway
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4 p-6">
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
    </DashboardLayout>
  );
}
