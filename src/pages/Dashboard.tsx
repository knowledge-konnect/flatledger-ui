"use client"
import { useMemo, useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Home, AlertCircle, Plus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import DashboardLayout from "../components/layout/DashboardLayout"
import { SubscriptionSummary } from "../components/SubscriptionSummary"
import RippleButton from "../components/ui/RippleButton"

/**
 * Dashboard - Analytics-inspired redesign with performance optimizations
 * Bold hero metrics, generous whitespace, rounded cards with soft shadows, micro-interactions
 */

export default function DashboardRedesigned() {
  const [user, setUser] = useState<any>(null);

  // Fix: Move localStorage access to useEffect
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

  // Memoize static data
  const stats = useMemo(() => [
    {
      title: "Total Collection",
      value: "₹12,50,000",
      change: "+12%",
      positive: true,
      icon: DollarSign,
    },
    {
      title: "Outstanding Dues",
      value: "₹4,50,000",
      change: "-8%",
      positive: true,
      icon: AlertCircle,
    },
    {
      title: "Total Flats",
      value: "120",
      change: "+4",
      positive: true,
      icon: Home,
    },
    {
      title: "Collection Rate",
      value: "85%",
      change: "+3%",
      positive: true,
      icon: TrendingUp,
    },
  ], []);

  const chartData = useMemo(() => [
    { month: "Jul", income: 185000, expense: 65000 },
    { month: "Aug", income: 195000, expense: 72000 },
    { month: "Sep", income: 188000, expense: 58000 },
    { month: "Oct", income: 210000, expense: 82000 },
    { month: "Nov", income: 225000, expense: 55000 },
    { month: "Dec", income: 247000, expense: 48000 },
  ], []);

  const expenseData = useMemo(() => [
    { name: "Maintenance", value: 380000, color: "hsl(262, 99%, 55%)" },
    { name: "Utilities", value: 220000, color: "hsl(217, 91%, 60%)" },
    { name: "Security", value: 180000, color: "hsl(142, 71%, 45%)" },
    { name: "Other", value: 85000, color: "hsl(38, 92%, 50%)" },
  ], []);

  const recentActivity = useMemo(() => [
    { id: 1, type: "payment", description: "A-101 Maintenance Payment", amount: 5000, status: "completed" },
    { id: 2, type: "expense", description: "Electricity Bill", amount: -8500, status: "pending" },
    { id: 3, type: "payment", description: "B-205 Maintenance Payment", amount: 4500, status: "completed" },
    { id: 4, type: "bill", description: "January 2025 Bills Generated", amount: 0, status: "completed" },
    { id: 5, type: "expense", description: "Security Staff Salary", amount: -45000, status: "completed" },
  ], []);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 animate-slide-in-up">
              Welcome back, {user?.name || "User"}
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Here's a complete overview of your society's financials today.
            </p>
          </div>
          <RippleButton variant="primary" className="w-full md:w-auto flex-shrink-0 animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
            <Plus className="w-5 h-5" />
            Quick Action
          </RippleButton>
        </div>

        <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <SubscriptionSummary />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-in-up"
              style={{ animationDelay: `${0.25 + 0.05 * index}s` }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-semibold badge-base ${stat.positive ? 'badge-success' : 'badge-destructive'}`}
                  >
                    {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Income vs Expense */}
          <div className="card-base p-6 lg:p-8 animate-slide-in-up" style={{ animationDelay: '0.45s' }}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                  }}
                  formatter={(value: number) => `₹${(value / 100000).toFixed(1)}L`}
                />
                <Legend />
                <Bar dataKey="income" fill="hsl(262, 99%, 55%)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(250, 75%, 60%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Collection Trend */}
          <div className="card-base p-6 lg:p-8 animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Collection Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                  }}
                  formatter={(value: number) => `₹${(value / 100000).toFixed(1)}L`}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(262, 99%, 55%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(262, 99%, 55%)", r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Expense Breakdown */}
          <div className="card-base p-6 lg:p-8 animate-slide-in-up" style={{ animationDelay: '0.55s' }}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 space-y-3">
              {expenseData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">₹{(item.value / 100000).toFixed(1)}L</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-base p-6 lg:p-8 lg:col-span-2 animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
              <a href="#" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors duration-200">
                View All →
              </a>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 animate-slide-in-up"
                  style={{ animationDelay: `${0.65 + 0.05 * index}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === "payment"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : activity.type === "expense"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      <FileText
                        className={`w-5 h-5 ${
                          activity.type === "payment"
                            ? "text-green-600 dark:text-green-400"
                            : activity.type === "expense"
                              ? "text-red-600 dark:text-red-400"
                              : "text-blue-600 dark:text-blue-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{activity.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Today</p>
                    </div>
                  </div>
                  {activity.amount !== 0 && (
                    <span
                      className={`font-semibold text-sm ${activity.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {activity.amount > 0 ? "+" : ""}₹{Math.abs(activity.amount).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6 mt-8">
          {[
            { title: "Generate Bills", desc: "Create monthly maintenance bills", icon: FileText },
            { title: "Record Payment", desc: "Add new payment entry", icon: DollarSign },
            { title: "Add Expense", desc: "Record society expenses", icon: AlertCircle },
          ].map((action, i) => (
            <button
              key={i}
              className="card-base p-6 group card-hover text-left animate-slide-in-up"
              style={{ animationDelay: `${0.85 + 0.05 * i}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">{action.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
