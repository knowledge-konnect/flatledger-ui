# FlatLedger User Manual (MVP)

FlatLedger logo: TODO - Insert approved FlatLedger logo asset  
Version: 1.1 (MVP audited)  
Last updated: May 23, 2026  
Support: support@FlatLedger.com  
Scope: Society-facing application only

---

## 1. About This Manual

This manual documents only currently implemented MVP behavior.

Documentation rules used:
- No future roadmap content.
- No inferred functionality.
- If behavior cannot be fully confirmed in code, it is marked as Needs Manual Verification.

Audience:
- Society Admin
- Viewer

## 2. System Access and Roles

### 2.1 Role Matrix

| Module | Society Admin | Viewer | Notes |
|---|---|---|---|
| Dashboard | View | View | Both can access protected dashboard route. |
| Flats | Add/Edit/Delete/View | View | Viewer write actions blocked by backend filters. |
| Maintenance | Add/Edit/Delete/View | View | Viewer write actions blocked; see lock notes. |
| Expenses | Add/Edit/Delete/View | View | Viewer write actions blocked. |
| Reports (view) | Yes | Yes | Collection, defaulters, income/expense, fund ledger, payment register. |
| Reports (download) | Yes | No (UI) | Download page is admin-only in society UI. |
| Users | Yes | No | Admin-only route and management actions. |
| Settings | Yes | No | Society settings route is admin-only. |
| Subscription Management | Yes | No | Admin-only route in society UI. |
| Support page | Public | Public | Available on support/feedback route. |

### 2.2 Authentication and Session

Implemented screens:
- Login
- Sign Up
- Forgot Password
- Reset Password
- Change Password

Possible redirect behavior:
- Some users may be forced to change password on first login when forcePasswordChange is set.

Needs Manual Verification:
- Exact account lockout timing/threshold after repeated failed logins.

## 3. Getting Started

### 3.1 Sign Up

1. Open Sign Up.
2. Enter full name, email, password, society name, and society address.
3. Submit form.
4. On success, you are redirected to setup or dashboard flow based on auth response.

Validation highlights:
- Email must be valid.
- Password must meet strength rules.
- Society name and address are required with minimum lengths.

### 3.2 Login

1. Open Login.
2. Enter username/email and password.
3. Submit.
4. On success, you are redirected to dashboard (or forced password-change screen when applicable).

### 3.3 Forgot and Reset Password

Forgot Password:
1. Open Forgot Password.
2. Enter registered email.
3. Submit reset request.

Reset Password:
1. Open reset link with token.
2. Enter new password and confirm password.
3. Submit.

Validation highlights:
- New password requires uppercase, lowercase, and number.
- Confirm password must match.

### 3.4 First-Time Setup

Setup route is admin-only and includes:
- Society details
- Maintenance configuration
- Flats onboarding
- Opening balance readiness flow

## 4. Module Guides

## 4.1 Dashboard

What is available:
- KPI summary cards
- Trend charts
- Recent activity list
- Insights list
- Billing reminder banner (generated vs not generated)

Billing reminder behavior:
- When current-month bills are not generated, reminder banner is shown.
- Banner can include flat-maintenance warnings (for zero-amount flats).

Needs Manual Verification:
- Exact content quality/wording of insights depends on backend data output.

## 4.2 Flats

Implemented actions:
- Add flat
- Edit flat
- Delete flat
- Search
- Sort
- Pagination
- Bulk import

Typical fields:
- Flat number
- Owner name
- Owner email (optional)
- Owner phone
- Maintenance amount
- Status

Validation highlights:
- Flat number required.
- Owner name required.
- Phone minimum 10 digits.
- Maintenance amount must be positive.
- Duplicate checks for flat number/email/mobile in UI.

Bulk import:
- Import modal available.
- Backend bulk endpoint exists.

## 4.3 Maintenance

Implemented actions:
- Add payment
- View payment list by period
- Update payment (with constraints)
- Delete payment
- View payment breakdown and summaries

