import Navbar from '../components/layout/Navbar';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using FlatLedger, you agree to be bound by these Terms of Service. These terms apply to all users of the platform, including housing society administrators, treasurers, secretaries, and any committee members granted access. If you do not agree to these terms, do not use the service.',
  },
  {
    title: '2. Description of Service',
    body: 'FlatLedger is a cloud-based software platform that enables apartment housing societies to manage maintenance billing, record resident payments, track society expenses, generate financial reports, and export data. The service is provided on a subscription basis and is intended for use by housing societies and their authorised committee members in India.',
  },
  {
    title: '3. Account Registration and Responsibilities',
    body: 'To use FlatLedger, you must register an account with a valid email address and create a society workspace. You are responsible for:\n\n• Providing accurate and up-to-date information during registration and setup.\n• Maintaining the confidentiality of your account credentials.\n• All activity that occurs under your account, including actions taken by committee members you invite.\n• Ensuring that only authorised individuals are granted access to your society workspace.\n• Promptly notifying us at support@flatledger.com if you suspect unauthorised access to your account.',
  },
  {
    title: '4. Free Trial',
    body: 'FlatLedger offers a 30-day free trial for new accounts. During the trial period, you have access to all features of the plan you select. No credit card is required to start the trial. At the end of the trial period, you may choose to subscribe to a paid plan to continue using the service. If you do not subscribe, your access will be restricted. Data entered during the trial period is retained for a reasonable period after the trial ends.',
  },
  {
    title: '5. Subscription Plans and Billing',
    body: 'FlatLedger offers Monthly and Yearly subscription plans. Pricing details are displayed on the pricing page and within the application.\n\n• Monthly plans are billed each month from the date of subscription.\n• Yearly plans are billed once annually and offer a discounted effective monthly rate.\n• All subscription payments are processed securely through Razorpay, a third-party payment gateway. FlatLedger does not store your payment card details.\n• Subscription fees are non-refundable except where required by applicable law or at our sole discretion.\n• We reserve the right to update pricing with reasonable prior notice. Continued use of the service after a price change constitutes acceptance of the new pricing.',
  },
  {
    title: '6. Cancellation and Termination',
    body: 'You may cancel your subscription at any time from your account settings or by contacting support@flatledger.com. Cancellation takes effect at the end of your current billing cycle; you retain access to the service until that date.\n\nWe reserve the right to suspend or terminate your account without notice if:\n\n• These Terms of Service are violated.\n• Your account is used for fraudulent, abusive, or illegal activity.\n• Continued access poses a security or operational risk to the platform or other users.\n• Required by a court order or applicable law.\n\nUpon termination, you may request an export of your data within 30 days. After this period, data may be permanently deleted.',
  },
  {
    title: '7. Acceptable Use',
    body: 'You agree to use FlatLedger only for lawful purposes and in accordance with these Terms. You must not:\n\n• Attempt to gain unauthorised access to any part of the platform or another user\'s account.\n• Upload, transmit, or distribute malicious code, viruses, or harmful content.\n• Use the platform to store or process data that violates any applicable law or third-party rights.\n• Reverse engineer, decompile, or attempt to extract the source code of FlatLedger.\n• Resell, sublicense, or redistribute access to the service without written permission.\n• Circumvent any security, rate-limiting, or access-control features of the platform.',
  },
  {
    title: '8. Data Ownership',
    body: 'You retain ownership of all data you enter into FlatLedger, including flat records, billing data, payment records, and expense entries. By using the service, you grant FlatLedger a limited licence to store, process, and display this data solely for the purpose of providing the service to you.\n\nWe do not claim any ownership rights over your society\'s data and will not use it for any purpose beyond operating and improving the FlatLedger platform.',
  },
  {
    title: '9. Availability and Service Changes',
    body: 'We aim to keep FlatLedger available and reliable at all times. However, we do not guarantee uninterrupted access to the service. Planned maintenance or unexpected downtime may occur. We will make reasonable efforts to notify users in advance of scheduled maintenance.\n\nWe reserve the right to add, modify, or remove features of the service at any time. Material changes that affect your subscription will be communicated via email or in-app notice.',
  },
  {
    title: '10. Intellectual Property',
    body: 'All rights, title, and interest in FlatLedger — including the software, design, code, trademarks, logos, and documentation — are owned by or licensed to FlatLedger. Nothing in these Terms grants you any right to use our intellectual property except as needed to use the service as intended.',
  },
  {
    title: '11. Disclaimer of Warranties',
    body: 'FlatLedger is provided on an "as-is" and "as-available" basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.\n\nWe do not warrant that the service will be error-free, uninterrupted, secure, or free from bugs or viruses. Your use of the service is at your own risk.',
  },
  {
    title: '12. Limitation of Liability',
    body: 'To the maximum extent permitted by applicable law, FlatLedger and its owners, employees, and affiliates shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising out of or in connection with your use of the service, including but not limited to loss of data, loss of revenue, or loss of business opportunity.\n\nIn no event shall our total liability to you exceed the amount you paid for the service in the 12 months preceding the claim.',
  },
  {
    title: '13. Governing Law',
    body: 'These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in India. We encourage you to contact us at support@flatledger.com first to resolve any dispute informally before pursuing legal action.',
  },
  {
    title: '14. Changes to These Terms',
    body: 'We may update these Terms of Service from time to time to reflect product changes, legal requirements, or operational updates. We will notify you of material changes by email or through an in-app notice at least 14 days before the changes take effect. Continued use of FlatLedger after the effective date constitutes your acceptance of the revised Terms.',
  },
  {
    title: '15. Contact Us',
    body: 'If you have any questions about these Terms of Service, please contact us:\n\nEmail: support@flatledger.com\n\nWe aim to respond to all inquiries within 5 business days.',
  },
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Navbar variant="landing" />

      <main className="flex-1 pt-24 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Legal
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              These terms govern your use of FlatLedger, including account registration, subscriptions, billing, acceptable use, and your rights and obligations as a user.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Effective date: March 12, 2026
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  {section.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-7">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          <div className="mb-6 text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-white">FlatLedger</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Apartment finance, simplified.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <a href="/" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Home</a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors duration-300">Terms</a>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl text-center mb-4">
            FlatLedger helps housing societies in India manage maintenance billing, payment records, expenses, and financial reports without relying on spreadsheets.
          </p>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 w-full text-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2026 FlatLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}