import { useState, useMemo } from 'react';
import { Plus, Zap, Droplet, Shield, Wrench, TrendingDown, Edit, Trash2, Search, X, AlertCircle, DollarSign, Lightbulb, Hammer, Home, BarChart2, Divide } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal, { ModalFooter } from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../components/ui/Toast';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpenseCategories } from '../hooks/useExpenses';
import { ExpenseResponse } from '../api/expensesApi';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';

const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  categoryCode: z.string().min(1, 'Category is required'),
  vendor: z.string().min(1, 'Vendor name is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

// Default color palette for categories (fallback if DB doesn't provide colors)
const defaultCategoryColors: Record<string, string> = {
  electricity: '#F97316',    
  water: '#0891B2',          
  security: '#6366F1',       
  repairs: '#DC2626',       
  maintenance: '#8B5CF6',    
  utilities: '#10B981',     
  salary: '#0EA5E9',         
  other: '#EC4899',          
  others: '#EC4899',         
  miscellaneous: '#EC4899',  
};

// Icon mapping for categories
const defaultCategoryIcons: Record<string, any> = {
  electricity: Lightbulb,
  water: Droplet,
  security: Shield,
  repairs: Hammer,
  maintenance: Wrench,
  utilities: Zap,
  salary: DollarSign,
  other: Home,
  others: Home,
};

// List of colors to cycle through for unmapped categories
const colorPalette = [
  '#F97316', '#0891B2', '#6366F1', '#DC2626', '#8B5CF6',
  '#10B981', '#0EA5E9', '#EC4899', '#F59E0B', '#06B6D4',
  '#A855F7', '#F43F5E', '#14B8A6', '#6366F1', '#D946EF',
];

export default function Expenses() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().substring(0, 10));
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseResponse | null>(null);

  // API hooks
  const { data: expensesData = [], isLoading, isError } = useExpenses();
  const { data: categoriesData = [] } = useExpenseCategories();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  /* =====================================================
     HELPER FUNCTIONS
  ===================================================== */

  // Build dynamic color map from categories
  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = { ...defaultCategoryColors };
    
    categoriesData.forEach((category, index) => {
      const code = category.code.toLowerCase();
      // Use default color if exists, otherwise pick from palette
      if (!map[code]) {
        map[code] = colorPalette[index % colorPalette.length];
      }
    });
    
    return map;
  }, [categoriesData]);

  // Build dynamic icon map from categories
  const categoryIconMap = useMemo(() => {
    const map: Record<string, any> = { ...defaultCategoryIcons };
    
    categoriesData.forEach((category) => {
      const code = category.code.toLowerCase();
      // If not in default map, use Home icon
      if (!map[code]) {
        map[code] = Home;
      }
    });
    
    return map;
  }, [categoriesData]);

  const getCategoryLabel = (code: string): string => {
    const category = categoriesData.find(c => c.code === code);
    return category?.displayName || code;
  };

  const getCategoryColor = (code: string): string => {
    return categoryColorMap[code.toLowerCase()] || '#6b7280';
  };

  const getCategoryIcon = (code: string): any => {
    return categoryIconMap[code.toLowerCase()] || Home;
  };

  const renderCategoryIcon = (code: string, size: 'sm' | 'md' = 'md', useWhite: boolean = false) => {
    const Icon = getCategoryIcon(code);
    const color = getCategoryColor(code);
    const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    const iconColor = useWhite ? 'white' : color;
    return <Icon className={`${sizeClass} transition-colors`} style={{ color: iconColor, strokeWidth: 2.5 }} />;
  };

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expensesData.filter(expense => {
      // Date range filter
      const expenseDate = expense.dateIncurred.substring(0, 10);
      if (expenseDate < startDate || expenseDate > endDate) return false;

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!expense.vendor?.toLowerCase().includes(search) &&
            !expense.description?.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategoryFilter && expense.categoryCode !== selectedCategoryFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.dateIncurred).getTime() - new Date(b.dateIncurred).getTime());
        break;
      case 'date-desc':
      default:
        filtered.sort((a, b) => new Date(b.dateIncurred).getTime() - new Date(a.dateIncurred).getTime());
        break;
    }

    return filtered;
  }, [startDate, endDate, searchTerm, sortBy, selectedCategoryFilter, expensesData]);

  const totalExpenses = filteredAndSortedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryData = Object.entries(
    filteredAndSortedExpenses.reduce((acc, expense) => {
      acc[expense.categoryCode] = (acc[expense.categoryCode] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([categoryCode, value]) => ({
    name: getCategoryLabel(categoryCode),
    value,
    color: getCategoryColor(categoryCode),
    categoryKey: categoryCode,
  }));

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      if (selectedExpense) {
        // Update
        await updateMutation.mutateAsync({
          publicId: selectedExpense.publicId,
          payload: {
            date: data.date,
            categoryCode: data.categoryCode,
            vendor: data.vendor,
            description: data.description,
            amount: Number(data.amount),
          },
        });
        showToast('Expense updated successfully', 'success');
      } else {
        // Create
        await createMutation.mutateAsync({
          date: data.date,
          categoryCode: data.categoryCode,
          vendor: data.vendor,
          description: data.description,
          amount: Number(data.amount),
        });
        showToast('Expense added successfully', 'success');
      }

      handleCloseModal();
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || 'Error saving expense',
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
        showToast('Error saving expense', 'error');
      }
    }
  };

  const handleEditExpense = (expense: ExpenseResponse) => {
    setSelectedExpense(expense);
    setValue('date', expense.dateIncurred);
    setValue('categoryCode', expense.categoryCode);
    setValue('vendor', expense.vendor ?? '');
    setValue('description', expense.description ?? '');
    setValue('amount', String(expense.amount));
    setShowAddModal(true);
  };

  const handleDeleteExpense = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.publicId);
      showToast('Expense deleted successfully', 'success');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: any) {
      if (error?.response?.data) {
        showErrorToast({
          ok: false,
          message: error.response.data.message || 'Error deleting expense',
          code: error.response.data.code,
          traceId: error.response.data.traceId,
        });
      } else {
        showToast('Error deleting expense', 'error');
      }
    }
  };

  const handlePieChartClick = (data: any) => {
    const categoryKey = categoryData.find(d => d.name === data.name)?.categoryKey;
    if (categoryKey) {
      setSelectedCategoryFilter(selectedCategoryFilter === categoryKey ? '' : categoryKey);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedExpense(null);
    reset();
  };

  /* =====================================================
     SKELETON LOADER COMPONENT
  ===================================================== */

  const SkeletonRow = () => (
    <tr>
      <td className="px-6 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse"></div></td>
      <td className="px-6 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div></td>
      <td className="px-6 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div></td>
      <td className="px-6 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div></td>
      <td className="px-6 py-3 hidden sm:table-cell"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20 animate-pulse"></div></td>
      <td className="px-6 py-3"><div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto animate-pulse"></div></td>
    </tr>
  );

  /* =====================================================
     LOADING & ERROR STATES
  ===================================================== */

  if (isError) {
    return (
      <DashboardLayout title="Expenses">
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-semibold">Failed to load expenses</p>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">Please try refreshing the page</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  /* =====================================================
     EMPTY STATE COMPONENT
  ===================================================== */

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <TrendingDown className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No expenses found</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-sm text-center">
        {searchTerm ? 'No expenses match your search. Try adjusting your filters.' : 'Start tracking expenses to get insights into your spending patterns.'}
      </p>
      {!searchTerm && (
        <Button onClick={() => {
          setSelectedExpense(null);
          reset();
          setShowAddModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Expense
        </Button>
      )}
    </div>
  );

  return (
    <DashboardLayout title="Expenses">
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Expenses"
          description="Track and manage society expenses"
          icon={TrendingDown}
          actions={
            <Button size="md" onClick={() => {
              setSelectedExpense(null);
              reset();
              setShowAddModal(true);
            }}>
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          }
        />

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-red-100 dark:border-red-900/40 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses (MTD)</p>
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{filteredAndSortedExpenses.length} transaction{filteredAndSortedExpenses.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/40 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Categories</p>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{categoryData.length}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{categoriesData.length} total categories</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-teal-100 dark:border-teal-900/40 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Per Transaction</p>
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                  <Divide className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{filteredAndSortedExpenses.length > 0 ? formatCurrency(totalExpenses / filteredAndSortedExpenses.length) : formatCurrency(0)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Based on {filteredAndSortedExpenses.length} expenses</p>
              </div>
            </div>
          </div>
        )}

        {/* Breakdown Chart and Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-bold mb-1">Spending Breakdown</CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">By category</p>
                </div>
                <div className="flex gap-2 items-center text-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {categoryData.length > 0 ? (
                <>
                  <ReactApexChart
                    type="donut"
                    height={320}
                    series={categoryData.map((d: any) => d.value)}
                    options={{
                      chart: {
                        background: 'transparent',
                        events: {
                          dataPointSelection: (_: any, __: any, config: any) => {
                            const entry = categoryData[config.dataPointIndex];
                            if (entry) handlePieChartClick(entry);
                          },
                        },
                      },
                      labels: categoryData.map((d: any) => d.name),
                      colors: categoryData.map((d: any) => d.color),
                      legend: { position: 'bottom', fontSize: '12px' },
                      dataLabels: {
                        enabled: true,
                        formatter: (val: number) => `${val.toFixed(0)}%`,
                      },
                      plotOptions: { pie: { donut: { size: '55%' } } },
                      tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
                    }}
                  />
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700 text-center">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">💡 Click on a slice to filter expenses</p>
                  </div>

                  {/* Quick Stats Below Chart */}
                  {filteredAndSortedExpenses.length > 0 && (
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Highest</p>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                          {formatCurrency(Math.max(...filteredAndSortedExpenses.map(e => e.amount)))}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg border border-cyan-200 dark:border-cyan-700">
                        <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 mb-1">Average</p>
                        <p className="text-sm font-bold text-cyan-900 dark:text-cyan-100">
                          {formatCurrency(totalExpenses / filteredAndSortedExpenses.length)}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Count</p>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                          {filteredAndSortedExpenses.length}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-[320px]">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No data available for this date range</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <div className="px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Categories</p>
              <div className="flex items-center gap-3">
                {totalExpenses > 0 && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpenses)}</span>
                )}
                {selectedCategoryFilter && (
                  <button onClick={() => setSelectedCategoryFilter('')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Clear</button>
                )}
              </div>
            </div>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-1.5">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  ))
                ) : categoriesData.length > 0 ? (
                  categoriesData.map((category) => {
                    const amount = categoryData.find(d => d.categoryKey === category.code)?.value || 0;
                    const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    const isSelected = selectedCategoryFilter === category.code;
                    const color = getCategoryColor(category.code);
                    return (
                      <div
                        key={category.code}
                        onClick={() => setSelectedCategoryFilter(isSelected ? '' : category.code)}
                        className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-150 border ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}22` }}
                        >
                          {renderCategoryIcon(category.code, 'sm')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{category.displayName}</span>
                            <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700 mt-1 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No categories available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold mb-1">Recent Expenses</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage and track all your expenses</p>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search vendor, notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    />
                  </div>
                  <Select
                    options={[
                      { value: 'date-desc', label: 'Newest' },
                      { value: 'date-asc', label: 'Oldest' },
                      { value: 'amount-desc', label: 'Highest' },
                      { value: 'amount-asc', label: 'Lowest' },
                    ]}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="!py-2 text-sm"
                  />
                  <Button size="sm" onClick={() => { setSelectedExpense(null); reset(); setShowAddModal(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Expense
                  </Button>
                </div>
              </div>

              {/* ACTIVE FILTER INDICATORS */}
              {(searchTerm || selectedCategoryFilter) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {searchTerm && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                      <Search className="w-3 h-3" />
                      Search: "{searchTerm}"
                      <button onClick={() => setSearchTerm('')} className="ml-1 hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {selectedCategoryFilter && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                      <span>{getCategoryLabel(selectedCategoryFilter)}</span>
                      <button onClick={() => setSelectedCategoryFilter('')} className="ml-1 hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategoryFilter('');
                    }}
                    className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 via-slate-50/70 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Added By</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredAndSortedExpenses.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 via-slate-50/70 to-slate-50 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">Added By</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAndSortedExpenses.map((expense) => (
                      <tr key={expense.publicId} className="group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-purple-50/50 dark:hover:from-emerald-950/20 dark:hover:to-purple-950/20 transition-all duration-200">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(expense.dateIncurred)}</span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{getCategoryLabel(expense.categoryCode)}</span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{expense.vendor}</div>
                          {expense.description && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{expense.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(expense.amount)}</span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{expense.createdByName || '—'}</span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex gap-2 justify-center items-center">
                            <button
                              aria-label="Edit expense"
                              onClick={() => handleEditExpense(expense)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                         bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110
                                         dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50
                                         focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              aria-label="Delete expense"
                              onClick={() => { setDeleteTarget(expense); setShowDeleteModal(true); }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                         bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-110
                                         dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50
                                         focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700/50 border-t-2 border-slate-200 dark:border-slate-700">
                      <td className="px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Total</td>
                      <td className="px-6 py-3 text-xs text-slate-400">{filteredAndSortedExpenses.length} items</td>
                      <td className="px-6 py-3"></td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpenses)}</span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400 dark:text-slate-500 hidden sm:table-cell">
                        Avg: {filteredAndSortedExpenses.length > 0 ? formatCurrency(totalExpenses / filteredAndSortedExpenses.length) : formatCurrency(0)}
                      </td>
                      <td className="px-6 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-6">
            {/* Left column */}
            <div className="space-y-4">
              <Input
                label="Expense Date"
                type="date"
                error={errors.date?.message}
                {...register('date')}
              />
              <Select
                label="Category"
                options={[
                  { value: '', label: 'Select a category...' },
                  ...categoriesData.map((cat) => ({
                    value: cat.code,
                    label: cat.displayName,
                  })),
                ]}
                error={errors.categoryCode?.message}
                {...register('categoryCode')}
              />
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="1500"
                step="0.01"
                error={errors.amount?.message}
                {...register('amount')}
              />
            </div>
            {/* Right column */}
            <div className="space-y-4">
              <Input
                label="Vendor Name"
                placeholder="e.g., ACME Plumbing"
                error={errors.vendor?.message}
                {...register('vendor')}
              />
              <Input
                label="Description"
                placeholder="e.g., Pipe repair in building"
                error={errors.description?.message}
                {...register('description')}
              />
            </div>
          </div>
        </form>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseModal}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {selectedExpense ? 'Updating...' : 'Adding...'}
              </>
            ) : selectedExpense ? 'Update Expense' : 'Add Expense'}
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
        title="🗑️ Delete Expense"
        size="sm"
      >
        <div className="space-y-4 p-4 sm:p-6 pb-20">
          {deleteTarget && (
            <>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  You're about to delete this expense:
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{deleteTarget.vendor}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(deleteTarget.dateIncurred)}</p>
                  </div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(deleteTarget.amount)}</p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                <p className="text-xs font-bold text-red-900 dark:text-red-100 mb-1">⚠️ Warning</p>
                <p className="text-xs text-red-800 dark:text-red-200">This action cannot be undone. The expense will be permanently deleted.</p>
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
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteExpense}
            disabled={deleteMutation.isPending}
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500 dark:text-red-400"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-red-600 border-t-transparent rounded-full animate-spin dark:border-red-400"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
