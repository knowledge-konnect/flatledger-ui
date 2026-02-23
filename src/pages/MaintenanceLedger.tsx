import { useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { useFlatLedger } from '../hooks/useFlats';
import { useNavigate } from 'react-router-dom';

function normalizeStatus(status?: string) {
  return (status || '').trim().toLowerCase();
}

function getStatusBadgeVariant(status?: string): 'success' | 'warning' | 'error' | 'neutral' {
  const normalized = normalizeStatus(status);
  if (normalized === 'paid') return 'success';
  if (normalized === 'partial') return 'warning';
  if (normalized === 'unpaid') return 'error';
  return 'neutral';
}

function getStatusLabel(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === 'paid') return 'Paid';
  if (normalized === 'partial') return 'Partial';
  if (normalized === 'unpaid') return 'Unpaid';
  return status || 'Unknown';
}

export default function MaintenanceLedger() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { data: ledger, isLoading, error, refetch, isRefetching } = useFlatLedger(publicId);

  if (isLoading) {
    return (
      <DashboardLayout title="Maintenance Ledger">
        <LoadingSpinner centered />
      </DashboardLayout>
    );
  }

  if (error || !ledger) {
    return (
      <DashboardLayout title="Maintenance Ledger">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Unable to Load Ledger
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {error instanceof Error ? error.message : 'Failed to fetch ledger data'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? 'Retrying...' : 'Retry'}
              </Button>
              <Button onClick={() => navigate('/flats')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Flats
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sortedBills = [...ledger.bills].sort((a, b) => a.period.localeCompare(b.period));

  return (
    <DashboardLayout title="Maintenance Ledger">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={`Ledger - ${ledger.flatNo || publicId}`}
          description="Flat maintenance bill and payment ledger"
          icon={FileText}
          actions={
            <Button variant="outline" onClick={() => navigate('/flats')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flats
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Member Outstanding</p>
              <p className={`text-2xl font-bold ${ledger.totalOutstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatCurrency(ledger.totalOutstanding || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Advance Balance</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(ledger.totalAdvance || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Bills</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {sortedBills.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Table */}
        <Card className="overflow-hidden">
          <CardContent>
            {sortedBills.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No bills recorded yet</p>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBills.map((bill) => (
                      <TableRow key={`${bill.billPublicId || bill.period}-${bill.period}`}>
                        <TableCell>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {bill.period}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(bill.amount || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(bill.paidAmount || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${(bill.balanceAmount || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(bill.balanceAmount || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(bill.status || bill.statusCode)}>
                            {getStatusLabel(bill.status || bill.statusCode)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
