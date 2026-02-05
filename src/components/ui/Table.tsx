import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="table-container">
      <table className={cn('table', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={className}>{children}</th>;
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={className}>{children}</td>;
}
