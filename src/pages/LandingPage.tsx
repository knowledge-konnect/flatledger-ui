"use client"

import React, { useState, useEffect } from 'react';
import { usePlans } from '../hooks/usePlans';
import { ArrowRight, Building2, DollarSign, BarChart3, Lock, Zap, ChevronRight, Star } from "lucide-react";
import { Link } from 'react-router-dom';
import Navbar from "../components/layout/Navbar";
import { useToast } from '../components/ui/Toast';

const LandingPage: React.FC = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { showToast } = useToast();

  const { plans, plansLoading, plansError } = usePlans();

  // Static features for the plan
  const planFeatures = [
    { color: "from-blue-500 to-blue-600", icon: Building2, title: "Unlimited flats & residents", description: "Manage unlimited properties and residents" },
    { color: "from-green-500 to-green-600", icon: DollarSign, title: "Create & manage maintenance bills", description: "Easy bill creation and management" },
    { color: "from-purple-500 to-purple-600", icon: BarChart3, title: "Record payments", description: "Cash, cheque, online transfer support" },
    { color: "from-orange-500 to-orange-600", icon: BarChart3, title: "Advanced charts & reports", description: "Detailed analytics and reporting" },
    { color: "from-indigo-500 to-indigo-600", icon: Zap, title: "Real-time KPI dashboard", description: "Live performance metrics" },
    { color: "from-cyan-500 to-cyan-600", icon: BarChart3, title: "Track all expenses & income", description: "Complete financial tracking" },
    { color: "from-red-500 to-red-600", icon: Lock, title: "Payment history & receipts", description: "Secure transaction records" },
    { color: "from-yellow-500 to-yellow-600", icon: Zap, title: "Email support", description: "24/7 customer support" },
  ]

  // plans, plansLoading, plansError now come from usePlans()

  // Transform API data to component format
  // Sort plans so Monthly appears first
  const sortedPlans = (Array.isArray(plans) ? [...plans] : []).sort((a, b) => {
    if (a.name === "Monthly") return -1;
    if (b.name === "Monthly") return 1;
    return 0;
  });

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
      name: "Rajesh Kumar",
      role: "Treasurer",
      society: "Sunheart Apartments, Mumbai",
      text: "We started using SocietyLedger last year. Collection is now easy. Members pay on time, and managing finances takes just 2 hours a month.",
      image: "👨‍💼",
    },
    {
      name: "Priya Sharma",
      role: "Secretary",
      society: "Green Valley Society, Bangalore",
      text: "Switched from Excel. Best decision ever. The app is simple, members like it, and office work is much less now.",
      image: "👩‍💼",
    },
    {
      name: "Amit Patel",
      role: "Finance Head",
      society: "Westbrook Towers, Pune",
      text: "No more chasing people for payments. Automatic reminders work great. Now I have time for other society work.",
      image: "👨‍🔧",
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar variant="landing" />

      {/* Hero Section */}
      <section className="pt-32 md:pt-48 pb-24 md:pb-40 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/20 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-100/20 dark:bg-violet-900/10 rounded-full blur-3xl pointer-events-none" />
         <div className="max-w-6xl mx-auto relative z-10">
           <div className="space-y-8 text-center">
            <div className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-200 dark:border-indigo-700 animate-fade-in">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <span className="animate-bounce">✨</span> Trusted by <span className="font-bold">500+</span> societies across India
              </p>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white text-balance animate-slide-in-up leading-tight tracking-tight">
              Effortless Society Management
              <br />
              <span className="text-primary-600 dark:text-primary-400">For Committees & Residents</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
              Ditch spreadsheets and manual work. Automate bills, payments, reports, and communication. Secure, simple, and built for Indian societies.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">500+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Societies</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹10 Cr+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Collections</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">95%+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Recovery Rate</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                className="px-8 py-4 bg-indigo-600 dark:bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-indigo-700 dark:hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
                aria-label="Start Free Trial"
                onClick={() => {
                  showToast('Redirecting to signup for free trial...', 'info');
                  window.location.href = '/signup';
                }}
              >
                <span className="font-bold">Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <a href="#features" className="px-8 py-4 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-300" aria-label="View Features">
                View Features
              </a>
            </div>
            <div className="pt-12 text-sm text-slate-600 dark:text-slate-400 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <p>✓ 1 Month Free  •  ✓ No automatic billing  •  ✓ Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-40">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 space-y-4">
            <h2 className="section-heading text-foreground animate-slide-in-up">Everything you need</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Powerful features built for modern society management
            </p>
          </div>

          <div className="card-grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {planFeatures.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 animate-slide-in-up group"
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

      {/* Trust & Security Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-600 dark:text-primary-400 mb-4 tracking-tight">Why Choose Us?</h2>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">Empowering societies with a seamless, secure, and modern management experience. Here’s what sets us apart:</p>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 min-h-[220px]">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 mb-3 md:mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 md:mb-2 text-base md:text-lg text-center whitespace-nowrap">Lightning Fast Setup</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm text-center">Get started in minutes with our intuitive onboarding. No technical skills required.</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 min-h-[220px]">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30 mb-3 md:mb-4">
                <span className="text-3xl">💵</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 md:mb-2 text-base md:text-lg text-center whitespace-nowrap">Transparent Pricing</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm text-center">Simple, affordable plans with no hidden fees. Pay only for what you need.</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 min-h-[220px]">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-info-100 dark:bg-info-900/30 mb-3 md:mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 md:mb-2 text-base md:text-lg text-center whitespace-nowrap">Bank-Grade Security</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm text-center">Your data is encrypted, backed up daily, and protected by industry best practices.</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300 min-h-[220px]">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30 mb-3 md:mb-4">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1 md:mb-2 text-base md:text-lg text-center whitespace-nowrap">Loved by Societies</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm text-center">Trusted by 500+ societies for reliability, support, and continuous improvement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-40">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 space-y-4">
            <h2 className="section-heading text-foreground animate-slide-in-up">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Start free for 1 month. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {plansLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading pricing...</p>
              </div>
            ) : plansError ? (
              <div className="text-center py-12">
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                    {plan.name === "Yearly" && (
                      <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold ml-2">Save 2 months</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">₹{plan.monthlyAmount}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-lg font-medium">{plan.name === "Monthly" ? "/ month" : "/ year"}</span>
                  </div>
                  <div className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                    {plan.description || (plan.name === "Monthly"
                      ? "Everything included. 1 month free, then pay monthly."
                      : "Everything included. 1 year, save 2 months.")}
                  </div>
                  <ul className="space-y-2 mt-4 mb-2">
                    {planFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature.title}</span>
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
            <div className="flex flex-col items-center mt-10">
              <div className="text-center text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                1 Month Free Trial
              </div>
              <div className="text-center text-slate-700 dark:text-slate-300 max-w-xl">
                No payment required to start. After your free month, you can choose to pay for your selected plan if you wish to continue. Cancel anytime. Select a plan above and click its "Start Free Trial" button to begin.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-40">
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white text-balance">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Quick answers about your free trial, billing, and support.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">How does the free trial work?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">You get 1 month completely free. No payment or credit card required to start. After your free month, you'll be automatically billed for your selected plan unless you cancel.</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">What happens after the trial?</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">After 1 month, your subscription will begin and you'll be charged the price of your selected plan. You can change or cancel your plan anytime before the trial ends.</p>
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
              <p className="text-sm text-slate-600 dark:text-slate-400">Email support is available at support@societyledger.com. We respond within 24 hours to all support requests and help you get the most out of the app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white text-balance animate-slide-in-up">Trusted by 500+ societies</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>See what society managers are saying</p>
          </div>

          <div className="relative">
            {/* Testimonial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`p-8 rounded-xl border-2 transition-all duration-300 cursor-pointer animate-slide-in-up ${
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

                  <p className="text-slate-900 dark:text-white mb-6 leading-relaxed">"{testimonial.text}"</p>

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
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto relative z-10">
            <div className="p-6 md:p-8 bg-primary-600 dark:bg-primary-700 rounded-2xl shadow-xl text-center space-y-3 border border-primary-500 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-4xl md:text-5xl font-bold text-white animate-slide-in-up">Start your free trial today</h2>
            <p className="text-lg text-white/90 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              1 month free, no credit card required. Join 500+ societies managing with SocietyLedger.
            </p>
            <Link to="/subscription" className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 mx-auto group animate-slide-in-up" style={{ animationDelay: '0.2s' }} aria-label="Start Free Trial">
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
            <p>&copy; 2025 SocietyLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage;
