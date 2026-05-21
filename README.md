# FlatLedger - Premium Society Management Platform

A comprehensive, modern web application for apartment society management with maintenance collection, billing, payment tracking, expense management, and detailed reporting.

## 🎨 Features

### ✅ Routed Pages

1. **Public Pages**
   - Landing page (`/`)
   - Login (`/login`)
   - Signup (`/signup`)
   - Forgot password (`/forgot-password`)
   - Reset password (`/reset-password`)
   - Privacy policy (`/privacy`)
   - Terms of service (`/terms`)
   - Subscription overview (`/subscription`)
   - Free trial (`/free-trial`)

2. **Authenticated Society Pages**
   - Change password (`/change-password`)
   - Dashboard (`/dashboard` and `/premium-dashboard`)
   - Flats (`/flats`)
   - Flat ledger (`/flats/:publicId/ledger`)
   - Maintenance (`/maintenance`)
   - Expenses (`/expenses`)
   - Users (`/users`)
   - Settings (`/settings`)
   - Opening balance entry (`/settings/opening-balance`)
   - Setup (`/setup`)
   - Subscription management (`/subscription/manage`)
   - Unauthorized page (`/unauthorized`)

3. **Reports**
   - Collection Summary (`/reports/collection-summary`)
   - Defaulters (`/reports/defaulters`)
   - Income vs Expense (`/reports/income-vs-expense`)
   - Fund Ledger (`/reports/fund-ledger`)
   - Payment Register (`/reports/payment-register`)
   - Download Reports (`/reports/download-reports`)

4. **Admin Panel**
   - Admin login (`/admin/login`)
   - Admin dashboard (`/admin/dashboard`)
   - Plans (`/admin/plans`)
   - Societies (`/admin/societies`)
   - Users (`/admin/users`)
   - Subscriptions (`/admin/subscriptions`)
   - Payments (`/admin/payments`)
   - Invoices (`/admin/invoices`)
   - Settings (`/admin/settings`)

5. **Localization**
   - English (`en`) and Telugu (`te`) translations are configured in the app
   - Users can switch languages using the language switcher component
   - Selected language is persisted in local storage

### 🎯 UI/UX Enhancements

- **Premium Design**: Gradient backgrounds, rounded corners, premium shadows
- **Color Scheme**: Emerald/Green primary for professional finance-grade appearance
- **Dark Mode**: Full dark mode support with theme toggle
- **Animations**: Smooth transitions, fade-ins, slide-ups via Framer Motion
- **Responsive**: Mobile-first design with breakpoints for all screen sizes
- **Mobile FAB**: Floating action button for quick actions on mobile
- **Lazy Loading**: All pages are code-split and lazy-loaded for fast initial loads
- **Error Boundary**: Global error boundary with graceful fallback UI
- **Micro-interactions**: Hover effects, loading states, smooth transitions

### 🗄️ Database (Supabase)

Complete schema with Row Level Security:

- **societies** - Society information
- **users** - User management with role-based access
- **flats** - Flat/unit management
- **bills** - Bill generation and tracking
- **payments** - Payment records with multiple modes
- **expenses** - Expense tracking with categories
- **subscriptions** - Subscription and plan data

All tables have:
- RLS policies for data isolation
- Proper indexes for performance
- Foreign key relationships
- Audit timestamps

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom theme + `tailwindcss-animate`
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: ApexCharts (`react-apexcharts`)
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Payment Gateway**: Razorpay
- **Notifications**: Sonner (toast)
- **i18n**: i18next + react-i18next
- **CSV Parsing**: PapaParse
- **Excel Export**: xlsx
- **Routing**: React Router v7
- **Security**: DOMPurify, jwt-decode

## 📦 Project Structure

