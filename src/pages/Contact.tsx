import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Clock, Send, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { contactApi } from '../api/contactApi';

const faqs = [
  {
    question: 'How do I get started with FlatLedger?',
    answer: 'Sign up for a free trial — no credit card required. You can set up your society, add flats, and start recording maintenance in minutes.',
  },
  {
    question: 'How do I report a bug or request a feature?',
    answer: 'Use the contact form on this page or email us directly at support@flatledger.in. We review every submission.',
  },
  {
    question: 'Can I export my society data?',
    answer: 'Yes. You can export payment records, expense reports, and financial summaries as CSV or PDF from the Reports section at any time.',
  },
  {
    question: 'What payment methods are accepted for subscriptions?',
    answer: 'We accept UPI, debit/credit cards, and net banking via Razorpay. All transactions are secured and encrypted.',
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await contactApi.submit({
        name: form.name,
        email: form.email,
        subject: form.subject || undefined,
        message: form.message,
      });
      setSubmitted(true);
    } catch {
      setError('Failed to send your message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navbar variant="landing" />

      <main className="flex-1 pt-24 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-12 text-center space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Get in Touch
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              Contact Us
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Have a question, feedback, or need help? We're here for you.
            </p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Email</p>
                <a href="mailto:support@flatledger.in" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                  support@flatledger.in
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Support</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Use the form below to send us a message</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Response Time</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Within 1–2 business days</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact form */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Message Sent!</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    Thanks for reaching out. We'll get back to you at <span className="font-medium text-slate-700 dark:text-slate-300">{form.email}</span> within 1–2 business days.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Send a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                      >
                        <option value="" disabled>Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing &amp; Subscription</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Report a Bug</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Describe your question or issue..."
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition resize-none"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg font-bold shadow hover:bg-emerald-700 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {loading ? 'Sending…' : 'Send Message'}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* FAQ */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Asked</h2>
              {faqs.map((faq) => (
                <div key={faq.question} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5">{faq.question}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-6">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          <div className="mb-6 text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-white">FlatLedger</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Apartment finance, simplified.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <Link to="/" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Home</Link>
            <Link to="/contact" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Contact</Link>
            <Link to="/privacy" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Terms</Link>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 FlatLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