Payment processing behavior:
- Payment allocation supports current/arrear/advance behavior.
- Payment modes are loaded from backend.
- Summary endpoint provides totals and collection percentage.

Critical note on lock behavior:
- UI enforces a 30-day lock for edit/delete actions on older payments.
- Backend lock parity for this exact 30-day rule is Needs Manual Verification.

What to communicate to users:
- Treat older payment records as accounting-sensitive.
- Prefer correction entries over editing old records where possible.

## 4.4 Expenses

Implemented actions:
- Add expense
- Edit expense
- Delete expense
- Date range filtering
- Category filtering
- Search and sorting
- Category chart and totals

Typical fields:
- Date
- Category
- Vendor (optional)
- Description (optional)
- Amount

Validation highlights:
- Date/category/amount required.
- UI duplicate guard for same date/category/vendor/amount.

## 4.5 Reports

Implemented report pages:
- Collection Summary
- Outstanding Dues
- Income & Expenses
- Fund Transactions (Fund Ledger)
- Payments Received (Payment Register)
- Download Reports

Filters and behavior:
- Period/date presets and custom ranges on report pages.
- Empty states shown when no data exists.

Export behavior:
- Download Reports page: XLSX downloads (monthly/yearly).
- Outstanding Dues page: CSV export available from UI.
- PDF export: not available in MVP.

## 4.6 Users

Scope:
- Admin-only user management.

Implemented actions:
- Create user
- Update user
- Delete user
- Search and sorting
- Role selection (society_admin/viewer in current role model)

Validation highlights:
- Name required.
- Email or username required.
- Password required for create.
- Mobile normalization and duplicate checks.

## 4.7 Settings

Settings sections available:
- Profile
- Password
- Society Details (admin)
- Maintenance Charges (admin)
- Opening Balance (admin)
- Notifications
- Appearance
- Subscription

Maintenance configuration fields:
- Default monthly charge
- Due day of month
- Late fee per month
- Grace period days

Important limitation:
- Late fee and due/grace settings are configurable and persisted.
- Exact runtime fee application logic is Needs Manual Verification.

## 4.8 Opening Balance

Implemented lifecycle:
- Check status
- View summary
- Apply opening balance

Opening balance can be applied through dedicated endpoint flow and is integrated with maintenance allocation behavior.

## 4.9 Subscription

Implemented actions:
- Start trial
- View status
- Subscribe to a plan
- Cancel subscription
- Refresh subscription state

Permission:
- Society UI subscription management route is admin-only.

## 4.10 Notifications

Implemented preferences:
- Payment reminders
- Bill generated
- Expense updates
- Monthly reports

Preferences can be retrieved and updated via notification endpoints.

## 4.11 Support

Support and feedback:
- Support page exists with email CTA.
- Contact: support@FlatLedger.com

Needs Manual Verification:
- Operational SLA claims (example: exact 24-business-hour response guarantee).

## 5. Validation Rules (Implemented)

| Module | Field | Rule |
|---|---|---|
| Login | usernameOrEmail | Required |
| Login | password | Minimum length validation |
| Signup | name | Minimum length |
| Signup | email | Valid email format |
| Signup | password | Strength rules |
| Forgot Password | email | Required + valid email |
| Reset Password | newPassword | Length + uppercase + lowercase + number |
| Reset Password | confirmPassword | Must match new password |
| Flats | flatNumber | Required |
| Flats | ownerName | Required |
| Flats | ownerPhone | Minimum length; duplicate checks in UI |
| Flats | maintenanceAmount | Positive number |
| Flats | statusCode | Required |
| Maintenance | amount | Positive value |
| Maintenance | paymentDate | Not before current FY start |
| Expenses | date/category/amount | Required |
| Users | name | Required |
| Users | email or username | At least one required |
| Users | password (create) | Required |
| Settings | maintenance due day | UI range validation |
| Settings | late fee/grace | Non-negative validation |

## 6. Common Errors

