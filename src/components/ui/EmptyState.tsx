import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  children?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-[#64748B] dark:text-[#94A3B8]" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {children}
      
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-4"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
