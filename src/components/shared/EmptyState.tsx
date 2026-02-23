import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon className="w-8 h-8 text-[#64748B] dark:text-[#94A3B8]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}
