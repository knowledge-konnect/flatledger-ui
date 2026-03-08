import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { usePlans } from '../hooks/usePlans';
import {
  ArrowRight, IndianRupee, BarChart3, Users, Zap, Star,
  Receipt, PieChart, Shield, Cloud, HardDrive, Lock,
  CheckCircle2, Calculator, ChevronRight, AlertTriangle,
} from "lucide-react";
import { Link } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";

const ChatBot = lazy(() => import('../components/chatbot/ChatBot'));

// Static data — defined outside component to avoid recreation on every render
const planFeatures = [
  { color: "from-green-500 to-green-600",   icon: IndianRupee, title: "Generate Bills for Every Flat in Seconds",    description: "One-click billing for every flat — stop wasting hours in Excel every month." },
  { color: "from-blue-500 to-blue-600",     icon: Receipt,     title: "See Who Paid and Who Hasn't",                 description: "Real-time payment status for every flat. No more manual checking." },
  { color: "from-orange-500 to-orange-600", icon: BarChart3,   title: "Transparent Expense Tracking",                description: "Every rupee accounted for — categorised, searchable, shareable with residents." },
  { color: "from-indigo-500 to-indigo-600", icon: Zap,         title: "Live Financial Dashboard",                    description: "Collection rate, fund balance, and KPIs updated in real time." },
  { color: "from-purple-500 to-purple-600", icon: PieChart,    title: "Instant Financial Reports",                   description: "Income vs expense charts and PDF exports ready for your AGM." },
  { color: "from-violet-500 to-violet-600", icon: Users,       title: "Committee Role Access",                       description: "Treasurer, Secretary, and Viewer access — each sees what they need." },
];

// ─── Tab definitions for Interactive Product Preview ───────────────────────
const previewTabs = [
  {
    id: "bills",
    label: "Generate Bills",
    icon: Receipt,
    color: "from-green-500 to-emerald-600",
    bg: "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
    border: "border-green-200 dark:border-green-800",
    description: "Generate maintenance bills for every flat with one click. Customise amounts, add late fees, and export PDFs instantly.",
    mockTitle: "Bill Generation",
    mockRows: [
      { flat: "Flat 101", amount: "₹2,000", status: "Generated", color: "text-green-600" },
      { flat: "Flat 102", amount: "₹2,000", status: "Generated", color: "text-green-600" },
      { flat: "Flat 201", amount: "₹2,500", status: "Generated", color: "text-green-600" },
      { flat: "Flat 202", amount: "₹2,000", status: "Generated", color: "text-green-600" },
    ],
  },
  {
    id: "payments",
    label: "Track Payments",
    icon: IndianRupee,
    color: "from-blue-500 to-indigo-600",
    bg: "from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950",
    border: "border-blue-200 dark:border-blue-800",
    description: "See real-time payment status for every flat. Filter by paid, pending, or overdue. Send reminders in seconds.",
    mockTitle: "Payment Status",
    mockRows: [
      { flat: "Flat 101", amount: "₹2,000", status: "Paid", color: "text-green-600" },
      { flat: "Flat 102", amount: "₹2,000", status: "Pending", color: "text-amber-600" },
      { flat: "Flat 201", amount: "₹2,500", status: "Paid", color: "text-green-600" },
      { flat: "Flat 202", amount: "₹2,000", status: "Overdue", color: "text-red-600" },
    ],
  },
  {
    id: "expenses",
    label: "Expense Reports",
    icon: PieChart,
    color: "from-purple-500 to-violet-600",
    bg: "from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950",
    border: "border-purple-200 dark:border-purple-800",
    description: "Record and categorise every society expense. Share transparent reports with residents. Track budget vs actuals.",
    mockTitle: "Expense Summary",
    mockRows: [
      { flat: "Security", amount: "₹15,000", status: "Monthly", color: "text-slate-600" },
      { flat: "Cleaning", amount: "₹8,000", status: "Monthly", color: "text-slate-600" },
      { flat: "Lift AMC", amount: "₹5,000", status: "Monthly", color: "text-slate-600" },
      { flat: "Electricity", amount: "₹12,000", status: "Monthly", color: "text-slate-600" },
    ],
  },
];

