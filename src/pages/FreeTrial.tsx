import Navbar from '../components/layout/Navbar'
import { Link } from 'react-router-dom'

export default function FreeTrial() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar variant="landing" />

      <main className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Try FlatLedger free for 30 days</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mt-3">No credit card required. Set up your society, send the first bill, and see payments come in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-center">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">What you get</h2>
              <ul className="mx-auto max-w-md space-y-3 text-slate-500 dark:text-slate-400">
                <li className="flex items-center justify-center gap-3"><span className="text-emerald-600 dark:text-emerald-400">•</span> Full access to Professional features for 30 days</li>
                <li className="flex items-center justify-center gap-3"><span className="text-emerald-600 dark:text-emerald-400">•</span> Create bills, send email reminders, and track payments</li>
                <li className="flex items-center justify-center gap-3"><span className="text-emerald-600 dark:text-emerald-400">•</span> Invite admins and members, export reports</li>
                <li className="flex items-center justify-center gap-3"><span className="text-emerald-600 dark:text-emerald-400">•</span> No credit card required, cancel anytime</li>
              </ul>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link to="/signup" className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors duration-200">Start Free Trial</Link>
                <Link to="/subscription" className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200">Compare Plans</Link>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">3 simple steps</h3>
              <ol className="list-decimal list-inside space-y-4 text-slate-500 dark:text-slate-400">
                <li>
                  Create your society — name, address and admin contact.
                </li>
                <li>
                  Add flats and members, or invite them by email.
                </li>
                <li>
                  Create your first bill and send reminders — then watch payments arrive.
                </li>
              </ol>

              <div className="mt-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">Need help? <Link to="/suggestions" className="text-emerald-600 dark:text-emerald-400 underline">Contact our team</Link> and we'll walk you through setup.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
