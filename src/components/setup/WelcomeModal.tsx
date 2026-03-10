import { useEffect, useRef } from 'react';
import { Building2, Wrench, Home, Calculator, ArrowRight, X } from 'lucide-react';
import Button from '../ui/Button';

export const WELCOME_MODAL_SEEN_KEY = 'welcome_modal_seen';

const STEPS = [
  {
    icon: Building2,
    color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    label: 'Society Profile',
    description: 'Your society name and contact details — the foundation of your account.',
  },
  {
    icon: Wrench,
    color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    label: 'Maintenance Config',
    description: 'Set the default monthly charge, due date, and late fee used when generating bills.',
  },
  {
    icon: Home,
    color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    label: 'Add Flats / Units',
    description: 'Register every flat in your society. Monthly bills are generated for each unit.',
  },
  {
    icon: Calculator,
    color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
    label: 'Opening Balance',
    description: 'Carry over your current bank balance and any outstanding dues from your previous system.',
  },
];

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Mark as seen immediately on mount — never show again even if closed mid-way
  useEffect(() => {
    try {
      localStorage.setItem(WELCOME_MODAL_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  // Trap focus & close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-in-up">

        {/* ── Header gradient ── */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-6 pt-8 pb-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
            <span className="text-3xl leading-none">🏢</span>
          </div>
          <h2 id="welcome-modal-title" className="text-xl font-bold mb-1">
            Welcome to FlatLedger!
          </h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">
            You're just 4 quick steps away from generating your first maintenance bill. Takes about 5 minutes.
          </p>
        </div>

        {/* ── Steps list ── */}
        <div className="px-6 py-5 space-y-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-start gap-3">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={onClose}
          >
            Let's Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            You can revisit any step anytime from Settings.
          </p>
        </div>

        {/* ── Dismiss X ── */}
        <button
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          onClick={onClose}
          aria-label="Close welcome guide"
        >
          <X className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
}
