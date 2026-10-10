import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ModalFooter } from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Select from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import { useCreateMaintenancePayment, useIncomePayments, usePaymentModes } from '../hooks/useBilling';
import { useFlats } from '../hooks/useFlats';

function getFYStartDateString(): string {
    const now = new Date();
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${fyStartYear}-04-01`;
}

function getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
}

function getCurrentPeriodString(): string {
    return new Date().toISOString().slice(0, 7);
}

function shiftPeriod(period: string, direction: number): string {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(value || 0);
}

const incomeTypeOptions = [
    { value: 'lift_usage_charges', label: 'Lift usage charges' },
    { value: 'parking_income', label: 'Parking income' },
    { value: 'bank_interest', label: 'Bank interest' },
    { value: 'other_income', label: 'Other income' },
];

const incomeTypeLabels: Record<string, string> = incomeTypeOptions.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {} as Record<string, string>);

const incomeSchema = z.object({
    flatPublicId: z.string().optional(),
    category: z.string().min(1, 'Please select a type'),
    amount: z.string()
        .min(1, 'Amount is required')
        .refine(val => Number(val) > 0, { message: 'Amount must be greater than ₹0' }),
    paymentModeId: z.string().min(1, 'Please select a payment mode'),
    paymentDate: z.string()
        .min(1, 'Payment date is required')
        .refine(val => new Date(val) <= new Date(), { message: 'Payment date cannot be in the future' }),
    referenceNumber: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
});

type IncomeForm = z.infer<typeof incomeSchema>;

export default function Income() {
    const { data: flats = [] } = useFlats();
    const { data: paymentModes = [] } = usePaymentModes();
    const createPayment = useCreateMaintenancePayment();
    const { showToast } = useToast();
    const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriodString());
    const [draftPeriod, setDraftPeriod] = useState(getCurrentPeriodString());
    const [showAddModal, setShowAddModal] = useState(false);
    const { data: incomePayments = [] } = useIncomePayments(
        selectedPeriod,
        1,
        200
    );

    const incomeRows = useMemo(() => {
        return [...incomePayments]
            .filter((payment) => {
                const category = (payment.category ?? 'maintenance').trim().toLowerCase();
                return category !== 'maintenance' && category.length > 0;
            })
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [incomePayments]);

    const filteredIncomeRows = useMemo(() => {
        return incomeRows;
    }, [incomeRows]);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<IncomeForm>({
        resolver: zodResolver(incomeSchema),
        defaultValues: {
            flatPublicId: '',
            category: 'lift_usage_charges',
            amount: '',
            paymentModeId: '',
            paymentDate: new Date().toISOString().split('T')[0],
            referenceNumber: '',
            notes: '',
        }
    });

    const onSubmit = async (data: IncomeForm) => {
        try {
            await createPayment.mutateAsync({
                payload: {
                    flatPublicId: data.flatPublicId || '',
                    amount: Number(data.amount),
                    paymentDate: new Date(data.paymentDate).toISOString(),
                    paymentModeId: data.paymentModeId,
                    paymentModeCode: data.paymentModeId,
                    referenceNumber: data.referenceNumber || undefined,
                    notes: data.notes || undefined,
                    category: data.category,
                }
            });
            showToast('Income recorded', 'success');
            setShowAddModal(false);
            reset();
        } catch (err: any) {
            showToast(err?.message || 'Failed to record income', 'error');
        }
    };

    return (
        <DashboardLayout title="Income">
            <div className="space-y-5">
                <PageHeader
                    title="Income"
                    description="Track non-maintenance society income such as lift charges, parking, bank interest, and one-time receipts."
                />

                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="flex items-end gap-3">
                            <div className="min-w-[220px]">
                                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="rounded-lg border border-border bg-background p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                                        onClick={() => setDraftPeriod((current) => shiftPeriod(current, -1))}
                                        aria-label="Previous month"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="month"
                                        value={draftPeriod}
                                        onChange={(event) => setDraftPeriod(event.target.value)}
                                        className="input"
                                    />
                                    <button
                                        type="button"
                                        className="rounded-lg border border-border bg-background p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                                        onClick={() => setDraftPeriod((current) => shiftPeriod(current, 1))}
                                        aria-label="Next month"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <Button variant="primary" onClick={() => setSelectedPeriod(draftPeriod)}>
                                Apply
                            </Button>
                        </div>

                        <Button variant="primary" onClick={() => setShowAddModal(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Income
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="flex flex-col gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Income Records</h3>
                            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                {filteredIncomeRows.length} {filteredIncomeRows.length === 1 ? 'entry' : 'entries'}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-emerald-800 dark:bg-emerald-950 border-b border-emerald-700 dark:border-emerald-900 divide-x divide-emerald-700 dark:divide-emerald-900">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">Flat</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider whitespace-nowrap">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">Mode</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">Reference</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-100 dark:text-slate-100 uppercase tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredIncomeRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                            No income found for the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredIncomeRows.map((income) => (
                                        <tr key={income.publicId} className="group hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200 divide-x divide-slate-100 dark:divide-slate-800">
                                            <td className="px-6 py-3 whitespace-nowrap align-middle text-sm text-slate-700 dark:text-slate-300">
                                                {new Date(income.paymentDate).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap align-middle">
                                                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                    {incomeTypeLabels[(income.category ?? '').toLowerCase()] ?? 'Other income'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap align-middle text-sm font-medium text-slate-900 dark:text-slate-100">
                                                {income.flatNumber || 'Society'}
                                            </td>
                                            <td className="px-6 py-3 text-right align-middle whitespace-nowrap text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                {formatCurrency(income.amount)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap align-middle text-sm text-slate-700 dark:text-slate-300">
                                                {income.paymentModeName || '-'}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap align-middle text-sm text-slate-700 dark:text-slate-300">
                                                {income.referenceNumber || '-'}
                                            </td>
                                            <td className="px-6 py-3 max-w-xs align-middle text-sm text-slate-600 dark:text-slate-300">
                                                <span className="block truncate">{income.notes || '-'}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Income" size="md">
                <form id="income-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="form-field md:col-span-2">
                            <label className="label">Flat / Unit (Optional)</label>
                            <select className="input" {...register('flatPublicId')}>
                                <option value="">Society-level income</option>
                                {flats.map((flat) => (
                                    <option key={flat.publicId} value={flat.publicId}>{flat.flatNo} · {flat.ownerName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field md:col-span-2">
                            <Select
                                label="Income Type"
                                options={[{ value: '', label: 'Select income type' }, ...incomeTypeOptions]}
                                error={errors.category?.message}
                                {...register('category')}
                            />
                        </div>

                        <div className="form-field">
                            <Input label="Amount" placeholder="₹ 5000" error={errors.amount?.message} {...register('amount')} />
                        </div>

                        <div className="form-field">
                            <Select
                                label="Payment Method"
                                options={[{ value: '', label: 'Select payment method' }, ...paymentModes.map((mode) => ({ value: mode.code, label: mode.displayName }))]}
                                error={errors.paymentModeId?.message}
                                {...register('paymentModeId')}
                            />
                        </div>

                        <div className="form-field">
                            <Input label="Received Date" type="date" min={getFYStartDateString()} max={getTodayDateString()} error={errors.paymentDate?.message} {...register('paymentDate')} />
                        </div>

                        <div className="form-field">
                            <Input label="Reference No. / Cheque No." placeholder="Optional" error={errors.referenceNumber?.message} {...register('referenceNumber')} />
                        </div>

                        <div className="form-field md:col-span-2">
                            <Input label="Notes" placeholder="Optional notes or remarks" {...register('notes')} />
                        </div>
                    </div>
                </form>

                <ModalFooter>
                    <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="income-form" variant="primary" isLoading={isSubmitting}>
                        Save Income
                    </Button>
                </ModalFooter>
            </Modal>
        </DashboardLayout>
    );
}
