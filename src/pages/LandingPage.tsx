import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { usePlans } from '../hooks/usePlans';
import {
  ArrowRight, IndianRupee, BarChart3, Users, Zap,
  Receipt, PieChart, CheckCircle2, ChevronRight,
} from "lucide-react";
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Navbar from "../components/layout/Navbar";

const ChatBot = lazy(() => import('../components/chatbot/ChatBot'));

// Static data — defined outside component to avoid recreation on every render
const planFeatures = [
  { color: "from-green-500 to-green-600",    icon: IndianRupee, title: "Generate Bills for Every Flat in Seconds",  description: "One-click billing for every flat — stop wasting hours in Excel every month." },
  { color: "from-teal-500 to-teal-600",      icon: Receipt,     title: "Record and Track Every Payment",            description: "Track cash, UPI, cheque, and bank transfer payments for every flat in one place." },
  { color: "from-orange-500 to-orange-600",  icon: BarChart3,   title: "Transparent Expense Tracking",              description: "Every rupee accounted for — categorised, searchable, shareable with residents." },
  { color: "from-emerald-500 to-emerald-600",icon: Zap,         title: "See Your Society's Full Financial Picture",   description: "Review collection status, fund balance, and key finance indicators in one place." },
  { color: "from-emerald-600 to-emerald-800",  icon: PieChart,    title: "Financial Reports and CSV Exports",         description: "Review income vs expense trends, defaulter lists, and export key data when needed." },
  { color: "from-red-500 to-red-600",      icon: Users,       title: "Committee Role Access",                     description: "Treasurer, Secretary, and Viewer access — each sees what they need." },
];

