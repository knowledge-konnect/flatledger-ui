# FlatLedger MVP Consolidated Audit Report

Version: 1.0  
Date: May 23, 2026  
Scope: Society-facing application only (admin portal excluded)

## 1. Audit Outcome

This audit compared the existing user manual with implemented behavior in the current codebase.

Decision summary:
- Keep and document features that are implemented with UI + API + validation.
- Mark partial/inconsistent implementations as Partial.
- Mark uncertain runtime-only behavior as Needs Manual Verification.
- Remove unsupported, inferred, or over-claimed documentation sections.

## 2. Evidence Sources

Primary UI sources:
- src/Router.tsx
- src/components/ProtectedRoute.tsx
- src/components/layout/Sidebar.tsx
- src/pages/Login.tsx
- src/pages/Signup.tsx
- src/pages/ForgotPassword.tsx
- src/pages/ResetPassword.tsx
- src/pages/Dashboard.tsx
- src/pages/Flats.tsx
- src/pages/Maintenance.tsx
- src/pages/Expenses.tsx
- src/pages/reports/CollectionSummary.tsx
- src/pages/reports/Defaulters.tsx
- src/pages/reports/IncomeVsExpense.tsx
- src/pages/reports/FundLedger.tsx
- src/pages/reports/PaymentRegister.tsx
- src/pages/reports/DownloadReports.tsx
- src/pages/Users.tsx
- src/pages/Settings.tsx
- src/pages/SubscriptionManagement.tsx
- src/pages/Suggestions.tsx

Primary API/Service sources:
- SocietyLedger.Api/Endpoints/AuthEndpoints.cs
- SocietyLedger.Api/Endpoints/DashboardEndpoints.cs
- SocietyLedger.Api/Endpoints/FlatEndPoints.cs
- SocietyLedger.Api/Endpoints/BillingEndpoints.cs
- SocietyLedger.Api/Endpoints/MaintenancePaymentEndpoints.cs
- SocietyLedger.Api/Endpoints/ExpenseEndpoints.cs
- SocietyLedger.Api/Endpoints/ReportEndpoints.cs
- SocietyLedger.Api/Endpoints/UserEndpoints.cs
- SocietyLedger.Api/Endpoints/SocietyEndpoints.cs
- SocietyLedger.Api/Endpoints/OpeningBalanceEndpoints.cs
- SocietyLedger.Api/Endpoints/SubscriptionEndpoints.cs
- SocietyLedger.Api/Endpoints/NotificationEndpoints.cs
- SocietyLedger.Api/Filters/ViewerForbiddenFilter.cs
- SocietyLedger.Infrastructure/Services/BillingService.cs
- SocietyLedger.Infrastructure/Services/MaintenancePaymentService.cs
- SocietyLedger.Infrastructure/Services/ReportService.cs
- SocietyLedger.Infrastructure/Services/ReportExportService.cs
- SocietyLedger.Domain/Constants/MasterCodes.cs

## 3. Claim-to-Evidence Matrix (Normalized)