| Scenario | Likely Cause | User Action |
|---|---|---|
| Login fails | Wrong credentials or rate limit | Re-check credentials, retry later, or use reset flow |
| Form cannot submit | Required/format validation failed | Correct highlighted fields |
| Duplicate flat/user data | Existing unique values | Use a different value or edit existing record |
| Payment update blocked | Record lock or bill linkage constraints | Re-record/correct through approved flow |
| Report appears empty | Date/period filter excludes data | Adjust filters and re-apply |
| Download issue | Browser/network interruption | Retry download |
| Admin section inaccessible | Signed in as non-admin | Use society admin account |

## 7. Real Workflows

### 7.1 New Society Setup (Admin)

1. Sign up.
2. Log in.
3. Complete setup and society details.
4. Configure maintenance settings.
5. Add/import flats.
6. Apply opening balance if available.
7. Start monthly billing and payment recording.

### 7.2 Monthly Billing and Collection Cycle

1. Open Maintenance/Dashboard and confirm billing status.
2. Generate bills for target month (admin flow).
3. Record payments as they are collected.
4. Monitor outstanding via reports.
5. Use report downloads for committee sharing.

### 7.3 Expense and Reporting Cycle

1. Add expenses with category/date/amount.
2. Review Income & Expenses and Fund Transactions reports.
3. Export required report files (XLSX/CSV paths as available).

## 8. FAQ

Q: Can viewer users add or delete records?  
A: No in standard MVP flow. Viewer write attempts are blocked by backend write filters.

Q: Which report downloads are available?  
A: XLSX downloads are available from Download Reports. Defaulters page has CSV export.

Q: Are late fees applied automatically?  
A: Configuration exists. Runtime application in billing flow is currently marked Needs Manual Verification.

Q: Why can I not edit an old payment?  
A: The UI enforces a 30-day lock behavior for older records; some backend parity rules require manual verification.

Q: Is online resident payment collection supported in MVP?  
A: Society workflow is centered on offline collection recording in the maintenance module.

## 9. Troubleshooting

### 9.1 Authentication
- If reset link does not work, request a fresh reset email.
- If forced password-change loop occurs, complete change-password and sign in again.

### 9.2 Data Entry
- Use exact required formats (email, date, amount).
- Check duplicate constraints before creating new flat/user records.

### 9.3 Permissions
- Verify logged-in role.
- Admin-only routes: Users, Settings, Subscription Management, setup operations.

### 9.4 Reports
- Confirm date filters.
- Retry on network failures.
- For large datasets, use available export options.

## 10. MVP Limitations

- No PDF report export in current implementation.
- Some policy-like claims (example: support SLA) are not code-enforced and require business confirmation.
- Payment lock behavior is strongly implemented in UI; exact backend parity for 30-day lock is Needs Manual Verification.
- Late fee/due/grace runtime computation behavior is not documented as guaranteed without additional verification.

## 11. Screenshot Policy (Production)

Only use real pages from current society-facing routes.

Required format for pending screenshots:
- TODO: [Route] [State] [What to annotate]

Current TODO list:
- TODO: /login - blank and validation-error states - annotate required fields and forgot-password link.
- TODO: /signup - filled and success states - annotate required profile/society fields.
- TODO: /dashboard - KPI/charts/activity/reminder areas - annotate major sections.
- TODO: /flats - table, add modal, import modal - annotate required fields and import actions.
- TODO: /maintenance - payment modal, list, lock indicator - annotate amount/date/mode and lock messaging.
- TODO: /expenses - add modal and category chart - annotate filter controls.
- TODO: /reports/collection-summary - filter and chart/table.
- TODO: /reports/defaulters - overdue badges and CSV export action.
- TODO: /reports/income-vs-expense - trend chart and category table.
- TODO: /reports/download-reports - monthly/yearly selectors and download action.
- TODO: /users - create/edit user flows and role selector (admin account).
- TODO: /settings - each section panel including notifications/appearance.
- TODO: /settings/opening-balance - status/summary/apply workflow visuals.
- TODO: /subscription/manage - status card and plan actions.
- TODO: /suggestions - support email CTA.

---

End of MVP manual.
