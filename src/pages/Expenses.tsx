import { useState, useMemo } from 'react';
import { Plus, Zap, Droplet, Shield, Wrench, TrendingDown, Edit, Trash2, Search, X, AlertCircle, DollarSign, Lightbulb, Hammer, Home } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal, { ModalFooter } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
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
  security: '#5B5EDE',       
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
  '#F97316', '#0891B2', '#5B5EDE', '#DC2626', '#8B5CF6',
  '#10B981', '#0EA5E9', '#EC4899', '#EAB308', '#06B6D4',
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
        if (!expense.vendor.toLowerCase().includes(search) &&
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
            status: selectedExpense.status as 'PENDING' | 'APPROVED' | 'REJECTED',
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
          status: 'PENDING',
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
    setValue('vendor', expense.vendor);
    setValue('description', expense.description);
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
    <TableRow>
      <TableCell>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
      </TableCell>
      <TableCell>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28 ml-auto animate-pulse"></div>
      </TableCell>
    </TableRow>
  );

  const StatsCardSkeleton = () => (
    <Card className="bg-gradient-to-br from-gray-100 dark:from-gray-800 to-gray-100 dark:to-gray-800">
      <CardContent className="p-6">
        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3 animate-pulse"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3 animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
      </CardContent>
    </Card>
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
      <div className="space-y-6">
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

        {/* Header Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <LoadingSpinner centered />
          ) : (
            <>
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-[#DC2626] dark:text-[#EF4444]" />
                    </div>
                  </div>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-1">Total (MTD)</p>
                  <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {formatCurrency(totalExpenses)}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    {filteredAndSortedExpenses.length} transaction{filteredAndSortedExpenses.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Active Categories</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {categoryData.length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {categoriesData.length} total categories
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-success-600 dark:text-success-400" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Avg Per Transaction</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {filteredAndSortedExpenses.length > 0 ? formatCurrency(totalExpenses / filteredAndSortedExpenses.length) : formatCurrency(0)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Based on {filteredAndSortedExpenses.length} expenses
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

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
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                        onClick={(data) => handlePieChartClick(data)}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 text-center">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">💡 Click on a slice to filter expenses</p>
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
            <CardContent className="p-5">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Category Sidebar</h4>
              <div className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  ))
                ) : categoriesData.length > 0 ? (
                  categoriesData.map((category) => {
                    const amount = categoryData.find(d => d.categoryKey === category.code)?.value || 0;
                    const isSelected = selectedCategoryFilter === category.code;
                    return (
                      <div
                        key={category.code}
                        onClick={() => setSelectedCategoryFilter(isSelected ? '' : category.code)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md font-bold"
                            style={{ backgroundColor: getCategoryColor(category.code), opacity: 0.9 }}
                          >
                            {renderCategoryIcon(category.code, 'sm', true)}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                              {category.displayName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No categories available</p>
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
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                </div>
              </div>

              {/* ACTIVE FILTER INDICATORS */}
              {(searchTerm || selectedCategoryFilter) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {searchTerm && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
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
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : filteredAndSortedExpenses.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedExpenses.map((expense) => {
                      return (
                        <TableRow key={expense.publicId} className="hover:bg-[#F8FAFC] dark:hover:bg-[#020617]/50 transition-colors">
                          <TableCell>
                            <span className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{formatDate(expense.dateIncurred)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                                style={{ backgroundColor: `${getCategoryColor(expense.categoryCode)}20` }}
                              >
                                {renderCategoryIcon(expense.categoryCode, 'sm')}
                              </div>
                              <span className="font-semibold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                                {getCategoryLabel(expense.categoryCode)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">{expense.vendor}</TableCell>
                          <TableCell>
                            <span className="font-bold text-[#DC2626] dark:text-[#EF4444] text-sm">
                              {formatCurrency(expense.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-[#64748B] dark:text-[#94A3B8] truncate max-w-xs">
                              {expense.description || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end items-center">
                              <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 shadow-sm">
                                {expense.status}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditExpense(expense)}
                                aria-label="Edit"
                                className="hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget(expense);
                                  setShowDeleteModal(true);
                                }}
                                aria-label="Delete"
                                className="hover:bg-red-100 dark:hover:bg-red-900/30"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableBody>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50 border-t-2 border-gray-200 dark:border-gray-700 font-semibold hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600">
                      <TableCell className="text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest">Total</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="text-xs text-gray-700 dark:text-gray-300 text-right">{filteredAndSortedExpenses.length} items</TableCell>
                      <TableCell>
                        <span className="font-bold text-lg text-red-600 dark:text-red-400">
                          {formatCurrency(totalExpenses)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-gray-600 dark:text-gray-400">
                        Avg: {filteredAndSortedExpenses.length > 0 ? formatCurrency(totalExpenses / filteredAndSortedExpenses.length) : formatCurrency(0)}
                      </TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        title={selectedExpense ? '✏️ Edit Expense' : '➕ Add New Expense'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5 p-6 pb-24">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedExpense ? 'Update the expense details below' : 'Fill in the details to record a new expense'}
            </p>

            <Input
              label="Expense Date"
              type="date"
              error={errors.date?.message}
              {...register('date')}
              className="!bg-gray-50 dark:!bg-gray-800/50"
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
              className="!bg-gray-50 dark:!bg-gray-800/50"
            />

            <Input
              label="Vendor Name"
              placeholder="e.g., ACME Plumbing"
              error={errors.vendor?.message}
              {...register('vendor')}
              className="!bg-gray-50 dark:!bg-gray-800/50"
            />

            <Input
              label="Description"
              placeholder="e.g., Pipe repair in building"
              error={errors.description?.message}
              {...register('description')}
              className="!bg-gray-50 dark:!bg-gray-800/50"
            />

            <Input
              label="Amount (₹)"
              type="number"
              placeholder="1500"
              step="0.01"
              error={errors.amount?.message}
              {...register('amount')}
              className="!bg-gray-50 dark:!bg-gray-800/50"
            />
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit(onSubmit)}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {selectedExpense ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                {selectedExpense ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Update Expense
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </>
                )}
              </>
            )}
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
        <div className="space-y-4 p-6 pb-20">
          {deleteTarget && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
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
