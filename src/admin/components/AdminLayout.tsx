import { Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  BarChart3,
  Layers,
  Flag,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { cn } from '../../lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Plans', href: '/admin/plans', icon: CreditCard },
  { label: 'Societies', href: '/admin/societies', icon: Building2 },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: Layers },
  { label: 'Payments', href: '/admin/payments', icon: BarChart3 },
  { label: 'Feature Flags', href: '/admin/features', icon: Flag },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = admin?.name
    ? admin.name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SA';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col',
          'bg-slate-900 border-r border-slate-800/60',
          'transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">FlatLedger</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                )}
              >
                <item.icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    isActive ? 'text-white' : 'text-slate-500',
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">
                {admin?.name ?? 'Admin'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{admin?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-14 px-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Super Admin
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Top bar (desktop) */}
        <header className="hidden lg:flex h-14 px-6 items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {navItems.find(
              (n) =>
                pathname === n.href ||
                (n.href !== '/admin/dashboard' && pathname.startsWith(n.href)),
            )?.label ?? 'Admin Panel'}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              {admin?.name}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
