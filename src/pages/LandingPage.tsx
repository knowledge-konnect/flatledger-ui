import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import Navbar from "../components/layout/Navbar";
import {
  ArrowRight, IndianRupee, BarChart3, Users, Zap,
  Receipt, PieChart, CheckCircle2, ChevronRight,
} from "lucide-react";
import { PricingSection } from '../components/pricing/PricingSection';

// Static data — defined outside component to avoid recreation on every render
const planFeatureDefs = [
  { color: "from-green-500 to-green-600", icon: IndianRupee, key: 'billing' },
  { color: "from-teal-500 to-teal-600", icon: Receipt, key: 'payments' },
  { color: "from-orange-500 to-orange-600", icon: BarChart3, key: 'expenses' },
  { color: "from-emerald-500 to-emerald-600", icon: Zap, key: 'finances' },
  { color: "from-emerald-600 to-emerald-800", icon: PieChart, key: 'reports' },
  { color: "from-red-500 to-red-600", icon: Users, key: 'roles' },
] as const;

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  const mockRef = useRef<HTMLDivElement>(null);
  const mockInView = useInView(mockRef, { once: true, margin: '-80px' });

  const planFeatures = planFeatureDefs.map((item) => ({
    ...item,
    title: t(`landing.features.items.${item.key}.title`),
    description: t(`landing.features.items.${item.key}.description`),
  }));
  const trustItems = t('landing.trust.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const earlyAccessItems = t('landing.earlyAccess.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const howItWorksItems = t('landing.howItWorks.steps', { returnObjects: true }) as Array<{ step: string; title: string; description: string }>;
  const faqItems = t('landing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const mockKpis = t('landing.mock.kpis', { returnObjects: true }) as Array<{ label: string; value: string; sub: string; color: string }>;
  const mockRows = t('landing.mock.rows', { returnObjects: true }) as Array<{ flat: string; amount: string; status: string; color: string }>;

  return (
    <div className="min-h-screen pb-24 md:pb-0 bg-white dark:bg-slate-950">
      {/* ── ANNOUNCEMENT BAR ─────────────────────────────────────────────── */}
      {announcementVisible && (
        <div className="w-full bg-emerald-600 text-white text-center text-xs sm:text-sm py-2 px-4 font-medium relative">
          {t('landing.announcement.text')} &nbsp;·&nbsp;
          <a href="#pricing" className="underline underline-offset-2 hover:text-emerald-200 transition-colors">{t('landing.announcement.link')}</a>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-base leading-none"
            onClick={() => setAnnouncementVisible(false)}
            aria-label={t('landing.announcement.dismiss')}
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
              {t('landing.hero.titleLine1')}{" "}{t('landing.hero.titleLine2')}{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
                {t('landing.hero.titleLine3')}
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed animate-slide-in-up font-medium" style={{ animationDelay: '0.1s' }}>
              {t('landing.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
                aria-label={t('landing.hero.primaryCta')}
              >
                <span>{t('landing.hero.primaryCta')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <a
                href="#pricing"
                className="w-full sm:w-auto px-6 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:focus-visible:ring-slate-800"
                aria-label={t('landing.hero.secondaryCta')}
              >
                {t('landing.hero.secondaryCta')}
              </a>
            </div>

            <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {t('landing.hero.teluguBadge')}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 animate-fade-in text-center" style={{ animationDelay: '0.35s' }}>{t('landing.hero.microcopy')}</p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm text-slate-600 dark:text-slate-400 animate-fade-in font-medium" style={{ animationDelay: '0.4s' }}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t('landing.hero.highlights.trial')}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t('landing.hero.highlights.card')}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t('landing.hero.highlights.cancel')}</span>
            </div>
          </div>

          {/* Dashboard preview mock */}
          <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-10 animate-fade-in" style={{ animationDelay: '0.45s' }}>
            {t('landing.mock.previewLabel')}
          </p>
          <div ref={mockRef} className="mt-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
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
                    {mockKpis.map((kpi, i) => (
                      <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={mockInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                        className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{kpi.label}</p>
                        <p className={`text-lg font-bold tabular-nums ${kpi.color}`}>
                          {kpi.value}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{kpi.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('landing.mock.recentPayments')}</p>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('landing.mock.viewAll')}</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {mockRows.map((row, i) => (
                        <motion.div
                          key={`${row.flat}-${row.status}`}
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

      {/* ── TRUST SECTION ──────────────────────────────────────────────── */}
      <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              {t('landing.trust.title')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('landing.trust.subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {trustItems.map((item, index) => {
              const icons = [Receipt, Users, Zap];
              const TrustIcon = icons[index];

              if (!TrustIcon) return null;

              return (
                <div
                  key={item.title}
                  className="flex flex-col items-center text-center p-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 transition-all duration-300 animate-slide-in-up group"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-all duration-300">
                    <TrustIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EARLY ACCESS ───────────────────────────────────────────────────── */}
      <section className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              {t('landing.earlyAccess.title')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              {t('landing.earlyAccess.subtitle')}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[Receipt, Users, Zap].map((IconComponent, idx) => {
              const item = earlyAccessItems[idx];

              return (
                <div key={item.title} className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">{item.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
              aria-label={t('landing.earlyAccess.cta')}
            >
              {t('landing.earlyAccess.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ──────────────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('landing.problem.body1')}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('landing.problem.body2')}
          </p>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              {t('landing.features.titlePrefix')} {" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">{t('landing.features.titleHighlight')}</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              {t('landing.features.subtitle')}
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
      <section id="how-it-works" className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 space-y-2">
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wider">{t('landing.howItWorks.badge')}</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">{t('landing.howItWorks.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {howItWorksItems.map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-2.5 p-1">
                <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-lg font-extrabold shadow-lg flex-shrink-0">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-[14rem]">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
              aria-label={t('landing.howItWorks.cta')}
            >
              {t('landing.howItWorks.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="pt-10 md:pt-12 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              {t('landing.pricing.titlePrefix')} {" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">{t('landing.pricing.titleHighlight')}</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('landing.pricing.subtitle1')}</p>
            {t('landing.pricing.subtitle2') && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('landing.pricing.subtitle2')}</p>
            )}
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{t('landing.pricing.subtitle3')}</p>
          </div>
          <PricingSection
            onChoosePlan={(planId) => navigate(`/signup?plan=${planId}`)}
          />

          {/* ── All plans include ── */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-6">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">All plans include:</p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  'Maintenance billing',
                  'Expense tracking',
                  'Dashboard',
                  'Reports & exports',
                  'Unlimited users',
                  '30-day free trial',
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-700 pt-4">
                🔒 Special pricing for early societies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="pt-16 md:pt-20 pb-10 md:pb-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white text-balance">{t('landing.faq.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3">{t('landing.faq.subtitle')}</p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {faqItems.map((item, i) => (
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
              {t('landing.faq.supportText')}{" "}
              <a href="mailto:support@flatledger.com" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                {t('landing.faq.supportLink')}
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
              {t('landing.finalCta.title')}
            </h2>
            <p className="text-lg text-white/90 animate-slide-in-up max-w-xl mx-auto" style={{ animationDelay: '0.1s' }}>
              {t('landing.finalCta.subtitle')}
            </p>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-emerald-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 inline-flex w-fit items-center justify-center gap-2 mx-auto group animate-slide-in-up focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              style={{ animationDelay: '0.2s' }}
              aria-label={t('landing.finalCta.cta')}
            >
              {t('landing.finalCta.cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 text-sm text-white/90 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span>✅ No credit card required</span>
              <span>✅ 30-day free trial</span>
              <span>✅ Get started in minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
            <div>
              <div className="flex flex-col leading-none gap-1 mb-2">
                <p className="text-lg font-extrabold">
                  <span className="text-slate-900 dark:text-white">Flat</span><span className="text-emerald-600 dark:text-emerald-400">Ledger</span>
                </p>
                <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300 font-bold">Society Management</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('landing.footer.tagline')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('landing.footer.supportingText')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t('landing.footer.groups.product')}</p>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">{t('landing.footer.links.features')}</a></li>
                  <li><a href="#pricing" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">{t('landing.footer.links.pricing')}</a></li>
                  <li><a href="#faq" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">{t('landing.footer.links.faq')}</a></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t('landing.footer.groups.support')}</p>
                <ul className="space-y-2">
                  <li><a href="mailto:support@flatledger.com" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">{t('landing.footer.links.contact')}</a></li>
                  <li><Link to="/privacy" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">{t('landing.footer.links.privacy')}</Link></li>
                  <li><Link to="/terms" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">{t('landing.footer.links.terms')}</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t('landing.footer.groups.builtFor')}</p>
                <ul className="space-y-2">
                  <li><span className="text-sm text-slate-600 dark:text-slate-400">{t('landing.footer.builtFor.societies')}</span></li>
                  <li><span className="text-sm text-slate-600 dark:text-slate-400">{t('landing.footer.builtFor.treasurers')}</span></li>
                  <li><span className="text-sm text-slate-600 dark:text-slate-400">{t('landing.footer.builtFor.telugu')}</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>{t('landing.footer.copyright')}</p>
          </div>
        </div>
      </footer>


      {/* ── MOBILE STICKY CTA ───────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-1.5">{t('landing.mobileCta.hint')}</p>
          <Link
            to="/signup"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
            aria-label={t('landing.mobileCta.button')}
          >
            {t('landing.mobileCta.button')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>


      {/* ── WHATSAPP SUPPORT BUTTON ───────────────────────────────────────── */}
      <a
        href={`https://wa.me/${import.meta.env.VITE_SUPPORT_WHATSAPP ?? '919999999999'}?text=Hi%2C%20I%20have%20a%20question%20about%20FlatLedger`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 left-4 z-50 md:bottom-5 md:left-auto md:right-5 w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-green-400/40"
        aria-label={t('landing.whatsappLabel')}
        title={t('landing.whatsappLabel')}
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
