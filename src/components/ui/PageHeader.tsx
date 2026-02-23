import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
