import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Navbar from "../components/layout/Navbar";
import {
  ArrowRight, Users, Receipt, CheckCircle2, ChevronRight, Shield, Database,
  CreditCard, BarChart2, History,
} from "lucide-react";
import { PricingSection } from '../components/pricing/PricingSection';

// Static data — defined outside component to avoid recreation on every render


const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);


  // const mockInView = useInView(mockRef, { once: true, margin: '-80px' });

  // const planFeatures = planFeatureDefs.map((item) => ({
  //   ...item,
  //   title: t(`landing.features.items.${item.key}.title`),
  //   description: t(`landing.features.items.${item.key}.description`),
  // }));
  // const trustItems = t('landing.trust.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  // const mockKpis = t('landing.mock.kpis', { returnObjects: true }) as Array<{ label: string; value: string; sub: string; color: string }>;
  // const mockRows = t('landing.mock.rows', { returnObjects: true }) as Array<{ flat: string; amount: string; status: string; color: string }>;

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
      <section className="pt-24 md:pt-32 pb-10 md:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
        {/* Premium gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/20 dark:bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-100/20 dark:bg-teal-900/10 rounded-full blur-3xl pointer-events-none" />
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(16,185,129,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* Radial glow from top */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.15), transparent)' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
              Stop Managing Society Maintenance in Excel
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed font-medium">
              Manage maintenance billing, expenses, and payments &mdash; without Excel or WhatsApp
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900"
                aria-label="Start Free 30-Day Trial"
              >
                <span>Start Free 30-Day Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <a
                href="#pricing"
                className="w-full sm:w-auto px-6 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99] transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 dark:focus-visible:ring-slate-800"
                aria-label="View Pricing"
              >
                View Pricing
              </a>
            </div>
            {/* Trust row below CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No Credit Card Required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 30-Day Free Trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Setup in Under 10 Minutes</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancel Anytime</span>
            </div>
          </div>

          {/* Dashboard Preview Mock */}
          <div className="mt-10 relative max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
              {/* App shell */}
              <div className="flex h-[420px] bg-slate-950 text-white select-none">

                {/* ── Sidebar ── */}
                <aside className="hidden sm:flex flex-col w-44 shrink-0 bg-slate-950 border-r border-slate-800">
                  {/* Logo */}
                  <div className="px-4 pt-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">F</div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">FlatLedger</p>
                        <p className="text-[9px] text-slate-400 leading-tight">Management</p>
                      </div>
                    </div>
                  </div>
                  {/* Nav */}
                  <nav className="flex-1 px-2 py-3 space-y-0.5 text-[11px]">
                    <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Overview</p>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-700/30 text-emerald-400 font-semibold">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500/30 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-sm bg-emerald-400" /></div>
                      Dashboard
                    </div>
                    <p className="px-2 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Management</p>
                    {['Flats', 'Maintenance', 'Expenses', 'Reports'].map(item => (
                      <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                        <div className="w-3 h-3 rounded-sm bg-slate-800" />
                        {item}
                      </div>
                    ))}
                    <p className="px-2 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Admin</p>
                    {['Users', 'Settings'].map(item => (
                      <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-400">
                        <div className="w-3 h-3 rounded-sm bg-slate-800" />
                        {item}
                      </div>
                    ))}
                  </nav>
                  {/* User */}
                  <div className="px-3 py-3 border-t border-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold">S</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-white truncate">Santosh Kumar</p>
                      <p className="text-[9px] text-slate-400">Society Admin</p>
                    </div>
                  </div>
                </aside>

                {/* ── Main content ── */}
                <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
                  {/* Topbar */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">⟋</span>
                      <span className="text-sm font-bold text-white">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-semibold">Trial · 4d left</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">⬆ Upgrade</span>
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold">S</div>
                    </div>
                  </div>

                  {/* Scrollable body */}
                  <div className="flex-1 overflow-hidden px-4 py-3 space-y-3">
                    {/* Welcome + bills banner */}
                    <div className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">Welcome back, Santosh 👋</p>
                          <p className="text-[11px] text-slate-400">Here's your society's financial overview</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-medium">This Month</span>
                          <span className="px-2 py-0.5 rounded-md text-slate-500">Last Month</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="text-emerald-400">↗</span> 49% collected this month</span>
                        <span className="flex items-center gap-1 text-amber-400">⚠ 20 flats pending</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 text-[10px] font-medium w-fit">
                        ✓ Bills generated for June 2026
                      </div>
                    </div>

                    {/* KPI cards */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'PAYMENTS RECEIVED', value: '₹19,500', sub: null, bar: true, barPct: 49, barColor: 'bg-red-400' },
                        { label: 'PENDING DUES', value: '₹20,500', sub: '20 flats pending', subColor: 'text-amber-400', bar: false },
                        { label: 'SOCIETY EXPENSES', value: '₹0', sub: null, bar: false },
                        { label: 'CURRENT FUND BALANCE', value: '₹12,400', sub: null, bar: false },
                      ].map(k => (
                        <div key={k.label} className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-3">
                          <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{k.label}</p>
                          <p className="text-base font-black text-white">{k.value}</p>
                          {k.sub && <p className={`text-[10px] mt-0.5 font-medium ${k.subColor || 'text-slate-400'}`}>{k.sub}</p>}
                          {k.bar && (
                            <div className="mt-2">
                              <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                                <div className={`h-full ${k.barColor} rounded-full`} style={{ width: `${k.barPct}%` }} />
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5">Collection · {k.barPct}% of current bills</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bottom row: chart + pending dues + recent transactions */}
                    <div className="grid grid-cols-5 gap-2">
                      {/* Mini bar chart */}
                      <div className="col-span-2 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-slate-300 mb-2">6-Month Income vs Expenses</p>
                        <div className="flex items-end gap-1.5 h-16 px-1">
                          {[
                            { inc: 10, exp: 5 }, { inc: 8, exp: 4 }, { inc: 6, exp: 3 }, { inc: 9, exp: 6 }, { inc: 100, exp: 40 }, { inc: 50, exp: 5 },
                          ].map((bar, i) => (
                            <div key={i} className="flex-1 flex items-end gap-0.5">
                              <div className="flex-1 rounded-t bg-emerald-500 opacity-80" style={{ height: `${bar.inc}%` }} />
                              <div className="flex-1 rounded-t bg-red-400 opacity-70" style={{ height: `${bar.exp}%` }} />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Income</span>
                          <span className="flex items-center gap-1 text-[9px] text-slate-400"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Expense</span>
                        </div>
                      </div>

                      {/* Highest pending dues */}
                      <div className="col-span-2 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-slate-300 mb-1">Highest Pending Dues</p>
                        <p className="text-[9px] text-slate-500 mb-2">Flats with large outstanding balances</p>
                        <div className="space-y-1">
                          {[
                            { flat: 'Flat A-115', amt: '₹1,500' },
                            { flat: 'Flat A-103', amt: '₹1,000' },
                            { flat: 'Flat A-104', amt: '₹1,000' },
                            { flat: 'Flat A-105', amt: '₹1,000' },
                          ].map((r, i) => (
                            <div key={r.flat} className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-400">{i + 1}</span>
                                <span className="text-slate-300">{r.flat}</span>
                              </div>
                              <span className="font-semibold text-red-400">{r.amt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent transactions */}
                      <div className="col-span-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-slate-300 mb-1">Recent</p>
                        <div className="space-y-1.5">
                          {[
                            { flat: 'A-111', amt: '+₹1,000' },
                            { flat: 'A-114', amt: '+₹1,000' },
                            { flat: 'A-109', amt: '+₹1,000' },
                          ].map(r => (
                            <div key={r.flat} className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-3.5 h-3.5 rounded-full bg-emerald-900/60 border border-emerald-600/40 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              </div>
                              <span className="text-slate-400 flex-1">{r.flat}</span>
                              <span className="text-emerald-400 font-semibold">{r.amt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
            {/* Sample data badge */}
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/90 backdrop-blur border border-slate-600 text-xs font-semibold text-slate-300">
                Sample Data
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none rounded-b-2xl" />
          </div>
          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Actual dashboard — all data belongs to your society, accessible anytime.
          </p>

        </div>
      </section>

      {/* ── SOCIETY RECORDS STAY WITH THE SOCIETY ───────────────────────── */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Society Records Stay With The Society</h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">Committee members may change, but society records should not.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-red-200 dark:border-red-900/60 p-8">
              <h3 className="font-bold text-red-600 dark:text-red-400 mb-5 text-lg">Without FlatLedger</h3>
              <ul className="space-y-3 text-base text-slate-700 dark:text-slate-300">
                <li>❌ Records stored on personal laptops</li>
                <li>❌ Excel files get misplaced</li>
                <li>❌ Information scattered across notebooks and WhatsApp</li>
                <li>❌ New committees struggle with handovers</li>
              </ul>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8">
              <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-5 text-lg">With FlatLedger</h3>
              <ul className="space-y-3 text-base text-slate-700 dark:text-slate-300">
                <li>✅ Records remain accessible</li>
                <li>✅ Easy committee handover</li>
                <li>✅ Complete society history stays available</li>
                <li>✅ One secure place for all records</li>
              </ul>
            </div>
          </div>
          <p className="text-base font-medium text-slate-600 dark:text-slate-400 text-center mt-10">Because society records belong to the society — not to one person's laptop</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">From Excel to FlatLedger in one afternoon</h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">No IT help needed. No training required.</p>
          </div>
          <div className="relative">
            {/* Desktop connector line */}
            <div
              className="hidden md:block absolute h-0.5 bg-emerald-300 dark:bg-emerald-700 pointer-events-none z-0"
              style={{ top: '23px', left: 'calc(100% / 6)', right: 'calc(100% / 6)' }}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-black mb-4 shadow-md relative z-10">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Add your flats</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Enter flat numbers and owner names. Import from Excel if you have one.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-black mb-4 shadow-md relative z-10">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Generate your first bill</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Select the month, set the amount, click generate. Done for all flats at once.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-black mb-4 shadow-md relative z-10">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Track every payment</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Mark payments as they arrive — cash, UPI, or cheque. See who has paid instantly.</p>
              </div>
            </div>
          </div>
          <p className="text-base font-semibold text-slate-600 dark:text-slate-300 text-center mt-8">Your society is fully set up. No accountant needed.</p>
          <div className="text-center mt-6">
            <Link to="/signup" className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-base">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BUILT FOR APARTMENT COMMUNITIES ─────────────────────────────── */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Built for Apartment Societies</h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Designed for small apartment societies across India</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Apartment Secretaries</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Manage maintenance billing, expenses, and records without spreadsheets.</p>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Treasurers</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Track collections, expenses, and balances with confidence.</p>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Committee Members</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Access important society information from one shared system.</p>
            </div>
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl flex items-center justify-center mb-4 shadow-md">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Easy Committee Handover</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Records stay organized even when committee members change.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Everything You Need for Maintenance Management</h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">Simple tools to manage billing, track expenses, and stay on top of dues.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-start p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Maintenance Billing</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Create monthly maintenance bills in minutes.</p>
            </div>
            <div className="flex flex-col items-start p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Expense Tracking</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Record expenses and maintain clear financial records.</p>
            </div>
            <div className="flex flex-col items-start p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Defaulter Reports</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Track pending dues and generate reports instantly.</p>
            </div>
            <div className="flex flex-col items-start p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Payment Recording</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Record cash, UPI, cheque and bank transfers as they arrive. Know instantly who has paid and who hasn't.</p>
            </div>
            <div className="flex flex-col items-start p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <BarChart2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reports</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Collection summary, fund ledger, payment history — export anytime for AGM or committee review.</p>
            </div>
            <div className="flex flex-col items-start p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <History className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Start Where You Left Off</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">Enter your existing fund balance and outstanding dues. Switch from Excel without losing any history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white animate-slide-in-up">
              Simple Pricing for Apartment Societies
            </h2>
            <p className="text-lg text-emerald-700 dark:text-emerald-400 font-bold">Less than ₹7 per day for most societies.</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold text-sm mt-2">
              Early Access Pricing
            </div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">First 10 societies lock in this price forever — price never increases</div>
          </div>
          <PricingSection
            onChoosePlan={(planId) => navigate(`/signup?plan=${planId}`)}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">One price for your whole society · No per-flat charges · No setup cost</p>
          </div>

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

      <section id="faq" className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3">Quick answers about your free trial, billing, and support.</p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {[
              { q: "Can I use FlatLedger for a small apartment?", a: "Yes. FlatLedger works for small and large apartment societies alike." },
              { q: "Are maintenance payments online?", a: "Maintenance collection tracking is built-in. Online payment collection is coming soon." },
              { q: "Is there a free trial?", a: "Yes. You get a full 30-day free trial with no credit card required." },
              { q: "Can we migrate from Excel?", a: "Yes. You can import your existing data from Excel or enter an opening balance to get started quickly." },
              { q: "Is our data secure?", a: "Yes. All data is stored securely in the cloud with daily backups and you can export your data at any time." },
              { q: "Can new committee members access old records?", a: "Yes. Society records remain available even when committee members change." },
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
              Still have questions?{' '}
              <a href="mailto:support@flatledger.in" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Talk to support
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="p-6 md:p-10 bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-2xl shadow-2xl text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">Stop spending Sunday evenings on maintenance billing.</h2>
            <p className="text-lg text-white/90 max-w-xl mx-auto">Start your free trial today — no Excel, no setup, no credit card.</p>
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-emerald-600 rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-slate-50 hover:-translate-y-1 active:translate-y-0 active:scale-[0.99] transition-all duration-300 inline-flex w-fit items-center justify-center gap-2 mx-auto group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 border border-white/40"
              aria-label="Start Free Trial"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 pt-3 text-sm text-white/90">
              <span>30-day free trial</span>
              <span>·</span>
              <span>No Excel needed</span>
              <span>·</span>
              <span>Works on mobile</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Secure Cloud Storage</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Daily Backups</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Data Export Anytime</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Email Support</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Made for Apartment Societies across India</div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
            <p>© 2026 FlatLedger. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link>
              <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
            </div>
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
