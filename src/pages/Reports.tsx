import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, TrendingUp, Calendar, Filter } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';

const incomeVsExpenseData = [
  { month: 'Jul', income: 545000, expense: 108000 },
  { month: 'Aug', income: 538000, expense: 115000 },
  { month: 'Sep', income: 542000, expense: 97000 },
  { month: 'Oct', income: 550000, expense: 125000 },
  { month: 'Nov', income: 548000, expense: 102000 },
  { month: 'Dec', income: 552000, expense: 118000 },
];

const outstandingByFlat = [
  { flatNumber: 'A-102', owner: 'Priya Sharma', outstanding: 15000, months: 3 },
  { flatNumber: 'C-305', owner: 'Deepak Verma', outstanding: 10000, months: 2 },
  { flatNumber: 'B-208', owner: 'Meera Singh', outstanding: 9000, months: 2 },
  { flatNumber: 'D-410', owner: 'Karan Mehta', outstanding: 5000, months: 1 },
  { flatNumber: 'A-105', owner: 'Suresh Rao', outstanding: 5000, months: 1 },
];

const collectionTrend = [
  { month: 'Jul', collected: 520000, target: 545000 },
  { month: 'Aug', collected: 495000, target: 538000 },
  { month: 'Sep', collected: 530000, target: 542000 },
  { month: 'Oct', collected: 535000, target: 550000 },
  { month: 'Nov', collected: 540000, target: 548000 },
  { month: 'Dec', collected: 545000, target: 552000 },
];

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('last-6-months');

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Reports & Analytics"
          description="Comprehensive financial reports and analytics for your society"
          icon={FileText}
          actions={
            <>
              <Select
                options={[
                  { value: 'last-6-months', label: 'Last 6 Months' },
                  { value: 'this-year', label: 'This Year' },
                  { value: 'last-year', label: 'Last Year' },
                  { value: 'custom', label: 'Custom Range' },
                ]}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />
              <Button variant="outline" size="md">
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#16A34A] dark:text-[#22C55E]" />
                </div>
                <Badge variant="success">+12%</Badge>
              </div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-1">Net Income (6M)</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {formatCurrency(incomeVsExpenseData.reduce((sum, d) => sum + (d.income - d.expense), 0))}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-info-100 dark:bg-info-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-info-600 dark:text-info-400" />
                </div>
                <Badge variant="info">YTD</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Avg Monthly Collection</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(collectionTrend.reduce((sum, d) => sum + d.collected, 0) / collectionTrend.length)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-error-600 dark:text-error-400" />
                </div>
                <Badge variant="danger">Alert</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Member Outstanding</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(outstandingByFlat.reduce((sum, d) => sum + d.outstanding, 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Income vs Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#f9fafb',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Collection Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={collectionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '0.75rem',
                      color: '#f9fafb',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="collected"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 6 }}
                    name="Collected"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#94a3b8', r: 4 }}
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Outstanding by Flat</CardTitle>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Months</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingByFlat.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className="font-bold text-[#2563EB] dark:text-[#3B82F6]">
                          {item.flatNumber}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{item.owner}</TableCell>
                      <TableCell>
                        <Badge variant={item.months >= 3 ? 'danger' : 'warning'}>
                          {item.months} {item.months === 1 ? 'month' : 'months'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-[#DC2626] dark:text-[#EF4444]">
                          {formatCurrency(item.outstanding)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card hover className="cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-[#2563EB] dark:text-[#3B82F6]" />
              </div>
              <h3 className="font-bold text-foreground mb-1">
                AGM Report
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Annual general meeting summary
              </p>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card hover className="cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Income Report
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Detailed income breakdown
              </p>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card hover className="cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Expense Report
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Category-wise expense analysis
              </p>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