```
src/
├── admin/                        # Separate admin panel app
│   ├── AdminApp.tsx
│   ├── AdminRouter.tsx
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminSocieties.tsx
│   │   ├── AdminUsers.tsx
│   │   ├── AdminPlans.tsx
│   │   ├── AdminSubscriptions.tsx
│   │   ├── AdminInvoices.tsx
│   │   ├── AdminPayments.tsx
│   │   └── AdminSettings.tsx
│   ├── schemas/
│   └── types/
├── api/                          # API client modules
│   ├── client.ts
│   ├── authApi.ts
│   ├── billingApi.ts
│   ├── expensesApi.ts
│   ├── flatsApi.ts
│   ├── maintenanceApi.ts
│   ├── paymentApi.ts
│   ├── reportsApi.ts
│   ├── societiesApi.ts
│   ├── usersApi.ts
│   ├── subscriptionApi.ts
│   ├── openingBalanceApi.ts
│   ├── notificationsApi.ts
│   ├── announcementsApi.ts
│   ├── documentsApi.ts
│   ├── activityLogsApi.ts
│   ├── financialsApi.ts
│   ├── rolesApi.ts
│   ├── adminApi.ts
│   ├── errorHandler.ts
│   └── responseUtils.ts
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── chatbot/
│   │   ├── ChatBot.tsx
│   │   └── chatbotData.ts
│   ├── OpeningBalance/
│   │   ├── OpeningBalanceEntry.tsx
│   │   ├── OpeningBalanceAlert.tsx
│   │   ├── OpeningBalancePreviewModal.tsx
│   │   ├── OpeningBalanceSuccess.tsx
│   │   ├── OnboardingWizard.tsx
│   │   └── SetupProgressWidget.tsx
│   ├── shared/
│   │   └── ErrorBoundary.tsx
│   ├── ui/                       # Reusable UI primitives
│   ├── LanguageSwitcher.tsx
│   ├── ProtectedRoute.tsx
│   ├── SubscriptionManager.tsx
│   ├── SubscriptionSummary.tsx
│   └── TrialCountdown.tsx
├── contexts/
│   ├── AuthProvider.tsx
│   └── ThemeContext.tsx
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useBilling.ts
│   ├── useDashboard.ts
│   ├── useExpenses.ts
│   ├── useFlats.ts
│   ├── useSubscription.ts
│   ├── useOpeningBalance.ts
│   ├── useRazorpayPayment.ts
│   └── ... (30+ hooks)
├── locales/
│   ├── en.json
│   └── te.json
├── pages/
│   ├── Dashboard.tsx
│   ├── Flats.tsx
│   ├── Maintenance.tsx
│   ├── MaintenanceLedger.tsx
│   ├── Expenses.tsx
│   ├── Payment.tsx
│   ├── PaymentSuccess.tsx
│   ├── PaymentGateways.tsx
│   ├── Users.tsx
│   ├── Settings.tsx
│   ├── Setup.tsx
│   ├── Subscription.tsx
│   ├── SubscriptionManagement.tsx
│   ├── Suggestions.tsx
│   ├── LandingPage.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── ChangePassword.tsx
│   ├── FreeTrial.tsx
│   ├── PrivacyPolicy.tsx
│   ├── TermsOfService.tsx
│   ├── Unauthorized.tsx
│   ├── NotFound.tsx
│   └── reports/
│       ├── CollectionSummary.tsx
│       ├── Defaulters.tsx
│       ├── IncomeVsExpense.tsx
│       ├── FundLedger.tsx
│       ├── PaymentRegister.tsx
│       └── DownloadReports.tsx
├── types/
│   ├── index.ts
│   ├── api.ts
│   ├── auth.ts
│   ├── roles.ts
│   └── openingBalance.types.ts
├── config/
├── lib/
├── App.tsx
├── Router.tsx
└── main.tsx
```

## 🛠️ Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```env
   VITE_APP_API_URL=https://localhost:7110
   VITE_APP_ENV=development
   ```
   
   > **Important:** The API URL must be configured in the `.env` file. The application will not start without it.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Type Check**
   ```bash
   npm run typecheck
   ```

6. **Lint**
   ```bash
   npm run lint
   ```

## 🎨 Design Principles

1. **Premium Look**: High-quality shadows, gradients, and animations
2. **Finance-Grade**: Professional color scheme suitable for financial management
3. **Consistent Spacing**: 8px spacing system throughout
4. **Clear Hierarchy**: Typography and visual weight create clear information hierarchy
5. **Accessible**: WCAG compliant color contrasts and keyboard navigation
6. **Mobile-First**: Responsive design with mobile-optimized interactions

## 🔐 Security Features

- Row Level Security (RLS) on all database tables
- JWT-based authentication with `jwt-decode`
- Role-based access control (Admin, Treasurer, Member)
- Forced password change on first login
- DOMPurify for XSS prevention
- API request/response interceptors
- CORS protection
- Protected routes with unauthorized redirect

## 📱 Mobile Experience

- Responsive breakpoints for all screen sizes
- Collapsible sidebar on mobile
- Mobile FAB for quick actions
- Touch-optimized interactions
- Optimized charts for small screens

## 🌐 Internationalization

- English (`en`) and Telugu (`te`) language support
- Language switcher in navbar
- Core translation resources live in `src/locales/`
- Active language is stored in local storage using the `lng` key

## 🚧 Future Enhancements

- Real-time notifications with Supabase Realtime
- Email/SMS integration for bill reminders
- Multi-society management
- Mobile app (React Native)
- Advanced analytics dashboard
- Automated bill generation
- WhatsApp integration

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For support, email support@flatledger.com or visit our help center.

---

**Built with ❤️ for modern society management**