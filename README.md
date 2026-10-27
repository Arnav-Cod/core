# Seva Setu Foundation

A responsive public NGO website and interactive management workspace. Built with HTML, CSS, and JavaScript, with no build step.

## Open locally

Serve the `dist` directory with a local HTTP server. The home URL opens the public website; `#dashboard` opens the management workspace.

## Included

- Dashboard with calculated summaries, monthly donations/expenses and project utilization.
- Members, application approvals, renewals, validity, blocking and a sample member portal.
- Donors, manual donations, public pledges, receipts and tax-certificate request summaries.
- Volunteers, attendance, activities, project budgets, documents and staff work assignments.
- Accounts, cash/bank summaries, vendors, ledger, fiscal-year reports and CSV exports.
- Events, fundraising campaigns and participant registrations.
- Editable public website content, projects, news, navigation and contact/social links.
- Local notices, individual messages, enquiry management and renewal reminders.
- QR-enabled certificates, appointment drafts and ID cards; direct PDF downloads and print previews.
- Permission configuration preview, local activity history and JSON backup/restore.

## Community engagement features

- **See Your Impact** (`#impact`): project funding and spending, published milestones, reviewed field updates, photos with captions, latest reported outcomes, and project-specific donation pledges. Update outcomes are totals as of the reporting date, not summed across posts. Project funds use existing project totals including opening balances; pending expenses are excluded from spending detail.
- **Volunteer matching** (`#opportunities`): filters for location, cause, availability and skills; opportunity-specific applications; duplicate prevention; coordinator review through orientation, assignment and completion. Verified service is linked to the existing volunteer and attendance records and prevents duplicate attendance for a person on a date.
- **Corporate partnerships** (`#partnerships`): programme funding and employee volunteering options, downloadable sample PDF proposals, enquiry capture, stage tracking, coordinator ownership, follow-up dates and reporting deadlines. Enquiry budgets do not count as received donations.
- Manage these in **Impact updates**, **Volunteer opportunities**, and **Corporate partnerships** in the workspace. New records are included in JSON backup/restore. Existing saved workspaces receive the sample additions once without replacing their existing records.

These features use the same browser-local demo storage as the rest of the site. Applications and enquiries do not notify the foundation; publication of a local update is visible only in that browser. Shared submissions and automated follow-ups require production services.

## Verification

Run `node tests/growth.test.cjs` for migration, filters, volunteer lifecycle/capacity, duplicate service prevention, publication review, partnership accounting isolation, storage rollback, and rendering checks.

## Demo and launch configuration

Records persist in the current browser's local storage. Sample records, stock photographs and document previews are clearly marked. There is no shared server database or production member authentication. Permission settings are a configuration preview rather than enforced security. QR verification reads the same browser's local records and is not a cross-device identity service.

No payment is processed. Public donation forms create pending pledges; administrators can record payments already received. Tax documents are request summaries, not approved 80G certificates.

Official contact details, a custom domain and payment provider are intentionally blank at the owner's request. Email/SMS/automated WhatsApp delivery, business mailboxes, real social accounts and YouTube channel creation require the owner's accounts and production integrations. The hosted preview includes HTTPS; no custom domain is purchased. A one-year support agreement is not included in the software.

A valid Google Analytics measurement ID can be added in Website CMS to load Google Analytics on public pages. It is disabled while the ID is blank.

Project and profile uploads are limited to 500 KB per file in this local demo. Download a JSON backup to retain edits before clearing browser storage.

## Reference design

The public website follows the supplied excellentcomputerclasses.in reference: the header stack, full-width Swiper slideshow, typography, icon set, quick links, program rows, community lists, documents, gallery, footer, mobile menus, spacing, and animation settings. Organization details remain Seva Setu’s, with placeholder contact information and clearly marked sample records. The management workspace uses the same fonts and palette.

## Assets

Photographs from Unsplash are bundled locally. QRCode.js (MIT) and jsPDF (MIT) are bundled with their upstream notices. The reference fonts (Poppins, Bakbak One, and Teko), Font Awesome icons, and Swiper slider are bundled locally with system fallbacks.
