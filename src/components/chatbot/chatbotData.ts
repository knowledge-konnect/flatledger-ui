import { BRAND_NAME, SUPPORT_EMAIL } from '../../config/branding';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  faqs: FAQItem[];
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'flats',
    label: 'Flats',
    icon: '🏠',
    description: 'Manage flat / unit records',
    faqs: [
      {
        question: 'How do I add a new flat?',
        answer:
          'Go to **Flats** from the sidebar → click the **"Add Flat"** button (top-right) → fill in the Flat Number, Owner Name, Owner Phone, Owner Email, Maintenance Amount, and Status → click **Add Flat**. The flat appears in the list immediately.',
      },
      {
        question: 'How do I edit flat details?',
        answer:
          'Open **Flats** → find the flat in the list → click the **Edit (pencil)** icon on that row → the **"Edit Flat"** modal opens → update the required fields → click **Save Changes**.',
      },
      {
        question: 'How do I delete a flat?',
        answer:
          'Open **Flats** → find the flat → click the **Delete (trash)** icon on that row → confirm in the dialog. Note: deleting a flat removes all its associated maintenance records.',
      },
      {
        question: 'How do I mark a flat as Vacant or Rented?',
        answer:
          'Open **Flats** → click the **Edit** icon → change the **Status** dropdown to **Occupied**, **Vacant**, or **Rented** → click **Save Changes**.',
      },
      {
        question: 'How do I export the flats list?',
        answer:
          'On the **Flats** page, click the **"Export"** button in the top-right area. This downloads a CSV file with all flat details including owner info, maintenance amount, and outstanding balance.',
      },
      {
        question: 'How do I view a flat\'s outstanding balance?',
        answer:
          'The outstanding balance is shown directly in the flats table under the **Outstanding** column. A red value means dues are pending; green means the account is clear.',
      },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: '🔧',
    description: 'Generate bills & record payments',
    faqs: [
      {
        question: 'How do I generate monthly maintenance bills?',
        answer:
          'Bills are generated from the **Dashboard**. Go to **Dashboard** → look for the billing status banner at the top → click **"Generate Bills"**. This creates maintenance dues for all active flats for the current month.',
      },
      {
        question: 'How do I record a maintenance payment?',
        answer:
          'Go to **Maintenance** from the sidebar → click **"Record Payment"** (top-right) → select the **Flat**, enter the **Amount**, pick the **Payment Mode**, set the **Payment Date**, and optionally add a **Reference Number** → click **Record Payment**.',
      },
      {
        question: 'How do I edit an existing payment record?',
        answer:
          'Open **Maintenance** → find the payment entry → click the **Edit** icon → the **"Edit Payment"** modal opens → make corrections → click **Update Payment**.',
      },
      {
        question: 'How do I delete a payment?',
        answer:
          'Open **Maintenance** → find the payment → click the **Delete** icon → confirm in the **"Delete Payment"** dialog.',
      },
      {
        question: 'How do I view the maintenance ledger for a flat?',
        answer:
          'Open **Maintenance** → find the flat entry → click its name or the ledger icon to open the **Maintenance Ledger** page. This shows all bills and payment history with running balance for that specific flat.',
      },
      {
        question: 'How do I filter maintenance payments by month or status?',
        answer:
          'On the **Maintenance** page, use the **month selector** (left/right arrows) to navigate between months. Use the **search box** or **status filter** to narrow results by flat number or payment status.',
      },
      {
        question: 'What happens if I record payment before bills are generated?',
        answer:
          'FlatLedger will show a notice: **"Bills not yet generated for this month"**. The payment will be recorded as an **advance** and automatically allocated to dues once bills are generated via the Dashboard.',
      },
    ],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: '💸',
    description: 'Track society expenses',
    faqs: [
      {
        question: 'How do I add a society expense?',
        answer:
          'Go to **Expenses** from the sidebar → click **"Add Expense"** → the **"Add New Expense"** modal opens → fill in the **Date**, **Category** (Electricity, Water, Security, Repairs, etc.), **Vendor**, **Description**, and **Amount** → click **Add Expense**.',
      },
      {
        question: 'How do I edit an expense?',
        answer:
          'Open **Expenses** → find the entry → click the **Edit (pencil)** icon → the **"Edit Expense"** modal opens → update the fields → click **Update Expense**.',
      },
      {
        question: 'How do I delete an expense?',
        answer:
          'Open **Expenses** → find the entry → click the **Delete (trash)** icon → confirm in the delete dialog. Deletion is permanent.',
      },
      {
        question: 'How do I filter expenses by category or date range?',
        answer:
          'On the **Expenses** page, use the **Start Date** and **End Date** pickers to set a date range. Use the **Category** dropdown to filter by expense type, and the **Search** box to find by vendor name or description.',
      },
      {
        question: 'How do I see expense analytics?',
        answer:
          'The **Expenses** page includes a **pie chart** at the top showing spending by category for the selected date range. This gives a quick visual breakdown of where society funds are being spent.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: '💳',
    description: 'Payment modes & subscription billing',
    faqs: [
      {
        question: 'What payment modes can I record for maintenance?',
        answer:
          'When recording a payment in **Maintenance → Record Payment**, select the **Payment Mode** dropdown. Supported modes include **Cash**, **UPI**, **Bank Transfer**, **Cheque**, and other modes configured in your society settings.',
      },
      {
        question: 'Where do I enter a payment reference number?',
        answer:
          'In the **"Record Payment"** modal (Maintenance page), there is an optional **Reference Number** field. Use this to enter the UPI transaction ID, cheque number, or bank transfer reference for easy reconciliation.',
      },
      {
        question: 'How do I pay for my FlatLedger subscription?',
        answer:
          'Go to **Settings → Billing → Subscription** → click **"Upgrade Plan"** → select a plan → you will be taken to the **Razorpay** checkout to complete payment. The subscription activates immediately after successful payment.',
      },
      {
        question: 'How do I track all maintenance payments made?',
        answer:
          'Go to **Maintenance** from the sidebar. All recorded payments are listed here. Use the month navigation and filters to view payments by period, flat, or payment mode.',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '📊',
    description: 'Financial & analytics reports',
    faqs: [
      {
        question: 'How do I access financial reports?',
        answer:
          'Go to **Reports** from the sidebar. The **Reports & Analytics** page shows charts like **Income vs Expense Trend**, **Collection Rate Trend**, and **Outstanding by Flat** — all updated in real time.',
      },
      {
        question: 'How do I export a report as PDF?',
        answer:
          'On the **Reports** page, click the **"Export PDF"** button at the top-right. This generates a PDF of the current report view which you can download or print.',
      },
      {
        question: 'How do I export the outstanding balance list?',
        answer:
          'On the **Reports** page, find the **"Outstanding by Flat"** section → click the **"Export"** button next to its title. This downloads a CSV of all flats with their outstanding amounts.',
      },
      {
        question: 'What reports are available?',
        answer:
          'The **Reports & Analytics** page includes:\n• **Income vs Expense Trend** – monthly comparison chart\n• **Collection Rate Trend** – % of dues collected over time\n• **Outstanding by Flat** – which flats owe the most\n• **AGM Report** – summary report for Annual General Meetings',
      },
    ],
  },
  {
    id: 'users',
    label: 'Users & Roles',
    icon: '👥',
    description: 'Manage members & permissions',
    faqs: [
      {
        question: 'How do I add a new user?',
        answer:
          'Go to **Users** from the sidebar (Admin section) → click **"Add User"** → enter their **Name**, **Email**, **Phone**, and select a **Role** → click **Add User**. The user receives login credentials at their email.',
      },
      {
        question: 'How do I edit a user or change their role?',
        answer:
          'Open **Users** → find the user → click the **Edit** icon → the **"Edit User"** modal opens → change the **Role** or other details → click **Save**.',
      },
      {
        question: 'How do I delete a user?',
        answer:
          'Open **Users** → find the user → click the **Delete** icon → confirm in the **"Delete User"** dialog. This permanently removes the user\'s access.',
      },
      {
        question: 'What are the available user roles?',
        answer:
          '• **Society Admin** – Full access to all features including billing and settings.\n• **Admin** – Can manage flats, maintenance, expenses, and users.\n• **Treasurer** – Financial access: can record payments, manage expenses, and view reports.\n• **Viewer** – Read-only access to view data without making changes.',
      },
      {
        question: 'Who can access the Users page?',
        answer:
          'The **Users** page is under the **Admin** section in the sidebar and is only visible to users with the **Society Admin** or **Admin** role. Treasurers and Viewers do not have access to manage users.',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    description: 'Profile, society & preferences',
    faqs: [
      {
        question: 'How do I update my profile (name, email)?',
        answer:
          'Go to **Settings** from the sidebar → under the **Account** group, click **"Profile"** (Name, email & mobile) → update your details → click **Save**.',
      },
      {
        question: 'How do I change my password?',
        answer:
          'Go to **Settings** → under **Account**, click **"Password"** → enter your **Current Password** and **New Password** → click **Update Password**.',
      },
      {
        question: 'How do I update the society name or address?',
        answer:
          'Go to **Settings** → under the **Society** group, click **"Society Details"** → update the **Society Name** and **Address** → click **Save**. (Admin-only)',
      },
      {
        question: 'How do I configure maintenance charges and due dates?',
        answer:
          'Go to **Settings** → under **Society**, click **"Maintenance Config"** (Charges & due dates) → set the default maintenance amount, due day, and late fee rules → click **Save**. (Admin-only)',
      },
      {
        question: 'How do I enable dark mode?',
        answer:
          'Option 1: Click the **Sun/Moon icon** in the top-right header bar to instantly toggle theme.\nOption 2: Go to **Settings** → under **Preferences**, click **"Appearance"** → choose your preferred theme.',
      },
      {
        question: 'How do I manage notification preferences?',
        answer:
          'Go to **Settings** → under **Preferences**, click **"Notifications"** (Alerts & reminders) → toggle the notification types you want to receive (payment reminders, due alerts, etc.) → save.',
      },
    ],
  },
  {
    id: 'opening-balance',
    label: 'Opening Balance',
    icon: '🏦',
    description: 'Set initial financial balances',
    faqs: [
      {
        question: 'What is Opening Balance and when do I need it?',
        answer:
          'Opening Balance is the starting financial position when you first set up FlatLedger. Enter existing outstanding dues (positive) or advance amounts (negative) per flat so that reports are accurate from day one.',
      },
      {
        question: 'How do I enter the opening balance?',
        answer:
          'Go to **Settings** → under the **Society** group, click **"Opening Balance"** → for each flat, enter the outstanding due or advance amount → click **Submit**. You can also reach it at **Settings → Opening Balance** directly.',
      },
      {
        question: 'Can I edit the opening balance after submission?',
        answer:
          '⚠️ **Important:** Opening Balance is a **one-time submission**. Once payments exist for a flat, the balance for that flat **cannot be edited**. Submit carefully and verify all amounts before confirming. Use payment adjustments for corrections after the fact.',
      },
      {
        question: 'What happens if I skip entering opening balances?',
        answer:
          'If you skip it, all flats start with a zero balance. This is fine for new societies. For existing societies migrating to FlatLedger, skipping opening balances will cause inaccurate outstanding reports.',
      },
    ],
  },
  {
    id: 'subscription',
    label: 'Subscription',
    icon: '🔑',
    description: 'Plan, billing & trial info',
    faqs: [
      {
        question: 'How do I upgrade my subscription plan?',
        answer:
          'Go to **Settings** → under the **Billing** group, click **"Subscription"** (Plan & billing info) → click **"Upgrade Plan"** → choose a plan → complete the **Razorpay** payment. Your plan activates immediately.',
      },
      {
        question: 'How long is the free trial?',
        answer:
          'FlatLedger offers a **14-day free trial** with full access to all features. No credit card is required to start. A trial countdown is shown in the sidebar during the trial period.',
      },
      {
        question: 'What happens when my trial expires?',
        answer:
          'After the trial ends, your data is preserved but access is restricted until you subscribe to a paid plan. You will receive reminders before expiry via the in-app trial countdown banner.',
      },
      {
        question: 'How do I view my current plan and billing details?',
        answer:
          'Go to **Settings → Billing → Subscription**. This shows your current plan, renewal date, and usage details. For full invoice history, go to the **Subscription Management** page accessible from the same section.',
      },
    ],
  },
];

export const WELCOME_MESSAGE =
  `Hi! 👋 I'm the ${BRAND_NAME} Guide. I can help you with step-by-step guidance for any feature.\n\nSelect a topic below to get started:`;

export const LANDING_WELCOME_MESSAGE =
  `Hi! 👋 Welcome to ${BRAND_NAME}!\n\nI can answer your questions about pricing, features, and getting started. What would you like to know?`;

export const LANDING_FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'pricing',
    label: 'Pricing & Trial',
    icon: '💰',
    description: 'Plans, billing, and free trial',
    faqs: [
      {
        question: 'Is there a free trial?',
        answer:
          'Yes! You get **30 days free** — no credit card required. Just sign up and start using the app immediately. Your trial includes all features with no restrictions.',
      },
      {
        question: 'How much does it cost after the trial?',
        answer:
          '**₹199/month** (billed monthly) or **₹1,999/year** (billed once a year — saves you ₹389, roughly 2 months free). Both plans include all features.',
      },
      {
        question: 'Can I cancel anytime?',
        answer:
          'Yes, absolutely. You can cancel your subscription at any time from **Settings → Subscription**. There are no cancellation fees and no long-term contracts.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We support all major Indian payment methods via **Razorpay** — UPI, debit/credit cards, net banking, and wallets.',
      },
      {
        question: 'Is there a discount for yearly billing?',
        answer:
          'Yes! The yearly plan at **₹1,999** saves you ₹389 compared to monthly billing (₹199 × 12 = ₹2,388). That is effectively 2 months free.',
      },
    ],
  },
  {
    id: 'features',
    label: 'App Features',
    icon: '🏢',
    description: 'What the app can do',
    faqs: [
      {
        question: 'What can FlatLedger do?',
        answer:
          'FlatLedger covers the full lifecycle of society management:\n- **Flats & Residents** — manage all unit records\n- **Maintenance Billing** — auto-generate monthly bills\n- **Payment Tracking** — record cash/UPI/cheque payments\n- **Expense Management** — track society expenses by category\n- **Financial Reports** — income vs expense charts, defaulter lists\n- **Role-Based Access** — treasurer, secretary, manager, viewer roles\n- **CSV Exports** — download any data',
      },
      {
        question: 'How many flats can I manage?',
        answer:
          'There is **no flat limit** on any plan. You can add as many flats and residents as your housing society has.',
      },
      {
        question: 'Can members pay online?',
        answer:
          'Currently the app supports **offline payment recording** — the admin records payments made via UPI, cash, or cheque. Online payment links for residents are on our roadmap.',
      },
      {
        question: 'Does it support multiple users / roles?',
        answer:
          'Yes. You can add team members with specific roles — **Treasurer**, **Secretary**, **Manager**, or **Viewer** — each with appropriate access levels. The society admin has full control.',
      },
      {
        question: 'Can I generate maintenance bills automatically?',
        answer:
          'Yes. Go to **Maintenance → Generate Bills** and select the month. The app creates bills for all active flats based on the individual maintenance amount set per flat. You can also set a custom due date.',
      },
      {
        question: 'Can I track defaulters?',
        answer:
          'Yes. The **Dashboard** and **Reports** section show outstanding dues and defaulter lists in real time. You can also export the defaulter list as a CSV.',
      },
    ],
  },
  {
    id: 'getstarted',
    label: 'Getting Started',
    icon: '🚀',
    description: 'Setup and onboarding',
    faqs: [
      {
        question: 'How long does setup take?',
        answer:
          'Most societies are fully set up in **under 30 minutes**. The onboarding wizard walks you through 3 steps: (1) Society profile, (2) Add flats, (3) Set opening balance. After that you are ready to generate bills.',
      },
      {
        question: 'Do I need technical knowledge?',
        answer:
          'None at all. FlatLedger is designed for society secretaries and treasurers — not IT professionals. If you can use a smartphone, you can use this app.',
      },
      {
        question: 'Can I import my existing data?',
        answer:
          'You can manually add your flats and set an opening balance for each flat to carry forward existing dues. Bulk CSV import is on our roadmap. For large societies, contact support and we will help you migrate.',
      },
      {
        question: 'What do I need to sign up?',
        answer:
          'Just an email address and your society details (name, address). No credit card, no contracts. Click **Start Free Trial** and you are up in minutes.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Security & Data',
    icon: '🔒',
    description: 'Privacy, safety, and data',
    faqs: [
      {
        question: 'Is my society\'s data safe?',
        answer:
          'Yes. All data is stored on secured cloud servers with **encrypted backups**. We use HTTPS for all communication. Your data is never shared with third parties.',
      },
      {
        question: 'Who can see my society\'s data?',
        answer:
          'Only the users you explicitly add to your society account. FlatLedger staff cannot access your financial data — we only see anonymised usage metrics for support purposes.',
      },
      {
        question: 'What happens if I cancel my subscription?',
        answer:
          'Your data is retained for **30 days** after cancellation. You can export all your data as CSV before that window closes. After 30 days inactive accounts are permanently deleted.',
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: '📞',
    description: 'Help and contact',
    faqs: [
      {
        question: 'How do I contact support?',
        answer:
          'Email us at **support@FlatLedger.com** — we respond within 24 hours on business days. You can also use the **Suggestions** page inside the app to report issues or request features.',
      },
      {
        question: 'Is the app available in regional languages?',
        answer:
          'Currently the app is in **English only**. Hindi and Marathi support are planned for a future release.',
      },
      {
        question: 'Is there phone or WhatsApp support?',
        answer:
          'Currently we offer email support only. Phone and WhatsApp support are planned for higher-tier plans in the future.',
      },
    ],
  },
];
