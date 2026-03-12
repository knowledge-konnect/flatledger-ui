import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
}

export function StatCard({ title, value, change, positive = true, icon: Icon }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary-500/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary dark:text-primary-500" />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              positive
                ? 'bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]'
                : 'bg-[#DC2626]/10 text-[#DC2626] dark:text-[#EF4444]'
            }`}
          >
            {positive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {change}
          </div>
        )}
      </div>
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-1">{title}</p>
      <p className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">{value}</p>
    </Card>
  );
}
