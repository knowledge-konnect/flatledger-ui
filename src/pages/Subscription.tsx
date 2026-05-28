"use client"

import Navbar from '../components/layout/Navbar'
import { useState } from 'react'
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { Link, useNavigate } from 'react-router-dom'
import { BRAND_NAME, SUPPORT_EMAIL } from '../config/branding';
import { PricingSection } from '../components/pricing/PricingSection';

export default function Subscription() {
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();

  const handleStartTrial = async () => {
    setIsActivating(true);
    try {
      showToast('Redirecting to signup for free trial...', 'info');
      setTimeout(() => {
        navigate('/signup');
        setIsActivating(false);
      }, 500);
    } catch (error: any) {
      const errorData = error?.response?.data;
      if (errorData) {
        showErrorToast({
          ok: false,
          message: errorData.message || 'Failed to start trial. Please try again.',
          code: errorData.code,
          fieldErrors: errorData.errors?.reduce(
            (acc: any, err: any) => {
              acc[err.field] = err.messages;
              return acc;
            },
            {}
          ),
          traceId: errorData.traceId,
        });
      } else {
        showToast('Failed to start trial. Please try again.', 'error');
      }
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar variant="landing" />

      {/* Hero Section */}
      <section className="pt-12 md:pt-20 pb-6 md:pb-10 px-2 sm:px-4 lg:px-6 relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700 animate-fade-in">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">✨ 30-Day Free Trial • No Credit Card Required</p>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white text-balance animate-slide-in-up leading-tight tracking-tight">
            Choose the Right Plan for Your Society
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
            Get 30 days completely free. Manage flats, create bills, record payments, and generate reports. No credit card required.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-8 md:py-12 px-2 sm:px-4 lg:px-6">
        <div className="max-w-5xl mx-auto">
          <PricingSection
            onChoosePlan={(planId) => navigate(`/payment?plan=${planId}`)}
            isBusy={isActivating}
          />
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-8 md:py-12 px-2 sm:px-4 lg:px-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">What's included in every plan</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to manage your society effectively
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Maintenance billing', desc: 'Generate bills for all flats in one click.' },
              { title: 'Expense tracking', desc: 'Record society expenses by category anytime.' },
              { title: 'Dashboard & reports', desc: 'Live KPI dashboard with CSV export.' },
              { title: 'Reports & exports', desc: 'Monthly and yearly reports downloadable instantly.' },
              { title: 'Unlimited users', desc: 'Add committee members with role-based access.' },
              { title: '30-day free trial', desc: 'Full access, no credit card required.' },
            ].map((feature, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-colors">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 md:py-12 px-2 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400">Get your society up and running in minutes</p>
          </div>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Add flats and residents',
                description: 'Import residents from Excel or add them manually in minutes.',
              },
              {
                step: '2',
                title: 'Generate maintenance bills',
                description: 'Create bills for all flats in one click with custom amounts and due dates.',
              },
              {
                step: '3',
                title: 'Track payments',
                description: 'See collections, expenses, and pending dues — all in one dashboard.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 md:py-12 px-2 sm:px-4 lg:px-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400">Have questions? We've got answers</p>
          </div>
          <div className="space-y-2">
            {[
              {
                q: 'Can I use FlatLedger for a small apartment?',
                a: 'Yes. FlatLedger works well for apartments with 10–50 flats. It is designed specifically for small, self-managed apartment societies.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes, every society gets a 30-day free trial with full access to all features — billing, payments, expenses, and reports. No credit card required.',
              },
              {
                q: 'How are plans calculated?',
                a: 'Plans are based on the number of flats in your society. Choose the tier that fits your apartment size.',
              },
              {
                q: 'Are maintenance payments online?',
                a: 'Maintenance payments are recorded manually — cash, UPI, or bank transfer. You record what residents pay directly to the society account. Simple and fully under your committee\'s control.',
              },
              {
                q: 'Can we migrate from Excel?',
                a: 'Yes. You can enter your flat list and opening balances directly, or copy them from your existing Excel sheet. Most societies are set up and billing within 30 minutes.',
              },
              {
                q: 'Is our society\'s data secure?',
                a: 'Yes. FlatLedger uses encrypted data storage, role-based access control, and regular backups. Only your committee members can access your society\'s data. We do not share data with any third party.',
              },
              {
                q: 'Can we export our data anytime?',
                a: 'Yes. Bills, payment records, and reports can be exported to CSV at any time. Your data is always yours — you are never locked in.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel your subscription at any time, even during the free trial. No questions asked, no hidden charges.',
              },
              {
                q: 'How do I get support?',
                a: `Email support is available at ${SUPPORT_EMAIL}. We respond to all support requests within 24 hours.`,
              },
            ].map((faq: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{faq.q}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-8 px-2 sm:px-4 lg:px-6 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-600 dark:to-emerald-700">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Start your free trial today. Get 30 days completely free to manage your society. No credit card required.
          </p>
          <button
            onClick={handleStartTrial}
            disabled={isActivating}
            className="inline-block px-8 py-4 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-emerald-200 dark:border-emerald-700 disabled:opacity-70"
          >
            {isActivating ? 'Redirecting…' : 'Start Your Free Trial'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white dark:from-slate-950 to-slate-50 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <a href="/" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">
              Home
            </a>
            <Link to="/privacy" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">
              Terms
            </Link>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