| Claim | Evidence | Status | Notes |
|---|---|---|---|
| User can sign up | Signup.tsx + AuthEndpoints /register | Proven | Redirects to setup/dashboard depending on auth response. |
| User can login | Login.tsx + AuthEndpoints /login | Proven | Supports username/email + password; rate limiting present. |
| Forgot password exists | ForgotPassword.tsx + AuthEndpoints /forgot-password | Proven | Email request flow implemented. |
| Reset password via token exists | ResetPassword.tsx + AuthEndpoints /reset-password | Proven | Token-based reset and optional auto-login. |
| First-login forced password change can happen | Router.tsx forcePasswordChange + /change-password | Proven | Enforced when user.forcePasswordChange is true. |
| Dashboard KPIs/charts exist | Dashboard.tsx + DashboardEndpoints.cs | Proven | Multiple KPI cards and charts rendered from dashboard data. |
| Activity feed exists | Dashboard.tsx ActivityItem.tsx + dashboard recent_activity | Proven | Rendered when data present. |
| Insights panel exists | Dashboard.tsx uses insights list | Proven | Data-driven; quality depends on backend output. |
| Billing reminder banner exists | BillingReminderBanner.tsx + billing status hook | Proven | Shows generated/not-generated and fix-flats warning. |
| Flats CRUD exists | Flats.tsx + FlatEndPoints.cs | Proven | Create/list/update/delete implemented. |
| Bulk import flats exists | ImportFlatsModal + POST /flats/bulk | Proven | UI and API both present. |
| Maintenance payment add exists | Maintenance.tsx + POST /maintenance-payments | Proven | Transactional allocation implemented in service. |
| Payment edit/delete lock older than 30 days | Maintenance.tsx isPaymentLocked | Partial | UI lock is 30 days; backend does not enforce same lock rule. |
| Expenses CRUD exists | Expenses.tsx + ExpenseEndpoints.cs | Proven | Add/list/update/delete implemented with filters. |
| Reports (collection/defaulters/income) exist | report pages + ReportEndpoints.cs | Proven | UI + API both implemented. |
| Report download exists | DownloadReports.tsx + /reports/download/* | Proven | XLSX only in backend export service. |
| Users management exists | Users.tsx + UserEndpoints.cs | Proven | Admin-only routes + API restrictions. |
| Settings: profile/password/society/maintenance | Settings.tsx + Auth/Society endpoints | Proven | Admin-only enforcement for society and maintenance config. |
| Opening balance exists and applies once | Settings opening-balance route + OpeningBalanceEndpoints.cs | Proven | Status/summary/apply endpoints implemented. |
| Notifications settings exist | Settings.tsx + notifications hooks + NotificationEndpoints.cs | Proven | Preference get/update implemented. |
| Appearance settings exist | Settings.tsx theme toggle | Proven | UI-level theme toggle implemented. |
| Subscription management exists | SubscriptionManagement.tsx + SubscriptionEndpoints.cs | Proven | Trial, status, subscribe, cancel flows present. |
| Support page exists | Suggestions.tsx route /suggestions | Proven | Email support CTA implemented as mailto. |
| "24 business hours" support SLA guaranteed by system | Suggestions.tsx text only | Needs Manual Verification | UI copy exists; no operational SLA evidence in code. |
| Late fee/grace period automatically applied in billing | Society maintenance config + BillingService.cs | Partial | Config is stored; no explicit late-fee application logic found in billing generation flow. |

## 4. Route Inventory (Society App)

| Route | Protected | Roles | Sidebar Visible | Active |
|---|---|---|---|---|
| / | No | Public | No | Yes |
| /login | No | Public | No | Yes |
| /signup | No | Public | No | Yes |
| /forgot-password | No | Public | No | Yes |
| /reset-password | No | Public | No | Yes |
| /change-password | Yes | Authenticated | No | Yes |
| /dashboard | Yes | Authenticated | Yes | Yes |
| /flats | Yes | Authenticated | Yes | Yes |
| /maintenance | Yes | Authenticated | Yes | Yes |
| /flats/:publicId/ledger | Yes | Authenticated | No direct nav | Yes |
| /expenses | Yes | Authenticated | Yes | Yes |
| /reports/collection-summary | Yes | Authenticated | Yes (Reports submenu) | Yes |
| /reports/defaulters | Yes | Authenticated | Yes (Reports submenu) | Yes |
| /reports/income-vs-expense | Yes | Authenticated | Yes (Reports submenu) | Yes |
| /reports/fund-ledger | Yes | Authenticated | No sidebar item | Yes |
| /reports/payment-register | Yes | Authenticated | No sidebar item | Yes |
| /reports/download-reports | Yes | society_admin (UI route guard) | Yes (admin-only submenu) | Yes |
| /users | Yes | society_admin | Yes (admin group) | Yes |
| /settings | Yes | society_admin | Yes (admin group) | Yes |
| /settings/opening-balance | Yes | society_admin | No direct sidebar item | Yes |
| /setup | Yes | society_admin | No | Yes |
| /subscription/manage | Yes | society_admin | No direct sidebar item | Yes |
| /payment | Yes | Authenticated | No | Yes |
| /payment/success | Yes | Authenticated | No | Yes |
| /payment-gateways | No | Public | No | Yes |
| /suggestions | No | Public | No | Yes |

## 5. Feature Validation Audit

Confidence model:
- 100: UI + API + validation + workflow all present.
- 75: one gate weak/missing.
- 50: partial implementation.
- 25: inferred only.
- 0: not found.

### 5.1 Stronger Runtime Verification Criteria

For future audits, classify a feature as Proven only when all of the following are evidenced:
- A reachable UI entry point or an intentional non-UI workflow is present.
- A live API or service path exists and matches the documented user action.
- Validation exists at the appropriate boundary, not only in convenience UI code.
- State transitions are observable through success, error, and empty-state behavior.
- Authorization is consistent between UI gating and backend enforcement.
- Data mutations are resilient to retry, duplicate submission, or stale-record conditions when the workflow changes financial or user-management state.

Escalation rules used for stronger runtime judgment:
- Mark Partial if UI and API both exist but enforcement differs across layers.
- Mark Needs Manual Verification if configuration fields exist without confirmed execution-path usage.
- Mark Needs Manual Verification if the only evidence is text copy, placeholder content, or indirect references.
- Do not score financial logic above 75 unless recalculation, idempotency, and post-mutation state visibility are all evidenced.
- Do not score permission-sensitive actions above 75 unless the backend restriction is at least as strong as the UI route restriction.

| Feature | UI | API | Validation | Workflow | Confidence | Status |
|---|---|---|---|---|---|---|
| Signup | Yes | Yes | Yes | Yes | 100 | Proven |
| Login | Yes | Yes | Yes | Yes | 100 | Proven |
| Forgot Password | Yes | Yes | Yes | Yes | 100 | Proven |
| Password Change | Yes | Yes | Yes | Yes | 100 | Proven |
| Dashboard KPIs | Yes | Yes | N/A | Yes | 100 | Proven |
| Dashboard Charts | Yes | Yes | N/A | Yes | 100 | Proven |
| Activity Feed | Yes | Yes | N/A | Yes | 100 | Proven |
| Insights Panel | Yes | Yes | N/A | Needs runtime content check | 75 | Needs Manual Verification |
| Billing Reminder Banner | Yes | Yes | N/A | Yes | 100 | Proven |
| Flats CRUD | Yes | Yes | Yes | Yes | 100 | Proven |
| Flats Search/Sort/Pagination | Yes | Yes | Yes | Yes | 100 | Proven |
| Flats Bulk Import | Yes | Yes | Yes | Yes | 100 | Proven |
| Maintenance Add Payment | Yes | Yes | Yes | Yes | 100 | Proven |
| Maintenance Edit Payment | Yes | Yes | Yes | Conditional constraints | 75 | Partial |
| Maintenance Delete Payment | Yes | Yes | N/A | Yes | 100 | Proven |
| Payment 30-day lock | UI only | No explicit server lock | UI validation | Inconsistent enforcement | 50 | Partial |
| Offline Payment Entry | Yes | Yes | Yes | Yes | 100 | Proven |
| Expenses CRUD | Yes | Yes | Yes | Yes | 100 | Proven |
| Expenses Filters | Yes | Yes | Yes | Yes | 100 | Proven |
| Billing Summary Report | Yes | Yes | Yes | Yes | 100 | Proven |
| Outstanding Dues Report | Yes | Yes | Yes | Yes | 100 | Proven |
| Income vs Expense Report | Yes | Yes | Yes | Yes | 100 | Proven |
| Fund Ledger Report | Yes | Yes | Yes | Yes | 100 | Proven |
| Payment Register Report | Yes | Yes | Yes | Yes | 100 | Proven |
| Report Download | Yes | Yes | Yes | Yes | 100 | Proven |
| Users Add/Edit/Delete | Yes | Yes | Yes | Yes | 100 | Proven |
| Role Permissions (admin/viewer) | Yes | Yes | N/A | Yes | 100 | Proven |
| Settings Profile | Yes | Yes | Yes | Yes | 100 | Proven |
| Settings Society Details | Yes | Yes | Yes | Yes | 100 | Proven |
| Maintenance Rules Settings | Yes | Yes | Yes | Yes | 100 | Proven |
| Opening Balance | Yes | Yes | Yes | Yes | 100 | Proven |
| Notifications Settings | Yes | Yes | Yes | Yes | 100 | Proven |
| Appearance Settings | Yes | N/A | N/A | Yes | 100 | Proven |
| Subscription Flow | Yes | Yes | Yes | Yes | 100 | Proven |
| Support Page | Yes | N/A | N/A | Yes | 100 | Proven |

## 6. Permission Matrix Audit

| Module | Admin | Viewer | Other Roles |
|---|---|---|---|
| Dashboard | View | View | Needs Manual Verification |
| Flats | Full UI actions; API write allowed | Read/list in UI; write blocked by ViewerForbiddenFilter | Needs Manual Verification |
| Maintenance | Add/edit/delete exposed to admin; lock UI rules apply | Read/list only in UI; write blocked by filter | Needs Manual Verification |
| Expenses | Full | Read/list only; write blocked by filter | Needs Manual Verification |
| Reports (view) | Yes | Yes | Needs Manual Verification |
| Reports download | UI route admin-only; API blocks viewer writes | No | Needs Manual Verification |
| Users | Admin-only route + write APIs blocked for viewer | No | Needs Manual Verification |
| Settings | Route admin-only (in UI) | No route access | Needs Manual Verification |
| Subscription Management | Admin-only route | No route access | Needs Manual Verification |
| Notifications Preferences | Available through settings flow | Not reachable via settings route | Needs Manual Verification |
| Support page | Public route | Public route | Public route |

Permission findings:
- Backend role filter is primarily ViewerForbiddenFilter on write endpoints.
- UI route restrictions are stricter in some places (example: report download admin-only in UI while API policy is viewer-forbidden, not explicitly admin-only).
- Other roles (Treasurer/Secretary/Manager) appear in display labels but are not part of the explicit two-role model in Domain constants; treat as Needs Manual Verification for society app permissions.

### 6.1 Endpoint Authorization Matrix

| Endpoint / Pattern | Auth Requirement | Write Restriction | Effective Access Finding |
|---|---|---|---|
| POST /auth/register | Public | None | Public signup flow available. |
| POST /auth/login | Public | Rate limited | Public login flow available. |
| POST /auth/forgot-password | Public | Rate limited | Public password reset request flow available. |
| POST /auth/reset-password | Public with valid token | Token validation | Public reset flow available with token. |
| GET /dashboard | Authenticated + active-subscription policy where configured | None | Read access available to signed-in society users. |
| GET /flats | Authenticated | None | Admin and viewer can read flat records. |
| POST /flats | Authenticated | ViewerForbiddenFilter | Admin-capable write path; viewer blocked server-side. |
| PUT /flats/{id} | Authenticated | ViewerForbiddenFilter | Admin-capable update path; viewer blocked server-side. |
| DELETE /flats/{id} | Authenticated | ViewerForbiddenFilter | Admin-capable delete path; viewer blocked server-side. |
| POST /flats/bulk | Authenticated | ViewerForbiddenFilter | Bulk import is effectively admin-only. |
| GET /maintenance-payments | Authenticated | None | Read/list path available to admin and viewer. |
| POST /maintenance-payments | Authenticated | ViewerForbiddenFilter | Payment creation blocked for viewer. |
| PUT /maintenance-payments/{id} | Authenticated | ViewerForbiddenFilter + business rule checks | Write path exists, but lock parity is not fully aligned with UI. |
| DELETE /maintenance-payments/{id} | Authenticated | ViewerForbiddenFilter | Delete path exists; backend recalculates bills. |
| POST /billing/generate-monthly | Authenticated | ViewerForbiddenFilter | Monthly bill generation is effectively admin-only. |
| GET /expenses | Authenticated | None | Read/list path available to admin and viewer. |
| POST /expenses | Authenticated | ViewerForbiddenFilter | Expense creation blocked for viewer. |
| PUT /expenses/{id} | Authenticated | ViewerForbiddenFilter | Expense update blocked for viewer. |
| DELETE /expenses/{id} | Authenticated | ViewerForbiddenFilter | Expense delete blocked for viewer. |
| GET /reports/* | Authenticated | None for reviewed read endpoints | Report viewing is available to authenticated users. |
| GET /reports/download/* | Authenticated | No viewer-specific write filter because export is read-shaped | UI is admin-only; backend policy should be made explicit if admin-only is intended. |
| GET /users | Authenticated | Route and role restrictions in UI | User management is effectively admin-only in society app flow. |
| POST /users | Authenticated | ViewerForbiddenFilter | User creation blocked for viewer. |
| PUT /users/{id} | Authenticated | ViewerForbiddenFilter | User update blocked for viewer. |
| DELETE /users/{id} | Authenticated | ViewerForbiddenFilter | User delete blocked for viewer. |
| GET /society | Authenticated | None | Society details can be read in protected flow. |
| PUT /society | Authenticated | ViewerForbiddenFilter | Society updates are effectively admin-only. |
| GET /opening-balance/* | Authenticated | None | Read/status flow exists in protected setup/settings flow. |
| POST /opening-balance/apply | Authenticated | ViewerForbiddenFilter | Apply action is effectively admin-only. |
| GET /subscriptions/status | Authenticated | None | Subscription status read path exists. |
| POST /subscriptions/subscribe | Authenticated | UI admin route; backend behavior reviewed as protected | Subscription purchase flow is positioned as admin-only in society UI. |
| POST /notifications/preferences | Authenticated | None | Preference updates exist but are only surfaced through admin settings route. |

## 7. Billing & Maintenance Critical Audit

| Feature | Result | Notes |
|---|---|---|
| Monthly bill generation | Implemented | /billing/generate-monthly + BillingService.GenerateBillsAsync. |
| Due dates | Configurable storage | dueDay saved in maintenance config, but no clear runtime due-date enforcement in billing generation flow. |
| Outstanding calculations | Implemented | Computed via bill allocations + opening balance remaining in maintenance summary/service. |
| Late fee calculation | Partial | lateFeePerMonth is configurable and persisted, but no explicit late-fee application path found in billing generation/payment allocation services. |
| Payment status | Implemented | Bill statuses (unpaid/partial/paid etc.) updated on allocations and recalculation after delete. |
| Offline payment recording | Implemented | Maintenance payment flow records manual payments with modes and references. |
| Edit/delete rules | Implemented with caveats | Backend blocks amount edits in specific settled-bill scenarios; delete recalculates bill atomically. |
| Payment lock logic | Inconsistent | UI enforces 30-day lock; backend does not show equivalent 30-day hard rule. |
| Adjustment entries | Implemented at service/data level | Opening balance adjustments and allocations are processed in payment allocation flow. |
| Collection summaries | Implemented | /maintenance-payments/summary and report endpoints provide aggregate data. |

### Billing/Maintenance Mismatch Table

| Feature | Mismatch Type | Risk | Recommendation |
|---|---|---|---|
| 30-day payment lock | UI-only enforcement | High | Add backend validation for same lock rule or remove hard claim from manual. |
| Report download permission | UI stricter than API semantics | Medium | Align backend authorization policy with UI (explicit admin-only if intended). |
| Late fee behavior | Config exists, execution unclear | High | Document as configurable field only; mark runtime application Needs Manual Verification until proven in service logic/tests. |
| Due day/grace period behavior | Config stored, runtime enforcement unclear | Medium | Avoid formula claims; keep to configuration-only wording in manual. |

## 8. Reports Audit

| Report | Exists | Filters | Export | Charts | Empty State | Permissions |
|---|---|---|---|---|---|---|
| Collection Summary | Yes | startPeriod/endPeriod | No direct export on page | Yes | Yes | Authenticated |
| Defaulters | Yes | Search, sorting, mode filters | CSV export (frontend-generated) | KPI cards | Yes | Authenticated |
| Income vs Expense | Yes | startDate/endDate presets | No direct file export | Yes | Yes | Authenticated |
| Fund Ledger | Yes | startDate/endDate presets | No direct file export | Yes | Yes | Authenticated |
| Payment Register | Yes | date range + period label filter + pagination | No direct file export | Pie chart breakdown | Yes | Authenticated |
| Download Reports | Yes | monthly/yearly selections | XLSX (monthly/yearly backend files) | No analytics chart | N/A | UI admin-only route |

Actual export formats verified:
- Backend report downloads: XLSX only.
- Defaulters page export: CSV generated client-side.
- PDF export: not found.

## 9. Settings Audit

| Setting | Exists | Working | Notes |
|---|---|---|---|
| Profile | Yes | Yes | Mobile update path implemented. |
| Password | Yes | Yes | Change password page + API. |
| Society Details | Yes | Yes | Admin-only flow with Society endpoint update. |
| Maintenance Rules | Yes | Yes (config) | Stores default charge, due day, late fee, grace period. |
| Opening Balance | Yes | Yes | Status/summary/apply implemented. |
| Notifications | Yes | Yes | Preference get/update endpoints and hooks exist. |
| Appearance | Yes | Yes | Theme toggle UI-based. |
| Subscription | Yes | Yes | Status/trial/subscribe/cancel flow exists. |

## 10. Validation Rules Extraction (Implemented)

| Module | Field | Rule | Error Message / Behavior |
|---|---|---|---|
| Login | usernameOrEmail | required | username required message |
| Login | password | min length | password minimum validation |
| Signup | name | min 2 | name min validation |
| Signup | email | valid email | invalid email validation |
| Signup | password | shared password schema | uppercase/lowercase/number rules |
| Forgot Password | email | required + valid | invalid email / required |
| Reset Password | newPassword | min/max + upper/lower/number | specific rule messages |
| Flats | flatNumber | required | flat number required |
| Flats | ownerName | required | owner required |
| Flats | ownerPhone | min length + duplicate checks | phone min and duplicate errors |
| Flats | maintenanceAmount | positive number | must be positive |
| Flats | statusCode | required | status required |
| Maintenance Payment | amount | >0 | amount positive required |
| Maintenance Payment | paymentDate | not before current FY start | FY start validation message |
| Maintenance Payment (API) | period query | yyyy-MM pattern | bad request for invalid format |
| Expenses | date/category/amount | required | required field messages |
| Expenses | duplicate guard | same date/category/vendor/amount blocked in UI | duplicate expense message |
| Users | name | required | full name required |
| Users | login ID requirement | email or username required | form error |
| Users | password (create) | required | password required |
| Users | mobile | normalized 10-digit + duplicate check | duplicate/invalid mobile |
| Settings Maintenance | dueDayOfMonth | UI range 1..28 | invalid due day error |
| Settings Maintenance | defaultMonthlyCharge | >0 | charge must be >0 |
| Settings Maintenance | lateFee, gracePeriod | non-negative | cannot be negative |

### 10.1 Data Integrity Checks

| Area | Implemented Check | Evidence Outcome | Residual Risk |
|---|---|---|---|
| Flats uniqueness | Duplicate checks for flat number, email, and mobile in UI | Present in create/edit flows | UI-only checks should not be treated as full server guarantees unless backed by DB constraints. |
| Flats import | Bulk import validates rows before submission and exposes row-level issues | Present in import flow | Final enforcement depends on backend duplicate and validation handling. |
| Maintenance payment amount | Positive amount validation in UI and API layer | Present | Low risk for malformed negative values. |
| Maintenance payment date | Financial-year boundary validation | Present | Runtime period edge cases still depend on service rules. |
| Maintenance allocation | Transactional allocation and recalculation behavior in service | Present | Stronger tests still needed for concurrent or repeated submissions. |
| Maintenance delete recalculation | Bill summaries/status recalculated after delete | Present | Low risk if service transaction remains atomic. |
| Duplicate expense guard | Same date/category/vendor/amount blocked in UI | Present | Medium risk because reviewed evidence was UI guard, not a hard backend uniqueness rule. |
| User identity normalization | Mobile normalization and duplicate checks | Present | Server-side constraint evidence should be strengthened for cross-client consistency. |
| Opening balance apply-once flow | Dedicated status/summary/apply lifecycle | Present | Needs runtime verification for repeat-submission race conditions. |
| Billing generation | Single generation flow exposed via dedicated endpoint/service | Present | Idempotency under retries was not proven by test evidence in this audit. |

Data integrity summary:
- The codebase shows multiple application-layer validation and transactional safeguards.
- The strongest integrity evidence exists in maintenance payment allocation and bill recalculation flows.
- The weakest integrity evidence is around duplicate prevention that appears UI-led rather than conclusively database-enforced in reviewed material.

## 11. Hallucination Detection (Existing Manual)

| Section | Evidence Found | Missing Pieces | Reason | Action |
|---|---|---|---|---|
| Generic screenshot blocks across all pages | Placeholder text only | Real captures absent | Documentation placeholders, not product evidence | Replace with explicit TODO markers tied to real routes |
| "Payments older than 30 days may be locked" presented as system rule | UI lock function in Maintenance.tsx | Server-side lock rule not evident | Rule not consistently enforced | Keep as UI behavior note; mark backend consistency Needs Manual Verification |
| Late fee behavior implied as operational billing rule | Maintenance config fields stored | No clear late-fee application logic in billing service path | Over-claimed behavior | Reduce to configuration statement; mark runtime application Needs Manual Verification |
| Viewer permissions phrased vaguely ("usually no") | Strong route and filter restrictions exist | No explicit matrix in manual | Ambiguous wording | Replace with explicit matrix |
| Download file format unspecified | Backend export service exists | Actual format not stated in manual | Incomplete | Document XLSX (and CSV where applicable) |
| Support SLA as guaranteed platform behavior | Support page text has 24h statement | No operational SLA enforcement in code | Non-code policy assertion | Mark Needs Manual Verification |

## 12. Missing Features List (From Documentation Perspective)

Implemented but under-documented in old manual:
- Fund Ledger report
- Payment Register report
- Detailed route-level role protections
- Opening balance status/summary/apply lifecycle
- Payment allocation behavior (current/arrear/advance)
- Idempotency behavior in maintenance payment processing
- Exact export formats (XLSX backend, CSV in defaulters page)

## 13. Incorrect Documentation List

Claims in old manual requiring correction/removal:
- Hard claim of universal 30-day edit/delete lock (currently UI-driven, not clearly backend-enforced).
- Implied late-fee runtime calculation behavior without code evidence in billing generation flow.
- Unclear report scope (manual listed 4 reports while app includes additional report pages).
- Generic permission wording instead of explicit admin/viewer controls.
- Placeholder screenshot instructions presented as if final assets.

## 14. MVP Limitations (Code-Verified)

- Online resident payment processing is not the primary MVP path; maintenance collection is documented as offline recording flow in society module.
- Report file downloads are XLSX-oriented; no backend PDF export found.
- Some enforcement differences exist between UI and API (example: payment lock behavior).
- Permission model in code is centered around society_admin and viewer; additional role labels may appear but require manual verification for full behavior in society app.
- Support SLA wording appears in UI copy and should be treated as policy text, not code-enforced guarantee.

## 15. Release Readiness Report

### Readiness Score

Overall score: 82/100

Scoring rationale:
- Feature verification coverage: 34/40
- Workflow confidence: 21/25
- Permission correctness: 15/20
- Documentation quality after rewrite readiness: 12/15

Primary deductions:
- UI/API mismatch risk around payment lock rule.
- Late-fee/due-date runtime behavior not fully evidenced in service execution paths.
- Other-role behavior ambiguity in society app context.

### Severity and Blockers

| Issue | Severity | Impact | Release Blocker |
|---|---|---|---|
| Payment lock rule inconsistent between UI and backend | High | Could allow API-side updates/deletes not allowed in UI expectation | Yes (docs must not overstate hard lock) |
| Late-fee runtime behavior unclear | High | Financial expectation mismatch risk | Yes (must be documented as Needs Manual Verification) |
| Permission mismatch UI vs API for some report actions | Medium | Potential authorization drift | No (documented risk with recommendation) |
| Support response-time guarantee not code-enforced | Low | Policy wording risk | No |

Go/No-go recommendation:
- Go for documentation release only if manual language is constrained to verified behavior and includes Needs Manual Verification tags for unresolved runtime rules.
- Engineering follow-up recommended for backend lock-rule parity and explicit late-fee execution tests.

### 15.1 Actionable Engineering Recommendations

| Priority | Recommendation | Why It Matters | Suggested Owner |
|---|---|---|---|
| P1 | Add backend enforcement for the 30-day maintenance payment lock or remove the hard rule from product behavior | Prevents API/UI drift on accounting-sensitive edits | Backend/API |
| P1 | Add explicit late-fee execution tests covering bill generation, arrears, grace period, and recalculation | Financial rules are currently configurable but not fully proven at runtime | Backend + QA |
| P1 | Align report download authorization between UI and backend policy | Avoids privilege drift and undocumented export access | Backend/API |
| P2 | Strengthen server-side duplicate protection for flats, expenses, and user contact identifiers | UI duplicate guards alone are insufficient across clients and retries | Backend/Data |
| P2 | Add focused tests for opening balance apply-once behavior and repeated-submit scenarios | Protects financial baseline integrity | Backend + QA |
| P2 | Add endpoint-level authorization tests for viewer vs admin across all write actions | Converts inferred permission behavior into executable evidence | Backend + QA |
| P3 | Document actual export formats and permission boundaries in developer docs alongside the user manual | Keeps docs, UI, and API expectations aligned | Product/Docs |
| P3 | Add release-gate checks for runtime evidence on financial workflows before marking features as complete | Reduces future documentation drift | Engineering Management |

Recommended acceptance criteria before raising readiness score above 82:
- Backend/API parity is proven for maintenance edit/delete restrictions.
- Late-fee and due/grace behavior are covered by executable tests.
- Authorization expectations for report downloads are made explicit and tested.
- At least one retry/idempotency test exists for each financial write workflow.

## 16. Verification Gate Checklist

- [x] Every manual statement category mapped to evidence class
- [x] Removed/incorrect claims captured in Incorrect Documentation section
- [x] Requested features classified
- [x] Permissions validated in UI and backend filters
- [x] Billing and maintenance inconsistencies flagged
- [x] Report exports verified by implementation
- [x] FAQ/troubleshooting constraints prepared for MVP-only rewrite
- [x] Screenshot policy converted to real-page TODO markers
- [x] MVP limitations documented
- [x] Hallucinated/inferred sections identified
