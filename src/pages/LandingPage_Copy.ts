import React, { useState, useEffect, lazy, Suspense } from 'react';
import { usePlans } from '../hooks/usePlans';
import { ArrowRight, IndianRupee, BarChart3, Users, Zap, Star, Receipt, PieChart } from "lucide-react";
import { Link } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";

const ChatBot = lazy(() => import('../components/chatbot/ChatBot'));

// Static data — defined outside component to avoid recreation on every render
const planFeatures = [
  { color: "from-green-500 to-green-600", icon: IndianRupee,   title: "Maintenance bill generation",        description: "Generate bills for all flats in one click" },
  { color: "from-blue-500 to-blue-600",   icon: Receipt,       title: "Payment & dues tracking",            description: "Track who paid, who hasn't, and pending amounts" },
  { color: "from-orange-500 to-orange-600", icon: BarChart3,   title: "Expense management",                 description: "Record society expenses by category" },
  { color: "from-indigo-500 to-indigo-600", icon: Zap,         title: "Dashboard analytics",                description: "Real-time collection rate and fund balance" },
  { color: "from-purple-500 to-purple-600", icon: PieChart,    title: "Financial reports",                  description: "Income vs expense reports and charts" },
  { color: "from-violet-500 to-violet-600", icon: Users,       title: "Role-based access",                  description: "Add Treasurer, Secretary, and Viewer roles" },
];