// Counts up from 0 to `to` once `active` becomes true
function AnimatedNumber({ to, prefix = '', suffix = '', active }: { to: number; prefix?: string; suffix?: string; active: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const duration = 1100;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, to]);
  const formatted = prefix === '\u20b9' ? value.toLocaleString('en-IN') : String(value);
  return <>{prefix}{formatted}{suffix}</>;
}

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  const { plans, plansLoading, plansError } = usePlans();

  const sortedPlans = (Array.isArray(plans) ? [...plans] : []).sort((a, b) => {
    if (a.name === "Monthly") return -1;
    if (b.name === "Monthly") return 1;
    return 0;
  });

  const monthlyPlan = sortedPlans.find(p => p.name === "Monthly");
  const yearlyPlan = sortedPlans.find(p => p.name === "Yearly");
  const yearlySaving = monthlyPlan && yearlyPlan
    ? (monthlyPlan.monthlyAmount * 12) - yearlyPlan.monthlyAmount
    : null;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const mockRef = useRef<HTMLDivElement>(null);
  const mockInView = useInView(mockRef, { once: true, margin: '-80px' });

  useEffect(() => {
    if (sortedPlans.length) {
      const recommended = sortedPlans.find(p => p.name === "Yearly");
      const monthly = sortedPlans.find(p => p.name === "Monthly");
      setSelectedPlanId((recommended || monthly || sortedPlans[0]).id);
    }
  }, [plans]);

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-white dark:bg-slate-950">
      {/* ── ANNOUNCEMENT BAR ─────────────────────────────────────────────── */}
      {announcementVisible && (
        <div className="w-full bg-emerald-600 text-white text-center text-xs sm:text-sm py-2 px-4 font-medium relative">
          Monthly billing in minutes, not hours — try FlatLedger free &nbsp;·&nbsp;
          <a href="#pricing" className="underline underline-offset-2 hover:text-emerald-200 transition-colors">See plans →</a>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-base leading-none"
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Dismiss announcement"
          >
            &#x2715;
          </button>
        </div>
      )}

      <Navbar variant="landing" />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="pt-24 md:pt-32 pb-12 md:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950"
      >
        {/* Premium gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/20 dark:bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-100/20 dark:bg-teal-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white text-balance animate-slide-in-up leading-tight tracking-tight">
              Apartment Billing &amp; Finances,
              <span className="hidden sm:inline"><br /></span>{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
                Done in Minutes
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
              One dashboard for billing, payments, expenses, and reports — built for Indian housing societies who've outgrown WhatsApp and Excel.
            </p>

            <p className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-semibold animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
              Built for Apartment Treasurers and Housing Society Committees in India.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
                aria-label="Start Free Trial"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <a
                href="#pricing"
                className="w-full sm:w-auto px-8 py-4 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 active:scale-[0.99] transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:focus-visible:ring-slate-800"
                aria-label="View Pricing"
              >
                View Pricing
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm text-slate-600 dark:text-slate-400 animate-fade-in font-medium" style={{ animationDelay: '0.4s' }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 30-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancel anytime</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 animate-fade-in" style={{ animationDelay: '0.45s' }}>
              {[
                "Secure data",
                "Offline payment recording",
                "CSV exports",
              ].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard preview mock */}
          <div ref={mockRef} className="mt-14 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl blur opacity-20" />
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                {/* Mock browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 mx-4 bg-white dark:bg-slate-700 rounded px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
                    app.flatledger.com/dashboard
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Total Collected", rawValue: 120000, prefix: '₹', suffix: '', sub: "This month", color: "text-green-600 dark:text-green-400" },
                      { label: "Pending Dues", rawValue: 18500, prefix: '₹', suffix: '', sub: "3 flats", color: "text-amber-600 dark:text-amber-400" },
                      { label: "Collection Rate", rawValue: 86, prefix: '', suffix: '%', sub: "+4% vs last month", color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Society Fund", rawValue: 245000, prefix: '₹', suffix: '', sub: "Available balance", color: "text-emerald-600 dark:text-emerald-400" },
                    ].map((kpi, i) => (
                      <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={mockInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                        className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{kpi.label}</p>
                        <p className={`text-lg font-bold tabular-nums ${kpi.color}`}>
                          <AnimatedNumber to={kpi.rawValue} prefix={kpi.prefix} suffix={kpi.suffix} active={mockInView} />
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{kpi.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Payments</p>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">View all</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {[
                        { flat: "Flat 101 — Sharma", amount: "₹2,000", status: "Paid", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
                        { flat: "Flat 204 — Mehta", amount: "₹2,000", status: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                        { flat: "Flat 302 — Reddy", amount: "₹3,500", status: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                      ].map((row, i) => (
                        <motion.div
                          key={row.flat}
                          initial={{ opacity: 0, x: -8 }}
                          animate={mockInView ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.35, delay: 0.35 + i * 0.1, ease: 'easeOut' }}
                          className="flex items-center justify-between px-4 py-2"
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300">{row.flat}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{row.amount}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.color}`}>{row.status}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ──────────────────────────────────────────── */}
      <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4 text-center mb-5">
            {[
              { label: "Monthly bills generated in a few clicks", value: "Fast billing" },
              { label: "Payments tracked by flat and mode", value: "Clear records" },
              { label: "Reports and exports ready when needed", value: "Audit-friendly" },
            ].map((item) => (
              <div key={item.label} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{item.value}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-700 dark:text-slate-300 text-sm sm:text-base">
            Built for apartment treasurers who need faster billing, cleaner payment records, and better visibility into society finances.
          </p>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              Every tool your society needs —{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">nothing it doesn't</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Everything a society treasurer needs, nothing they don't
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {planFeatures.slice(0, 6).map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all duration-300 animate-slide-in-up group"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-all duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:focus-visible:ring-slate-800"
            >
              See pricing options
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              Simple Pricing —{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">Less Than ₹5 Per Flat Per Month</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Start with a free 30-day trial. No credit card required.
            </p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              Most societies pay less than the cost of one cup of tea per flat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {plansLoading ? (
              <div className="col-span-2 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading pricing...</p>
              </div>
            ) : plansError ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-red-600 dark:text-red-400">{plansError}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Plans start below ₹5 per flat per month. Please try again later for live pricing.</p>
              </div>
            ) : (
              sortedPlans.map((plan, index) => {
                const isRecommended = plan.name === "Yearly";
                const isSelected = selectedPlanId === plan.id;
                return (
                <label
                  key={plan.id}
                  className={`relative cursor-pointer pt-10 pb-8 px-8 rounded-2xl border-2 transition-all duration-300 animate-slide-in-up flex flex-col gap-4 focus-within:ring-4 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40 ${
                    isSelected
                      ? "border-emerald-600 shadow-2xl bg-white dark:bg-slate-900"
                      : isRecommended
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-900/10 shadow-lg hover:shadow-xl hover:-translate-y-1"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-md hover:shadow-xl hover:-translate-y-1"
                  }`}
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  tabIndex={0}
                  onClick={() => setSelectedPlanId(plan.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlanId(plan.id); }}
                >
                  {plan.name === "Yearly" && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="absolute top-4 right-4 w-5 h-5 accent-emerald-600"
                    aria-label={`Select ${plan.name} plan`}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    {plan.name === "Yearly" && yearlySaving && (
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-xs font-bold">
                        Save ₹{yearlySaving} · 2 months free
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{plan.monthlyAmount}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg font-medium">{plan.name === "Monthly" ? "/ month" : "/ year"}</span>
                  </div>
                  {plan.name === "Yearly" && monthlyPlan && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold -mt-2">
                      Only ₹{Math.round(plan.monthlyAmount / 12)}/month effective · vs ₹{monthlyPlan.monthlyAmount}/month
                    </p>
                  )}
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {plan.description || (plan.name === "Monthly"
                      ? "All features included. 30-day trial, then billed monthly. Offline payment recording, reports, and exports included."
                      : "All features included. Pay once a year and save 2 months.")}
                  </p>
                  <ul className="space-y-2 mt-2">
                    {planFeatures.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{feature.title}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`mt-4 px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900 ${
                      plan.name === "Yearly"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    aria-label={`Start Free Trial for ${plan.name}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/signup'; }}
                  >
                    Start Free Trial
                  </button>
                </label>
                );
              })
            )}
          </div>

          {!plansLoading && !plansError && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              No setup fee. No payment required to start. Cancel anytime.
            </p>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-balance">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Quick answers about your free trial, billing, and support.</p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {[
              { q: "How does onboarding work if we use Excel today?", a: "You can import your flat list and opening balances in one setup pass. We provide a guided checklist to help your society move from Excel into FlatLedger." },
              { q: "Will our committee get training?", a: "Yes. We provide guided onboarding for treasurer and committee members, plus help docs and email support for day-to-day questions." },
              { q: "Can we export data anytime?", a: "Yes. You can export bills, payment records, and reports whenever needed, so your society is never locked in." },
              { q: "Is society data secure and auditable?", a: "FlatLedger uses encrypted storage, controlled access, and backup routines, with activity history that helps committees maintain financial accountability." },
              { q: "How are payments handled in FlatLedger?", a: "FlatLedger supports offline payment recording. Your society admin can record cash, UPI, cheque, and bank transfer payments in the app for tracking, reporting, and reconciliation." },
            ].map((item, i) => (
              <div key={item.q} className="bg-white dark:bg-slate-900">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 dark:focus-visible:ring-emerald-900/40"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base pr-4">{item.q}</span>
                  <ChevronRight
                    className={`w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${openFaq === i ? "rotate-90" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Still have questions?{" "}
              <a href="mailto:support@flatledger.com" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Talk to support
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="p-8 md:p-12 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl shadow-2xl text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white animate-slide-in-up">
              Your Society's Finances — Organised in One Place
            </h2>
            <p className="text-lg text-white/90 animate-slide-in-up max-w-xl mx-auto" style={{ animationDelay: '0.1s' }}>
              Start your free 30-day trial. No credit card, no setup fee — just cleaner billing from day one.
            </p>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-emerald-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 inline-flex w-fit items-center justify-center gap-2 mx-auto group animate-slide-in-up focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              style={{ animationDelay: '0.2s' }}
              aria-label="Start Free Trial"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-white/70 text-sm">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-white/80" /> 30-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-white/80" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-white/80" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          <div className="mb-6 text-center">
            <p className="text-lg font-bold">
              <span className="text-slate-700 dark:text-slate-300">Flat</span><span className="text-emerald-600 dark:text-emerald-400">Ledger</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Apartment finance, simplified.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <a href="/" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Home</a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Terms</a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl text-center mb-4">
            FlatLedger helps housing societies in India manage maintenance billing, payment records, expenses, and financial reports without relying on spreadsheets.
          </p>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 FlatLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>


      {/* ── MOBILE STICKY CTA ───────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            to="/signup"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
            aria-label="Start free trial"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>


      {/* Landing page chatbot — pre-sales FAQ, lazy-loaded after first paint */}
      <Suspense fallback={null}>
        <ChatBot variant="landing" />
      </Suspense>
    </div>
  );
};

export default LandingPage;
