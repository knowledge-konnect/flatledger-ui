import Navbar from '../components/layout/Navbar';

const sections = [
  {
    title: '1. Who We Are',
    body: 'FlatLedger is a software-as-a-service (SaaS) product designed to help apartment housing societies in India manage maintenance billing, resident payment records, society expenses, and financial reports. By using FlatLedger, you agree to the practices described in this Privacy Policy. If you have questions, contact us at support@flatledger.com.',
  },
  {
    title: '2. Information We Collect',
    body: 'We collect information you provide directly when you create an account, set up your society, add flat and resident details, record payments, log expenses, or contact us for support. This may include: account holder name and email address; society name, address, and registration details; flat numbers, owner and tenant names, and contact information; maintenance bill amounts, payment records (cash, UPI, cheque, bank transfer), and outstanding dues; expense records, categories, and vendor details; committee member roles and access permissions; and any correspondence with our support team.',
  },
  {
    title: '3. Information Collected Automatically',
    body: 'When you use FlatLedger, we automatically collect certain technical information to operate and improve the service. This includes: IP address and general location (country/state); browser type, device type, and operating system; pages visited, features used, and session duration; error logs and performance data. This information is used solely to maintain service reliability, diagnose technical issues, and improve the product. We do not sell this data.',
  },
  {
    title: '4. How We Use Your Information',
    body: 'We use collected information to: provide and operate the FlatLedger service; create and manage your account and society workspace; generate maintenance bills, payment records, expense reports, and financial summaries; notify you about important account or service updates; respond to support requests and troubleshoot issues; process subscription payments securely through our payment partners; analyse product usage to improve features and fix problems; meet our legal and regulatory obligations.',
  },
  {
    title: '5. Data Sharing and Third-Party Services',
    body: 'We do not sell or rent your personal information to third parties. We share data only in the following circumstances:\n\n• Payment Processing: Subscription payments are processed by Razorpay. FlatLedger does not store your card or bank credentials. Razorpay\'s privacy policy governs their data handling.\n\n• Infrastructure and Hosting: We use cloud hosting providers to store and serve your data securely. These providers are contractually bound to protect your data.\n\n• Support and Communication Tools: We may use email and support platforms to respond to your queries. Only the information necessary to handle your request is shared.\n\n• Legal Requirements: We may disclose data when required by law, court order, or to protect the rights and safety of FlatLedger, its users, or the public.',
  },
  {
    title: '6. Data Storage and Security',
    body: 'Your data is stored on secured servers with industry-standard safeguards including encrypted data storage, HTTPS for all data in transit, access controls limiting data to authorised personnel only, regular backups to prevent data loss, and activity logging for accountability and audit purposes.\n\nWhile we take reasonable precautions to protect your data, no system can guarantee absolute security. In the event of a data breach that affects your information, we will notify you as required by applicable law.',
  },
  {
    title: '7. Data Retention',
    body: 'We retain your account and society data for as long as your subscription is active. If you cancel or your account is terminated, we retain data for a reasonable period (typically 90 days) to allow you to export your records before permanent deletion. Billing records and invoices may be retained longer to comply with tax and accounting regulations under Indian law. You may request early deletion by contacting support@flatledger.com, subject to any legal retention obligations.',
  },
  {
    title: '8. Your Rights and Choices',
    body: 'As a FlatLedger account holder, you have the right to: access the data stored in your account at any time through the dashboard; export your billing records, payment history, and reports as CSV files; request corrections to inaccurate personal or society information; request deletion of your account and associated data (subject to legal retention requirements); withdraw consent for non-essential communications by contacting support.\n\nTo exercise any of these rights, contact us at support@flatledger.com.',
  },
  {
    title: '9. Cookies',
    body: 'FlatLedger uses essential cookies to maintain your login session and keep the application functional. We do not use third-party advertising cookies or behavioural tracking cookies. You can disable cookies in your browser settings, but this may affect your ability to log in and use the service.',
  },
  {
    title: '10. Children\'s Privacy',
    body: 'FlatLedger is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected such information, please contact us immediately at support@flatledger.com and we will delete it.',
  },
  {
    title: '11. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time to reflect changes in the product, legal requirements, or our practices. When we make material changes, we will notify you by email or through a notice in the application. The updated policy will be effective from the date it is published. Continued use of FlatLedger after changes constitutes your acceptance of the updated policy.',
  },
  {
    title: '12. Contact Us',
    body: 'If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please contact us:\n\nEmail: support@flatledger.com\n\nWe aim to respond to all privacy-related inquiries within 5 business days.',
  },
];

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              This policy explains what information FlatLedger collects, how it is used, how it is protected, and your rights as a user.
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