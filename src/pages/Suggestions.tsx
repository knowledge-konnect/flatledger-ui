import Navbar from '../components/layout/Navbar'
import { Mail, ArrowRight } from 'lucide-react'

export default function Suggestions() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <main className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-4">Support & Feedback</h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] mb-8">We'd love to hear from you. Please reach out with feedback, suggestions, or any issues.</p>

          <div className="bg-white dark:bg-[#020617] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-[#2563EB] dark:text-[#3B82F6]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">Email Support</h2>
                <p className="text-[#64748B] dark:text-[#94A3B8] mb-4">
                  Send us your feedback, suggestions, or report any issues directly to our support team.
                </p>
                <a
                  href="mailto:support@FlatLedger.com?subject=Feedback for FlatLedger"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-lg hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors font-medium group"
                >
                  Send Email to support@FlatLedger.com
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] dark:border-[#1E293B] pt-6">
              <h3 className="font-semibold text-foreground mb-4">Response Time</h3>
              <p className="text-[#64748B] dark:text-[#94A3B8]">
                We respond to all support emails within 24 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
