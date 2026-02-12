import { useState } from 'react';
import { Plus, CreditCard, Search, Edit, Trash } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal, { ModalFooter } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ui/Toast';
import { useMaintenancePayments, useCreateMaintenancePayment, useUpdateMaintenancePayment, useDeleteMaintenancePayment, usePaymentModes } from '../hooks/useMaintenanceApi';
import { useFlats } from '../hooks/useFlatsApi';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';

const paymentSchema = z.object({
  flatId: z.string().min(1, 'Please select a flat'),
  amount: z.string().min(1, 'Amount is required'),
  paymentModeId: z.string().min(1, 'Please select a payment mode'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function Maintenance() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const societyId = user?.societyId ? Number(user.societyId) : undefined;

  // Fetch data
  const { data: payments = [], isLoading: paymentsLoading } = useMaintenancePayments(societyId);
  const { data: flats = [] } = useFlats(societyId);
  const { data: paymentModes = [] } = usePaymentModes();
  const createPayment = useCreateMaintenancePayment();
  const updatePayment = useUpdateMaintenancePayment();
  const deletePayment = useDeleteMaintenancePayment();

  // Ensure arrays are always arrays
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeFlats = Array.isArray(flats) ? flats : [];
  const safePaymentModes = Array.isArray(paymentModes) ? paymentModes : [];


  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      flatId: '',
      amount: '',
      paymentModeId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      if (!societyId) {
        showToast('No society selected', 'error');
        return;
      }

      if (isEditing && selectedPayment) {
        // Update payment
        await updatePayment.mutateAsync({
          publicId: selectedPayment.publicId,
          payload: {
            amount: Number(data.amount),
            paymentDate: new Date(data.paymentDate).toISOString(),
            paymentModeId: Number(data.paymentModeId),
            referenceNumber: data.referenceNumber,
            notes: data.notes,
          }
        });
        showToast('Payment updated successfully', 'success');
      } else {
        // Create payment
        await createPayment.mutateAsync({
          flatId: Number(data.flatId),
          amount: Number(data.amount),
          paymentDate: new Date(data.paymentDate).toISOString(),
          paymentModeId: Number(data.paymentModeId),
          referenceNumber: data.referenceNumber,
          notes: data.notes,
        });
        showToast('Payment recorded successfully', 'success');
      }

      setShowAddModal(false);
      setIsEditing(false);
      setSelectedPayment(null);
      reset();
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || 'Failed to save payment',
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
        showToast(error?.message || 'Failed to save payment. Please try again.', 'error');
      }
    }
  };

  const openEditModal = (payment: any) => {
    setSelectedPayment(payment);
    setIsEditing(true);
    setValue('flatId', String(payment.flatId));
    setValue('amount', String(payment.amount));
    setValue('paymentModeId', String(payment.paymentModeId));
    setValue('paymentDate', payment.paymentDate.split('T')[0]);
    setValue('referenceNumber', payment.referenceNumber || '');
    setValue('notes', payment.notes || '');
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    try {
      await deletePayment.mutateAsync(deleteTarget.publicId);
      showToast('Payment deleted successfully', 'success');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || 'Failed to delete payment',
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
        showToast(error?.message || 'Failed to delete payment. Please try again.', 'error');
      }
    }
  };

  const filteredPayments = searchQuery
    ? safePayments.filter(p =>
        (p.flatNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.recordedByName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : safePayments;

  const totalCollected = safePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <DashboardLayout title="Maintenance Payments">
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-200 dark:border-green-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 font-semibold">Total Collected</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100 mt-1">
                {formatCurrency(totalCollected)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {safePayments.length} transactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Payments This Month</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {safePayments.length}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {safePayments.length > 0 ? 'Recorded payments' : 'No payments yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Average Payment</p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {safePayments.length > 0 ? formatCurrency(totalCollected / safePayments.length) : formatCurrency(0)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Per transaction
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-lg">Payment History</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-full h-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-bold text-foreground">No payments found</h3>
                <p className="text-sm text-muted-foreground mt-2">Record your first payment to get started.</p>
                <div className="mt-4">
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>
            ) : (
              <>
              <div className="w-full overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Flat</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="hidden md:table-cell">Recorded By</TableHead>
                  <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  <TableHead className="hidden sm:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.publicId}>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground">{formatDate(payment.paymentDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary">
                        {payment.flatNumber || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-success">
                        {formatCurrency(payment.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {payment.paymentModeName || `Mode ${payment.paymentModeId}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      <span className="text-muted-foreground">
                        {payment.recordedByName || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      <span className="text-muted-foreground truncate max-w-xs">
                        {payment.notes || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm font-mono text-muted-foreground">
                        {payment.referenceNumber || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(payment)}
                          className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                          title="Edit payment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(payment);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete payment"
                        >
                          <Trash className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setIsEditing(false);
          setSelectedPayment(null);
          reset();
        }}
        title={isEditing ? "Edit Payment" : "Record Payment"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="form-group space-y-4 md:space-y-6 p-6">
          <div className="form-field">
            <Select
              label="Select Flat"
              options={[
                { value: '', label: 'Choose a flat...' },
                ...safeFlats.map(flat => ({
                  value: String(flat.id),
                  label: `${flat.flatNo} - ${flat.ownerName}`
                }))
              ]}
              error={errors.flatId?.message}
              disabled={isEditing}
              {...register('flatId')}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">Flat cannot be changed when editing a payment</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="form-field">
              <Input
                label="Amount (₹)"
                type="number"
                step="0.01"
                placeholder="5000"
                error={errors.amount?.message}
                {...register('amount')}
              />
            </div>

            <div className="form-field">
              <Input
                label="Payment Date"
                type="date"
                error={errors.paymentDate?.message}
                {...register('paymentDate')}
              />
            </div>
          </div>

          <div className="form-field">
            <Select
              label="Payment Mode"
              options={[
                { value: '', label: 'Choose a payment mode...' },
                ...safePaymentModes.map(mode => ({
                  value: String(mode.id),
                  label: mode.displayName
                }))
              ]}
              error={errors.paymentModeId?.message}
              {...register('paymentModeId')}
            />
          </div>

          <div className="form-field">
            <Input
              label="Reference Number (Optional)"
              placeholder="Transaction ID, Cheque number, etc."
              error={errors.referenceNumber?.message}
              {...register('referenceNumber')}
            />
          </div>

          <div className="form-field">
            <Input
              label="Notes (Optional)"
              placeholder="Additional notes..."
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setIsEditing(false);
                setSelectedPayment(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createPayment.isPending || updatePayment.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isSubmitting || createPayment.isPending || updatePayment.isPending 
                ? (isEditing ? 'Updating...' : 'Recording...')
                : (isEditing ? 'Update Payment' : 'Record Payment')
              }
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="Delete Payment"
        size="sm"
      >
        <div className="space-y-4 p-6">
          <p className="text-foreground">
            Are you sure you want to delete the payment for <strong>Flat {deleteTarget?.flatNumber}</strong> of <strong>{formatCurrency(deleteTarget?.amount)}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deletePayment.isPending}
            >
              <Trash className="w-4 h-4 mr-2" />
              {deletePayment.isPending ? 'Deleting...' : 'Delete Payment'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
