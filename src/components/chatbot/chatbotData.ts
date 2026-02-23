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
          'SocietyLedger will show a notice: **"Bills not yet generated for this month"**. The payment will be recorded as an **advance** and automatically allocated to dues once bills are generated via the Dashboard.',
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
        question: 'How do I pay for my SocietyLedger subscription?',
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
          'Opening Balance is the starting financial position when you first set up SocietyLedger. Enter existing outstanding dues (positive) or advance amounts (negative) per flat so that reports are accurate from day one.',
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
          'If you skip it, all flats start with a zero balance. This is fine for new societies. For existing societies migrating to SocietyLedger, skipping opening balances will cause inaccurate outstanding reports.',
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
          'SocietyLedger offers a **14-day free trial** with full access to all features. No credit card is required to start. A trial countdown is shown in the sidebar during the trial period.',
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
  'Hi! 👋 I\'m the SocietyLedger Guide. I can help you with step-by-step guidance for any feature.\n\nSelect a topic below to get started:';