const LandingPage: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const { plans, plansLoading, plansError } = usePlans();


  const sortedPlans = (Array.isArray(plans) ? [...plans] : []).sort((a, b) => {
    if (a.name === "Monthly") return -1;
    if (b.name === "Monthly") return 1;
    return 0;
  });

  // Calculate yearly savings dynamically from DB prices
  const monthlyPlan = sortedPlans.find(p => p.name === "Monthly");
  const yearlyPlan  = sortedPlans.find(p => p.name === "Yearly");
  const yearlySaving = monthlyPlan && yearlyPlan
    ? (monthlyPlan.monthlyAmount * 12) - yearlyPlan.monthlyAmount
    : null;

  // Selected plan state (default to Monthly if exists)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  useEffect(() => {
    if (sortedPlans.length) {
      const monthly = sortedPlans.find(p => p.name === "Monthly");
      setSelectedPlanId(monthly ? monthly.id : sortedPlans[0].id);
    }
  }, [plans]);

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
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar variant="landing" />

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-14 md:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/20 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-100/20 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />
         <div className="max-w-6xl mx-auto relative z-10">
           <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white text-balance animate-slide-in-up leading-tight tracking-tight">
              Simple Maintenance Billing &
              <span className="hidden sm:inline"><br /></span>{" "}
              <span className="text-primary-600 dark:text-primary-400">Society Accounting Software</span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
              Generate maintenance bills, track payments, manage expenses, and keep society finances transparent—all in one place.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto pt-2 animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">30 Days</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Free Trial</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹0</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">No Credit Card</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Cancel</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Anytime</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 dark:bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-indigo-700 dark:hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                aria-label="Start Free Trial"
                onClick={() => {
                  window.location.href = '/signup';
                }}
              >
                <span className="font-bold">Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300 text-center" aria-label="View Features">
                View Features
              </a>
            </div>
            <div className="pt-4 text-sm text-slate-600 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span>✓ 30-Day Free Trial</span>
                <span className="hidden sm:inline text-slate-400">•</span>
                <span>✓ No credit card required</span>
                <span className="hidden sm:inline text-slate-400">•</span>
                <span>✓ Cancel anytime</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-14 md:py-18 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Are you still managing your society in Excel?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Most apartment societies face the same challenges every month:
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4 p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-2xl flex-shrink-0">📊</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Managing maintenance in Excel</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Updating spreadsheets manually for every payment takes hours and is error-prone</p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-2xl flex-shrink-0">❓</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Difficulty tracking dues</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">No clear view of who has paid and who hasn't—chasing residents wastes time</p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-2xl flex-shrink-0">⏰</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Manual billing effort</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Creating and sending bills to 50+ flats manually every month is exhausting</p>
              </div>
            </div>
            
            <div className="flex gap-4 p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-2xl flex-shrink-0">🔍</div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Lack of financial transparency</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Residents question where money is spent—no easy way to share reports</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              FlatLedger solves all of these problems in one simple platform.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 space-y-4">
            <h2 className="section-heading text-foreground animate-slide-in-up">Everything you need</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Powerful features built for modern society management
            </p>
          </div>

          <div className="card-grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {planFeatures.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center p-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 animate-slide-in-up group"
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                      <IconComponent className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 text-center">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm text-center">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Product Screenshot Section */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              See the dashboard in action
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Everything you need to manage your society finances in one clean interface
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Dashboard View */}
            <div className="group">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl p-8 border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-xl transition-all duration-300 h-64 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <BarChart3 className="w-16 h-16 mx-auto text-indigo-600 dark:text-indigo-400" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard View</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Live KPIs, collection rates, and fund balance at a glance</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Real-time analytics dashboard</p>
            </div>

            {/* Billing Screen */}
            <div className="group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl p-8 border-2 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300 h-64 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Receipt className="w-16 h-16 mx-auto text-green-600 dark:text-green-400" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Billing Screen</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Generate maintenance bills for all flats in seconds</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">One-click billing generation</p>
            </div>

            {/* Payment Tracking - Full Width */}
            <div className="group md:col-span-2">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-xl p-8 border-2 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300 h-64 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <IndianRupee className="w-16 h-16 mx-auto text-orange-600 dark:text-orange-400" />
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Payment Tracking</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Track payments, dues, and defaulters with detailed history</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300 text-center">Complete payment visibility</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">Ready to see it for yourself?</p>
            <button
              className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all duration-300 inline-flex items-center gap-2"
              onClick={() => { window.location.href = '/signup'; }}
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-14 md:py-18 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary-600 dark:text-primary-400 mb-4 tracking-tight">Why Choose Us?</h2>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">Empowering societies with a seamless, secure, and modern management experience. Here’s what sets us apart:</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 mb-3">
                <span className="text-2xl">{'⚡'}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm md:text-base text-center">Lightning Fast Setup</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs text-center">Get started in minutes. No technical skills required.</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30 mb-3">
                <span className="text-2xl">{'💰'}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm md:text-base text-center">Transparent Pricing</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs text-center">Simple plans, no hidden fees. Pay only for what you need.</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-info-100 dark:bg-info-900/30 mb-3">
                <span className="text-2xl">{'🔒'}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm md:text-base text-center">Bank-Grade Security</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs text-center">Encrypted, backed up daily, audited regularly.</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30 mb-3">
                <span className="text-2xl">{'🌟'}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm md:text-base text-center">Built for India</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs text-center">Designed for Indian housing societies from the ground up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 space-y-4">
            <h2 className="section-heading text-foreground animate-slide-in-up">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Start free for 30 days. No credit card required. Cancel anytime.
            </p>
            <p className="text-xl font-semibold text-primary-600 dark:text-primary-400">
              Less than ₹5 per flat per month
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
                  className={`relative cursor-pointer p-8 rounded-xl border-2 transition-all duration-300 animate-slide-in-up flex flex-col gap-4 ${
                    selectedPlanId === plan.id
                      ? "border-indigo-600 shadow-xl bg-white dark:bg-slate-900"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm hover:shadow-lg hover:-translate-y-1"
                  }`}
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  tabIndex={0}
                  onClick={() => setSelectedPlanId(plan.id)}
                  onKeyPress={e => { if (e.key === 'Enter') setSelectedPlanId(plan.id); }}
                >
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
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                    {plan.name === "Yearly" && yearlySaving && (
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full text-xs font-bold ml-2">
                        Save ₹{yearlySaving} · 2 months free
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">₹{plan.monthlyAmount}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg font-medium">{plan.name === "Monthly" ? "/ month" : "/ year"}</span>
                  </div>
                  {plan.name === "Yearly" && monthlyPlan && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium -mt-2">
                      ₹{Math.round(plan.monthlyAmount / 12)}/month effective · vs ₹{monthlyPlan.monthlyAmount}/month
                    </p>
                  )}
                  <div className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                    {plan.description || (plan.name === "Monthly"
                      ? "All features included. 30-day trial, then billed monthly."
                      : "All features included. Pay once a year and save 2 months.")}
                  </div>
                  <ul className="space-y-2 mt-4 mb-2">
                    {planFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <feature.icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{feature.title}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Start Free Trial button inside each plan card */}
                  <button
                    type="button"
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all duration-300 text-center"
                    aria-label={`Start Free Trial for ${plan.name}`}
                    onClick={() => {
                      window.location.href = '/signup';
                    }}
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

      {/* FAQ Section */}
      <section id="faq" className="py-14 md:py-18 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-balance">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Quick answers about your free trial, billing, and support.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">How does the free trial work?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">You get 1 month completely free. No payment or credit card required to start. After your free month, you can choose to subscribe to continue. We'll notify you before any payment is due.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">What happens after the trial?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">After 1 month, you'll receive a notification to select a plan if you wish to continue. No charge happens automatically — you decide when you're ready.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Yes, you can cancel your subscription at any time, even during the free trial. No questions asked, no hidden charges. Your data remains accessible.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Is my resident data secure?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Absolutely. Bank-grade 256-bit encryption, daily automated backups, and regular security audits. Your data is safer than Excel or physical records.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300 md:col-span-2">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">How do I get support?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email support is available at support@flatledger.com. We respond within 24 hours to all support requests and help you get the most out of the app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-balance animate-slide-in-up">What society managers say</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>Real feedback from early users</p>
          </div>

          <div className="relative">
            {/* Testimonial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer animate-slide-in-up ${
                    activeTestimonial === index ? "bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 shadow-lg scale-105" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md hover:-translate-y-1"
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
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {testimonial.role} • {testimonial.society}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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

      {/* CTA Section */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto relative z-10">
            <div className="p-6 md:p-8 bg-primary-600 dark:bg-primary-700 rounded-2xl shadow-xl text-center space-y-3 border border-primary-500 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white animate-slide-in-up">Start Your 30-Day Free Trial</h2>
            <p className="text-lg text-white/90 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              No credit card required. Set up your society in minutes and see the difference.
            </p>
            <Link to="/signup" className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 inline-flex w-fit items-center justify-center gap-2 mx-auto group animate-slide-in-up" style={{ animationDelay: '0.2s' }} aria-label="Start Free Trial">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <a href="/" className="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300">
              Home
            </a>
            <a href="/privacy" className="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors duration-300">
              Terms
            </a>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 FlatLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Landing page chatbot — pre-sales FAQ, lazy-loaded after first paint */}
      <Suspense fallback={null}>
        <ChatBot variant="landing" />
      </Suspense>
    </div>
  )
}

export default LandingPage;
