import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { FlatLedgerIcon } from '../components/ui/FlatLedgerIcon';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <FlatLedgerIcon size={48} className="mb-6 rounded-xl" />
      <p className="text-7xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">404</p>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