const LandingPage: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activePreviewTab, setActivePreviewTab] = useState(0);
  const [flatsCount, setFlatsCount] = useState(60);
  const [showScrollCta, setShowScrollCta] = useState(false);
  const [scrollCtaDismissed, setScrollCtaDismissed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const scrollCtaShown = useRef(false);

  const { plans, plansLoading, plansError } = usePlans();

  // Scroll CTA — show at 70% scroll depth, once
  useEffect(() => {
    const handleScroll = () => {
      if (scrollCtaDismissed || scrollCtaShown.current) return;
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled >= 0.7) {
        setShowScrollCta(true);
        scrollCtaShown.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollCtaDismissed]);

  const sortedPlans = (Array.isArray(plans) ? [...plans] : []).sort((a, b) => {
    if (a.name === "Monthly") return -1;
    if (b.name === "Monthly") return 1;
    return 0;
  });

  const monthlyPlan = sortedPlans.find(p => p.name === "Monthly");
  const yearlyPlan  = sortedPlans.find(p => p.name === "Yearly");
  const yearlySaving = monthlyPlan && yearlyPlan
    ? (monthlyPlan.monthlyAmount * 12) - yearlyPlan.monthlyAmount
    : null;

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  useEffect(() => {
    if (sortedPlans.length) {
      const monthly = sortedPlans.find(p => p.name === "Monthly");
      setSelectedPlanId(monthly ? monthly.id : sortedPlans[0].id);
    }
  }, [plans]);

  // ROI Calculator
  const manualHours = Math.ceil(flatsCount * 0.15);
  const flatledgerMinutes = 10;
  const hoursSaved = Math.max(0, manualHours - Math.ceil(flatledgerMinutes / 60));

  const testimonials = [
    {
      name: "Rajesh K.",
      role: "Apartment Treasurer",
      society: "Mumbai",
      text: "We were using Excel before. FlatLedger made our billing and payment tracking much simpler. Collection has improved significantly.",
      image: "👨‍💼",
    },
    {
      name: "Priya S.",
      role: "Society Secretary",
      society: "Bangalore",
      text: "The dashboard gives us a clear picture of our finances. Residents can now see where their money is going. Transparency has increased.",
      image: "👩‍💼",
    },
    {
      name: "Amit P.",
      role: "Society Treasurer",
      society: "Pune",
      text: "Generating bills for 60 flats now takes 5 minutes instead of 2 days. The time saved lets me focus on other society matters.",
      image: "👨‍🔧",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ── ANNOUNCEMENT BAR ─────────────────────────────────────────────── */}
      <div className="w-full bg-indigo-600 text-white text-center text-xs sm:text-sm py-2 px-4 font-medium">
        🎉 New: Bulk bill generation for 200+ flats — now live &nbsp;·&nbsp;
        <a href="#pricing" className="underline underline-offset-2 hover:text-indigo-200 transition-colors">See plans →</a>
      </div>

      <Navbar variant="landing" />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-24 md:pt-32 pb-14 md:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        {/* Premium gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/20 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-100/20 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white text-balance animate-slide-in-up leading-tight tracking-tight">
              Stop Managing Apartment Maintenance
              <span className="hidden sm:inline"><br /></span>{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                in Excel
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
              FlatLedger helps apartment societies generate maintenance bills, track payments, manage expenses, and identify defaulters instantly — all in one simple dashboard.
            </p>

            <p className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-semibold animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
              Built for Apartment Treasurers and Housing Society Committees in India.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
                aria-label="Start Free Trial"
                onClick={() => { window.location.href = '/signup'; }}
              >
                Start Free Trial — Set Up Your Society in Minutes
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300 text-center"
                aria-label="View Features"
              >
                View Features
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm text-slate-600 dark:text-slate-400 animate-fade-in font-medium" style={{ animationDelay: '0.4s' }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 30-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancel anytime</span>
            </div>
          </div>

          {/* Dashboard preview mock */}
          <div className="mt-14 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20" />
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
                      { label: "Total Collected", value: "₹1,20,000", sub: "This month", color: "text-green-600 dark:text-green-400" },
                      { label: "Pending Dues", value: "₹18,500", sub: "3 flats", color: "text-amber-600 dark:text-amber-400" },
                      { label: "Collection Rate", value: "86%", sub: "+4% vs last month", color: "text-indigo-600 dark:text-indigo-400" },
                      { label: "Society Fund", value: "₹2,45,000", sub: "Available balance", color: "text-purple-600 dark:text-purple-400" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{kpi.label}</p>
                        <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Payments</p>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">View all</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {[
                        { flat: "Flat 101 — Sharma", amount: "₹2,000", status: "Paid", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
                        { flat: "Flat 204 — Mehta", amount: "₹2,000", status: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                        { flat: "Flat 302 — Reddy", amount: "₹3,500", status: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                      ].map((row) => (
                        <div key={row.flat} className="flex items-center justify-between px-4 py-2">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{row.flat}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{row.amount}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.color}`}>{row.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── PROBLEM SECTION ──────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Are you still managing apartment maintenance in Excel?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Most apartment societies face the same challenges every month:
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: "📊", title: "Managing maintenance in Excel", desc: "Updating spreadsheets for every payment takes hours and leads to mistakes." },
              { icon: "❓", title: "Difficulty tracking dues", desc: "No clear view of who has paid and who still owes maintenance." },
              { icon: "⏰", title: "Manual billing effort", desc: "Creating bills for 50+ flats manually every month wastes valuable time." },
              { icon: "🔍", title: "Lack of financial transparency", desc: "Residents often ask where money is spent and reports take time to prepare." },
            ].map((p) => (
              <div key={p.title} className="flex gap-4 p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="text-2xl flex-shrink-0">{p.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              FlatLedger solves all of these problems in one simple platform.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Set Up Your Society in{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Minutes</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              No training required. Start managing finances the same day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", icon: "🏠", title: "Add flats and owners", desc: "Add your flats and residents to your society dashboard." },
              { step: "02", icon: "📄", title: "Generate monthly bills", desc: "Generate maintenance bills for every flat with one click." },
              { step: "03", icon: "✅", title: "Track payments & expenses", desc: "Track payments and record society expenses in real time." },
              { step: "04", icon: "📊", title: "View reports & dashboards", desc: "View reports and share transparent financial summaries with residents." },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <span className="absolute top-4 right-4 text-xs font-bold text-slate-300 dark:text-slate-700">{item.step}</span>
                <div className="text-3xl">{item.icon}</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Excel vs{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FlatLedger</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400">See the difference at a glance</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
            <table className="min-w-[640px] w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-100 dark:bg-slate-800 px-5 py-4 text-left font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Feature</th>
                  <th className="bg-red-50 dark:bg-red-900/20 px-5 py-4 text-left font-bold text-red-600 dark:text-red-400 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">📊 Excel / Manual</th>
                  <th className="bg-indigo-600 px-5 py-4 text-left font-bold text-white border-b border-indigo-500 whitespace-nowrap">⚡ FlatLedger</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Bill generation",        "Manual entry, 2–4 hrs/month",  "One-click, under 60 seconds"],
                  ["Payment tracking",       "Separate sheet, error-prone",  "Real-time dashboard"],
                  ["Defaulter reminders",    "Follow up manually",           "Smart defaulter dashboard"],
                  ["Expense management",     "Multiple files, hard to audit","Categorised & GST-ready"],
                  ["Monthly reports",        "Copy-paste nightmare",         "Auto-generated PDF reports"],
                  ["Data backup",            "Depends on your laptop",       "Daily cloud backup"],
                  ["Committee access",       "Shared file, version chaos",   "Role-based multi-user access"],
                  ["UPI payments",           "Not possible",                 "Built-in payment links"],
                ].map(([feature, excel, flat], i) => (
                  <tr key={feature} className={i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/60"}>
                    <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200 align-middle border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">{feature}</td>
                    <td className="px-5 py-3.5 align-middle border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <span className="text-base leading-none">❌</span>
                        <span>{excel}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-medium">
                        <span className="text-base leading-none">✅</span>
                        <span>{flat}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              Every tool your society needs —{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">nothing it doesn't</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Powerful features built for modern society management
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {planFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 animate-slide-in-up group"
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

      {/* ── INTERACTIVE PRODUCT PREVIEW ──────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              See How FlatLedger{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Preview how FlatLedger helps apartment societies manage billing, payments, and expenses.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist">
            {previewTabs.map((tab, i) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activePreviewTab === i}
                  onClick={() => setActivePreviewTab(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 border ${
                    activePreviewTab === i
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {(() => {
            const tab = previewTabs[activePreviewTab];
            return (
              <div className={`grid md:grid-cols-2 gap-8 items-center bg-gradient-to-br ${tab.bg} rounded-2xl border ${tab.border} p-8 shadow-lg transition-all duration-300`}>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tab.label}</h3>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{tab.description}</p>
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={() => { window.location.href = '/signup'; }}
                  >
                    Try it free <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{tab.mockTitle}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-gradient-to-r ${tab.color} text-white`}>Live</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {tab.mockRows.map((row, ri) => (
                      <div key={ri} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{row.flat}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{row.amount}</span>
                          <span className={`text-xs font-semibold ${row.color}`}>{row.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ── DEFAULTER TRACKING HIGHLIGHT ─────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-y border-indigo-100 dark:border-indigo-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-block px-3 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full uppercase tracking-widest">
              Defaulter Tracking
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Instantly Identify Maintenance{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Defaulters
              </span>
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              FlatLedger automatically highlights flats with unpaid maintenance so treasurers no longer need to manually check spreadsheets or call residents.
            </p>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 hover:-translate-y-0.5 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => { window.location.href = '/signup'; }}
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Defaulters This Month</p>
              <span className="ml-auto text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">3 flats</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {[
                { flat: "Flat 204", name: "Mehta", amount: "₹2,000", overdue: "15 days" },
                { flat: "Flat 302", name: "Reddy", amount: "₹3,500", overdue: "22 days" },
                { flat: "Flat 406", name: "Patel", amount: "₹1,500", overdue: "8 days" },
              ].map((row) => (
                <div key={row.flat} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.flat} — {row.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Overdue {row.overdue}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{row.amount}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Total pending: <span className="font-bold text-slate-700 dark:text-slate-200">₹7,000</span> · Updated live
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST & SECURITY ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Enterprise-Grade Security for Your Society Data
            </h2>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Your society's financial data is protected with secure cloud infrastructure, encryption, and automatic backups.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Lock,      iconColor: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30",  title: "Bank-Grade Encryption", desc: "256-bit SSL encryption on all data in transit and at rest." },
              { icon: Cloud,     iconColor: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-100 dark:bg-blue-900/30",      title: "Secure Cloud Hosting",  desc: "Hosted on reliable cloud infrastructure with automatic scaling and redundancy." },
              { icon: HardDrive, iconColor: "text-green-600 dark:text-green-400",   bg: "bg-green-100 dark:bg-green-900/30",    title: "Daily Backups",         desc: "Automatic backups every day so your data is never lost." },
              { icon: Shield,    iconColor: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30",  title: "Data Privacy",          desc: "Your society data is never shared or sold to third parties." },
            ].map(({ icon: Icon, iconColor, bg, title, desc }) => (
              <div key={title} className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${bg} mb-3`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              How Much Time Can FlatLedger{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Save Your Society?</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Drag the slider to match your society size and see the difference.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="flats-slider" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Number of Flats
                </label>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{flatsCount}</span>
              </div>
              <input
                id="flats-slider"
                type="range"
                min={10}
                max={300}
                step={5}
                value={flatsCount}
                onChange={(e) => setFlatsCount(Number(e.target.value))}
                className="w-full h-2 bg-indigo-200 dark:bg-indigo-800 rounded-full accent-indigo-600 cursor-pointer"
                aria-label="Number of flats"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>10 flats</span>
                <span>300 flats</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 text-center">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">Manual Billing</p>
                <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{manualHours}h</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">per month</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 text-center">
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">FlatLedger</p>
                <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{flatledgerMinutes}m</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">per month</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">You Save</p>
                <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{hoursSaved}h+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">every month</p>
              </div>
            </div>

            <p className="text-center text-slate-600 dark:text-slate-400 text-sm">
              That's <span className="font-bold text-indigo-600 dark:text-indigo-400">{hoursSaved * 12}+ hours saved per year</span> — time better spent on your society.
            </p>

            <div className="text-center">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => { window.location.href = '/signup'; }}
              >
                Reclaim Your Time — Start Free <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-balance animate-slide-in-up">
              What society managers say
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>Real feedback from early users</p>
          </div>
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer animate-slide-in-up ${
                    activeTestimonial === index
                      ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-xl scale-[1.02]"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-1"
                  }`}
                  onClick={() => setActiveTestimonial(index)}
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                    ))}
                  </div>
                  <p className="text-slate-900 dark:text-white mb-3 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{testimonial.image}</div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role} · {testimonial.society}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-3 animate-fade-in">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`rounded-full transition-all duration-300 ${
                    activeTestimonial === index ? "bg-indigo-600 dark:bg-indigo-500 w-8 h-2.5" : "bg-indigo-200 dark:bg-indigo-800 w-2.5 h-2.5 hover:bg-indigo-300 dark:hover:bg-indigo-700"
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              Simple Pricing for Every{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Society</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Start with a free 30-day trial. No credit card required.
            </p>
            <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
              Most societies pay less than ₹5 per flat per month.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {plansLoading ? (
              <div className="col-span-2 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading pricing...</p>
              </div>
            ) : plansError ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-red-600 dark:text-red-400">{plansError}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Please try again later.</p>
              </div>
            ) : (
              sortedPlans.map((plan, index) => (
                <label
                  key={plan.id}
                  className={`relative cursor-pointer pt-10 pb-8 px-8 rounded-2xl border-2 transition-all duration-300 animate-slide-in-up flex flex-col gap-4 ${
                    selectedPlanId === plan.id
                      ? "border-indigo-600 shadow-2xl bg-white dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-md hover:shadow-xl hover:-translate-y-1"
                  }`}
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  tabIndex={0}
                  onClick={() => setSelectedPlanId(plan.id)}
                  onKeyPress={(e) => { if (e.key === 'Enter') setSelectedPlanId(plan.id); }}
                >
                  {plan.name === "Yearly" && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="absolute top-4 right-4 w-5 h-5 accent-indigo-600"
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
                    <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">₹{plan.monthlyAmount}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg font-medium">{plan.name === "Monthly" ? "/ month" : "/ year"}</span>
                  </div>
                  {plan.name === "Yearly" && monthlyPlan && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold -mt-2">
                      Only ₹{Math.round(plan.monthlyAmount / 12)}/month effective · vs ₹{monthlyPlan.monthlyAmount}/month
                    </p>
                  )}
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {plan.description || (plan.name === "Monthly"
                      ? "All features included. 30-day trial, then billed monthly."
                      : "All features included. Pay once a year and save 2 months.")}
                  </p>
                  <ul className="space-y-2 mt-2">
                    {planFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{feature.title}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`mt-4 px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-0.5 ${
                      plan.name === "Yearly"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    aria-label={`Start Free Trial for ${plan.name}`}
                    onClick={(e) => { e.preventDefault(); window.location.href = '/signup'; }}
                  >
                    Start Free Trial
                  </button>
                </label>
              ))
            )}
          </div>

          {!plansLoading && !plansError && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              No payment required to start. Cancel anytime.
            </p>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-balance">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Quick answers about your free trial, billing, and support.</p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {[
              { q: "How does the free trial work?", a: "You get 1 month completely free. No payment or credit card required to start. After your free month, you can choose to subscribe to continue. We'll notify you before any payment is due." },
              { q: "What happens after the trial?", a: "After 1 month, you'll receive a notification to select a plan if you wish to continue. No charge happens automatically — you decide when you're ready." },
              { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time, even during the free trial. No questions asked, no hidden charges. Your data remains accessible." },
              { q: "Is my resident data secure?", a: "Absolutely. Bank-grade 256-bit encryption, daily automated backups, and regular security audits. Your data is safer than Excel or physical records." },
              { q: "Does FlatLedger support UPI payments?", a: "Yes. Residents can pay maintenance dues using UPI payment links and payments are automatically tracked in the dashboard." },
              { q: "Is FlatLedger compliant with co-op society regulations?", a: "FlatLedger is built with Indian co-operative housing society regulations in mind, including Maharashtra, Karnataka, Gujarat, and other state co-op acts. Reports are GST-ready as well." },
              { q: "How do I get support?", a: "Email support is available at support@flatledger.com. We respond within 24 hours to all support requests and help you get the most out of the app." },
            ].map((item, i) => (
              <div key={item.q} className="bg-white dark:bg-slate-900">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-200 group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base pr-4">{item.q}</span>
                  <ChevronRight
                    className={`w-5 h-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${openFaq === i ? "rotate-90" : ""}`}
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
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-2xl text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white animate-slide-in-up">
              Start Managing Your Society Finances Today
            </h2>
            <p className="text-lg text-white/90 animate-slide-in-up max-w-xl mx-auto" style={{ animationDelay: '0.1s' }}>
              Create your society in minutes and start generating maintenance bills instantly.
            </p>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 inline-flex w-fit items-center justify-center gap-2 mx-auto group animate-slide-in-up"
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
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <a href="/" className="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300">Home</a>
            <a href="/privacy" className="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300">Privacy Policy</a>
            <a href="/terms" className="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300">Terms</a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl text-center mb-4">
            FlatLedger is apartment management software designed for housing societies in India. It helps apartment associations generate maintenance bills, track payments, manage society expenses, and create financial reports easily. Treasurers and housing society committees can manage their entire society accounting in one simple dashboard without relying on Excel spreadsheets.
          </p>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 FlatLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>



      {/* ── SCROLL CTA POPUP ─────────────────────────────────────────────── */}
      {showScrollCta && !scrollCtaDismissed && (
        <div className="fixed bottom-24 right-6 z-50 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-700 p-5 animate-slide-in-up">
          <button
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            onClick={() => { setShowScrollCta(false); setScrollCtaDismissed(true); }}
            aria-label="Dismiss popup"
          >
            &#x2715;
          </button>
          <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Ready to simplify billing?</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Start your 30-day free trial today.</p>
          <button
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2"
            onClick={() => { window.location.href = '/signup'; }}
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Landing page chatbot — pre-sales FAQ, lazy-loaded after first paint */}
      <Suspense fallback={null}>
        <ChatBot variant="landing" />
      </Suspense>
    </div>
  );
};

export default LandingPage;
