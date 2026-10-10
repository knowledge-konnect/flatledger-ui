import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
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
    <div className={cn('page-header', className)}>
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        {Icon && (
          <div className="page-header-icon">
            <Icon className="w-5 h-5 text-primary dark:text-primary-500" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="page-header-title">
            {title}
          </h1>
          {description && (
            <p className="page-header-description">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="page-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}
