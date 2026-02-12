"use client"

import Navbar from '../components/layout/Navbar'
import { useState, useEffect } from 'react'
import { usePlans } from '../hooks/usePlans';
import { useToast } from '../components/ui/Toast';
import { useApiErrorToast } from '../hooks/useApiErrorHandler';
import { CheckCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Subscription() {
  const navigate = useNavigate();
  const [isActivating, setIsActivating] = useState(false);
  const { showToast } = useToast();
  const { showErrorToast } = useApiErrorToast();
  const { plans, plansLoading, plansError } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Set default selected plan when plans load
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

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

      {/* Hero Section - Dynamic by selected plan */}
      <section className="pt-12 md:pt-20 pb-6 md:pb-10 px-2 sm:px-4 lg:px-6 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-200 dark:border-indigo-700 animate-fade-in">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">✨ 1 Month Free • No Credit Card Required</p>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white text-balance animate-slide-in-up leading-tight tracking-tight">
            {selectedPlanId && plans.length > 0 ? `Choose the ${plans.find(p => p.id === selectedPlanId)?.name} Plan` : 'Start Your Free Trial Today'}
          </h1>
          <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
            {selectedPlanId && plans.length > 0
              ? plans.find(p => p.id === selectedPlanId)?.description || 'Get 1 month completely free. Manage flats, create bills, record payments, and generate reports. No credit card required.'
              : 'Get 1 month completely free. Manage flats, create bills, record payments, and generate reports. No credit card required.'}
          </p>
          {selectedPlanId && plans.length > 0 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">₹{plans.find(p => p.id === selectedPlanId)?.monthlyAmount}</span>
              <span className="text-lg text-slate-600 dark:text-slate-400">/month</span>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Plan */}
      <section className="py-8 md:py-12 px-2 sm:px-4 lg:px-6">
        <div className="max-w-3xl mx-auto">
          {plansLoading ? (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">Loading plans...</div>
          ) : plansError ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">{plansError}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className={`rounded-2xl border-2 transition-all duration-300 shadow-xl overflow-hidden bg-white dark:bg-slate-900 ${selectedPlanId === plan.id ? 'border-indigo-600 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-base font-medium text-indigo-600 dark:text-indigo-400">{plan.description}</p>
                    </div>
                    <div className="space-y-1 border-t border-b border-slate-200 dark:border-slate-800 py-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">₹{plan.monthlyAmount}</span>
                        <span className="text-lg text-slate-600 dark:text-slate-400">/month</span>
                      </div>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">1 Month Free • No Credit Card Required</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">Then cancel anytime, no lock-in.</p>
                    </div>
                    <ul className="space-y-2">
                      {['Unlimited Flats & Residents', 'Secure Data Storage', 'Team Collaboration', 'Advanced Reports', 'Payment Recording', 'Email Support'].map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => { setSelectedPlanId(plan.id); handleStartTrial(); }}
                      disabled={isActivating}
                      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:shadow-lg hover:-translate-y-1 shadow-lg disabled:opacity-70 hover:from-indigo-700 hover:to-indigo-600 dark:from-indigo-600 dark:to-indigo-500 ${selectedPlanId === plan.id ? '' : 'opacity-70'}`}
                      aria-label={`Start Free Trial for ${plan.name}`}
                    >
                      {isActivating && selectedPlanId === plan.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          Start Your Free Trial
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-8 md:py-12 px-2 sm:px-4 lg:px-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">What's included in {selectedPlanId && plans.length > 0 ? plans.find(p => p.id === selectedPlanId)?.name : 'the plan'}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {selectedPlanId && plans.length > 0
                ? plans.find(p => p.id === selectedPlanId)?.description || 'Everything you need to manage your society effectively'
                : 'Everything you need to manage your society effectively'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Unlimited Flats & Residents', 'Secure Data Storage', 'Team Collaboration', 'Advanced Reports', 'Payment Recording', 'Email Support'].map((feature: string, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-colors">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 md:py-12 px-2 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-slate-600 dark:text-slate-400">Get your society up and running in minutes</p>
          </div>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your account with your society name, email, and phone number.',
              },
              {
                step: '2',
                title: 'Add Flats & Residents',
                description: 'Enter flat numbers, owner names, emails, and maintenance amounts.',
              },
              {
                step: '3',
                title: 'Generate Bills',
                description: 'Create maintenance bills with customized amounts and due dates.',
              },
              {
                step: '4',
                title: 'Collect Payments',
                description: 'Collect payments from residents offline (cash, cheque, or personal UPI).',
              },
              {
                step: '5',
                title: 'Record & Track',
                description: 'Manually enter payment details in the app and generate reports.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white font-bold text-lg">
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
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400">Have questions? We've got answers</p>
          </div>
          <div className="space-y-2">
            {[{
                q: 'How does the free trial work?',
                a: 'You get 1 month completely free with full access to all features. No credit card required to start. After 30 days, it\'s ₹299/month. You can cancel anytime.',
              },
              {
                q: 'Is my data secure?',
                a: 'Yes, we use bank-grade encryption, SSL certificates, and daily automated backups to protect your data.',
              },
              {
                q: 'How are payments collected?',
                a: 'Payments are collected offline by the society admin (cash, cheque, or personal UPI). You manually enter payment details in the app for record-keeping and reporting.',
              },
              {
                q: 'Can I add unlimited flats?',
                a: 'Yes, the plan includes unlimited flats. Add as many flats and residents as your society has.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel your subscription at any time, even during the free trial. No questions asked, no hidden charges.',
              },
              {
                q: 'How do I get support?',
                a: 'Email support is available at support@societyledger.com. We respond to all support requests within 24 hours.',
              }].map((faq: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{faq.q}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-8 px-2 sm:px-4 lg:px-6 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-600 dark:to-indigo-700">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to get started with {selectedPlanId && plans.length > 0 ? plans.find(p => p.id === selectedPlanId)?.name : 'your plan'}?</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            {selectedPlanId && plans.length > 0
              ? `Start your free trial for the ${plans.find(p => p.id === selectedPlanId)?.name} plan. Get 1 month free. No credit card required.`
              : 'Start your free trial now. Get 1 month completely free to manage your society. No credit card required.'}
          </p>
          <button
            onClick={handleStartTrial}
            disabled={isActivating}
            className="inline-block px-8 py-4 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-indigo-200 dark:border-indigo-700 disabled:opacity-70"
          >
            {isActivating ? 'Redirecting...' : `Start Free Trial for ${selectedPlanId && plans.length > 0 ? plans.find(p => p.id === selectedPlanId)?.name : 'Plan'}`}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white dark:from-slate-950 to-slate-50 dark:to-slate-900">
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
