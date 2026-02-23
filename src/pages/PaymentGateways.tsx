import Navbar from '../components/layout/Navbar'
import { Mail, Info } from 'lucide-react'

export default function PaymentGateways() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-4">Payment Collection</h1>
          <p className="text-muted-foreground mb-8">In our MVP, maintenance payments are collected offline by the society admin.</p>

          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 border border-[#2563EB]/20 dark:border-[#3B82F6]/20 flex gap-4">
              <Info className="w-6 h-6 text-[#2563EB] dark:text-[#3B82F6] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-2">How Payment Collection Works</h3>
                <p className="text-[#0F172A] dark:text-[#F8FAFC] text-sm mb-4">
                  The society admin collects maintenance payments directly from residents (cash or personal UPI). After collection, the admin manually enters payment details into the app for record-keeping and reporting purposes.
                </p>
                <ul className="text-sm text-[#0F172A] dark:text-[#F8FAFC] space-y-2 ml-4 list-disc">
                  <li>Admin collects payments offline (cash or personal UPI)</li>
                  <li>Admin records payment details in the app</li>
                  <li>App generates reports on collection status and pending dues</li>
                  <li>Data remains in the app for audit and analysis</li>
                </ul>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Need More Information?</h3>
              <p className="text-muted-foreground mb-4">
                If you have questions about payment collection or need further assistance, please contact our support team.
              </p>
              <a
                href="mailto:support@societyledger.com?subject=Payment Collection Inquiry"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-lg hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors font-medium"
              >
                <Mail className="w-4 h-4" />
                Email Support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
