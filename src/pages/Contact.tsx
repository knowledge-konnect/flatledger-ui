import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Clock, Send, CheckCircle2, Phone, User, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import { contactApi } from '../api/contactApi';
import { useToast } from '../components/ui/Toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const contactUsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  subject: z.string().min(3, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

type ContactFormData = z.infer<typeof contactUsSchema>;

const faqs = [
  {
    question: 'How do I get started with FlatLedger?',
    answer:
      'Sign up for a free trial — no credit card required. You can set up your society, add flats, and start recording maintenance in minutes.',
  },
  {
    question: 'How do I report a bug or request a feature?',
    answer:
      'Use the contact form on this page or email us directly at support@flatledger.in. We review every submission.',
  },
  {
    question: 'Can I export my society data?',
    answer:
      'Yes. You can export payment records, expense reports, and financial summaries as CSV or PDF from the Reports section at any time.',
  },
  {
    question: 'What payment methods are accepted for subscriptions?',
    answer:
      'We accept UPI, debit/credit cards, and net banking via Razorpay. All transactions are secured and encrypted.',
  },
];

export default function Contact() {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactUsSchema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' },
  });

  const messageLength = watch('message')?.length ?? 0;

  const submitMutation = useMutation({
    mutationFn: (data: ContactFormData) =>
      contactApi.submit({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        subject: data.subject,
        message: data.message,
      }),
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status !== 429) {
        showToast('Failed to send. Please try again.', 'error');
      }
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      await submitMutation.mutateAsync(data);
    } catch {
      // Error handled by onError callback
    }
  };

  const handleSendAnother = () => {
    submitMutation.reset();
    reset();
  };

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
                <a
                  href="mailto:support@flatledger.in"
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
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
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Use the form below to send us a message
                </p>
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
              {submitMutation.isSuccess ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Message Sent!</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                    Thanks! We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={handleSendAnother}
                    className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                    Send a Message
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name + Email row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Name"
                        placeholder="Your name"
                        icon={<User className="w-4 h-4" />}
                        error={errors.name?.message}
                        {...register('name')}
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        icon={<Mail className="w-4 h-4" />}
                        error={errors.email?.message}
                        {...register('email')}
                      />
                    </div>

                    {/* Phone (optional) */}
                    <Input
                      label={
                        <span>
                          Phone{' '}
                          <span className="text-slate-400 font-normal text-xs">(optional)</span>
                        </span>
                      }
                      type="tel"
                      placeholder="10-digit mobile number"
                      icon={<Phone className="w-4 h-4" />}
                      error={errors.phone?.message}
                      {...register('phone')}
                    />

                    {/* Subject */}
                    <Input
                      label="Subject"
                      placeholder="What is this about?"
                      icon={<FileText className="w-4 h-4" />}
                      error={errors.subject?.message}
                      {...register('subject')}
                    />

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Describe your question or issue..."
                        className={`w-full px-3 py-2.5 rounded-lg border ${
                          errors.message
                            ? 'border-red-400 dark:border-red-500'
                            : 'border-slate-300 dark:border-slate-700'
                        } bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition resize-none`}
                        {...register('message')}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {errors.message ? (
                          <p className="text-xs text-red-500">{errors.message.message}</p>
                        ) : (
                          <span />
                        )}
                        <p
                          className={`text-xs tabular-nums ${
                            messageLength > 1900
                              ? 'text-red-500'
                              : messageLength > 1600
                              ? 'text-amber-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {messageLength}/2000
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={submitMutation.isPending}
                      disabled={submitMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </>
              )}
            </div>

            {/* FAQ */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Frequently Asked</h2>
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
                >
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1.5">
                    {faq.question}
                  </p>
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
            <Link
              to="/"
              className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/contact"
              className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              Terms
            </Link>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 FlatLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
