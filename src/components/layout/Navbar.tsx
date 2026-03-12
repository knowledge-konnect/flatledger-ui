import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../ui/Button';
import { FlatLedgerIcon } from '../ui/FlatLedgerIcon';

interface NavbarProps {
  variant?: 'landing' | 'dashboard';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => (e?: React.MouseEvent) => {
    e?.preventDefault();
    const scrollWithOffset = () => {
      const el = document.getElementById(id);
      if (el) {
        const offsetTop = el.offsetTop - 200;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    };
    if (location.pathname === '/') {
      scrollWithOffset();
      return;
    }
    navigate('/');
    setTimeout(scrollWithOffset, 120);
  };

  if (variant === 'landing') {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <FlatLedgerIcon
                  size={40}
                  className="flex-shrink-0 rounded-xl shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-300"
                />
                <div className="flex flex-col leading-none gap-1">
                  <span className="text-[17px] tracking-tight leading-none">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Flat</span><span className="font-extrabold text-emerald-600 dark:text-emerald-400">Ledger</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:block">Society Finance</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <a onClick={scrollToSection('features')} href="#features" className="px-4 py-2 text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary dark:hover:text-primary-300 hover:bg-[#F8FAFC] dark:hover:bg-[#020617] rounded-lg transition-all duration-300 font-medium text-sm">
                Features
              </a>
              <a onClick={scrollToSection('pricing')} href="#pricing" className="px-4 py-2 text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary dark:hover:text-primary-300 hover:bg-[#F8FAFC] dark:hover:bg-[#020617] rounded-lg transition-all duration-300 font-medium text-sm">
                Pricing
              </a>
              <a onClick={scrollToSection('faq')} href="#faq" className="px-4 py-2 text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary dark:hover:text-primary-300 hover:bg-[#F8FAFC] dark:hover:bg-[#020617] rounded-lg transition-all duration-300 font-medium text-sm">
                FAQ
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#020617] transition-colors duration-300"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-[#64748B] hover:text-primary transition-colors" />
                ) : (
                  <Sun className="w-5 h-5 text-[#94A3B8] hover:text-primary transition-colors" />
                )}
              </button>
              <Link to="/login">
                <Button variant="secondary" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Start Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return null;
}
