import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { usePlans } from '../hooks/usePlans';
import {
  ArrowRight, IndianRupee, BarChart3, Users, Zap,
  Receipt, PieChart, CheckCircle2, ChevronRight, Star,
} from "lucide-react";
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import Navbar from "../components/layout/Navbar";

const ChatBot = lazy(() => import('../components/chatbot/ChatBot'));

// Static data — defined outside component to avoid recreation on every render
const planFeatures = [
  { color: "from-green-500 to-green-600",    icon: IndianRupee, title: "Generate bills in seconds, not hours",       description: "One click generates bills for every flat — no more Sunday evenings in Excel." },
  { color: "from-teal-500 to-teal-600",      icon: Receipt,     title: "Know instantly who hasn't paid",              description: "Real-time payment status for every flat — no WhatsApp follow-ups or manual registers." },
  { color: "from-orange-500 to-orange-600",  icon: BarChart3,   title: "Track every expense easily",                  description: "Categorised expenses, fully searchable — perfect for AGM presentations and reviews." },
  { color: "from-emerald-500 to-emerald-600",icon: Zap,         title: "See full society finances at a glance",       description: "Collection rate, fund balance, pending dues — all on one screen, always current." },
  { color: "from-emerald-600 to-emerald-800",  icon: PieChart,  title: "Get audit-ready reports in seconds",          description: "Income vs expense, defaulter list, payment history — export to CSV anytime." },
  { color: "from-red-500 to-red-600",        icon: Users,      title: "Right access for every committee member",    description: "Treasurer, Secretary, or Viewer — each person sees exactly what they need." },
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
    if (a.name.includes("Monthly")) return -1;
    if (b.name.includes("Monthly")) return 1;
    return 0;
  });

  const monthlyPlan = sortedPlans.find(p => p.name.includes("Monthly"));
  const yearlyPlan = sortedPlans.find(p => p.name.includes("Yearly"));
  const yearlySaving = monthlyPlan && yearlyPlan
    ? (monthlyPlan.monthlyAmount * 12) - yearlyPlan.monthlyAmount
    : null;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const mockRef = useRef<HTMLDivElement>(null);
  const mockInView = useInView(mockRef, { once: true, margin: '-80px' });

  useEffect(() => {
    if (sortedPlans.length) {
      const recommended = sortedPlans.find(p => p.name.includes("Yearly"));
      const monthly = sortedPlans.find(p => p.name.includes("Monthly"));
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
        className="pt-24 md:pt-32 pb-8 md:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950"
      >
        {/* Premium gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/20 dark:bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-100/20 dark:bg-teal-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white text-balance animate-slide-in-up leading-tight tracking-tight">
              Still Managing Society Billing on Excel?
              <span className="hidden sm:inline"><br /></span>{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
                There's a Better Way.
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
              Stop chasing payments on WhatsApp and managing bills in Excel. FlatLedger automates everything in one place.
            </p>

            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
              Trusted by 50+ housing societies across India.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
                aria-label="Start Free Trial in 2 Minutes"
              >
                <span>Start Free Trial in 2 Minutes</span>
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

            <p className="text-sm text-slate-500 dark:text-slate-400 animate-fade-in text-center" style={{ animationDelay: '0.35s' }}>No setup. No training required.</p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm text-slate-600 dark:text-slate-400 animate-fade-in font-medium" style={{ animationDelay: '0.4s' }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 30-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancel anytime</span>
            </div>
          </div>

          {/* Dashboard preview mock */}
          <div ref={mockRef} className="mt-10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
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
        {/* Removed social proof strip section as requested */}

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wider">Trusted by Housing Societies Across India</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              What Committee Members Are Saying
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: "Earlier we spent 3–4 hours every month preparing bills in Excel. Now it takes less than 10 minutes. The defaulter list alone saves us many awkward conversations.",
                name: "Ramesh Iyer",
                role: "Treasurer, Jade Gardens – Bengaluru",
                initials: "RI",
              },
              {
                quote: "Very easy to use, even for someone not very tech-savvy. Our secretary handles billing now, and all committee members can see reports whenever they need.",
                name: "Sunita Patel",
                role: "Secretary, Silver Oak CHS – Pune",
                initials: "SP",
              },
              {
                quote: "We tried two other apps before FlatLedger. This one works the way a housing society actually needs it to. Payment tracking and CSV exports are exactly right for our AGM.",
                name: "Krishnamurthy R.",
                role: "Committee Member, Palm Heights – Chennai",
                initials: "KR",
              },
            ].map((t) => (
              <div key={t.name} className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">“{t.quote}”</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Join <span className="font-semibold text-slate-700 dark:text-slate-300">50+ housing societies</span> across India already simplifying their society finances with FlatLedger.
          </p>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              Replace Excel and WhatsApp —{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">with one simple app</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Everything a society treasurer or secretary needs for housing society management — no technical skills required
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

        </div>
      </section>
      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wider">Simple Setup</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Up and running in under 30 minutes
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">No IT team. No complex configuration. Just three simple steps.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Add your flats and members",
                description: "Enter flat numbers, owner names, and maintenance amounts. Import from your existing Excel sheet in minutes if you have one.",
              },
              {
                step: "2",
                title: "Generate maintenance bills",
                description: "Click once to generate bills for all flats every month. Customise amounts by flat type. Bills are ready instantly.",
              },
              {
                step: "3",
                title: "Track payments and expenses",
                description: "Record cash, UPI, cheque, or bank transfers as they arrive. See who has paid, who hasn't, and your fund balance — all in real time.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-start gap-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xl font-extrabold shadow-lg flex-shrink-0">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
              aria-label="Start Your Free Trial Today in 2 Minutes"
            >
              Start Your Free Trial Today in 2 Minutes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              Simple Pricing —{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">Less Than ₹2 Per Flat Per Month</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Start with a free 30-day trial. No credit card required.
            </p>
            <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              Costs less than one cup of tea per flat ☕ — perfect for societies with 10–200 flats.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">No hidden fees. No setup cost. Cancel anytime. Your data is always yours.</p>
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
                const isRecommended = plan.name.includes("Yearly");
                const isSelected = selectedPlanId === plan.id;
                return (
                <label
                  key={plan.id}
                  className={`relative cursor-pointer pt-10 pb-8 px-8 rounded-2xl border-2 transition-all duration-300 animate-slide-in-up flex flex-col gap-4 focus-within:ring-4 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40 ${
                    isSelected && isRecommended
                      ? "border-emerald-500 shadow-2xl bg-emerald-50 dark:bg-emerald-900/20 scale-[1.03]"
                      : isSelected
                        ? "border-emerald-600 shadow-2xl bg-white dark:bg-slate-900"
                        : isRecommended
                          ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-2xl scale-[1.03] hover:-translate-y-1"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-600 shadow-md hover:shadow-xl hover:-translate-y-1"
                  }`}
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  tabIndex={0}
                  onClick={() => setSelectedPlanId(plan.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlanId(plan.id); }}
                >
                  {plan.name.includes("Yearly") && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                      ⭐ Most Popular
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
                    {plan.name.includes("Yearly") && yearlySaving && (
                      <span className="inline-block px-3 py-1 bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-xs font-semibold">
                        Save ₹{yearlySaving} (2 months free)
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{plan.name.includes("Yearly") ? Math.round(plan.monthlyAmount / 12) : plan.monthlyAmount}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg font-medium">/ month</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">
                    {plan.name.includes("Monthly") ? "Billed monthly" : `Billed as ₹${plan.monthlyAmount}/year`}
                  </p>
                  <ul className="space-y-2 mt-2">
                    {[
                      "Generate bills in seconds",
                      "Track payments instantly",
                      "View financial reports",
                      "See full society finances",
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                    <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      Cancel anytime
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`mt-1 px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900 ${
                      plan.name.includes("Yearly")
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
      <section id="faq" className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-balance">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Quick answers about your free trial, billing, and support.</p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {[
              { q: "Can we migrate from Excel?", a: "Yes. You can enter your flat list and opening balances directly, or copy them from your existing Excel sheet. Most societies are set up and billing within 30 minutes. We provide a setup checklist to make the move smooth." },
              { q: "Is FlatLedger easy for non-technical users?", a: "Yes. FlatLedger is designed for treasurers and secretaries, not IT professionals. If you can use WhatsApp, you can use FlatLedger. No technical training needed — but we do provide help guides and email support." },
              { q: "Do you support UPI or online payments?", a: "FlatLedger supports offline payment recording — you record cash, UPI, cheque, and bank transfer payments that residents make directly to the society account. It keeps things simple and fully under your committee's control." },
              { q: "What if the internet is slow or unavailable?", a: "FlatLedger is lightweight and works reliably on standard mobile data. The app loads fast even on slow connections. You can note payments offline and enter them when connected." },
              { q: "Is our society's data secure?", a: "Yes. FlatLedger uses encrypted data storage, role-based access control, and regular backups. Only your committee members can access your society's data. We do not share data with any third party." },
              { q: "Will our committee get training or support?", a: "Yes. We provide onboarding guidance for treasurer and committee members, step-by-step help documentation, and email support for everyday questions." },
              { q: "Can we export our data anytime?", a: "Yes. Bills, payment records, and reports can be exported to CSV at any time. Your data is always yours — you are never locked in." },
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
      <section className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="p-6 md:p-10 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl shadow-2xl text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white animate-slide-in-up">
              Stop Managing Your Society Finances on Excel.
            </h2>
            <p className="text-lg text-white/90 animate-slide-in-up max-w-xl mx-auto" style={{ animationDelay: '0.1s' }}>
              Join 50+ housing societies across India who've switched to FlatLedger — and never looked back. Start your free 30-day trial today, no credit card required.
            </p>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-emerald-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 inline-flex w-fit items-center justify-center gap-2 mx-auto group animate-slide-in-up focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              style={{ animationDelay: '0.2s' }}
              aria-label="Start Your Free Trial Today in 2 Minutes"
            >
              Start Your Free Trial Today in 2 Minutes
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col items-center">
          <div className="mb-4 text-center">
            <p className="text-lg font-bold">
              <span className="text-slate-700 dark:text-slate-300">Flat</span><span className="text-emerald-600 dark:text-emerald-400">Ledger</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Simplifying housing society finances across India</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-4">
            <a href="/" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Home</a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Terms</a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl text-center mb-3">
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


      {/* ── WHATSAPP SUPPORT BUTTON ───────────────────────────────────────── */}
      {/* TODO: Replace the phone number below with your actual WhatsApp support number */}
      <a
        href="https://wa.me/919999999999?text=Hi%2C%20I%20have%20a%20question%20about%20FlatLedger"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-green-400/40 md:bottom-5 md:right-5"
        aria-label="Chat with us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Chatbot hidden for now */}
      {/*
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <ChatBot variant="landing" />
        </Suspense>
      </div>
      */}
    </div>
  );
};

export default LandingPage;
