import { useState } from 'react';
import { Bell, Check, CheckCheck, X, IndianRupee, Receipt, AlertCircle, Megaphone, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Notification {
  id: string;
  type: 'payment' | 'expense' | 'announcement' | 'alert' | 'report';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Mock notifications for MVP - Replace with API data later
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Received',
    message: 'Maintenance payment for May 2026 of ₹5,000 has been successfully recorded for Flat 101.',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'announcement',
    title: 'Monthly Society Meeting',
    message: 'General body meeting scheduled for 20th May at 6:00 PM in the clubhouse. Agenda: Budget discussion.',
    timestamp: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'alert',
    title: 'Payment Due Soon',
    message: 'Your maintenance payment for June 2026 is due in 5 days. Please pay before 5th June.',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'expense',
    title: 'New Expense: Elevator Maintenance',
    message: 'Elevator annual maintenance expense of ₹12,000 has been recorded under maintenance category.',
    timestamp: '2 days ago',
    read: true,
  },
  {
    id: '5',
    type: 'report',
    title: 'Monthly Report Ready',
    message: 'April 2026 financial report is now available for download in the Reports section.',
    timestamp: '3 days ago',
    read: true,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'payment': return IndianRupee;
    case 'expense': return Receipt;
    case 'announcement': return Megaphone;
    case 'alert': return AlertCircle;
    case 'report': return FileText;
    default: return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'payment': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40';
    case 'expense': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/40';
    case 'announcement': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40';
    case 'alert': return 'text-red-600 bg-red-50 dark:bg-red-950/40';
    case 'report': return 'text-violet-600 bg-violet-50 dark:bg-violet-950/40';
    default: return 'text-slate-600 bg-slate-50 dark:bg-slate-950/40';
  }
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-up max-h-[32rem] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                No notifications
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative',
                      !notification.read && 'bg-blue-50/30 dark:bg-blue-950/10'
                    )}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                    {notification.read && (
                      <Check className="absolute top-3 right-3 w-3 h-3 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handleClearAll}
              className="w-full py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
